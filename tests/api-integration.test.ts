import { Miniflare } from 'miniflare';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { handleAnalyze, handleChallenge, handleStatus } from '../lib/server/handlers';
import { type ServerEnv } from '../lib/server/config';
import { SECTION_KEYS } from '../lib/contracts';

let mf:Miniflare,db:D1Database,env:ServerEnv;
const site='https://saju.test';
const profile={version:1,dayElement:'wood',polarity:'yang',elementCounts:{wood:2,fire:1,earth:1,metal:1,water:1},tenGodCounts:{비견:1,정인:1},season:'봄',timeKnown:false,boundaryUncertain:false,cycles:[],annual:[{year:2026,element:'fire'}],analysisYear:2026};
const reading={headline:'나무처럼 천천히 자라는 마음',intro:'전통 사주는 과학적 예측이 아닌 자기 성찰의 참고 자료예요.',sections:Object.fromEntries(SECTION_KEYS.map(key=>[key,{title:'마음을 살펴봐요',body:'작은 일부터 하나씩 시작해 보세요.',tip:'오늘의 계획을 한 줄 적어 보세요.',evidence:[key==='year'?'annual:2026':'day-element']}]))};
const completion={id:'gen-test123',model:'openai/gpt-5.6-luna',provider:'Azure',choices:[{finish_reason:'stop',message:{content:JSON.stringify(reading)}}],usage:{is_byok:true,cost:0.0001,cost_details:{upstream_inference_cost:0.001}}};
const request=(body:unknown,headers:Record<string,string>={},signal?:AbortSignal)=>new Request(`${site}/api/analyze`,{method:'POST',headers:{origin:site,'content-type':'application/json','cf-connecting-ip':'203.0.113.11',...headers},body:JSON.stringify(body),signal});
async function proof(){
  const response=await handleChallenge(new Request(`${site}/api/challenge`,{headers:{'cf-connecting-ip':'203.0.113.11'}}),env);
  const {challenge}=await response.json() as {challenge:{token:string;difficulty:number}};
  for(let nonce=0;nonce<2_000_000;nonce++) {
    const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${challenge.token}:${nonce}`)));
    if(digest[0]===0 && digest[1]<(1<<(16-challenge.difficulty)))return {token:challenge.token,nonce:String(nonce)};
  }
  throw Error('Proof fixture did not solve');
}
beforeEach(async()=>{
  mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
  db=await mf.getD1Database('DB') as unknown as D1Database;
  await db.prepare(`CREATE TABLE ai_reservations (request_id TEXT PRIMARY KEY, challenge_hash TEXT NOT NULL UNIQUE, ip_hash TEXT NOT NULL, day_key TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, leased_until INTEGER NOT NULL, reserved_microusd INTEGER NOT NULL)`).run();
  env={DB:db,SITE_URL:site,AI_ENABLED:'true',OPENROUTER_API_KEY:'test-key',OPENROUTER_AZURE_MODEL:'openai/gpt-5.6-luna',AI_AZURE_BYOK_ONLY_CONFIRMED:'true',AI_IP_HMAC_KEY:'test-only-hmac-key-at-least-32-characters'};
});
afterEach(async()=>{await mf.dispose();});
describe('real API handler and D1 integration without paid requests',()=>{
  it('streams acceptance before the provider responds and retains the concurrency lease until completion',async()=>{
    let complete!:(r:Response)=>void;
    const provider=vi.fn<typeof fetch>(()=>new Promise<Response>(resolve=>{complete=resolve;}));
    const response=await handleAnalyze(request({profile,proof:await proof()},{accept:'application/x-ndjson'}),env,provider);
    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    const reader=response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain('"stage":"accepted"');
    expect((await db.prepare('SELECT leased_until FROM ai_reservations').first<{leased_until:number}>())!.leased_until).toBeGreaterThan(Date.now());
    complete(Response.json(completion));
    let data='';while(true){const {done,value}=await reader.read();if(done)break;data+=new TextDecoder().decode(value);}
    const events=data.trim().split('\n').map(line=>JSON.parse(line));
    expect(events.map(event=>event.type)).toEqual(['progress','result']);
    expect(events[0].stage).toBe('verified');
    expect(events[1].reading.source).toBe('ai');
    expect((await db.prepare('SELECT leased_until FROM ai_reservations').first<{leased_until:number}>())?.leased_until).toBe(0);
  },20_000);
  it('aborts the paid provider and releases the lease when a streaming reader cancels',async()=>{
    let providerSignal:AbortSignal|undefined;
    const provider=vi.fn<typeof fetch>((_url,init)=>new Promise((_resolve,reject)=>{providerSignal=init?.signal??undefined;providerSignal?.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});}));
    const response=await handleAnalyze(request({profile,proof:await proof()},{accept:'application/x-ndjson'}),env,provider);
    const reader=response.body!.getReader();await reader.read();await reader.cancel();
    await vi.waitFor(()=>expect(providerSignal?.aborted).toBe(true));
    await vi.waitFor(async()=>expect((await db.prepare('SELECT leased_until FROM ai_reservations').first<{leased_until:number}>())?.leased_until).toBe(0));
    expect(provider).toHaveBeenCalledTimes(1);
  },20_000);
  it('reports a real fallback without pretending the unfinished reading is complete',async()=>{
    const provider=vi.fn<typeof fetch>(async()=>new Response('',{status:503}));
    const response=await handleAnalyze(request({profile,proof:await proof()},{accept:'application/x-ndjson'}),env,provider);
    const events=(await response.text()).trim().split('\n').map(line=>JSON.parse(line));
    expect(events.map(e=>e.stage||e.type)).toEqual(['accepted','retrying','error']);
    expect(provider).toHaveBeenCalledTimes(2);
  },20_000);
  it('runs challenge → validated reading, releases lease and stores only short-lived reservation metadata',async()=>{
    const solved=await proof();
    const response=await handleAnalyze(request({profile,proof:solved}),env,vi.fn(async()=>Response.json(completion)));
    expect(response.status).toBe(200);expect(await response.json()).toMatchObject({reading:{source:'ai'}});
    const row=await db.prepare('SELECT * FROM ai_reservations').first<Record<string,unknown>>();
    expect(row).toMatchObject({leased_until:0,reserved_microusd:100_000});
    expect(row?.ip_hash).not.toBe('203.0.113.11');
    expect(JSON.stringify(row)).not.toMatch(/203\.0\.113|elementCounts|wood|headline|생년/);
    const replay=await handleAnalyze(request({profile,proof:solved}),env,vi.fn(async()=>Response.json(completion)));
    expect(replay.status).toBe(429);expect(await replay.json()).toMatchObject({code:'CHALLENGE_REPLAY'});
  },20_000);
  it('rejects wrong origin, content type, personal input, and missing proof before any provider call',async()=>{
    const fetcher=vi.fn(async()=>Response.json(completion));
    const cases=[
      [request({profile},{origin:'https://attacker.test'}),403],
      [request({profile},{'content-type':'text/plain'}),415],
      [request({profile:{...profile,name:'private'}}),400],
      [request({profile}),400],
      [new Request(`${site}/api/analyze`,{method:'POST',headers:{origin:site,'content-type':'application/json','cf-connecting-ip':'203.0.113.11'},body:' '.repeat(12_289)}),413],
    ] as const;
    for(const [req,status]of cases)expect((await handleAnalyze(req,env,fetcher)).status).toBe(status);
    expect(fetcher).not.toHaveBeenCalled();
    expect((await db.prepare('SELECT COUNT(*) AS n FROM ai_reservations').first<{n:number}>())?.n).toBe(0);
  });
  it('releases lease after client cancellation while retaining the full two-attempt budget',async()=>{
    const solved=await proof();const controller=new AbortController();
    const fetcher=vi.fn((_url:string|URL|Request,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{
      init?.signal?.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});
      controller.abort();
    }));
    const response=await handleAnalyze(request({profile,proof:solved},{},controller.signal),env,fetcher);
    expect(response.status).toBe(499);
    expect(await db.prepare('SELECT leased_until,reserved_microusd FROM ai_reservations').first()).toEqual({leased_until:0,reserved_microusd:100_000});
    expect(fetcher).toHaveBeenCalledTimes(1);
  },20_000);
  it('fails availability closed if schema is missing even with configured secrets',async()=>{
    await db.prepare('DROP TABLE ai_reservations').run();
    expect(await (await handleStatus(env)).json()).toEqual({available:false});
    expect((await handleAnalyze(request({profile}),env)).status).toBe(503);
  });
});
