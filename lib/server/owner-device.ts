import type { ServerEnv } from './config';
import { siteOrigin } from './config';
import { hash } from './challenge';
import { readBoundedJson } from './validation';

export const OWNER_COOKIE='__Host-saju_owner';
const headers={'cache-control':'no-store, max-age=0','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff','referrer-policy':'no-referrer','cross-origin-resource-policy':'same-origin'};
const cookieOptions='Path=/; Secure; HttpOnly; SameSite=Strict';
const tokenPattern=/^[A-Za-z0-9_-]{43}$/;

async function validToken(token:unknown,env:ServerEnv):Promise<boolean> {
  const expected=env.OWNER_DEVICE_TOKEN_HASH;
  if(typeof token!=='string'||!tokenPattern.test(token)||!expected||!tokenPattern.test(expected))return false;
  const actual=await hash(token);
  let diff=0;
  for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^actual.charCodeAt(i);
  return diff===0;
}

/** Only a server-verified device credential can grant the count-limit exception. */
export async function isOwnerDevice(request:Request,env:ServerEnv):Promise<boolean> {
  const matches=(request.headers.get('cookie')??'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(`${OWNER_COOKIE}=`));
  if(matches.length!==1)return false;
  return validToken(matches[0].slice(OWNER_COOKIE.length+1),env);
}

export async function handleOwnerDevice(request:Request,env:ServerEnv):Promise<Response> {
  const respond=(body:unknown,status=200,cookie?:string)=>new Response(JSON.stringify(body),{status,headers:{...headers,...(cookie?{'set-cookie':cookie}:{})}});
  const allowed=siteOrigin(env.SITE_URL);
  const origin=request.headers.get('origin');
  const fetchSite=request.headers.get('sec-fetch-site');
  if(!allowed||new URL(request.url).origin!==allowed||(origin&&origin!==allowed)||(request.method!=='GET'&&origin!==allowed)||(fetchSite&&!['same-origin','none'].includes(fetchSite)))return respond({error:'허용되지 않은 요청이에요.'},403);
  if(request.method==='GET')return respond({owner:await isOwnerDevice(request,env)});
  if(request.method==='DELETE')return respond({owner:false},200,`${OWNER_COOKIE}=; ${cookieOptions}; Max-Age=0`);
  if(request.method!=='POST')return respond({error:'허용되지 않은 요청이에요.'},405);
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??'')||request.headers.has('content-encoding'))return respond({error:'요청 형식을 확인해 주세요.'},415);
  try {
    const body=await readBoundedJson(request,256) as Record<string,unknown>|null;
    if(!body||Object.keys(body).length!==1||!await validToken(body.token,env))return respond({error:'등록되지 않은 브라우저예요.'},403);
    // No token is returned, logged or stored in D1. Rotation/removal of its server
    // hash revokes the grant immediately, including existing cookies.
    return respond({owner:true},200,`${OWNER_COOKIE}=${body.token}; ${cookieOptions}; Max-Age=31536000`);
  }catch{return respond({error:'요청 정보를 확인해 주세요.'},400);}
}
