import { afterEach, describe, expect, it, vi } from 'vitest';
import { runReading, makeProviderRequest } from '../lib/server/ai';
import { getConfig } from '../lib/server/config';
import { validateReading } from '../lib/server/validation';
import { SECTION_KEYS, type AIProfile } from '../lib/contracts';

const profile:AIProfile={version:1,dayElement:'wood',polarity:'yang',elementCounts:{wood:2,fire:1,earth:1,metal:1,water:1},tenGodCounts:{비견:1,정인:1},season:'봄',timeKnown:false,boundaryUncertain:false,cycles:[],annual:[{year:2026,element:'fire'}],analysisYear:2026};
const reading={headline:'나무처럼 천천히 자라는 마음',intro:'이 풀이는 전통 사주를 참고한 자기 성찰 이야기예요.',sections:Object.fromEntries(SECTION_KEYS.map(key=>[key,{title:'내 마음 살펴보기',body:'나무의 기운을 참고해 지금 마음을 살펴보세요.',tip:'오늘은 작은 일을 하나 적어 보세요.',evidence:[key==='year'?'annual:2026':'day-element']}]))};
const config=()=>getConfig({AI_ENABLED:'true',SITE_URL:'https://saju.test',OPENROUTER_API_KEY:'test-key',OPENROUTER_AZURE_MODEL:'openai/gpt-5.6-luna',AI_AZURE_BYOK_ONLY_CONFIRMED:'true',AI_IP_HMAC_KEY:'test-hmac-key-at-least-32-characters',DB:{} as D1Database});
const completion=(byok:boolean|'unknown'=true,model='openai/gpt-5.6-luna',provider='Azure',content=reading)=>({id:'gen-test123',model,provider,choices:[{finish_reason:'stop',message:{role:'assistant',content:JSON.stringify(content)}}],usage:{prompt_tokens:200,completion_tokens:900,total_tokens:1100,cost:0.001,...(byok==='unknown'?{}:{is_byok:byok}),cost_details:{upstream_inference_cost:byok?0.001:0}}});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});

