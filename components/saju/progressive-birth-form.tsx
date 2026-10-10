'use client';

import { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Info, LockKeyhole } from 'lucide-react';
import type { BirthInput, Gender } from '@/lib/contracts';
import { validateBirthInput } from '@/lib/saju';
import { CalendarSettings } from './calendar-settings';

const pad = (number: number) => String(number).padStart(2, '0');

export function ProgressiveBirthForm({ initial, onSubmit, error, busy = false }: {
  initial?: BirthInput; onSubmit: (input: BirthInput) => void; error?: string; busy?: boolean;
}) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const timeField = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name || '');
  const [date, setDate] = useState(initial ? `${initial.year}${pad(initial.month)}${pad(initial.day)}` : '');
  const [gender, setGender] = useState<Gender>(initial?.gender || 'unspecified');
  const [timeKnown, setTimeKnown] = useState<boolean | null>(initial ? initial.timeKnown : null);
  const [time, setTime] = useState(initial?.timeKnown ? `${pad(initial.hour!)}${pad(initial.minute!)}` : '');
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>(initial?.calendar || 'solar');
  const [leapMonth, setLeapMonth] = useState(initial?.leapMonth || false);
  const [fieldError, setFieldError] = useState('');
  const [hideParentError, setHideParentError] = useState(false);

  function go(next: number) {
    setStep(next); setFieldError(''); setHideParentError(true);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    });
  }
  function changeCalendar(next: 'solar' | 'lunar', leap: boolean) {
    setCalendar(next); setLeapMonth(next === 'lunar' && leap); setFieldError(''); setHideParentError(true);
  }
  function birthInput(known: boolean): BirthInput {
    if (!/^\d{8}$/.test(date)) throw new Error('생년월일을 숫자 8자리로 입력해 주세요. 예: 19951024');
    if (known && !/^\d{4}$/.test(time)) throw new Error('시간을 숫자 4자리로 입력해 주세요. 오후 2시 30분은 1430이에요.');
    const input: BirthInput = {
      name: name.trim() || undefined, year: +date.slice(0, 4), month: +date.slice(4, 6), day: +date.slice(6, 8),
      calendar, leapMonth: calendar === 'lunar' && leapMonth, gender, country: 'KR', timeKnown: known,
      ...(known ? { hour: +time.slice(0, 2), minute: +time.slice(2, 4) } : {}),
    };
    validateBirthInput(input);
    return input;
  }
  function finish(known: boolean) {
    try {
      const input = birthInput(known);
      setTimeKnown(known); setFieldError(''); setHideParentError(false); onSubmit(input);
    } catch (issue) { setFieldError(issue instanceof Error ? issue.message : '입력한 정보를 확인해 주세요.'); }
  }
  function next() {
    if (step === 0) { go(1); return; }
    if (step === 1) {
      try { birthInput(false); go(2); }
      catch (issue) { setFieldError(issue instanceof Error ? issue.message : '생년월일을 확인해 주세요.'); }
      return;
    }
    if (step === 2) { go(3); return; }
    finish(timeKnown === true);
  }
  const message = fieldError || (!hideParentError && error);
  const dateLabel = date.length === 8 ? `${date.slice(0, 4)}년 ${+date.slice(4, 6)}월 ${+date.slice(6, 8)}일` : '';
  const inputError = message ? `${id}-error` : undefined;
  return <form className="birth-form paper progressive-form" noValidate onSubmit={event => { event.preventDefault(); if (!busy) next(); }}>
    {step > 0 && <button className="step-back" type="button" onClick={() => go(step - 1)}><ArrowLeft size={15} aria-hidden="true" />이전</button>}
    <div className="step-question" key={step}>
      {step > 0 && <p className="step-recap">{name.trim() ? `${name.trim()}님의 사주` : '나의 사주'}{step > 1 && dateLabel ? ` · ${dateLabel}` : ''}</p>}
      <h2 ref={heading} tabIndex={-1}>
        {step === 0 ? '이름을 알려주세요.' : step === 1 ? '언제 태어나셨나요?' : step === 2 ? '성별을 선택해 주세요.' : '태어난 시간을 아시나요?'}
      </h2>
      <p className="step-help">{step === 0 ? '풀이에서 불러드릴 이름이에요. 입력하지 않아도 괜찮아요.' : step === 1 ? '생년월일을 숫자 8자리로 적어주세요.' : step === 2 ? '전통의 긴 운세 흐름을 계산할 때 사용해요.' : '시간을 몰라도 괜찮아요. 확인할 수 있는 사주로 풀어드려요.'}</p>

      {step === 0 && <div className="field step-field"><label htmlFor={`${id}-name`}>이름 <span>선택</span></label><input id={`${id}-name`} type="text" autoComplete="off" maxLength={20} placeholder="이름을 입력해 주세요" value={name} enterKeyHint="next" onChange={event => setName(event.target.value)} /><p className="field-hint">이름은 사주 계산에 영향을 주지 않으며, AI에 보내지 않아요.</p></div>}
      {step === 1 && <div className="field step-field"><label htmlFor={`${id}-date`}>생년월일 <span>{calendar === 'solar' ? '양력' : leapMonth ? '음력 · 윤달' : '음력'}</span></label><input id={`${id}-date`} className="date-entry" type="text" inputMode="numeric" autoComplete="off" maxLength={10} placeholder="예: 19951024" enterKeyHint="next" value={date} aria-invalid={!!message} aria-describedby={inputError || `${id}-date-hint`} onChange={event => { setDate(event.target.value.replace(/\D/g, '').slice(0, 8)); setFieldError(''); setHideParentError(true); }} /><p className="field-hint" id={`${id}-date-hint`}>{dateLabel || '1909년부터 오늘까지 · 대한민국 출생 기준'}</p></div>}
      {step === 2 && <div className="step-gender"><p className="choice-guidance">선택하면 마지막 단계로 넘어가요.</p><div className="step-choice-pair">{([['female', '여성'], ['male', '남성']] as const).map(([value, label]) => <button className={`step-option ${gender === value ? 'selected' : ''}`} type="button" key={value} onClick={() => { setGender(value); go(3); }}>{label}{gender === value ? <Check size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}</button>)}</div><button className="step-skip" type="button" onClick={() => { setGender('unspecified'); go(3); }}>선택하지 않고 계속하기<ArrowRight size={14} aria-hidden="true" /></button></div>}
      {step === 3 && (timeKnown === true ? <div className="field step-field"><label htmlFor={`${id}-time`}>태어난 시각 <span>24시간 기준</span></label><input ref={timeField} id={`${id}-time`} type="text" inputMode="numeric" autoComplete="off" maxLength={5} placeholder="예: 오후 2시 30분 → 1430" enterKeyHint="go" value={time} aria-invalid={!!message} aria-describedby={inputError || `${id}-time-hint`} onChange={event => { setTime(event.target.value.replace(/\D/g, '').slice(0, 4)); setFieldError(''); setHideParentError(true); }} /><p className="field-hint" id={`${id}-time-hint`}>{time.length === 4 ? `${time.slice(0, 2)}시 ${time.slice(2, 4)}분` : '00:00부터 23:59까지 · 모르는 시간은 만들지 않아요.'}</p></div> : <div className="step-time-options"><button className="step-option" type="button" onClick={() => { setTimeKnown(true); setFieldError(''); setHideParentError(true); requestAnimationFrame(() => timeField.current?.focus()); }}>시간을 알고 있어요<ChevronRight size={18} aria-hidden="true" /></button><button className="step-option time-unknown" type="button" disabled={busy} onClick={() => finish(false)}><span>태어난 시간을 몰라요<small>시간 없이 사주풀이 보기</small></span><ArrowRight size={18} aria-hidden="true" /></button></div>)}
    </div>
    {message && <div className="error-note" role="alert" id={`${id}-error`}><Info size={18} aria-hidden="true" /><p>{message}</p></div>}
    {(step < 2 || (step === 3 && timeKnown === true)) && <button className="button primary submit-button step-next" type="submit" disabled={busy}>{busy ? '계산하고 있어요' : step === 3 ? '내 사주 무료로 보기' : step === 0 && !name.trim() ? '이름 없이 계속하기' : '다음'}<ArrowRight size={18} aria-hidden="true" /></button>}
    {step === 3 && timeKnown === true && <button className="step-skip" type="button" disabled={busy} onClick={() => finish(false)}>시간을 모르겠어요 · 건너뛰기</button>}
    {step >= 1 && <CalendarSettings key={`calendar-${step}`} calendar={calendar} leapMonth={leapMonth} onChange={changeCalendar} />}
    <p className="step-privacy"><LockKeyhole size={12} aria-hidden="true" /> 입력 정보는 저장하지 않아요.</p>
  </form>;
}
