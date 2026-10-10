import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export function CalendarSettings({ calendar, leapMonth, onChange }: {
  calendar: 'solar' | 'lunar';
  leapMonth: boolean;
  onChange: (calendar: 'solar' | 'lunar', leapMonth: boolean) => void;
}) {
  const id = useId();
  return <details className="calendar-settings">
    <summary><span><strong>{calendar === 'solar' ? '양력' : leapMonth ? '음력 · 윤달' : '음력'}</strong>{calendar === 'lunar' && leapMonth ? '로' : '으로'} 보고 있어요 <span className="calendar-change">달력 변경</span></span><ChevronDown size={16} aria-hidden="true" /></summary>
    <div className="calendar-settings-body">
      <p>음력 생일이라면 여기에서 바꿔주세요.</p>
      <fieldset className="choice-field"><legend className="visually-hidden">생일의 달력</legend><div className="segmented">
        <label><input type="radio" name={`${id}-calendar`} checked={calendar === 'solar'} onChange={() => onChange('solar', false)} /><span>양력</span></label>
        <label><input type="radio" name={`${id}-calendar`} checked={calendar === 'lunar'} onChange={() => onChange('lunar', leapMonth)} /><span>음력</span></label>
      </div></fieldset>
      {calendar === 'lunar' && <label className="check-label leap-check"><input type="checkbox" checked={leapMonth} onChange={event => onChange('lunar', event.target.checked)} /><span>윤달에 태어났어요</span></label>}
    </div>
  </details>;
}
