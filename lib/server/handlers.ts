import { getConfig, siteOrigin, unavailable, type ServerEnv } from './config';
import { ApiError } from './errors';
import { parseAnalyzeBody, readBoundedJson } from './validation';
import { createChallenge, dailyIpHash, hash, verifyChallenge } from './challenge';
import { cleanupReservations, releaseJob, reserveJob } from './limits';
import { makeProviderRequest, runReading } from './ai';
const responseHeaders={'cache-control':'no-store, max-age=0','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff','referrer-policy':'no-referrer','vary':'Origin','cross-origin-resource-policy':'same-origin'};
function json(value:unknown,status=200,retryAfter?:number){return new Response(JSON.stringify(value),{status,headers:{...responseHeaders,...(retryAfter?{'retry-after':String(retryAfter)}:{})}});}
function failure(error:unknown){const known=error instanceof ApiError?error:unavailable();return json({error:known.message,code:known.code,...(known.retryAfter?{retryAfter:known.retryAfter}:{})},known.status,known.retryAfter);}
function requireOrigin(request:Request,env:ServerEnv,post=false) {
  const allowed=siteOrigin(env.SITE_URL);
  const origin=request.headers.get('origin');
  const fetchSite=request.headers.get('sec-fetch-site');
  if(!allowed || (origin?origin!==allowed:post || new URL(request.url).origin!==allowed) || (fetchSite && !['same-origin','none'].includes(fetchSite))) throw new ApiError(403,'ORIGIN_DENIED','이 사이트에서만 AI 풀이를 요청할 수 있어요.');
}
function requestIp(request:Request,env:ServerEnv):string {
  const ip=request.headers.get('cf-connecting-ip');
  if(ip && ip.length<=45 && /^[0-9a-fA-F:.]+$/.test(ip)) return ip;
  const origin=siteOrigin(env.SITE_URL);
  if(origin && ['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname))return '127.0.0.1';
  throw unavailable();
}
async function cleanupIfBound(env:ServerEnv){if(env.DB)await cleanupReservations(env.DB);}
export async function handleStatus(env:ServerEnv):Promise<Response> {
  try {await cleanupIfBound(env);getConfig(env);return json({available:true});}
  catch{return json({available:false});}
}
export async function handleChallenge(request:Request,env:ServerEnv):Promise<Response> {
  try {
    await cleanupIfBound(env);const config=getConfig(env);requireOrigin(request,env);
    const ipHash=await dailyIpHash(config.hmacKey,requestIp(request,env));
    return json({challenge:await createChallenge(config.hmacKey,ipHash)});
  }catch(error){return failure(error);}
}
export async function handleAnalyze(request:Request,env:ServerEnv,fetcher:typeof fetch=fetch):Promise<Response> {
  let reservationId:string|undefined;
  try {
    await cleanupIfBound(env);const config=getConfig(env);requireOrigin(request,env,true);
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??'')) throw new ApiError(415,'JSON_REQUIRED','JSON 형식으로 요청해 주세요.');
    if(request.headers.has('content-encoding'))throw new ApiError(415,'JSON_REQUIRED','압축되지 않은 JSON으로 요청해 주세요.');
    const {profile,proof}=parseAnalyzeBody(await readBoundedJson(request));
    const now=Date.now();const ip=requestIp(request,env);const ipHash=await dailyIpHash(config.hmacKey,ip,now);
    if(!proof || !await verifyChallenge(config.hmacKey,ipHash,proof,now)) throw new ApiError(400,'CHALLENGE_REQUIRED','AI 풀이를 다시 눌러 요청 확인을 완료해 주세요.');
    makeProviderRequest(profile,config);
    if(request.signal.aborted)throw new ApiError(499,'CLIENT_CANCELLED','AI 풀이를 취소했어요.');
    const requestId=crypto.randomUUID();
    const previousIpHash=await dailyIpHash(config.hmacKey,ip,now-86_400_000);
    const result=await reserveJob(config.db,{requestId,challengeHash:await hash(proof.token),ipHash,previousIpHash,now,dailyCalls:config.dailyCalls,dailyBudgetMicros:config.dailyBudgetMicros,reserveMicros:config.reserveMicros});
    if(!result.ok)throw new ApiError(429,result.code,'AI 요청 한도에 도달했어요. 기본 풀이는 계속 볼 수 있어요.',result.retryAfter);
    reservationId=requestId;
    return json({reading:await runReading(profile,config,requestId,request.signal,fetcher)});
  }catch(error){return failure(error);}
  finally {
    if(reservationId && env.DB) {
      try {await releaseJob(env.DB,reservationId);}catch{ /* Fail closed until the short lease expires. */ }
    }
  }
}
