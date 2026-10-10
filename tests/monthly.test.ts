import { describe, expect, it } from 'vitest';
import { getSolarTerm } from 'manseryeok';
import { calculateMonthlyContext } from '../lib/monthly';

describe('calendar-month readings respect Korean solar-term boundaries',()=>{
  it('uses both actual monthly pillars across the October 2026 boundary',()=>{
    const month=calculateMonthlyContext('water','yin',2026,10);
    expect(month.periods).toHaveLength(2);
    expect(month.periods[0]).toMatchObject({startsAt:'2026-09-30T15:00:00.000Z',element:'fire',branchElement:'metal'});
    expect(month.periods[1]).toMatchObject({endsAt:'2026-10-31T15:00:00.000Z',element:'earth',branchElement:'earth',tenGod:'정관'});
    expect(month.periods[0].endsAt).toBe(getSolarTerm(2026,18).date.toISOString());
    expect(month.periods[1].startsAt).toBe(month.periods[0].endsAt);
  });
  it('keeps the February leap day and next year rollover inside exact KST boundaries',()=>{
    expect(calculateMonthlyContext('wood','yang',2024,2).periods.at(-1)?.endsAt).toBe('2024-02-29T15:00:00.000Z');
    expect(calculateMonthlyContext('wood','yang',2026,12).periods.at(-1)?.endsAt).toBe('2026-12-31T15:00:00.000Z');
    expect(calculateMonthlyContext('wood','yang',2027,1).periods[0].startsAt).toBe('2026-12-31T15:00:00.000Z');
  });
  it('uses the individual day element and polarity for monthly relationships',()=>{
    const water=calculateMonthlyContext('water','yin',2026,10);
    const wood=calculateMonthlyContext('wood','yang',2026,10);
    expect(wood.periods[1].tenGod).toBe('편재');
    expect(water.periods[1].tenGod).not.toBe(wood.periods[1].tenGod);
    expect(JSON.stringify(wood)).not.toMatch(/name|birth|gender|solarDate/);
  });
  it.each([0,13,1.5])('rejects invalid analysis month %s',month=>{
    expect(()=>calculateMonthlyContext('wood','yang',2026,month)).toThrow();
  });
});