describe('verified provider lanes with bounded attempts',()=>{
  it('accepts actual Azure BYOK and fixes source on the server',async()=>{
    const bodies:Record<string,unknown>[]=[];
    const fetcher=vi.fn(async (_url: string|URL|Request,init?:RequestInit)=>{new Request(_url,init);bodies.push(JSON.parse(String(init?.body)));return Response.json(completion());});
    const result=await runReading(profile,config(),'request-1',undefined,fetcher);
    expect(result.source).toBe('ai'); expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({model:'openai/gpt-5.6-luna',max_tokens:3200,reasoning:{enabled:false},provider:{only:['azure'],allow_fallbacks:false,data_collection:'deny',require_parameters:true,max_price:{request:0}}});
    expect(JSON.stringify(bodies[0])).not.toContain('birthdate');
  });
  it('supports mandatory primary reasoning with an allowed effort and excludes internal reasoning',()=>{
    const env={AI_ENABLED:'true',SITE_URL:'https://saju.test',OPENROUTER_API_KEY:'test-key',OPENROUTER_AZURE_MODEL:'openai/gpt-6.1-sol',AI_AZURE_BYOK_ONLY_CONFIRMED:'true',AI_IP_HMAC_KEY:'test-hmac-key-at-least-32-characters',DB:{} as D1Database};
    for(const effort of ['low','medium','high']) {
      const configured=getConfig({...env,AI_PRIMARY_REASONING_EFFORT:effort});
      expect(makeProviderRequest(profile,configured).reasoning).toEqual({effort,exclude:true});
      expect(makeProviderRequest(profile,configured,true).reasoning).toEqual({enabled:false});
    }
    expect(makeProviderRequest(profile,getConfig(env)).reasoning).toEqual({enabled:false});
    expect(()=>getConfig({...env,AI_PRIMARY_REASONING_EFFORT:'unbounded'})).toThrow();
  });
  it('rejects shared Azure as primary and falls back exactly once to credit OpenAI Luna',async()=>{
    const bodies:Record<string,unknown>[]=[];
    const fetcher=vi.fn(async (_url: string|URL|Request,init?:RequestInit)=>{bodies.push(JSON.parse(String(init?.body)));return Response.json(bodies.length===1?completion(false):completion(false,'openai/gpt-6-luna','OpenAI'));});
    const result=await runReading(profile,config(),'request-2',undefined,fetcher);
    expect(result.source).toBe('ai');expect(bodies).toHaveLength(2);
    expect(bodies[1]).toMatchObject({model:'openai/gpt-6-luna',reasoning:{enabled:false},provider:{only:['openai'],ignore:['azure'],allow_fallbacks:false}});
  });
  it('accepts only the verified dated fallback alias while still requesting the exact Luna model',async()=>{
    const bodies:Record<string,unknown>[]=[];
    const fetcher=vi.fn(async(_url:string|URL|Request,init?:RequestInit)=>{
      bodies.push(JSON.parse(String(init?.body)));
      return Response.json(bodies.length===1?completion(false):completion(false,'openai/gpt-6-luna-20260922','OpenAI'));
    });
    expect((await runReading(profile,config(),'fallback-alias',undefined,fetcher)).source).toBe('ai');
    expect(bodies[1].model).toBe('openai/gpt-6-luna');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('records rejected shared-provider cost metadata without logging input or output',async()=>{
    const log=vi.spyOn(console,'info').mockImplementation(()=>{});let calls=0;
    const fetcher=vi.fn(async()=>{calls++;return Response.json(calls===1?completion(false):completion(false,'openai/gpt-6-luna','OpenAI'));});
    await runReading(profile,config(),'request-diagnostic',undefined,fetcher);
    const entries=log.mock.calls.map(args=>JSON.parse(String(args[0])));
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({provider:'Azure',byok:false,generationId:'gen-test123',cost:0.001});
    for(const entry of entries)expect(Object.keys(entry).sort()).toEqual(['byok','cost','generationId','model','provider','requestId','upstreamCost']);
  });
  it('looks up generation metadata when inline BYOK evidence is absent',async()=>{
    const fetcher=vi.fn(async(url:string|URL|Request)=>String(url).includes('/generation?')?Response.json({data:{id:'gen-test123',model:'openai/gpt-5.6-luna',provider_name:'Azure',is_byok:true,total_cost:0.001,upstream_inference_cost:0.001}}):Response.json(completion('unknown')));
    expect((await runReading(profile,config(),'request-3',undefined,fetcher)).source).toBe('ai');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('logs scrubbed HTTP failure reasons while never exposing provider error details',async()=>{
    const log=vi.spyOn(console,'warn').mockImplementation(()=>{});
    const fetcher=vi.fn(async()=>Response.json({error:{message:'secret-key-and-private-input'}},{status:402}));
    await expect(runReading(profile,config(),'safe-failure',undefined,fetcher)).rejects.toMatchObject({code:'AI_FAILED'});
    const entries=log.mock.calls.map(args=>JSON.parse(String(args[0])));
    expect(entries).toHaveLength(2);expect(entries[0]).toMatchObject({requestId:'safe-failure',model:'openai/gpt-5.6-luna',provider:'Azure',status:402,reason:'HTTP_ERROR'});
    expect(JSON.stringify(entries)).not.toContain('secret-key-and-private-input');
  });
  it('logs only static validation paths and codes when output exceeds a field limit',async()=>{
    const log=vi.spyOn(console,'warn').mockImplementation(()=>{});let calls=0;
    const invalid={...reading,intro:'나'.repeat(301)+'private-response-text','private-field-name':'private-field-value'};
    const fetcher=vi.fn(async()=>Response.json(completion(++calls===1,calls===1?'openai/gpt-5.6-luna':'openai/gpt-6-luna',calls===1?'Azure':'OpenAI',invalid)));
    await expect(runReading(profile,config(),'safe-schema-failure',undefined,fetcher)).rejects.toMatchObject({code:'AI_FAILED'});
    const entries=log.mock.calls.map(args=>JSON.parse(String(args[0])));
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({reason:'INVALID_AI_OUTPUT',validationIssues:expect.arrayContaining([{path:'intro',code:'too_big'},{path:'$',code:'unrecognized_keys'}])});
    expect(JSON.stringify(entries)).not.toMatch(/private-response-text|private-field-name|private-field-value/);
  });
  it('identifies a prohibited Hanja rule without logging the generated text',async()=>{
    const log=vi.spyOn(console,'warn').mockImplementation(()=>{});let calls=0;
    const invalid={...reading,intro:'나무 木에 관한 private-hanja-output'};
    const fetcher=vi.fn(async()=>Response.json(completion(++calls===1,calls===1?'openai/gpt-5.6-luna':'openai/gpt-6-luna',calls===1?'Azure':'OpenAI',invalid)));
    await expect(runReading(profile,config(),'safe-hanja-failure',undefined,fetcher)).rejects.toMatchObject({code:'AI_FAILED'});
    const entries=log.mock.calls.map(args=>JSON.parse(String(args[0])));
    expect(entries[0]).toMatchObject({reason:'INVALID_AI_OUTPUT',validationIssues:[{path:'intro',code:'custom',rule:'NO_HANJA'}]});
    expect(JSON.stringify(entries)).not.toContain('private-hanja-output');
  });
  it('sends supported field lengths, plain Korean pattern and bounded evidence in the wire schema',()=>{
    const format=makeProviderRequest(profile,config()).response_format;
    expect(format).toMatchObject({type:'json_schema',json_schema:{schema:{properties:{headline:{type:'string',minLength:2,maxLength:70,pattern:expect.any(String)},intro:{minLength:2,maxLength:300},sections:{properties:{personality:{properties:{title:{minLength:2,maxLength:40},body:{minLength:2,maxLength:450},tip:{minLength:2,maxLength:120},evidence:{minItems:1,maxItems:5}}},year:{properties:{evidence:{items:{enum:['annual:2026']}}}}}}}}}});
    expect(String(makeProviderRequest(profile,config()).messages[0].content)).toContain('headline 2~70');
  });
  it('does not accept BYOK fallback or send a third paid request',async()=>{
    let calls=0;
    const fetcher=vi.fn(async()=>{calls++;return Response.json(calls===1?completion(false):completion(true,'openai/gpt-6-luna','OpenAI'));});
    await expect(runReading(profile,config(),'request-4',undefined,fetcher)).rejects.toMatchObject({code:'AI_FAILED'});
    expect(calls).toBe(2);
  });
  it('rejects mismatched actual model on both lanes',async()=>{
    let calls=0;
    const fetcher=vi.fn(async()=>{calls++;return Response.json(completion(true,'openai/another-model'));});
    await expect(runReading(profile,config(),'request-5',undefined,fetcher)).rejects.toMatchObject({code:'AI_FAILED'});
    expect(calls).toBe(2);
  });
  it('times out each lane once and aborts the underlying request',async()=>{
    vi.useFakeTimers();let calls=0,aborted=0;
    const fetcher=vi.fn((_url:string|URL|Request,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{calls++;init?.signal?.addEventListener('abort',()=>{aborted++;reject(new DOMException('aborted','AbortError'));},{once:true});}));
    const promise=runReading(profile,config(),'request-6',undefined,fetcher);
    const assertion=expect(promise).rejects.toMatchObject({code:'AI_FAILED'});
    await vi.advanceTimersByTimeAsync(50_100);await assertion;
    expect(calls).toBe(2);expect(aborted).toBe(2);
  });
  it('client cancellation aborts primary and prevents fallback',async()=>{
    const controller=new AbortController();let calls=0;
    const fetcher=vi.fn((_url:string|URL|Request,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{calls++;init?.signal?.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});}));
    const promise=runReading(profile,config(),'request-7',controller.signal,fetcher);controller.abort();
    await expect(promise).rejects.toMatchObject({code:'CLIENT_CANCELLED'});expect(calls).toBe(1);
  });
  it('admits a higher priced Azure model only with a sufficient bounded job reserve',()=>{
    const paidConfig=getConfig({AI_ENABLED:'true',SITE_URL:'https://saju.test',OPENROUTER_API_KEY:'test-key',OPENROUTER_AZURE_MODEL:'deepseek/deepseek-v4-pro',AI_AZURE_BYOK_ONLY_CONFIRMED:'true',AI_IP_HMAC_KEY:'test-hmac-key-at-least-32-characters',DB:{} as D1Database,AI_MAX_PROMPT_PRICE_PER_MILLION:'10',AI_MAX_COMPLETION_PRICE_PER_MILLION:'50',AI_JOB_RESERVE_USD:'0.5'});
    expect(paidConfig.dailyCalls).toBe(40);
    expect(()=>makeProviderRequest(profile,paidConfig)).not.toThrow();
    expect(makeProviderRequest(profile,paidConfig)).toMatchObject({model:'deepseek/deepseek-v4-pro',provider:{only:['azure'],max_price:{prompt:10,completion:50}}});
    expect(makeProviderRequest(profile,paidConfig,true)).toMatchObject({model:'openai/gpt-6-luna',provider:{max_price:{prompt:0.1,completion:0.5}}});
    expect(()=>makeProviderRequest(profile,{...paidConfig,reserveMicros:40_000})).toThrow();
  });
  it('uses JSON object plus explicit schema for non-structured Azure and accepts the verified canonical alias',async()=>{
    const deepseekConfig=getConfig({AI_ENABLED:'true',SITE_URL:'https://saju.test',OPENROUTER_API_KEY:'test-key',OPENROUTER_AZURE_MODEL:'deepseek/deepseek-v4-pro',OPENROUTER_AZURE_CANONICAL_MODEL:'deepseek/deepseek-v4-pro-20260423',AI_PRIMARY_RESPONSE_MODE:'json_object',AI_AZURE_BYOK_ONLY_CONFIRMED:'true',AI_IP_HMAC_KEY:'test-hmac-key-at-least-32-characters',DB:{} as D1Database,AI_MAX_PROMPT_PRICE_PER_MILLION:'1.91',AI_MAX_COMPLETION_PRICE_PER_MILLION:'3.83',AI_JOB_RESERVE_USD:'0.1'});
    const body=makeProviderRequest(profile,deepseekConfig);
    expect(body.response_format).toEqual({type:'json_object'});
    expect(String(body.messages[1].content)).toContain('outputSchema');
    expect(makeProviderRequest(profile,deepseekConfig,true).response_format.type).toBe('json_schema');
    const fetcher=vi.fn(async()=>Response.json(completion(true,'deepseek/deepseek-v4-pro-20260423','Azure')));
    expect((await runReading(profile,deepseekConfig,'canonical-test',undefined,fetcher)).source).toBe('ai');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('uses the authorized $20 daily defaults and caps configuration at $20 and 200 jobs',()=>{
    const env={AI_ENABLED:'true',SITE_URL:'https://saju.test',OPENROUTER_API_KEY:'test-key',OPENROUTER_AZURE_MODEL:'openai/gpt-6.1-sol',AI_AZURE_BYOK_ONLY_CONFIRMED:'true',AI_IP_HMAC_KEY:'test-hmac-key-at-least-32-characters',DB:{} as D1Database};
    expect(getConfig(env)).toMatchObject({dailyBudgetMicros:20_000_000,dailyCalls:200,reserveMicros:100_000,promptPrice:2,completionPrice:10});
    expect(getConfig({...env,AI_DAILY_BUDGET_USD:'20',AI_DAILY_CALL_LIMIT:'200'})).toMatchObject({dailyBudgetMicros:20_000_000,dailyCalls:200});
    expect(()=>getConfig({...env,AI_DAILY_BUDGET_USD:'20.01'})).toThrow();
    expect(()=>getConfig({...env,AI_DAILY_CALL_LIMIT:'201'})).toThrow();
    expect(getConfig({...env,AI_DAILY_BUDGET_USD:'2',AI_DAILY_CALL_LIMIT:'100',AI_JOB_RESERVE_USD:'0.5'}).dailyCalls).toBe(4);
    expect(()=>getConfig({...env,AI_DAILY_BUDGET_USD:'2',AI_JOB_RESERVE_USD:'2.01'})).toThrow();
  });
  it('fails closed when BYOK-only account state is unconfirmed',()=>{
    expect(()=>getConfig({AI_ENABLED:'true',SITE_URL:'https://saju.test',OPENROUTER_API_KEY:'test-key',OPENROUTER_AZURE_MODEL:'openai/gpt-5.6-luna',AI_IP_HMAC_KEY:'test-hmac-key-at-least-32-characters',DB:{} as D1Database})).toThrow();
  });
});

describe('AI response boundary',()=>{
  it('accepts an honest missing-hour-pillar explanation without inventing a pillar',()=>{
    expect(validateReading({...reading,intro:'태어난 시간을 몰라 계산 범위를 줄였어요. 전통 해석을 자기 성찰 자료로 참고해 주세요.'},profile).source).toBe('ai');
  });
  it('accepts ordinary Korean mental balance and skill advice without mistaking words for pillars',()=>{
    expect(validateReading({...reading,headline:'정신의 균형과 기술의 성장을 살펴봐요',intro:'이번 일주일에는 작은 일을 하나씩 시작해 보세요.'},profile).source).toBe('ai');
  });
  it.each([
    {...reading,source:'local'},
    {...reading,sections:{...reading.sections,money:{...reading.sections.money,evidence:['birthdate']}}},
    {...reading,headline:'갑자일주로 태어난 당신'},
    {...reading,headline:'갑자 기운으로 태어난 당신'},
    {...reading,headline:'좋은 일간과 십신을 살펴봐요'},
    {...reading,headline:'대운과 오행을 살펴봐요'},
    {...reading,headline:'나무 木처럼 천천히 자라나요'},
    {...reading,headline:'2039년 반드시 성공합니다'},
    {...reading,headline:'나무는 9개로 가득해요'},
    {...reading,headline:'생일은 1990-01-01이에요'},
    {...reading,headline:'태어난 시간은 12시예요'},
    {...reading,headline:'일간은 물의 기운이에요'},
    {...reading,headline:'2026년은 물의 기운이에요'},
    {...reading,headline:'비견은 8개로 가득해요'},
    {...reading,headline:'우울증 진단이 나왔어요'},
    {...reading,headline:'<script>실행하세요</script>'},
    {...reading,sections:{...reading.sections,year:{...reading.sections.year,evidence:['day-element']}}},
  ])('rejects unsupported claims, private facts, and forged evidence',invalid=>expect(()=>validateReading(invalid,profile)).toThrow());
});
