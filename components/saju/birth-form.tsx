'use client';

import { useId, useState } from 'react';
import type { BirthInput, Gender } from '@/lib/contracts';
import { MapPin } from 'lucide-react';
import { CalendarSettings } from './calendar-settings';

type FieldErrors = Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'name', string>>;
export function BirthFields({ initial, label, onChange }: { initial?: BirthInput; label: string; onChange: (input: BirthInput | null) => void }) {
  const id = useId();
  const [name, setName] = useState(initial?.name || '');
  const [gender, setGender] = useState<Gender>(initial?.gender || 'unspecified');
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>(initial?.calendar || 'solar');
  const [leapMonth, setLeapMonth] = useState(initial?.leapMonth || false);
  const [year, setYear] = useState(initial ? String(initial.year) : '');
  const [month, setMonth] = useState(initial ? String(initial.month) : '');
  const [day, setDay] = useState(initial ? String(initial.day) : '');
  const [timeKnown, setTimeKnown] = useState(initial?.timeKnown || false);
  const [hour, setHour] = useState(initial?.hour !== undefined ? String(initial.hour) : '');
  const [minute, setMinute] = useState(initial?.minute !== undefined ? String(initial.minute) : '');
  const [errors, setErrors] = useState<FieldErrors>({});
  function update(changes: Partial<{name: string; gender: Gender; calendar: 'solar' | 'lunar'; leapMonth: boolean; year: string; month: string; day: string; timeKnown: boolean; hour: string; minute: string}>) {
    const value = { name, gender, calendar, leapMonth, year, month, day, timeKnown, hour, minute, ...changes };
    const nextErrors: FieldErrors = {};
    const currentYear = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).getUTCFullYear();
    if (value.name.length > 20) nextErrors.name = '이름은 20자까지 입력할 수 있어요.';
    if (value.year && (!/^\d{4}$/.test(value.year) || +value.year < 1909 || +value.year > currentYear)) nextErrors.year = `1909~${currentYear}년 사이의 네 자리 연도를 입력해 주세요.`;
    if (value.month && (!/^\d{1,2}$/.test(value.month) || +value.month < 1 || +value.month > 12)) nextErrors.month = '월은 1~12로 입력해 주세요.';
    if (value.day && (!/^\d{1,2}$/.test(value.day) || +value.day < 1 || +value.day > 31)) nextErrors.day = '일은 1~31로 입력해 주세요.';
    if (value.timeKnown && value.hour && (!/^\d{1,2}$/.test(value.hour) || +value.hour < 0 || +value.hour > 23)) nextErrors.hour = '시는 0~23로 입력해 주세요.';
    if (value.timeKnown && value.minute && (!/^\d{1,2}$/.test(value.minute) || +value.minute < 0 || +value.minute > 59)) nextErrors.minute = '분은 0~59로 입력해 주세요.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !value.year || !value.month || !value.day || (value.timeKnown && (!value.hour || !value.minute))) { onChange(null); return; }
    onChange({ name: value.name.trim() || undefined, gender: value.gender, calendar: value.calendar, leapMonth: value.calendar === 'lunar' && value.leapMonth, year: +value.year, month: +value.month, day: +value.day, timeKnown: value.timeKnown, ...(value.timeKnown ? { hour: +value.hour, minute: +value.minute } : {}), country: 'KR' });
  }
  const numberField = (field: 'year' | 'month' | 'day' | 'hour' | 'minute', title: string, value: string, setter: (value: string) => void, placeholder: string, maxLength: number) => <div className="field"><label htmlFor={`${id}-${field}`}>{title}</label><input id={`${id}-${field}`} type="text" inputMode="numeric" autoComplete="off" maxLength={maxLength} placeholder={placeholder} value={value} required aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${id}-${field}-error` : undefined} onChange={event => { setter(event.target.value); update({ [field]: event.target.value }); }} /><span className="field-error" id={`${id}-${field}-error`}>{errors[field]}</span></div>;
  return <fieldset className="birth-fields"><legend className="person-legend">{label}</legend>
    <div className="field"><label htmlFor={`${id}-name`}>이름 <span>선택</span></label><input id={`${id}-name`} value={name} maxLength={20} autoComplete="off" placeholder="이름을 입력해 주세요" onChange={event => { setName(event.target.value); update({ name: event.target.value }); }} aria-invalid={!!errors.name} /><p className="field-hint">이름을 입력하지 않아도 모든 기능을 사용할 수 있어요.</p></div>

    <div className="date-grid">{numberField('year', '태어난 연도', year, setYear, '예: 1995', 4)}{numberField('month', '월', month, setMonth, '월', 2)}{numberField('day', '일', day, setDay, '일', 2)}</div><p className="field-hint date-range">1909년부터 오늘까지 지원해요. 오래된 날짜의 시간 변경 경계는 정확한 시간이 필요할 수 있어요.</p>
    <fieldset className="choice-field"><legend>태어난 시간</legend><div className="segmented"><label><input type="radio" name={`${id}-time`} checked={!timeKnown} onChange={() => { setTimeKnown(false); update({ timeKnown: false }); }} /><span>잘 모르겠어요</span></label><label><input type="radio" name={`${id}-time`} checked={timeKnown} onChange={() => { setTimeKnown(true); update({ timeKnown: true }); }} /><span>알고 있어요</span></label></div>{timeKnown ? <div className="time-grid">{numberField('hour', '시 (24시간)', hour, setHour, '0~23', 2)}{numberField('minute', '분', minute, setMinute, '0~59', 2)}</div> : <p className="field-hint">시간을 임의로 만들지 않고, 확정할 수 있는 정보로 풀이해요. 일부 해석은 달라질 수 있어요.</p>}</fieldset>
    <fieldset className="choice-field"><legend>성별 <span>선택 · 전통 대운 계산에 사용</span></legend><div className="segmented three"><label><input type="radio" name={`${id}-gender`} checked={gender === 'unspecified'} onChange={() => { setGender('unspecified'); update({ gender: 'unspecified' }); }} /><span>선택 안 함</span></label><label><input type="radio" name={`${id}-gender`} checked={gender === 'female'} onChange={() => { setGender('female'); update({ gender: 'female' }); }} /><span>여성</span></label><label><input type="radio" name={`${id}-gender`} checked={gender === 'male'} onChange={() => { setGender('male'); update({ gender: 'male' }); }} /><span>남성</span></label></div><p className="field-hint">선택하지 않으면 성별에 따른 대운 방향을 확정하지 않아요.</p></fieldset>
    <div className="country-note"><MapPin size={17} aria-hidden="true" /><p><strong>대한민국 출생 기준</strong><br />한국의 표준시·역사적 시간 변경을 반영해요. 해외 출생은 현재 지원하지 않아요.</p></div>
    <CalendarSettings calendar={calendar} leapMonth={leapMonth} onChange={(next, leap) => { setCalendar(next); setLeapMonth(leap); update({ calendar: next, leapMonth: leap }); }} />
  </fieldset>;
}

export { ProgressiveBirthForm as BirthForm } from './progressive-birth-form';
