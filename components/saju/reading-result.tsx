'use client';

import { useEffect, useId, useState } from 'react';
import { ArrowDown, ArrowUpRight, BookOpen, CalendarDays, ChevronDown, Sparkles, CircleAlert, Check } from 'lucide-react';
import { ELEMENTS, ELEMENT_LABELS, SECTION_KEYS } from '@/lib/contracts';
import type { Reading, SajuChart, SectionKey } from '@/lib/contracts';
import { ELEMENT_COLORS, getElementPercentages } from '@/lib/share-card';
import { annualWindow, cleanDisplayText, monthWindow, selectOpportunityArt } from '@/lib/reading-presentation';
import { ANALYSIS_LABELS, estimatedProgress, type AnalysisStage } from '@/lib/analysis-progress';
import { Character } from './character';
import { selectedEvidence } from '@/lib/reading-evidence';

const sectionLabels:Record<SectionKey,string>={personality:'나의 성격',strengths:'강점과 주의점',relationships:'인간관계',love:'연애 성향',career:'일하는 방식',money:'돈 쓰는 습관',year:'올해 운세',cycles:'나이별 운세',advice:'나에게 맞는 조언'};
const sectionOrder:SectionKey[]=['personality','strengths','love','relationships','career','money','year','cycles','advice'];
const tips:Record<SectionKey,string>={personality:'이렇게 해보세요',strengths:'장점을 살리는 방법',relationships:'대화할 때 이렇게',love:'마음을 전하는 방법',career:'일할 때 이렇게',money:'돈 쓸 때 이렇게',year:'올해 해보면 좋은 일',cycles:'지금 준비할 것',advice:'오늘 하나만 한다면'};

function Reason({text}:{text:string}) {
  const sentences=cleanDisplayText(text).match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g)||[text];
  return <><p className="reason-lead"><strong>{sentences[0].trim()}</strong></p>{sentences.length>1 && <p>{sentences.slice(1).join(' ').trim()}</p>}</>;
}

function CalculatedReason({chart,point}:{chart:SajuChart;point:{body:string;evidence:string[]}}) {
  const facts=selectedEvidence(chart.profile,point.evidence);
  const basis=selectedEvidence(chart.profile,['day-element'])[0];
  return <div className="month-reason calculated-reason"><h3>이렇게 풀이한 이유</h3><p className="reason-basis"><strong>{basis.fact}</strong> 기준으로 비교했어요.</p><ol className="reason-facts">{facts.map(fact=><li key={fact.id}><span className="reason-fact-label">{fact.kind==='month'?'해당 기간의 사주':'내 사주의 실제 구성'}</span>{fact.period&&<time className="reason-period">{fact.period} (한국 시간)</time>}<strong>{fact.fact}</strong><p>{fact.meaning}</p></li>)}</ol><div className="reason-conclusion"><span>이 조언으로 이어지는 해석</span><Reason text={point.body} /></div><p className="reason-method">천간은 겉에 드러난 글자, 지지 본기는 아래 글자의 대표 성분이에요. 개수는 나를 기준으로 한 글자(일간)를 제외하고 셌어요. 개수만으로 강약이나 길흉을 확정하지 않아요.</p></div>;
}

