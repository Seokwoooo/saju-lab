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
    await expect(requestReading(chart.profile,{signal:new AbortController().signal,fetcher})).rejects.toThrow('60초');
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
