import { SECTION_KEYS, type AIProfile, type Reading } from '../contracts';
import { ApiError } from './errors';
import { type AIConfig, unavailable } from './config';
import { evidenceIds, readBoundedJson, validateReading, OUTPUT_TEXT_LIMITS, KOREAN_OUTPUT_PATTERN, InvalidAIOutputError, UnsupportedAIClaimError, safeValidationIssues, type SafeValidationIssue } from './validation';
import { z } from 'zod';
import { READING_PROMPT } from './reading-prompt';

const API='https://openrouter.ai/api/v1';
const FALLBACK_MODEL='openai/gpt-6-luna';
const FALLBACK_CANONICAL_MODEL='openai/gpt-6-luna-20260922';
const FALLBACK_PROMPT_PRICE=0.1;
const FALLBACK_COMPLETION_PRICE=0.5;
const systemPrompt=READING_PROMPT;
const textSchema=(maxLength:number)=>({type:'string',minLength:2,maxLength,pattern:KOREAN_OUTPUT_PATTERN,description:'쉬운 한국어 문장. 한자, 사주 전문용어, HTML, 코드, URL 금지.'});
function responseFormat(profile:AIProfile) {
  const ids=evidenceIds(profile);
  const sections=Object.fromEntries(SECTION_KEYS.map(key=>{
    const allowed=key==='year'?ids.filter(id=>id.startsWith('annual:')):key==='cycles' && profile.cycles.length?ids.filter(id=>id.startsWith('cycle:')):ids;
    return [key,{type:'object',additionalProperties:false,properties:{title:textSchema(OUTPUT_TEXT_LIMITS.title),body:textSchema(OUTPUT_TEXT_LIMITS.body),tip:textSchema(OUTPUT_TEXT_LIMITS.tip),evidence:{type:'array',minItems:1,maxItems:5,items:{type:'string',enum:allowed}}},required:['title','body','tip','evidence']}];
  }));
  const monthlyPoint={type:'object',additionalProperties:false,properties:{title:textSchema(60),body:textSchema(250),evidence:{type:'array',minItems:2,maxItems:5,items:{type:'string',enum:ids}}},required:['title','body','evidence']};
  const monthly=profile.currentMonth?{monthly:{type:'object',additionalProperties:false,properties:{headline:textSchema(60),opportunity:monthlyPoint,caution:monthlyPoint,action:monthlyPoint},required:['headline','opportunity','caution','action']}}:{};
  return {type:'json_schema',json_schema:{name:'saju_reading',strict:true,schema:{type:'object',additionalProperties:false,properties:{headline:textSchema(OUTPUT_TEXT_LIMITS.headline),intro:textSchema(OUTPUT_TEXT_LIMITS.intro),sections:{type:'object',additionalProperties:false,properties:sections,required:[...SECTION_KEYS]},...monthly},required:['headline','intro','sections',...(profile.currentMonth?['monthly']:[])]}}};
}
function providerRequestBody(profile:AIProfile,config:AIConfig,fallback:boolean) {
  const structured=responseFormat(profile);
  const objectMode=!fallback && config.primaryResponseMode==='json_object';
  const reasoning=!fallback && config.primaryReasoningEffort!=='none'?{effort:config.primaryReasoningEffort,exclude:true}:{enabled:false};
  const body={model:fallback?FALLBACK_MODEL:config.primaryModel,messages:[{role:'system',content:systemPrompt},{role:'user',content:JSON.stringify({profile,evidenceIds:evidenceIds(profile),...(objectMode?{outputSchema:structured.json_schema.schema}:{})})}],max_tokens:config.maxTokens,reasoning,stream:false,response_format:objectMode?{type:'json_object'}:structured,provider:{only:[fallback?'openai':'azure'],...(fallback?{ignore:['azure']}:{}),allow_fallbacks:false,require_parameters:true,data_collection:'deny',max_price:{prompt:fallback?FALLBACK_PROMPT_PRICE:config.promptPrice,completion:fallback?FALLBACK_COMPLETION_PRICE:config.completionPrice,request:0}}};
  return body;
}
export function makeProviderRequest(profile:AIProfile,config:AIConfig,fallback=false) {
  const body=providerRequestBody(profile,config,fallback);
  // UTF-8 bytes conservatively bound input tokens for the configured model routes.
  // Include schema and framing; reserve two capped generations plus a 5% BYOK fee.
  const costUpperMicros=generationCostUpperMicros(providerRequestBody(profile,config,false),config,false)+generationCostUpperMicros(providerRequestBody(profile,config,true),config,true);
  if(costUpperMicros>config.reserveMicros) throw unavailable();
  return body;
}
function generationCostUpperMicros(body:{messages:unknown;response_format:unknown},config:AIConfig,fallback:boolean):number {
  const promptBytes=new TextEncoder().encode(JSON.stringify({messages:body.messages,response_format:body.response_format})).byteLength+512;
  const inference=promptBytes*(fallback?FALLBACK_PROMPT_PRICE:config.promptPrice)+config.maxTokens*(fallback?FALLBACK_COMPLETION_PRICE:config.completionPrice);
  return Math.ceil(inference*(fallback?1:1.05));
}
const finiteCost=z.number().finite().nonnegative().max(10);
const generationSchema=z.object({id:z.string().regex(/^gen-[0-9A-Za-z-]{1,124}$/),model:z.string().max(100),provider_name:z.string().max(80),is_byok:z.boolean(),total_cost:finiteCost,upstream_inference_cost:finiteCost.nullish()});
const completionSchema=z.object({
  id:z.string().regex(/^gen-[0-9A-Za-z-]{1,124}$/),model:z.string().max(100),provider:z.string().max(80).optional(),is_byok:z.boolean().optional(),
  choices:z.array(z.object({finish_reason:z.literal('stop'),message:z.object({content:z.string().min(2).max(24_000),refusal:z.string().nullish()})})).length(1),
  usage:z.object({cost:finiteCost,is_byok:z.boolean().optional(),cost_details:z.object({is_byok:z.boolean().optional(),upstream_inference_cost:finiteCost.nullish()}).optional()}),
});
class ProviderAttemptError extends Error {
  constructor(public readonly reason:string,public readonly status?:number,public readonly validationIssues?:SafeValidationIssue[]){super(reason);}
}
async function httpError(response:Response):Promise<ProviderAttemptError> {
  let reason='HTTP_ERROR';
  try {
    const body=await readBoundedJson(response,4096) as {error?:{message?:unknown}};
    const message=typeof body.error?.message==='string'?body.error.message.slice(0,2048).toLowerCase():'';
    if(/no endpoints|no eligible|no matching provider/.test(message))reason='NO_ELIGIBLE_PROVIDER';
    else if(/structured|json_schema|response_format|unsupported.*parameter/.test(message))reason='UNSUPPORTED_RESPONSE_FORMAT';
    else if(/byok|credential|key.*filter/.test(message))reason='BYOK_CONFIGURATION';
    else if(/context length|too many tokens|token limit/.test(message))reason='TOKEN_LIMIT';
  }catch {await response.body?.cancel().catch(()=>{});}
  return new ProviderAttemptError(reason,response.status);
}
function failureDiagnostics(error:unknown,requestId:string,config:AIConfig,fallback:boolean) {
  const reason=error instanceof ProviderAttemptError?error.reason:error instanceof ApiError?error.code:error instanceof SyntaxError?'INVALID_AI_JSON':error instanceof z.ZodError?'INVALID_GENERATION_METADATA':'NETWORK_ERROR';
  const status=error instanceof ProviderAttemptError?error.status??null:error instanceof ApiError?error.status:null;
  const validationIssues=error instanceof InvalidAIOutputError || error instanceof UnsupportedAIClaimError || error instanceof ProviderAttemptError?error.validationIssues:error instanceof z.ZodError?safeValidationIssues(error.issues):undefined;
  console.warn(JSON.stringify({requestId,model:fallback?FALLBACK_MODEL:config.primaryModel,provider:fallback?'OpenAI':'Azure',status,reason,...(validationIssues?.length?{validationIssues}:{})}));
}
interface Diagnostics {requestId:string;model:string;provider:string;byok:boolean;generationId:string;cost:number;upstreamCost:number|null}
function diagnostics(value:Diagnostics){console.info(JSON.stringify(value));}
async function bounded<T>(operation:(signal:AbortSignal)=>Promise<T>,timeoutMs:number,parent?:AbortSignal):Promise<T> {
  if(parent?.aborted) throw new ApiError(499,'CLIENT_CANCELLED','상세 풀이를 취소했어요.');
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  let abort:()=>void=()=>{};
  const stopped=new Promise<never>((_,reject)=>{
    abort=()=>{controller.abort();reject(new ApiError(499,'CLIENT_CANCELLED','상세 풀이를 취소했어요.'));};
    parent?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>{controller.abort();reject(new ApiError(504,'AI_TIMEOUT','풀이 응답이 늦어 기본 풀이를 보여드려요.'));},timeoutMs);
  });
  try {return await Promise.race([operation(controller.signal),stopped]);}
  finally {clearTimeout(timer);parent?.removeEventListener('abort',abort);}
}
async function lane(profile:AIProfile,config:AIConfig,requestId:string,fallback:boolean,parent:AbortSignal|undefined,fetcher:typeof fetch):Promise<Reading> {
  const allowedModels=new Set(fallback?[FALLBACK_MODEL,FALLBACK_CANONICAL_MODEL]:[config.primaryModel,...(config.canonicalModel?[config.canonicalModel]:[])]);
  return bounded(async signal=>{
    const requestBody=makeProviderRequest(profile,config,fallback);
    const response=await fetcher(`${API}/chat/completions`,{method:'POST',headers:{authorization:`Bearer ${config.apiKey}`,'content-type':'application/json','HTTP-Referer':config.siteUrl,'X-OpenRouter-Title':'Saju Lab'},body:JSON.stringify(requestBody),signal});
    if(!response.ok)throw await httpError(response);
    const parsed=completionSchema.safeParse(await readBoundedJson(response,65_536));
    if(!parsed.success) throw new ProviderAttemptError('INVALID_PROVIDER_RESPONSE',undefined,safeValidationIssues(parsed.error.issues));
    const completion=parsed.data;
    let byok=completion.usage.is_byok??completion.usage.cost_details?.is_byok??completion.is_byok;
    let provider=completion.provider;
    let cost=completion.usage.cost;
    let upstreamCost=completion.usage.cost_details?.upstream_inference_cost??null;
    if(byok===undefined || !provider || (byok && upstreamCost===null)) {
      // Exactly one metadata lookup; no paid generation or retry is hidden here.
      const metadata=await bounded(async lookupSignal=>{
        const result=await fetcher(`${API}/generation?id=${encodeURIComponent(completion.id)}`,{headers:{authorization:`Bearer ${config.apiKey}`},signal:lookupSignal});
        if(!result.ok)throw new ProviderAttemptError('GENERATION_METADATA_UNAVAILABLE',result.status);
        return generationSchema.parse((await readBoundedJson(result,32_768) as {data?:unknown})?.data);
      },3_000,signal);
      if(metadata.id!==completion.id || !allowedModels.has(metadata.model))throw new ProviderAttemptError('GENERATION_IDENTITY_MISMATCH');
      byok=metadata.is_byok;provider=metadata.provider_name;cost=metadata.total_cost;upstreamCost=metadata.upstream_inference_cost??null;
    }
    if(typeof byok==='boolean' && provider)diagnostics({requestId,model:completion.model,provider,byok,generationId:completion.id,cost,upstreamCost});
    if(!allowedModels.has(completion.model))throw new ProviderAttemptError('MODEL_MISMATCH');
    if(completion.choices[0].message.refusal)throw new ProviderAttemptError('PROVIDER_REFUSAL');
    const expectedProvider=fallback?/^openai$/i:/^azure(?: openai)?$/i;
    if(byok!==!fallback || !provider || !expectedProvider.test(provider)) throw new ProviderAttemptError('UNVERIFIED_PROVIDER');
    if((cost+(byok?(upstreamCost??0):0))*1_000_000>generationCostUpperMicros(requestBody,config,fallback)) throw new ProviderAttemptError('GENERATION_OVER_BUDGET');
    const reading=validateReading(JSON.parse(completion.choices[0].message.content),profile);
    return reading;
  },fallback?25_000:45_000,parent);
}
export async function runReading(profile:AIProfile,config:AIConfig,requestId:string,signal?:AbortSignal,fetcher:typeof fetch=fetch,onRetry?:()=>void):Promise<Reading> {
  makeProviderRequest(profile,config); // Refuse unsafe price/token configuration before any paid call.
  for(const fallback of [false,true]) {
    if(signal?.aborted) throw new ApiError(499,'CLIENT_CANCELLED','상세 풀이를 취소했어요.');
    if(fallback)onRetry?.();
    try {return await lane(profile,config,requestId,fallback,signal,fetcher);}
    catch(error){failureDiagnostics(error,requestId,config,fallback);if(signal?.aborted || (error instanceof ApiError && error.code==='CLIENT_CANCELLED'))throw new ApiError(499,'CLIENT_CANCELLED','상세 풀이를 취소했어요.');}
  }
  throw new ApiError(502,'AI_FAILED','상세 풀이를 완성하지 못했어요. 계산된 기본 풀이는 그대로 볼 수 있어요.');
}
