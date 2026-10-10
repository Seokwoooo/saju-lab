import {describe,it,expect} from 'vitest';
import {hash} from '../lib/server/challenge';
import {handleOwnerDevice,isOwnerDevice,OWNER_COOKIE} from '../lib/server/owner-device';
import {parseAnalyzeBody} from '../lib/server/validation';
const site='https://saju.test';
const token='T'.repeat(43);
const env=async()=>({SITE_URL:site,OWNER_DEVICE_TOKEN_HASH:await hash(token)});
const post=(value:unknown,origin=site)=>new Request(`${site}/api/owner/device`,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(value)});
describe('owner browser credential',()=>{
 it('issues a host-only HttpOnly Secure Strict cookie and never returns the credential',async()=>{
  const response=await handleOwnerDevice(post({token}),await env());
  expect(response.status).toBe(200);
  const cookie=response.headers.get('set-cookie')!;
  expect(cookie).toContain(`${OWNER_COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=31536000`);
  expect(cookie).not.toContain('Domain=');
  expect(await response.text()).toBe('{"owner":true}');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(await isOwnerDevice(new Request(site,{headers:{cookie:cookie.split(';')[0]}}),await env())).toBe(true);
 });
 it('does not trust an IP, user agent, query flag, custom header, missing, or forged cookie',async()=>{
  for(const headers of [{},{'x-owner':'true'},{'cf-connecting-ip':'127.0.0.1','user-agent':'Macintosh'},{cookie:`${OWNER_COOKIE}=true`},{cookie:`${OWNER_COOKIE}=${'X'.repeat(43)}`},{cookie:`${OWNER_COOKIE}=${token}; ${OWNER_COOKIE}=${token}`}]) {
   expect(await isOwnerDevice(new Request(`${site}/?owner=true`,{headers:headers as Record<string,string>}),await env())).toBe(false);
  }
 });
 it('fails closed after server revocation even if the old browser cookie survives',async()=>{
  const request=new Request(site,{headers:{cookie:`${OWNER_COOKIE}=${token}`}});
  expect(await isOwnerDevice(request,{})).toBe(false);
  expect(await isOwnerDevice(request,{OWNER_DEVICE_TOKEN_HASH:await hash('rotated')})).toBe(false);
 });
 it('rejects foreign origins, missing origin, invalid tokens and oversized bodies without setting cookies',async()=>{
  for(const request of [post({token},'https://evil.test'),post({token},''),post({token:'X'.repeat(43)}),post({token,owner:true}),post({token:'x'.repeat(1000)})]) {
   const response=await handleOwnerDevice(request,await env());
   expect(response.status).toBeGreaterThanOrEqual(400);expect(response.headers.has('set-cookie')).toBe(false);
  }
 });
 it('exposes only the authorization result and supports clearing this device',async()=>{
  const headers={cookie:`${OWNER_COOKIE}=${token}`,origin:site};
  expect(await (await handleOwnerDevice(new Request(`${site}/api/owner/device`,{headers}),await env())).json()).toEqual({owner:true});
  const response=await handleOwnerDevice(new Request(`${site}/api/owner/device`,{method:'DELETE',headers}),await env());
  expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
 });
 it('rejects client-supplied owner bypass flags at the analysis input boundary',()=>{
  expect(()=>parseAnalyzeBody({ownerCountBypass:true})).toThrow();
 });
});
