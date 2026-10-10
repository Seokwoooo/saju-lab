const encode = (value:Uint8Array) => btoa(String.fromCharCode(...value)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode = (value:string) => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),char=>char.charCodeAt(0));
export async function hmac(key:string,value:string):Promise<string> {
  const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return encode(new Uint8Array(await crypto.subtle.sign('HMAC',secret,new TextEncoder().encode(value))));
}
export async function hash(value:string):Promise<string> {
  return encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
}
export async function createChallenge(key:string,ipHash:string,now=Date.now(),difficulty=14) {
  const expiresAt=now+5*60_000;
  const payload=encode(new TextEncoder().encode(JSON.stringify({v:1,ip:ipHash,exp:expiresAt,d:difficulty,id:crypto.randomUUID()})));
  return {token:`${payload}.${await hmac(key,payload)}`,difficulty,expiresAt};
}
export async function verifyChallenge(key:string,ipHash:string,proof:{token:string;nonce:string},now=Date.now(),difficulty=14):Promise<boolean> {
  try {
    if(!/^\d{1,20}$/.test(proof.nonce) || proof.token.length>500) return false;
    const [payload,signature,...rest]=proof.token.split('.');
    if(rest.length || !payload || !signature) return false;
    const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('HMAC',secret,decode(signature),new TextEncoder().encode(payload))) return false;
    const data=JSON.parse(new TextDecoder().decode(decode(payload)));
    if(data.v!==1 || data.ip!==ipHash || data.d!==difficulty || !Number.isSafeInteger(data.exp) || data.exp<=now || data.exp>now+5*60_000 || typeof data.id!=='string') return false;
    const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${proof.token}:${proof.nonce}`)));
    for(let bit=0;bit<difficulty;bit++) if(digest[Math.floor(bit/8)] & (1<<(7-bit%8))) return false;
    return true;
  }catch{return false;}
}
export async function dailyIpHash(key:string,ip:string,now=Date.now()) {return hmac(key,`${new Date(now).toISOString().slice(0,10)}:${ip}`);}
