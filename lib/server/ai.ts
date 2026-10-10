import { SECTION_KEYS, type AIProfile, type Reading } from '../contracts';
import { ApiError } from './errors';
import { type AIConfig, unavailable } from './config';
import { evidenceIds, readBoundedJson, validateReading, OUTPUT_TEXT_LIMITS, KOREAN_OUTPUT_PATTERN, InvalidAIOutputError, safeValidationIssues, type SafeValidationIssue } from './validation';
import { z } from 'zod';

const API='https://openrouter.ai/api/v1';
const FALLBACK_MODEL='openai/gpt-6-luna';
const FALLBACK_CANONICAL_MODEL='openai/gpt-6-luna-20260922';
const FALLBACK_PROMPT_PRICE=0.1;
const FALLBACK_COMPLETION_PRICE=0.5;
const systemPrompt=`당신은 사주랩의 다정한 한국어 사주 해석 안내자예요. 친구에게 차분히 이야기를 건네듯 자연스러운 해요체로 쓰세요. 이 해석은 전통 상징을 활용한 자기 성찰이며 과학적 예측이 아니라는 안내는 intro에 한 번만 넣으세요.
입력은 이미 계산된 오행·십성·계절·연도·시기 요약이에요. 출생 날짜, 이름, 성별, 시각, 천간, 지지, 사주 기둥은 없어요. 없는 사실이나 기둥을 추측하지 말고 실제 입력의 관계와 분포만 해석하세요. 수치와 연도는 제공된 값만 쓸 수 있어요. 정확한 날짜나 시각, 운명, 질병, 수명, 성적, 합격, 결혼, 투자 수익을 만들어 내거나 확정·진단하지 마세요. 숨은 추론 과정은 출력하지 마세요.
headline은 조언이나 명령이 아니라 이 사람의 결을 생생하게 보여주는 짧은 정체성 문장이에요. 제공된 특징 두 가지를 연결해 '~을 살피며 ~을 키우는 사람'처럼 쓰되, 이 틀을 그대로 반복하거나 모든 사람에게 같은 수식어를 붙이지 마세요. '~해 보세요'로 끝내지 마세요. 각 section title도 내용을 보여주는 짧고 다정한 제목으로 쓰세요.
JSON의 9개 section을 모두 작성하세요. 각 body는 총 120~220자 안팎의 짧은 3문장이 목표예요. 첫 문장은 실제 특징에서 읽을 수 있는 성향을 부드럽게 풀고, 다음 문장은 대화·선택·일상에서 떠올릴 만한 구체적 장면을 조건부 예시로 들고, 마지막 문장은 강점과 부담 사이의 균형을 따뜻하게 짚으세요. 예시를 실제 과거 경험이라고 단정하지 마세요. 상징과 일상을 연결해 풍부하게 설명하되 확인되지 않은 세부 사실은 추가하지 마세요. tip은 바로 할 수 있는 작고 안전한 행동 한 문장이에요. body를 같은 말의 반복이나 '돌아보세요'만으로 채우지 마세요.
성격은 생각과 반응의 방식, 강점은 잘 쓰이는 능력, 관계는 친구·동료와 경계·소통, love는 애정 표현과 친밀감·속도, career는 배우고 일하고 결정하는 방식, money는 지출·저축·선택의 습관을 다루세요. 특히 관계·연애·일·돈이 서로 다른 이야기가 되게 하세요. 돈은 실제 기록과 여유 자원을 바탕으로 선택하도록 설명하고 수익·재산을 예언하지 마세요. 단순 개수의 많고 적음이나 0을 좋고 나쁨·결핍·성공의 확정으로 해석하지 마세요. year는 제공된 연도의 상징을 실제로 할 수 있는 방향과 연결하고, advice는 앞의 이야기를 받아 한 가지 균형을 제안하세요.
문화·과학 안내와 일반적 한계는 intro에 모으고 각 section에서 되풀이하지 마세요. '입력된 요약', '자료에는', '계산에 따르면'처럼 데이터 설명문으로 시작하지 마세요. 시간이 미상이거나 경계가 불확실하면 그 실제 제한은 intro에 간단히 알리세요. cycles가 비어 있으면 그 section에서 긴 시기별 정보가 없다는 실제 한계를 한 번 알리고 현재의 생활 리듬에 관해 이야기하세요. cycles가 있으면 실제 주어진 나이 구간과 상징에만 근거하세요.
한자와 일간, 십신, 십성, 천간, 지지, 간지, 시주, 대운, 오행, 음양, 격국, 용신 같은 전문용어는 headline·intro·title·body·tip에 쓰지 마세요. 개별 전문 label을 되풀이하기보다 배움·표현·책임·독립심 같은 쉬운 말로 풀어 주세요. 나무, 불, 흙, 쇠, 물과 일상의 쉬운 한국어만 사용하세요. HTML, 코드, URL, 숨은 추론은 금지예요.
모든 문장은 한국어를 포함하고 글자 수는 headline 2~70, intro 2~300, 각 title 2~40, body 2~450, tip 2~120 안에 맞추세요. 이 상한은 영어 token 수가 아니에요. body 120~220자는 작성 목표이며 전체 9개 section을 끝낼 수 있게 간결하게 쓰세요. evidence 배열은 제공된 근거 ID 1~5개만 넣으세요. year는 annual 근거, cycles는 실제 cycles가 있으면 cycle 근거만 쓰세요. source나 schema에 없는 key를 추가하지 마세요.`;
const textSchema=(maxLength:number)=>({type:'string',minLength:2,maxLength,pattern:KOREAN_OUTPUT_PATTERN,description:'쉬운 한국어 문장. 한자, 사주 전문용어, HTML, 코드, URL 금지.'});
function responseFormat(profile:AIProfile) {
  const ids=evidenceIds(profile);
  const sections=Object.fromEntries(SECTION_KEYS.map(key=>{
    const allowed=key==='year'?ids.filter(id=>id.startsWith('annual:')):key==='cycles' && profile.cycles.length?ids.filter(id=>id.startsWith('cycle:')):ids;
    return [key,{type:'object',additionalProperties:false,properties:{title:textSchema(OUTPUT_TEXT_LIMITS.title),body:textSchema(OUTPUT_TEXT_LIMITS.body),tip:textSchema(OUTPUT_TEXT_LIMITS.tip),evidence:{type:'array',minItems:1,maxItems:5,items:{type:'string',enum:allowed}}},required:['title','body','tip','evidence']}];
  }));
  return {type:'json_schema',json_schema:{name:'saju_reading',strict:true,schema:{type:'object',additionalProperties:false,properties:{headline:textSchema(OUTPUT_TEXT_LIMITS.headline),intro:textSchema(OUTPUT_TEXT_LIMITS.intro),sections:{type:'object',additionalProperties:false,properties:sections,required:[...SECTION_KEYS]}},required:['headline','intro','sections']}}};
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
  const validationIssues=error instanceof InvalidAIOutputError || error instanceof ProviderAttemptError?error.validationIssues:error instanceof z.ZodError?safeValidationIssues(error.issues):undefined;
  console.warn(JSON.stringify({requestId,model:fallback?FALLBACK_MODEL:config.primaryModel,provider:fallback?'OpenAI':'Azure',status,reason,...(validationIssues?.length?{validationIssues}:{})}));
}
interface Diagnostics {requestId:string;model:string;provider:string;byok:boolean;generationId:string;cost:number;upstreamCost:number|null}
function diagnostics(value:Diagnostics){console.info(JSON.stringify(value));}
async function bounded<T>(operation:(signal:AbortSignal)=>Promise<T>,timeoutMs:number,parent?:AbortSignal):Promise<T> {
  if(parent?.aborted) throw new ApiError(499,'CLIENT_CANCELLED','AI 풀이를 취소했어요.');
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  let abort:()=>void=()=>{};
  const stopped=new Promise<never>((_,reject)=>{
    abort=()=>{controller.abort();reject(new ApiError(499,'CLIENT_CANCELLED','AI 풀이를 취소했어요.'));};
    parent?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>{controller.abort();reject(new ApiError(504,'AI_TIMEOUT','AI 응답이 늦어 기본 풀이를 보여드려요.'));},timeoutMs);
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
  },25_000,parent);
}
export async function runReading(profile:AIProfile,config:AIConfig,requestId:string,signal?:AbortSignal,fetcher:typeof fetch=fetch):Promise<Reading> {
  makeProviderRequest(profile,config); // Refuse unsafe price/token configuration before any paid call.
  for(const fallback of [false,true]) {
    if(signal?.aborted) throw new ApiError(499,'CLIENT_CANCELLED','AI 풀이를 취소했어요.');
    try {return await lane(profile,config,requestId,fallback,signal,fetcher);}
    catch(error){failureDiagnostics(error,requestId,config,fallback);if(signal?.aborted || (error instanceof ApiError && error.code==='CLIENT_CANCELLED'))throw new ApiError(499,'CLIENT_CANCELLED','AI 풀이를 취소했어요.');}
  }
  throw new ApiError(502,'AI_FAILED','AI 풀이를 완성하지 못했어요. 계산된 기본 풀이는 그대로 볼 수 있어요.');
}
