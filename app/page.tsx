'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Leaf, RotateCcw, Sparkles, ChevronDown } from 'lucide-react';
import type { BirthInput, Reading, SajuChart } from '@/lib/contracts';
import { calculateSaju } from '@/lib/saju';
import { requestReading } from '@/lib/client-analysis';
import { createLocalReading } from '@/lib/local-reading';
import { GITHUB_URL, X_URL } from '@/lib/site-config';
import { Brand } from '@/components/saju/brand';
import { BirthForm } from '@/components/saju/birth-form';
import { AnalysisLoading, ReadingHero, ReadingSections } from '@/components/saju/reading-result';
import { ShareStudio } from '@/components/saju/share-studio';
import { QuickShareActions } from '@/components/saju/quick-share-actions';
import { SajuHome } from '@/components/saju/saju-home';
import type { AnalysisStage } from '@/lib/analysis-progress';

type View = 'landing' | 'input' | 'analyzing' | 'result';
interface PersonalResult { input: BirthInput; chart: SajuChart; local: Reading }

export default function Home() {
  const [ownerDevice,setOwnerDevice]=useState(false);
  useEffect(()=>{const abort=new AbortController();void fetch('/api/owner/device',{cache:'no-store',signal:abort.signal}).then(r=>r.ok?r.json():null).then(data=>setOwnerDevice((data as {owner?:boolean}|null)?.owner===true)).catch(()=>{});return ()=>abort.abort();},[]);
  const [view, setView] = useState<View>('landing');
  const [personal, setPersonal] = useState<PersonalResult | null>(null);
  const [formError, setFormError] = useState('');
  const [aiReading, setAiReading] = useState<Reading | null>(null);
  const [aiState, setAiState] = useState<AnalysisStage | 'idle'>('idle');
  const [aiError, setAiError] = useState('');
  const aiController = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); requestAnimationFrame(() => document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })); }, [view]);
  useEffect(() => () => { aiController.current?.abort(); }, []);
  function stopAI() { sequence.current++; aiController.current?.abort(); aiController.current = null; setAiState('idle'); }
  function navigate(next: View) { stopAI(); setFormError(''); setView(next); }
  function calculate(input: BirthInput) {
    if (aiController.current) return;
    try {
      const chart=calculateSaju(input); const local=createLocalReading(chart);
      setPersonal({input,chart,local}); setAiReading(null); setAiError(''); setFormError('');
      void requestAI(chart);
    } catch(error) { setFormError(error instanceof Error?error.message:'입력한 정보를 확인해 주세요.'); }
  }
  function reset() { stopAI(); setPersonal(null); setAiReading(null); setAiError(''); setFormError(''); setView('landing'); }
  async function requestAI(chart:SajuChart) {
    if(aiController.current) return;
    const controller=new AbortController(); aiController.current=controller;
    const requestId=++sequence.current;
    setAiState('preparing'); setAiError(''); setView('analyzing');
    try {
      const result=await requestReading(chart.profile,{signal:controller.signal,onStatus:stage=>{if(requestId===sequence.current)setAiState(stage);}});
      if(requestId!==sequence.current || controller.signal.aborted) return;
      setAiReading(result); setView('result');
    } catch(error) {
      if(requestId===sequence.current && !controller.signal.aborted) {
        setAiError(error instanceof Error?error.message:'풀이 연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
        setView('result');
      }
    } finally {if(requestId===sequence.current){setAiState('idle');aiController.current=null;}}
  }
  const reading = aiReading || personal?.local;
  const hasPersonalResult = Boolean(personal && (aiReading || aiError));
  return <div className="saju-app"><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><header className="site-header"><div className="header-inner"><button className="brand" onClick={() => navigate('landing')} aria-label="사주랩 홈"><Brand /></button><nav aria-label="주요 메뉴"><a className="header-lucian-home" href="https://lucianlabs.dev"><ArrowLeft size={14} aria-hidden="true" />루샨 랩 - 홈으로</a><a href="/faq">자주 묻는 질문</a><a className="header-open-source" href={GITHUB_URL} target="_blank" rel="noreferrer">오픈소스<ExternalLink size={13} aria-hidden="true" /></a></nav></div></header>
  <main id="main-content">
    {ownerDevice && <p className="owner-device-notice">운영자 브라우저 <strong>개인 횟수 제한 없음</strong><span>하루 $20 비용 상한과 동시 처리 제한은 적용돼요.</span></p>}
    {view === 'landing' && <SajuHome onStart={() => navigate('input')} />}
    {view === 'input' && <div className="input-page narrow-page"><button className="back-button" onClick={() => navigate(hasPersonalResult ? 'result' : 'landing')}><ArrowLeft size={17} />{hasPersonalResult ? '결과로 돌아가기' : '홈으로'}</button><div className="input-heading progressive-heading"><p className="eyebrow">나의 사주풀이 시작하기</p><h1 tabIndex={-1}>하나씩, 편하게 알려주세요.</h1><p>모르는 항목은 건너뛰어도 괜찮아요.</p></div><BirthForm key={personal ? 'edit' : 'new'} initial={personal?.input} onSubmit={calculate} error={formError} /></div>}
    {view === 'analyzing' && <AnalysisLoading stage={aiState==='idle'?'preparing':aiState} onCancel={()=>navigate('input')} />}
    {view === 'result' && personal && reading && <div className="result-page wide-page reading-report">
      <div className="result-toolbar"><button className="back-button" onClick={()=>navigate('input')}><ArrowLeft size={17} />정보 수정</button><div><button className="back-button" onClick={reset}><RotateCcw size={16} />처음부터</button></div></div>
      {aiError && <section className="analysis-failure" aria-label="사주풀이 상태"><div role="alert"><strong>상세 풀이를 받지 못했어요.</strong><p>{aiError}</p><p>아래는 계산값에 따른 기본 해석이에요. 이번 달의 개인별 상세 운세는 풀이가 완료되면 보여드려요.</p></div><button className="button secondary" onClick={()=>void requestAI(personal.chart)}><RotateCcw size={16} />상세 풀이 다시 시도</button></section>}
      <ReadingHero chart={personal.chart} reading={reading} nickname={personal.input.name} />
      <QuickShareActions chart={personal.chart} reading={reading} />
      <ReadingSections reading={reading} chart={personal.chart} />
      <details className="share-drawer" id="share-options"><summary><span><Sparkles size={19} aria-hidden="true" />내 사주 카드 저장하기</span><ChevronDown size={20} aria-hidden="true" /></summary><ShareStudio key="personal" chart={personal.chart} reading={reading} nickname={personal.input.name} /></details>
      <div className="result-end"><Leaf size={22} strokeWidth={1.4} /><p>내 경험과 맞는 조언부터 하나씩 해보세요.</p><button className="button text-button" onClick={reset}>처음부터 다시 보기<ArrowRight size={17} /></button></div>
    </div>}
  </main><footer className="site-footer"><div className="footer-top"><button className="brand" onClick={() => navigate('landing')}><Brand /></button><p>누구나 쉽게, 무료 사주풀이.<br /><a href="https://lucianlabs.dev" target="_blank" rel="noreferrer">Lucian Labs ↗</a><br /><span>Made with ♡ by Lucian</span></p><nav aria-label="사이트 안내"><a href="/about">사주랩 소개</a><a href="/faq">자주 묻는 질문</a><a href="/privacy">개인정보 안내</a><a href="/terms">이용 안내</a><a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub ↗</a>{X_URL && <a href={X_URL} target="_blank" rel="noreferrer">루샨lucian on X ↗</a>}</nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} SAJU LAB, FREE & OPEN SOURCE</span><span>재미와 자기성찰을 위한 전통 해석</span></div></footer></div>;
}
