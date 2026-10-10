import { ApiError } from './errors';
export interface ServerEnv {
  DB?:D1Database; SITE_URL?:string; AI_ENABLED?:string; OPENROUTER_API_KEY?:string;
  OPENROUTER_AZURE_MODEL?:string; OPENROUTER_AZURE_CANONICAL_MODEL?:string; AI_PRIMARY_RESPONSE_MODE?:string; AI_PRIMARY_REASONING_EFFORT?:string; AI_IP_HMAC_KEY?:string; AI_AZURE_BYOK_ONLY_CONFIRMED?:string;
  AI_DAILY_CALL_LIMIT?:string; AI_DAILY_BUDGET_USD?:string; AI_JOB_RESERVE_USD?:string; AI_MAX_OUTPUT_TOKENS?:string;
  AI_MAX_PROMPT_PRICE_PER_MILLION?:string; AI_MAX_COMPLETION_PRICE_PER_MILLION?:string;
  OWNER_DEVICE_TOKEN_HASH?:string;
}
export interface AIConfig {
  db:D1Database;siteUrl:string;apiKey:string;primaryModel:string;canonicalModel?:string;primaryResponseMode:'json_object'|'json_schema';primaryReasoningEffort:'none'|'low'|'medium'|'high';hmacKey:string;
  dailyCalls:number;dailyBudgetMicros:number;reserveMicros:number;maxTokens:number;
  promptPrice:number;completionPrice:number;
}
export const unavailable=()=>new ApiError(503,'AI_UNAVAILABLE','상세 풀이를 잠시 사용할 수 없어요. 계산된 기본 풀이는 계속 볼 수 있어요.');
export function siteOrigin(value?:string):string|null {
  try {
    const url=new URL(value??'');
    if(url.username || url.password || !['https:','http:'].includes(url.protocol)) return null;
    if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))return null;
    return url.origin;
  }catch{return null;}
}
function number(value:string|undefined,fallback:number,min:number,max:number,integer=false):number {
  const parsed=value===undefined?fallback:Number(value);
  if(!Number.isFinite(parsed)||parsed<min||parsed>max||(integer&&!Number.isInteger(parsed)))throw unavailable();
  return parsed;
}
export function getConfig(env:ServerEnv):AIConfig {
  const siteUrl=siteOrigin(env.SITE_URL);
  if(env.AI_ENABLED!=='true'||env.AI_AZURE_BYOK_ONLY_CONFIRMED!=='true'||!env.DB||!siteUrl||!env.OPENROUTER_API_KEY||!env.AI_IP_HMAC_KEY||env.AI_IP_HMAC_KEY.length<32||!env.OPENROUTER_AZURE_MODEL||!/^[a-z0-9][a-z0-9_-]{0,30}\/[a-z0-9][a-z0-9._-]{1,90}$/.test(env.OPENROUTER_AZURE_MODEL)) throw unavailable();
  const primaryResponseMode=env.AI_PRIMARY_RESPONSE_MODE??'json_schema';
  if(!['json_object','json_schema'].includes(primaryResponseMode))throw unavailable();
  const primaryReasoningEffort=env.AI_PRIMARY_REASONING_EFFORT??'none';
  if(!['none','low','medium','high'].includes(primaryReasoningEffort))throw unavailable();
  const canonicalModel=env.OPENROUTER_AZURE_CANONICAL_MODEL;
  if(canonicalModel && (!/^[a-z0-9][a-z0-9_-]{0,30}\/[a-z0-9][a-z0-9._-]{1,100}$/.test(canonicalModel)||!canonicalModel.startsWith(`${env.OPENROUTER_AZURE_MODEL}-`)))throw unavailable();
  const dailyBudgetMicros=Math.floor(number(env.AI_DAILY_BUDGET_USD,20,0.04,20)*1_000_000);
  const reserveMicros=Math.ceil(number(env.AI_JOB_RESERVE_USD,0.1,0.04,20)*1_000_000);
  if(reserveMicros>dailyBudgetMicros)throw unavailable();
  return {
    db:env.DB,siteUrl,apiKey:env.OPENROUTER_API_KEY,primaryModel:env.OPENROUTER_AZURE_MODEL,canonicalModel,primaryResponseMode:primaryResponseMode as 'json_object'|'json_schema',primaryReasoningEffort:primaryReasoningEffort as AIConfig['primaryReasoningEffort'],hmacKey:env.AI_IP_HMAC_KEY,
    dailyCalls:Math.min(number(env.AI_DAILY_CALL_LIMIT,200,1,200,true),Math.floor(dailyBudgetMicros/reserveMicros)),dailyBudgetMicros,reserveMicros,
    maxTokens:number(env.AI_MAX_OUTPUT_TOKENS,3200,1000,3500,true),
    promptPrice:number(env.AI_MAX_PROMPT_PRICE_PER_MILLION,2,0.01,100),completionPrice:number(env.AI_MAX_COMPLETION_PRICE_PER_MILLION,10,0.01,200),
  };
}
