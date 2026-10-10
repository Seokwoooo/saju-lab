'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Heart, Leaf, LockKeyhole, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { AIResponse, BirthInput, Compatibility, Reading, SajuChart } from '@/lib/contracts';
import { calculateSaju } from '@/lib/saju';
import { calculateCompatibility, createLocalReading } from '@/lib/local-reading';
import { GITHUB_URL, X_URL } from '@/lib/site-config';
import { BirthForm } from '@/components/saju/birth-form';
import { Character, Flower, Garden } from '@/components/saju/character';
import { CompatibilityForm, CompatibilityResult } from '@/components/saju/compatibility';
import { ElementBalance, ReadingHero, ReadingSections, TechnicalDetails } from '@/components/saju/reading-result';
import { ShareStudio } from '@/components/saju/share-studio';

type View = 'landing' | 'input' | 'result' | 'compatibility-input' | 'compatibility-result';
interface PersonalResult { input: BirthInput; chart: SajuChart; local: Reading }
interface CoupleResult { inputs: [BirthInput, BirthInput]; charts: [SajuChart, SajuChart]; reading: Reading; result: Compatibility }

async function solveChallenge(token: string, difficulty: number, expiresAt: number, signal: AbortSignal) {
  if (difficulty < 0 || difficulty > 22 || !Number.isInteger(difficulty)) throw new Error('요청 준비에 문제가 생겼어요. 다시 시도해 주세요.');
  if (!globalThis.crypto?.subtle) throw new Error('이 브라우저에서 안전한 AI 요청을 준비할 수 없어요. 최신 브라우저에서 이용해 주세요.');
  const encoder = new TextEncoder();
  for (let nonce = 0; nonce < 12_000_000; nonce++) {
    if (signal.aborted) throw new DOMException('요청이 취소되었어요.', 'AbortError');
    if (Date.now() > expiresAt) throw new Error('요청 준비 시간이 만료되었어요. 다시 시도해 주세요.');
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(`${token}:${nonce}`)));
    let remaining = difficulty; let valid = true;
    for (const byte of bytes) { const required = Math.min(8, remaining); if (required === 0) break; if ((byte >> (8 - required)) !== 0) { valid = false; break; } remaining -= required; }
    if (valid) return String(nonce);
    if (nonce % 128 === 0) await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  throw new Error('요청 준비를 마치지 못했어요. 다시 시도해 주세요.');
}

