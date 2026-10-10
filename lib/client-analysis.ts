import { retryDelayMessage } from './retry-delay';
import type { AIProfile, AIResponse, Reading } from './contracts';
import type { AnalysisEvent, AnalysisStage } from './analysis-progress';

export type { AnalysisStage } from './analysis-progress';
const cancelled=()=>new DOMException('요청을 취소했어요.','AbortError');

async function solveChallenge(token:string,difficulty:number,expiresAt:number,signal:AbortSignal) {
  if(!Number.isInteger(difficulty)||difficulty<0||difficulty>22||!Number.isFinite(expiresAt)) throw new Error('분석 준비에 문제가 생겼어요. 다시 시도해 주세요.');
  if(!globalThis.crypto?.subtle) throw new Error('이 브라우저에서는 풀이 요청을 준비할 수 없어요. 최신 브라우저를 이용해 주세요.');
  const encoder=new TextEncoder();
  for(let nonce=0;nonce<12_000_000;nonce++) {
    if(signal.aborted) throw cancelled();
    if(Date.now()>expiresAt) throw new Error('분석 준비 시간이 지났어요. 다시 시도해 주세요.');
    const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(`${token}:${nonce}`)));
    let remaining=difficulty; let valid=true;
    for(const byte of bytes) {const required=Math.min(8,remaining);if(!required)break;if((byte>>(8-required))!==0){valid=false;break;}remaining-=required;}
    if(valid) return String(nonce);
    if(nonce%128===0) await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  throw new Error('분석 준비를 마치지 못했어요. 다시 시도해 주세요.');
}

// Explicit projection prevents accidental raw birth fields from crossing this boundary.
function publicProfile(profile:AIProfile):AIProfile {
  return {version:1,dayElement:profile.dayElement,polarity:profile.polarity,elementCounts:profile.elementCounts,tenGodCounts:profile.tenGodCounts,season:profile.season,timeKnown:profile.timeKnown,boundaryUncertain:profile.boundaryUncertain,cycles:profile.cycles,annual:profile.annual,analysisYear:profile.analysisYear,...(profile.currentMonth?{currentMonth:profile.currentMonth}:{})};
}
export async function requestReading(profile:AIProfile,{signal,onStatus,fetcher=fetch}:{signal:AbortSignal;onStatus?:(stage:AnalysisStage)=>void;fetcher?:typeof fetch}):Promise<Reading> {
  if(signal.aborted) throw cancelled();
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  let abort=()=>{};
  const stopped=new Promise<never>((_resolve,reject)=>{
    abort=()=>{controller.abort();reject(cancelled());};
    signal.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>{controller.abort();reject(new Error('풀이 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.'));},100_000);
  });
  const operation=async()=>{
    onStatus?.('preparing');
    const response=await fetcher('/api/challenge',{signal:controller.signal,cache:'no-store'});
    const body=await response.json() as {challenge?:{token?:unknown;difficulty?:unknown;expiresAt?:unknown};error?:string;retryAfter?:number};
    if(controller.signal.aborted) throw cancelled();
    if(!response.ok||!body.challenge) throw new Error(`${body.error||'상세 풀이를 시작하지 못했어요.'}${retryDelayMessage(body.retryAfter)}`);
    const {token,difficulty,expiresAt}=body.challenge;
    if(typeof token!=='string'||typeof difficulty!=='number'||typeof expiresAt!=='number') throw new Error('풀이 요청을 준비하지 못했어요. 다시 시도해 주세요.');
    const nonce=await solveChallenge(token,difficulty,expiresAt,controller.signal);
    if(controller.signal.aborted) throw cancelled();
    onStatus?.('loading');
    const result=await fetcher('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/x-ndjson'},body:JSON.stringify({profile:publicProfile(profile),proof:{token,nonce}}),signal:controller.signal});
    const payload=result.ok && result.headers.get('content-type')?.includes('application/x-ndjson')?await readProgressStream(result,controller.signal,onStatus):await result.json() as AIResponse;
    if(controller.signal.aborted) throw cancelled();
    if(!result.ok||!payload.reading||payload.reading.source!=='ai') throw new Error(`${payload.error||'상세 풀이를 완성하지 못했어요.'}${retryDelayMessage(payload.retryAfter)}`);
    return payload.reading;
  };
  try{return await Promise.race([operation(),stopped]);}
  finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
}

async function readProgressStream(response:Response,signal:AbortSignal,onStatus?:(stage:AnalysisStage)=>void):Promise<AIResponse> {
  if(!response.body)throw new Error('풀이 연결이 끊겼어요. 다시 시도해 주세요.');
  const reader=response.body.getReader(); const decoder=new TextDecoder();
  let buffer=''; let bytes=0;let finished=false;let payload:AIResponse|undefined;
  const abort=()=>{void reader.cancel().catch(()=>{});};
  signal.addEventListener('abort',abort,{once:true});
  try {
    while(true) {
      if(signal.aborted)throw cancelled();
      const {done,value}=await reader.read();
      if(done){finished=true;break;}
      bytes+=value.byteLength;if(bytes>131072)throw new Error('풀이 응답을 확인하지 못했어요.');
      buffer+=decoder.decode(value,{stream:true});
      let newline:number;
      while((newline=buffer.indexOf('\n'))!==-1) {
        const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);if(!line.trim())continue;
        const event=JSON.parse(line) as AnalysisEvent;
        if(event.type==='progress' && ['accepted','retrying','verified'].includes(event.stage))onStatus?.(event.stage);
        else if(event.type==='error')payload={error:event.error,code:event.code,retryAfter:event.retryAfter};
        else if(event.type==='result' && event.reading?.source==='ai')payload={reading:event.reading};
      }
    }
    if(signal.aborted)throw cancelled();
    // EOF follows the server's lease cleanup; cancelling at the result event can interrupt it.
    if(payload){if(payload.reading)onStatus?.('complete');return payload;}
    throw new Error('풀이 연결이 끊겼어요. 다시 시도해 주세요.');
  } finally {signal.removeEventListener('abort',abort);if(!finished)await reader.cancel().catch(()=>{});reader.releaseLock();}
}
