import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestReading } from '../lib/client-analysis';
import { calculateSaju } from '../lib/saju';

const chart = calculateSaju({ name:'보내면 안 되는 이름', year:1992, month:10, day:24, calendar:'solar', leapMonth:false, gender:'male', timeKnown:true, hour:5, minute:30, country:'KR' },2026);
const reading = { source:'ai', headline:'생각한 것을 끝까지 해내는 사람' };
afterEach(() => vi.useRealTimers());

describe('automatic analysis transport', () => {
  it('sends only calculated traits after solving the challenge, without raw birth fields', async () => {
    const sent: {url:string; body?:Record<string,unknown>}[] = [];
    const statuses:string[] = [];
    const fetcher:typeof fetch = async (url, init) => {
      sent.push({url:String(url),body:init?.body ? JSON.parse(String(init.body)) : undefined});
      return Response.json(String(url).endsWith('challenge') ? {challenge:{token:'test-proof',difficulty:0,expiresAt:Date.now()+60_000}} : {reading});
    };
    const result = await requestReading({...chart.profile, name:'private', year:1992, hour:5} as typeof chart.profile, {signal:new AbortController().signal,onStatus:status=>statuses.push(status),fetcher});
    expect(result.headline).toBe('생각한 것을 끝까지 해내는 사람');
    expect(sent.map(item=>item.url)).toEqual(['/api/challenge','/api/analyze']);
    expect(sent[1].body?.profile).toEqual(chart.profile);
    expect(JSON.stringify(sent)).not.toMatch(/보내면|private|1992|solarDate|"hour"|"name"/);
    expect(statuses).toEqual(['preparing','loading']);
    expect(sent[1].body?.proof).toEqual({token:'test-proof',nonce:'0'});
  });
  it('does not start a request that has already been cancelled', async () => {
    const abort = new AbortController(); abort.abort();
    const fetcher=vi.fn();
    await expect(requestReading(chart.profile,{signal:abort.signal,fetcher})).rejects.toMatchObject({name:'AbortError'});
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('surfaces a provider limit once without silently retrying or pretending it is AI output',async()=>{
    let calls=0;
    const fetcher:typeof fetch=async()=>{calls++; return Response.json({error:'잠시 후 다시 시도해 주세요.',retryAfter:60},{status:429});};
    await expect(requestReading(chart.profile,{signal:new AbortController().signal,fetcher})).rejects.toThrow('약 1분 후');
    expect(calls).toBe(1);
  });
  it('bounds a stalled request and aborts the network operation',async()=>{
    vi.useFakeTimers(); let signal:AbortSignal|undefined;
    const fetcher:typeof fetch=async(_url,init)=>{signal=init?.signal??undefined;return new Promise(()=>{});};
    const request=requestReading(chart.profile,{signal:new AbortController().signal,fetcher});
    const rejection=expect(request).rejects.toThrow('응답');
    await vi.advanceTimersByTimeAsync(100_001); await rejection;
    expect(signal?.aborted).toBe(true);
  });
  it('cancels while preparing without sending an analysis request',async()=>{
    const abort=new AbortController(); let calls=0;
    const fetcher:typeof fetch=async()=>{calls++;abort.abort();return Response.json({challenge:{token:'test',difficulty:0,expiresAt:Date.now()+60_000}});};
    await expect(requestReading(chart.profile,{signal:abort.signal,fetcher})).rejects.toMatchObject({name:'AbortError'});
    expect(calls).toBe(1);
  });
});

describe('real server milestone stream',()=>{
  it.each(['result','error'] as const)('waits for the server to finish cleanup after a %s event without cancelling the connection',async type=>{
    let stream!:ReadableStreamDefaultController<Uint8Array>;
    const cancel=vi.fn();const stages:string[]=[];let settled=false;
    const event=type==='result'?{type,reading}:{type,error:'풀이를 완성하지 못했어요.'};
    const fetcher:typeof fetch=async url=>String(url).endsWith('challenge')?Response.json({challenge:{token:'test',difficulty:0,expiresAt:Date.now()+60000}}):new Response(new ReadableStream({start(c){stream=c;},cancel}),{headers:{'content-type':'application/x-ndjson'}});
    const promise=requestReading(chart.profile,{signal:new AbortController().signal,fetcher,onStatus:s=>stages.push(s)}).then(value=>{settled=true;return value;},error=>{settled=true;throw error;});
    const outcome=type==='result'?expect(promise).resolves.toMatchObject(reading):expect(promise).rejects.toThrow('완성하지');
    await vi.waitFor(()=>expect(stream).toBeDefined());
    stream.enqueue(new TextEncoder().encode(JSON.stringify(event)+'\n'));
    // Drain the already-enqueued event while the server still owns the lease.
    await new Promise(resolve=>setTimeout(resolve,0));
    const earlySettlement=settled;const earlyCompletion=stages.includes('complete');const earlyCancel=cancel.mock.calls.length;
    if(!earlyCancel)stream.close();
    await outcome;
    expect(earlySettlement).toBe(false);
    expect(earlyCompletion).toBe(false);
    expect(cancel).not.toHaveBeenCalled();
    expect(stages.includes('complete')).toBe(type==='result');
  });
  it('does not advance while the provider is pending and reaches 100 only with a result',async()=>{
    let stream!:ReadableStreamDefaultController<Uint8Array>;
    const stages:string[]=[];
    const encoder=new TextEncoder();
    const fetcher:typeof fetch=async url=>String(url).endsWith('challenge')?Response.json({challenge:{token:'test',difficulty:0,expiresAt:Date.now()+60000}}):new Response(new ReadableStream({start(c){stream=c;}}),{headers:{'content-type':'application/x-ndjson'}});
    const promise=requestReading(chart.profile,{signal:new AbortController().signal,fetcher,onStatus:s=>stages.push(s)});
    await vi.waitFor(()=>expect(stream).toBeDefined());
    stream.enqueue(encoder.encode('{"type":"progress","stage":"accepted"}\n'));
    await vi.waitFor(()=>expect(stages).toContain('accepted'));
    expect(stages).not.toContain('complete');
    // A JSON line may cross network chunks, including inside a Korean UTF-8 character.
    const result=encoder.encode(JSON.stringify({type:'result',reading})+'\n');
    stream.enqueue(result.slice(0,66));stream.enqueue(result.slice(66));stream.close();
    expect((await promise).headline).toBe(reading.headline);
    expect(stages.at(-1)).toBe('complete');
  });
  it('rejects a stream that closes without a result instead of reporting success',async()=>{
    const fetcher:typeof fetch=async url=>String(url).endsWith('challenge')?Response.json({challenge:{token:'test',difficulty:0,expiresAt:Date.now()+60000}}):new Response('{"type":"progress","stage":"accepted"}\n',{headers:{'content-type':'application/x-ndjson'}});
    await expect(requestReading(chart.profile,{signal:new AbortController().signal,fetcher})).rejects.toThrow('연결');
  });
  it('surfaces a streamed failure without a hidden retry',async()=>{
    const fetcher=vi.fn<typeof fetch>(async url=>String(url).endsWith('challenge')?Response.json({challenge:{token:'test',difficulty:0,expiresAt:Date.now()+60000}}):new Response('{"type":"error","error":"풀이를 완성하지 못했어요."}\n',{headers:{'content-type':'application/x-ndjson'}}));
    await expect(requestReading(chart.profile,{signal:new AbortController().signal,fetcher})).rejects.toThrow('완성하지');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