export default function Home() {
  const [view, setView] = useState<View>('landing');
  const [personal, setPersonal] = useState<PersonalResult | null>(null);
  const [couple, setCouple] = useState<CoupleResult | null>(null);
  const [formError, setFormError] = useState('');
  const [aiReading, setAiReading] = useState<Reading | null>(null);
  const [aiState, setAiState] = useState<'idle' | 'preparing' | 'loading'>('idle');
  const [aiError, setAiError] = useState('');
  const [consent, setConsent] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const aiController = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); requestAnimationFrame(() => document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })); }, [view]);
  useEffect(() => () => { aiController.current?.abort(); }, []);
  function stopAI() { sequence.current++; aiController.current?.abort(); aiController.current = null; setAiState('idle'); }
  function navigate(next: View) { stopAI(); setFormError(''); setAiNote(''); setView(next); }
  function calculate(input: BirthInput) {
    try { const chart = calculateSaju(input); const local = createLocalReading(chart); stopAI(); setPersonal({ input, chart, local }); setCouple(null); setAiReading(null); setConsent(false); setAiError(''); setView('result'); setFormError(''); }
    catch (error) { setFormError(error instanceof Error ? error.message : '입력한 정보를 확인해 주세요.'); }
  }
  function calculateCouple(a: BirthInput, b: BirthInput) {
    try { const first = calculateSaju(a); const second = calculateSaju(b); setCouple({ inputs: [a, b], charts: [first, second], reading: createLocalReading(first), result: calculateCompatibility(first, second) }); setView('compatibility-result'); setFormError(''); }
    catch (error) { setFormError(error instanceof Error ? error.message : '두 사람의 입력 정보를 확인해 주세요.'); }
  }
  function reset() { stopAI(); setPersonal(null); setCouple(null); setAiReading(null); setAiError(''); setAiNote(''); setConsent(false); setFormError(''); setView('landing'); }
  async function requestAI() {
    if (!personal || !consent || aiState !== 'idle') return;
    const controller = new AbortController(); aiController.current = controller; const requestId = ++sequence.current;
    setAiState('preparing'); setAiError(''); setAiNote('');
    try {
      const challengeResponse = await fetch('/api/challenge', { signal: controller.signal, cache: 'no-store' });
      const challengeBody = await challengeResponse.json() as { challenge?: { token: unknown; difficulty: unknown; expiresAt: unknown }; error?: unknown };
      if (!challengeResponse.ok || !challengeBody.challenge) throw new Error(typeof challengeBody.error === 'string' ? challengeBody.error : 'AI 요청을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.');
      const challenge = challengeBody.challenge;
      if (typeof challenge.token !== 'string' || typeof challenge.difficulty !== 'number' || typeof challenge.expiresAt !== 'number') throw new Error('요청 준비 응답을 확인하지 못했어요.');
      const nonce = await solveChallenge(challenge.token, challenge.difficulty, challenge.expiresAt, controller.signal);
      if (controller.signal.aborted) return;
      setAiState('loading');
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: personal.chart.profile, proof: { token: challenge.token, nonce } }), signal: controller.signal });
      const body: AIResponse = await response.json();
      if (!response.ok || !body.reading) throw new Error(`${body.error || 'AI 풀이를 받지 못했어요.'}${body.retryAfter ? ` 약 ${body.retryAfter}초 후 다시 시도해 주세요.` : ''}`);
      if (requestId !== sequence.current) return;
      setAiReading(body.reading); setAiNote('AI 심화 풀이가 도착했어요. 계산값은 그대로 유지돼요.');
    } catch (error) { if (requestId === sequence.current && !controller.signal.aborted) setAiError(error instanceof Error ? error.message : 'AI 연결에 문제가 생겼어요. 기본 풀이는 계속 볼 수 있어요.'); }
    finally { if (requestId === sequence.current) { setAiState('idle'); aiController.current = null; } }
  }
  const reading = aiReading || personal?.local;
  return <div className="saju-app"><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><header className="site-header"><div className="header-inner"><button className="brand" onClick={() => navigate('landing')} aria-label="사주랩 홈"><span className="brand-flower">✿</span><span>사주랩<small>SAJU LAB</small></span></button><nav aria-label="주요 메뉴"><button className={view.includes('compatibility') ? 'nav-active' : ''} onClick={() => navigate('compatibility-input')}>우리 궁합 <Heart size={14} aria-hidden="true" /></button><a href="/faq">자주 묻는 질문</a><a className="header-open-source" href={GITHUB_URL} target="_blank" rel="noreferrer">오픈소스<ExternalLink size={13} aria-hidden="true" /></a></nav></div></header>
  <main id="main-content">
    {view === 'landing' && <>
      <section className="hero"><div className="hero-copy"><p className="hero-tag"><span /> 100% 무료 · 회원가입 없이</p><p className="eyebrow hero-eyebrow">A LITTLE LAB FOR KNOWING YOURSELF</p><h1 tabIndex={-1}>당신이라는<br />작은 <span className="hero-word">우주.<Flower /></span></h1><p className="hero-description">태어난 날에 담긴 다섯 빛깔의 이야기.<br />어려운 사주를, 다정하고 쉬운 말로 만나세요.</p><div className="hero-buttons"><button className="button primary" onClick={() => navigate('input')}>나의 사주 만나기<ArrowRight size={19} aria-hidden="true" /></button><button className="button text-button" onClick={() => navigate('compatibility-input')}><Heart size={17} aria-hidden="true" />우리 궁합도 보기</button></div><p className="hero-small"><LockKeyhole size={13} aria-hidden="true" /> 내 브라우저에서 계산 · 출생정보 저장 없이</p></div><Garden /></section>
      <div className="hero-bottom"><span>모든 계절의 당신을 환영해요.</span><span>SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span></div>
      <section className="welcome-section section-space"><div className="welcome-heading"><p className="eyebrow">GET TO KNOW YOUR OWN SEASON</p><h2>정해진 운명보다,<br />나를 알아가는 즐거움.</h2><p>사주랩은 나를 돌아보는 작은 창이에요.<br />맞는 말은 간직하고, 아닌 말은 가볍게 흘려보내세요.</p></div><div className="welcome-cards"><article className="welcome-card"><span className="welcome-index">01</span><Character element="wood" decorative /><h3>쉽고 다정하게</h3><p>기질부터 일, 연애, 올해의 흐름까지.<br />일상에서 이해할 수 있는 아홉 이야기.</p></article><article className="welcome-card"><span className="welcome-index">02</span><Character element="water" decorative /><h3>내 정보는 소중하게</h3><p>출생정보는 브라우저 안에서 계산.<br />AI에는 이름과 생일을 보내지 않아요.</p></article><article className="welcome-card"><span className="welcome-index">03</span><Character element="metal" decorative /><h3>한 장의 나를 간직해요</h3><p>여섯 가지 이야기, 세 가지 종이 색.<br />피드와 스토리에 어울리는 작은 카드.</p></article></div></section>
      <section className="landing-note"><Flower /><div><p className="eyebrow">MADE WITH A LITTLE CURIOSITY</p><h2>누구나 가볍게,<br className="mobile-only" /> 자기 이야기를 만나도록.</h2><p>X 루샨이 만든 무료 오픈소스 프로젝트입니다.<br />광고와 추적 도구 없이, 오늘의 나를 조금 더 이해해 보세요.</p><div className="creator-links"><a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub에서 코드 보기<ExternalLink size={14} /></a>{X_URL && <a href={X_URL} target="_blank" rel="noreferrer">루샨lucian의 X<ExternalLink size={14} /></a>}</div></div></section>
      <section className="last-invitation"><p>어떤 빛깔의 이야기가 기다릴까요?</p><button className="button primary" onClick={() => navigate('input')}>이제, 나를 만나러 가기<ArrowRight size={19} /></button><p className="entertainment-note">전통 사주를 바탕으로 한 재미와 자기성찰용 콘텐츠예요.<br />미래를 보장하거나 중요한 결정을 대신하지 않아요.</p></section>
    </>}
    {view === 'input' && <div className="input-page narrow-page"><button className="back-button" onClick={() => navigate(personal ? 'result' : 'landing')}><ArrowLeft size={17} />{personal ? '결과로 돌아가기' : '홈으로'}</button><div className="input-heading"><p className="eyebrow">FIRST, A LITTLE ABOUT YOU</p><h1 tabIndex={-1}>이야기의 시작을<br />알려주세요.</h1><p>태어난 날만 알면 시작할 수 있어요.<br />모르는 시간은 비워두어도 괜찮아요.</p><Character element="wood" decorative /></div><BirthForm key={personal ? 'edit' : 'new'} initial={personal?.input} onSubmit={calculate} error={formError} /></div>}
    {view === 'result' && personal && reading && <div className="result-page wide-page"><div className="result-toolbar"><button className="back-button" onClick={() => navigate('input')}><ArrowLeft size={17} />정보 수정</button><div><button className="back-button" onClick={() => navigate('compatibility-input')}><Heart size={16} />궁합 보기</button><button className="back-button" onClick={reset}><RotateCcw size={16} />처음부터</button></div></div><ReadingHero chart={personal.chart} reading={reading} nickname={personal.input.name} />
      {(personal.chart.boundaryUncertain || !personal.chart.timeKnown) && <div className="result-notice"><ShieldCheck size={22} aria-hidden="true" /><p><strong>{personal.chart.boundaryUncertain ? '경계의 불확실성을 함께 읽어 주세요.' : '태어난 시간이 없는 만큼, 여백을 남겨둘게요.'}</strong>{personal.chart.boundaryUncertain ? '절기·시각 경계의 조건에 따라 일부 계산과 풀이가 달라질 수 있어요. 자세한 내용은 계산 근거에서 확인할 수 있어요.' : '시간에 해당하는 기둥을 임의로 만들지 않았어요. 기본 기질을 중심으로 가볍게 읽어 주세요.'}</p></div>}
      <ElementBalance chart={personal.chart} />
      <section className="ai-section paper" aria-labelledby="ai-title"><div className="ai-icon"><Sparkles size={25} strokeWidth={1.3} /></div><div className="ai-copy"><p className="eyebrow">OPTIONAL · A LITTLE DEEPER</p><h2 id="ai-title">조금 더 풍성하게 읽고 싶다면.</h2><p>계산된 특성을 AI가 자연스러운 이야기로 풀어드려요.<br />기본 풀이만으로도 모든 결과와 카드를 볼 수 있어요.</p><details className="ai-privacy-details"><summary>AI에 전달되는 정보 보기</summary><p>오행·십성의 분포, 계절, 시간 확인 여부, 경계 불확실성, 대운의 나이 구간·오행, 연도별 오행과 분석 연도만 전달해요. 닉네임·성별·출생일·출생시간은 전달하지 않아요. AI는 서버를 거쳐 외부 모델 제공자에게 요청됩니다. <a href="/privacy">자세한 개인정보 안내</a></p></details>{!aiReading && <label className="check-label ai-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={aiState !== 'idle'} /><span>위 계산 특성을 외부 AI에 전달하는 데 동의해요.</span></label>}{aiError && <p className="ai-error" role="alert">{aiError}<br /><span>기본 풀이와 계산 결과는 그대로 볼 수 있어요.</span></p>}<p className="live-note" role="status">{aiNote}</p></div><div className="ai-actions">{aiState !== 'idle' ? <><span className="ai-loading" role="status"><span className="loading-flower" aria-hidden="true">✿</span>{aiState === 'preparing' ? '안전한 요청을 준비하고 있어요' : 'AI가 이야기를 풀고 있어요'}</span><button className="button secondary" onClick={() => { stopAI(); setAiNote('AI 요청을 취소했어요. 기본 풀이는 계속 볼 수 있어요.'); }}><X size={16} />취소</button></> : aiReading ? <><span className="ai-complete"><Check size={16} />심화 풀이 완료</span><button className="button secondary" onClick={() => { setAiReading(null); setAiNote('기본 풀이로 돌아왔어요.'); }}>기본 풀이 보기</button></> : <button className="button secondary" disabled={!consent} onClick={requestAI}><Sparkles size={17} />{aiError ? 'AI 풀이 다시 요청' : '무료 AI 심화 풀이'}</button>}</div></section>
      <ReadingSections reading={reading} chart={personal.chart} /><ShareStudio key="personal" chart={personal.chart} reading={reading} nickname={personal.input.name} /><div className="result-end"><Leaf size={22} strokeWidth={1.4} /><p>오늘의 당신에게 도움이 되는 문장만, 가져가세요.</p><button className="button text-button" onClick={reset}>다른 이야기 만나기<ArrowRight size={17} /></button></div>
    </div>}
    {view === 'compatibility-input' && <div className="compatibility-page wide-page"><button className="back-button" onClick={() => navigate(personal ? 'result' : 'landing')}><ArrowLeft size={17} />{personal ? '나의 결과로' : '홈으로'}</button><div className="compatibility-heading"><p className="eyebrow">TWO SEASONS, ONE LITTLE GARDEN</p><h1 tabIndex={-1}>우리, 어떤 사이일까요?</h1><p>잘 맞는 결도, 다른 리듬도.<br />두 사람의 실제 사주로 함께 가꿀 이야기를 살펴봐요.</p><div className="mini-couple"><Character element="fire" decorative /><Flower /><Character element="water" decorative /></div><span className="soft-label">연인 · 친구 · 가족 · 함께 일하는 사이</span></div><CompatibilityForm key={couple ? 'edit-couple' : personal ? 'with-personal' : 'blank'} initial={couple?.inputs[0] || personal?.input} initialSecond={couple?.inputs[1]} onSubmit={calculateCouple} error={formError} /></div>}
    {view === 'compatibility-result' && couple && <div className="result-page wide-page"><div className="result-toolbar"><button className="back-button" onClick={() => navigate('compatibility-input')}><ArrowLeft size={17} />두 사람 정보 수정</button><button className="back-button" onClick={reset}><RotateCcw size={16} />처음부터</button></div><h1 className="visually-hidden" tabIndex={-1}>두 사람의 궁합 결과</h1><CompatibilityResult result={couple.result} charts={couple.charts} names={[couple.inputs[0].name, couple.inputs[1].name]} /><ShareStudio key="couple" chart={couple.charts[0]} reading={couple.reading} compatibility={couple.result} compatibilityUncertain={couple.charts.some(chart => !chart.timeKnown || chart.boundaryUncertain)} /><div className="couple-technical"><p>궁합은 두 사람의 계산값을 바탕으로 한 기본 해석입니다.</p><TechnicalDetails chart={couple.charts[0]} reading={couple.reading} /><TechnicalDetails chart={couple.charts[1]} reading={createLocalReading(couple.charts[1])} /></div></div>}
  </main><footer className="site-footer"><div className="footer-top"><button className="brand" onClick={() => navigate('landing')}><span className="brand-flower">✿</span><span>사주랩<small>SAJU LAB</small></span></button><p>나를 만나는 작은 연구소.<br /><span>Made with ♡ by Lucian</span></p><nav aria-label="사이트 안내"><a href="/about">사주랩 소개</a><a href="/faq">자주 묻는 질문</a><a href="/privacy">개인정보 안내</a><a href="/terms">이용 안내</a><a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub ↗</a>{X_URL && <a href={X_URL} target="_blank" rel="noreferrer">루샨lucian on X ↗</a>}</nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} SAJU LAB · FREE & OPEN SOURCE</span><span>재미와 자기성찰을 위한 전통 해석</span></div></footer></div>;
}
