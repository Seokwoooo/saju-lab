import type { AIProfile, AIResponse, Reading } from './contracts';

export type AnalysisStage='preparing'|'loading';
const cancelled=()=>new DOMException('요청을 취소했어요.','AbortError');

async function solveChallenge(token:string,difficulty:number,expiresAt:number,signal:AbortSignal) {
  if(!Number.isInteger(difficulty)||difficulty<0||difficulty>22||!Number.isFinite(expiresAt)) throw new Error('분석 준비에 문제가 생겼어요. 다시 시도해 주세요.');
  if(!globalThis.crypto?.subtle) throw new Error('이 브라우저에서는 AI 요청을 준비할 수 없어요. 최신 브라우저를 이용해 주세요.');
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
    timer=setTimeout(()=>{controller.abort();reject(new Error('AI 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.'));},100_000);
  });
  const operation=async()=>{
    onStatus?.('preparing');
    const response=await fetcher('/api/challenge',{signal:controller.signal,cache:'no-store'});
    const body=await response.json() as {challenge?:{token?:unknown;difficulty?:unknown;expiresAt?:unknown};error?:string;retryAfter?:number};
    if(controller.signal.aborted) throw cancelled();
    if(!response.ok||!body.challenge) throw new Error(`${body.error||'AI 풀이를 시작하지 못했어요.'}${body.retryAfter?` 약 ${body.retryAfter}초 후 다시 시도해 주세요.`:''}`);
    const {token,difficulty,expiresAt}=body.challenge;
    if(typeof token!=='string'||typeof difficulty!=='number'||typeof expiresAt!=='number') throw new Error('AI 요청을 준비하지 못했어요. 다시 시도해 주세요.');
    const nonce=await solveChallenge(token,difficulty,expiresAt,controller.signal);
    if(controller.signal.aborted) throw cancelled();
    onStatus?.('loading');
    const result=await fetcher('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile:publicProfile(profile),proof:{token,nonce}}),signal:controller.signal});
    const payload=await result.json() as AIResponse;
    if(controller.signal.aborted) throw cancelled();
    if(!result.ok||!payload.reading||payload.reading.source!=='ai') throw new Error(`${payload.error||'AI 풀이를 완성하지 못했어요.'}${payload.retryAfter?` 약 ${payload.retryAfter}초 후 다시 시도해 주세요.`:''}`);
    return payload.reading;
  };
  try{return await Promise.race([operation(),stopped]);}
  finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
}