export function ReadingHero({chart,reading,nickname}:{chart:SajuChart;reading:Reading;nickname?:string}) {
  const month=chart.profile.currentMonth;
  const window=month?monthWindow(month):null;
  const illustration=reading.monthly?selectOpportunityArt(reading.monthly.opportunity.title):null;
  return <section className="fortune-hero" aria-labelledby="reading-headline">
    <div className="fortune-heading"><div><p className="fortune-date">{month?`${month.year}년 ${month.month}월`:`${chart.profile.analysisYear}년`} 사주풀이</p><p className="fortune-greeting">{nickname?`${cleanDisplayText(nickname)}님을 위한`:'나를 위한'} {reading.monthly?'이번 달 한마디':'성격 풀이'}</p><h1 id="reading-headline" tabIndex={-1}>{reading.monthly?.headline||reading.headline}</h1></div><div className={`fortune-mascot element-${chart.dayElement}`}><Character element={chart.dayElement} decorative /></div></div>
    {reading.monthly && window && <div className="reading-period"><CalendarDays size={22} aria-hidden="true" /><div><span>이번 달 풀이에서 살펴보는 범위</span><strong><time dateTime={window.start}>{window.start.replaceAll('-','.')}</time><span> ~ </span><time dateTime={window.end}>{window.end.replaceAll('-','.')}</time></strong><small>조언별 해당 기간은 각 카드에 따로 표시해요.</small></div></div>}
    {reading.monthly?<div className="month-highlights" aria-label="이번 달 운세 핵심">
      {(['opportunity','caution','action'] as const).map(key=>{const point=reading.monthly![key];const pointPeriod=selectedEvidence(chart.profile,point.evidence).find(f=>f.kind==='month')?.period;const Icon=key==='opportunity'?Sparkles:key==='caution'?CircleAlert:Check;return <article className={`month-point month-${key}`} key={key}><p className="month-label"><Icon size={19} aria-hidden="true" />{({opportunity:'이런 기회가 올 수 있어요',caution:'이것은 조심하세요',action:'이렇게 해보세요'})[key]}</p>
      {key==='opportunity' && illustration && <figure className="opportunity-art">{/* Local pre-made artwork is also used verbatim in the saved card. */}{/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={illustration.src} alt={illustration.alt} width={1536} height={1024} /><figcaption>{illustration.label}</figcaption></figure>}
      <div className="month-point-copy"><h2>{point.title}</h2>{window && <p className="point-period">{pointPeriod||window.label}{pointPeriod?' (한국 시간)':''}</p>}<CalculatedReason chart={chart} point={point} /></div></article>;})}
    </div>:<p className="fortune-local-intro">{reading.intro}</p>}
    <p className="fortune-context">이 기간의 사주를 해석한 조언이며, 특정 날짜에 사건이 생긴다는 뜻은 아니에요.{!chart.timeKnown?' 태어난 시간을 몰라 세부 시기 해석은 제한돼요.':chart.boundaryUncertain?' 시간 경계에서 달라질 수 있는 부분은 제외했어요.':''}</p>
    <a className="fortune-read-more" href="#my-reading">성격, 연애, 일, 돈도 자세히 보기<ArrowDown size={15} aria-hidden="true" /></a>
  </section>;
}

export function ElementBalance({chart}:{chart:SajuChart}) {
  const percentages=getElementPercentages(chart.elementCounts);const id=useId();
  return <section className="element-balance paper" aria-labelledby={id}><div className="balance-intro"><h2 id={id}>사주에 담긴 다섯 요소</h2><p>사주 글자를 종류별로 센 비율이에요.<br />성격이나 능력의 점수가 아니에요.</p></div><div className="balance-chart"><div className="element-bars">{ELEMENTS.map(element=><div className="element-column" key={element}><Character element={element} decorative /><strong>{percentages[element]}<small>%</small></strong><div className="bar-track"><div className="bar-fill" style={{height:`${percentages[element]}%`,background:ELEMENT_COLORS[element]}} /></div><span>{ELEMENT_LABELS[element]}</span><small>{chart.elementCounts[element]}개</small></div>)}</div><p className="balance-caption">확정된 {chart.elementTotal}개 글자의 단순 개수 / {chart.pillars.hour?'출생 시간 포함':'출생 시간 제외'}{chart.boundaryUncertain?' / 일부 미확정':''}</p></div></section>;
}

export function ReadingSections({reading,chart}:{reading:Reading;chart:SajuChart}) {
  const yearPeriod=annualWindow(chart.profile.analysisYear);
  return <section className="plain-reading" id="my-reading" aria-labelledby="reading-sections-title"><div className="plain-reading-heading"><p className="eyebrow">월별 운세와는 다른, 나의 평소 모습</p><h2 id="reading-sections-title">나는 어떤 사람일까요?</h2><p className="personality-summary">{reading.headline}</p><p>{reading.intro}</p></div>
    <nav className="reading-shortcuts" aria-label="궁금한 운세로 이동">{(['personality','love','career','money','year'] as const).map(key=><a href={`#chapter-${key}`} key={key}>{sectionLabels[key]}<ArrowUpRight size={14} aria-hidden="true" /></a>)}</nav>
    <div className="plain-chapters">{sectionOrder.map((key,index)=>{const item=reading.sections[key];return <article className={`plain-chapter chapter-${key}`} id={`chapter-${key}`} key={key}><div className="chapter-kicker"><span className="chapter-number">{String(index+1).padStart(2,'0')}</span><p className="plain-chapter-label">{key==='year'?`${chart.profile.analysisYear}년 운세`:sectionLabels[key]}</p></div><h3>{item.title}</h3><p className="chapter-period">{key==='year'?`${yearPeriod.label} (한국 시간, 입춘 기준)`:key==='cycles'?(chart.cycles.length?'본문에 적힌 나이 구간에 적용돼요. 현재 나이를 추측하지 않아요.':'출생 시간과 성별 정보가 부족해 적용 시기를 확정하지 않았어요.'):'특정 달에 한정하지 않은 평소 성향과 조언이에요.'}</p><div className="plain-chapter-body">{item.body.split(/\n+/).filter(Boolean).map((paragraph,index)=><p key={index}>{index===0?<strong>{paragraph}</strong>:paragraph}</p>)}</div><aside className="plain-chapter-tip"><span>{tips[key]}</span><p>{item.tip}</p></aside></article>;})}</div>
    <TechnicalDetails chart={chart} reading={reading} />
  </section>;
}

export function AnalysisLoading({stage,onCancel}:{stage:AnalysisStage;onCancel:()=>void}) {
  const [elapsedMs,setElapsedMs]=useState(0);
  useEffect(()=>{const start=performance.now();const timer=setInterval(()=>setElapsedMs(performance.now()-start),100);return ()=>clearInterval(timer);},[]);
  const percent=estimatedProgress(elapsedMs,stage);const elapsed=Math.floor(elapsedMs/1000);
  return <div className="analysis-page narrow-page"><div className="analysis-art" aria-hidden="true"><Character element="wood" decorative /><span className="analysis-spark">✦</span><Character element="fire" decorative /></div><p className="fortune-date">나만의 사주풀이</p><h1 tabIndex={-1}>기회도, 조심할 일도.<br />그 이유까지 풀고 있어요.</h1><p className="analysis-status" role="status">{ANALYSIS_LABELS[stage]}</p><div className="analysis-progress"><div className="progress-heading"><span>예상 진행률</span><strong>{Math.floor(percent)}<small>%</small></strong></div><div className="progress-track animated-progress" role="progressbar" aria-label="대기 시간에 따른 예상 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(percent)} aria-valuetext={`예상 ${Math.floor(percent)}퍼센트. ${ANALYSIS_LABELS[stage]}`}><div style={{width:`${percent}%`}} /></div><div className="analysis-timing"><strong>{elapsed<60 && stage!=='retrying'?'예상 소요 시간 30~60초':'평소보다 시간이 더 걸리고 있어요'}</strong><span>{elapsed}초 경과</span></div><p className="progress-explanation">진행률은 대기 시간을 바탕으로 한 예상치예요. 실제 처리 상태는 위 문구로 알려드려요.{elapsed>=60 || stage==='retrying'?' 최대 약 100초 안에 결과나 재시도 안내를 보여드려요.':' 결과와 근거 확인을 마쳐야 100%가 돼요.'}</p></div><button className="button text-button" onClick={onCancel}>취소하고 입력 수정하기</button></div>;
}

export function TechnicalDetails({ chart, reading }: { chart: SajuChart; reading: Reading }) {
  const pillars = [['년주', chart.pillars.year], ['월주', chart.pillars.month], ['일주', chart.pillars.day], ['시주', chart.pillars.hour]] as const;
  return <details className="technical-details"><summary><span><BookOpen size={19} aria-hidden="true" /> 계산 근거와 전문 정보 보기<small>한자, 사주팔자, 십성, 대운</small></span><ChevronDown size={20} aria-hidden="true" /></summary><div className="technical-inner"><ElementBalance chart={chart} /><p>아래는 풀이에 사용한 계산값이에요. 풀이 문장이 바뀌어도 이 값은 바뀌지 않아요.</p><div className="table-scroll"><table><caption>사주 기둥</caption><thead><tr><th scope="col">구분</th>{pillars.map(([label]) => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody><tr><th scope="row">천간, 지지</th>{pillars.map(([label, pillar]) => <td key={label}>{pillar ? <>{pillar.stem}{pillar.branch}<br /><small>{pillar.stemKo}{pillar.branchKo}</small></> : '미확정'}</td>)}</tr><tr><th scope="row">오행</th>{pillars.map(([label, pillar]) => <td key={label}>{pillar ? `${ELEMENT_LABELS[pillar.stemElement]}, ${ELEMENT_LABELS[pillar.branchElement]}` : '미확정'}</td>)}</tr><tr><th scope="row">십성</th>{pillars.map(([label, pillar]) => <td key={label}>{pillar?.tenGod || '미확정'}</td>)}</tr><tr><th scope="row">지장간</th>{pillars.map(([label, pillar]) => <td key={label}>{pillar?.hiddenStems.join(', ') || '미확정'}</td>)}</tr></tbody></table></div><dl className="calculation-notes"><div><dt>오행 집계</dt><dd>{chart.elementMethod}</dd></div><div><dt>계절</dt><dd>{chart.season}</dd></div><div><dt>십성 분포</dt><dd>{Object.entries(chart.tenGodCounts).map(([key, count]) => `${key} ${count}`).join(', ') || '없음'}</dd></div><div><dt>적용 관례</dt><dd>{chart.conventions.join(' / ')}</dd></div></dl>{chart.warnings.length > 0 && <div className="technical-warning"><strong>불확실성과 유의점</strong><ul>{chart.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}<h3>대운, 긴 주기</h3>{chart.cycles.length ? <div className="table-scroll"><table><thead><tr><th>나이</th><th>간지</th><th>오행</th><th>계산 설명</th></tr></thead><tbody>{chart.cycles.map(cycle => <tr key={cycle.startAge}><td>{cycle.startAge}~{cycle.endAge}</td><td>{cycle.pillar}</td><td>{ELEMENT_LABELS[cycle.element]}</td><td>{cycle.description}</td></tr>)}</tbody></table></div> : <p>현재 입력 조건으로 대운 방향을 확정하지 않았어요.</p>}<h3>연도별 흐름</h3><div className="table-scroll"><table><thead><tr><th>연도</th><th>간지</th><th>오행</th><th>설명</th></tr></thead><tbody>{chart.annual.map(annual => <tr key={annual.year}><td>{annual.year}</td><td>{annual.pillar}</td><td>{ELEMENT_LABELS[annual.element]}</td><td>{annual.description}</td></tr>)}</tbody></table></div>{chart.profile.currentMonth && <><h3>이번 달 계산 근거</h3><p>{chart.profile.currentMonth.year}년 {chart.profile.currentMonth.month}월 전체를 절기가 바뀌는 순간에 나누어 계산했어요. 아래 시각은 한국 표준시이며 사건이 일어나는 시각을 뜻하지 않아요.</p><ul>{chart.profile.currentMonth.periods.map(period=><li key={period.startsAt}>{new Date(period.startsAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}부터 {new Date(period.endsAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} 직전까지, {ELEMENT_LABELS[period.element]} / {ELEMENT_LABELS[period.branchElement]}, {period.tenGod} / {period.branchTenGod}</li>)}</ul></>}<h3>풀이에 참고한 특성</h3>{reading.monthly && (['opportunity','caution','action'] as const).map(key=><p className="evidence-line" key={key}><strong>이번 달 {({opportunity:'기회',caution:'주의',action:'행동'})[key]}</strong> {reading.monthly![key].evidence.join(' / ')}</p>)}{SECTION_KEYS.map(key => <p className="evidence-line" key={key}><strong>{sectionLabels[key]}</strong> {reading.sections[key].evidence.join(' / ')}</p>)}</div></details>;
}
