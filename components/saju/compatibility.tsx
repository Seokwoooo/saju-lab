'use client';

import { useState } from 'react';
import { ArrowRight, Heart, Info } from 'lucide-react';
import type { BirthInput, Compatibility, SajuChart } from '@/lib/contracts';
import { BirthFields } from './birth-form';
import { Character, Flower } from './character';

export function CompatibilityForm({ initial, initialSecond, onSubmit, error }: { initial?: BirthInput; initialSecond?: BirthInput; onSubmit: (a: BirthInput, b: BirthInput) => void; error?: string }) {
  const [first, setFirst] = useState<BirthInput | null>(initial || null);
  const [second, setSecond] = useState<BirthInput | null>(initialSecond || null);
  return <form className="compatibility-form" onSubmit={event => { event.preventDefault(); if (first && second) onSubmit(first, second); }}><div className="two-person-grid"><div className="paper"><BirthFields initial={initial} label="첫 번째 사람" onChange={setFirst} /></div><div className="paper"><BirthFields initial={initialSecond} label="두 번째 사람" onChange={setSecond} /></div></div>{error && <div className="error-note" role="alert"><Info size={18} /><p>{error}</p></div>}<button className="button primary compatibility-submit" disabled={!first || !second}>두 사람의 이야기 보기<ArrowRight size={19} /></button><p className="form-privacy">두 사람 모두 동의한 정보로 입력해 주세요. 입력 정보는 저장하거나 공유하지 않아요.</p></form>;
}

export function CompatibilityResult({ result, charts, names }: { result: Compatibility; charts: [SajuChart, SajuChart]; names: [string | undefined, string | undefined] }) {
  const uncertain = charts.some(chart => !chart.timeKnown || chart.boundaryUncertain);
  return <section className="compatibility-result paper" aria-labelledby="compatibility-title"><p className="eyebrow"><Heart size={15} /> TOGETHER IN THE GARDEN</p><div className="couple-art"><Character element={result.elements[0]} decorative /><Flower /><Character element={result.elements[1]} decorative /></div><p className="couple-names">{names[0] || '첫 번째 사람'} <span>&</span> {names[1] || '두 번째 사람'}</p><h2 id="compatibility-title">{result.title}</h2><p className="couple-summary">{result.summary}</p>{uncertain && <p className="uncertainty-note">시간 미상 또는 절기 경계가 포함되어 있어, 알려진 정보 안에서 살펴본 궁합이에요. 시간이 달라지면 풀이도 달라질 수 있어요.</p>}<div className="couple-notes"><article><span>01 · 함께 편안한 점</span><h3>우리의 잘 맞는 결</h3><p>{result.harmony}</p></article><article><span>02 · 서로에게 배우는 점</span><h3>다른 리듬도 괜찮아요</h3><p>{result.difference}</p></article><article><span>03 · 관계를 가꾸는 방법</span><h3>둘이 함께 해볼 일</h3><p>{result.advice}</p></article></div><p className="entertainment-note">궁합은 두 사람의 관계를 평가하는 점수가 아니에요. 실제 관계는 대화와 선택으로 만들어져요.</p></section>;
}
