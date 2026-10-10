import {describe,it,expect} from 'vitest';
import {retryDelayMessage} from '../lib/retry-delay';
import {requestReading} from '../lib/client-analysis';
import type {AIProfile} from '../lib/contracts';

describe('human-readable wait time',()=>{
 it.each([[1,'1분'],[60,'1분'],[61,'2분'],[3599,'60분'],[3600,'1시간'],[35827,'10시간'],[86400,'1일'],[90000,'2일'],[259200,'3일']])('rounds %s seconds up to %s',(seconds,label)=>{
  expect(retryDelayMessage(seconds)).toBe(` 약 ${label} 후 다시 시도해 주세요.`);
 });
 it.each([undefined,null,-1,0,NaN,Infinity,'35827'])('ignores invalid retry values %s',seconds=>expect(retryDelayMessage(seconds)).toBe(''));
 it.each(['challenge','json','stream'])('formats the reported 35827-second limit through the real %s transport',async mode=>{
  const fetcher:typeof fetch=async url=>{
   const error={type:'error',error:'풀이 요청 한도에 도달했어요.',retryAfter:35827};
   if(String(url).endsWith('challenge')&&mode!=='challenge')return Response.json({challenge:{token:'proof',difficulty:0,expiresAt:Date.now()+60000}});
   return mode==='stream'?new Response(JSON.stringify(error)+'\n',{headers:{'content-type':'application/x-ndjson'}}):Response.json(error,{status:429});
  };
  await expect(requestReading({} as AIProfile,{signal:new AbortController().signal,fetcher})).rejects.toThrow('약 10시간 후');
 });
});
