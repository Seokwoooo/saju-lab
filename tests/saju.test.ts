import {afterEach, describe, expect, it, vi} from 'vitest';
import {Solar} from 'lunar-javascript';
import type {BirthInput, SajuChart} from '../lib/contracts';
import {calculateSaju, validateBirthInput} from '../lib/saju';

const birth = (changes: Partial<BirthInput> = {}): BirthInput => ({
  gender: 'unspecified', calendar: 'solar', leapMonth: false,
  year: 1992, month: 10, day: 24, timeKnown: true, hour: 5, minute: 30,
  country: 'KR', ...changes,
});
const hanja = (chart: SajuChart, key: keyof SajuChart['pillars']) => {
  const pillar = chart.pillars[key];
  return pillar ? pillar.stem + pillar.branch : null;
};

describe('Korean calendar and pillars', () => {
  it('calculates the documented KASI-anchor fixture and derived counts', () => {
    const chart = calculateSaju(birth(), 2026);
    expect(['year', 'month', 'day', 'hour'].map(key => hanja(chart, key as keyof SajuChart['pillars'])))
      .toEqual(['壬申', '庚戌', '癸酉', '乙卯']);
    expect(chart.solarDate).toBe('1992-10-24');
    expect(chart.lunarDate).toBe('1992-09-29');
    expect(chart.elementCounts).toEqual({wood: 2, fire: 0, earth: 1, metal: 3, water: 2});
    expect(chart.elementTotal).toBe(8);
    expect(chart.elementMethod).toMatch(/단순|글자/);
    expect(chart.pillars.year?.hiddenStems).toEqual(['戊', '壬', '庚']);
    expect(chart.pillars.month?.tenGod).toBe('정인');
    expect(chart.tenGodCounts).toEqual({비견: 0, 겁재: 1, 식신: 2, 상관: 0, 편재: 0, 정재: 0, 편관: 0, 정관: 1, 편인: 1, 정인: 2});
  });
  it('converts ordinary lunar input to the same actual chart', () => {
    const solar = calculateSaju(birth(), 2026);
    const lunar = calculateSaju(birth({calendar: 'lunar', month: 9, day: 29}), 2026);
    expect(lunar).toEqual(solar);
  });
  it('validates and distinguishes the 2023 leap second month', () => {
    const leap = calculateSaju(birth({calendar: 'lunar', year: 2023, month: 2, day: 1, leapMonth: true}), 2026);
    const normal = calculateSaju(birth({calendar: 'lunar', year: 2023, month: 2, day: 1}), 2026);
    expect(leap.solarDate).toBe('2023-03-22');
    expect(leap.lunarDate).toBe('2023-윤02-01');
    expect(normal.solarDate).toBe('2023-02-20');
    expect(hanja(leap, 'day')).toBe('己卯');
    expect(hanja(normal, 'day')).toBe('己酉');
  });
  it('keeps the Korean 1997 new-year date rather than using Chinese lunar data', () => {
    const chart = calculateSaju(birth({calendar: 'lunar', year: 1997, month: 1, day: 1}), 2026);
    expect(chart.solarDate).toBe('1997-02-08');
    expect(Solar.fromYmd(1997, 2, 7).getLunar().getDay()).toBe(1);
  });
  it('accepts Gregorian February 29 in a leap year', () => {
    expect(() => validateBirthInput(birth({year: 2024, month: 2, day: 29}))).not.toThrow();
    const chart = calculateSaju(birth({year: 2024, month: 2, day: 29}), 2026);
    expect(chart.solarDate).toBe('2024-02-29');
    expect(chart.lunarDate).toBe('2024-01-20');
    expect(hanja(chart, 'day')).toBe('癸亥');
  });
  it.each([
    [2024, 2, 4, 17, 26, '癸卯', '乙丑'],
    [2024, 2, 4, 17, 27, '甲辰', '丙寅'],
    [2024, 2, 4, 17, 28, '甲辰', '丙寅'],
    [2024, 3, 5, 11, 22, '甲辰', '丙寅'],
    [2024, 3, 5, 11, 23, '甲辰', '丁卯'],
    [2024, 3, 5, 11, 24, '甲辰', '丁卯'],
  ])('uses the exact minute boundary at %i-%i-%i %i:%i', (year, month, day, hour, minute, y, m) => {
    const chart = calculateSaju(birth({year, month, day, hour, minute}), 2026);
    expect(hanja(chart, 'year')).toBe(y);
    expect(hanja(chart, 'month')).toBe(m);
  });
  it('changes day at midnight and keeps the same day at 23:00', () => {
    const late = calculateSaju(birth({hour: 23, minute: 0}), 2026);
    const beforeMidnight = calculateSaju(birth({hour: 23, minute: 59}), 2026);
    const next = calculateSaju(birth({day: 25, hour: 0, minute: 0}), 2026);
    expect(hanja(late, 'day')).toBe('癸酉');
    expect(hanja(beforeMidnight, 'day')).toBe('癸酉');
    expect(hanja(late, 'hour')).toBe('壬子');
    expect(hanja(next, 'day')).toBe('甲戌');
    expect(hanja(next, 'hour')).toBe('甲子');
  });
  it.each([
    [1992, 10, 24, 5, 30, 5, 30],
    [1954, 4, 1, 14, 0, 14, 30],
    [1961, 8, 9, 23, 45, 0, 15],
    [1988, 7, 1, 13, 30, 12, 30],
    [2024, 2, 4, 17, 26, 17, 26],
    [2024, 2, 4, 17, 28, 17, 28],
    [2024, 3, 5, 11, 22, 11, 22],
    [2024, 3, 5, 11, 24, 11, 24],
  ])('cross-validates independent calendar pillars after Korean clock conversion: %i-%i-%i', (year, month, day, hour, minute, kh, km) => {
    const chart = calculateSaju(birth({year, month, day, hour, minute}), 2026);
    const kst = new Date(Date.UTC(year, month - 1, day, kh, km));
    if (year === 1961) kst.setUTCDate(kst.getUTCDate() + 1);
    const chinese = new Date(kst.getTime() - 60 * 60_000);
    const exact = Solar.fromYmdHms(chinese.getUTCFullYear(), chinese.getUTCMonth() + 1, chinese.getUTCDate(), chinese.getUTCHours(), chinese.getUTCMinutes(), 0).getLunar();
    const local = Solar.fromYmdHms(kst.getUTCFullYear(), kst.getUTCMonth() + 1, kst.getUTCDate(), kh, km, 0).getLunar();
    expect(hanja(chart, 'year')).toBe(exact.getYearInGanZhiExact());
    expect(hanja(chart, 'month')).toBe(exact.getMonthInGanZhiExact());
    expect(hanja(chart, 'day')).toBe(local.getDayInGanZhi());
    expect(hanja(chart, 'hour')).toBe(local.getTimeInGanZhi());
  });
});

describe('unknown and historical times', () => {
  it('never manufactures an hour or cycles for unknown time', () => {
    const chart = calculateSaju(birth({timeKnown: false, gender: 'male', hour: 20, minute: 55}), 2026);
    expect(chart.pillars.hour).toBeNull();
    expect(chart.elementTotal).toBe(6);
    expect(chart.cycles).toEqual([]);
    expect(chart.boundaryUncertain).toBe(false);
    expect(chart).toEqual(calculateSaju(birth({timeKnown: false, gender: 'male'}), 2026));
  });
  it('omits both year and month for unknown time on ipchun', () => {
    const chart = calculateSaju(birth({year: 2024, month: 2, day: 4, timeKnown: false}), 2026);
    expect(chart.pillars.year).toBeNull();
    expect(chart.pillars.month).toBeNull();
    expect(chart.pillars.hour).toBeNull();
    expect(chart.elementTotal).toBe(2);
    expect(chart.season).toBe('절기 경계 미확정');
    expect(chart.boundaryUncertain).toBe(true);
    expect(chart.warnings.join(' ')).toMatch(/입춘|연주/);
  });
  it('preserves year but omits month on an unknown-time monthly boundary', () => {
    const chart = calculateSaju(birth({year: 2024, month: 3, day: 5, timeKnown: false}), 2026);
    expect(hanja(chart, 'year')).toBe('甲辰');
    expect(chart.pillars.month).toBeNull();
    expect(chart.boundaryUncertain).toBe(true);
    expect(chart.elementTotal).toBe(4);
  });
  it('rejects historical unknown time when its normalized day cannot be known', () => {
    expect(() => calculateSaju(birth({year: 1954, month: 4, day: 1, timeKnown: false}), 2026)).toThrow(/시간.*일주|일주.*시간/);
    expect(() => calculateSaju(birth({year: 1988, month: 7, day: 1, timeKnown: false}), 2026)).toThrow(/시간.*일주|일주.*시간/);
  });
  it.each([
    [1961, 8, 10, 0, 15],
    [1988, 5, 8, 2, 30],
    [1955, 5, 5, 0, 30],
  ])('rejects a nonexistent Korean civil time %i-%i-%i %i:%i', (year, month, day, hour, minute) => {
    expect(() => calculateSaju(birth({year, month, day, hour, minute}), 2026)).toThrow(/존재하지 않는|시계 변경/);
  });
  it('reports the 1954 repeated time and rejects ambiguous day pillars', () => {
    expect(() => calculateSaju(birth({year: 1954, month: 3, day: 20, hour: 23, minute: 45}), 2026)).toThrow(/일주|두 번/);
  });
  it('retains agreed pillars but omits cycles for the 1988 repeated time', () => {
    const chart = calculateSaju(birth({year: 1988, month: 10, day: 9, hour: 2, minute: 30, gender: 'male'}), 2026);
    expect(chart.boundaryUncertain).toBe(true);
    expect(chart.cycles).toEqual([]);
    expect(chart.warnings.join(' ')).toMatch(/두 번|서머타임/);
  });
  it('only calculates daewoon when precise time and a direction input are available', () => {
    expect(calculateSaju(birth(), 2026).cycles).toEqual([]);
    const chart = calculateSaju(birth({gender: 'male'}), 2026);
    expect(chart.cycles).toHaveLength(10);
    expect(chart.cycles[0]).toMatchObject({pillar: '辛亥', startAge: 5, endAge: 14, element: 'metal'});
  });
});

describe('validation and privacy boundary', () => {
  afterEach(() => vi.useRealTimers());
  it.each([
    {year: 1908}, {year: 2050}, {year: NaN}, {year: 2024.5},
    {year: 2023, month: 2, day: 29}, {month: 4, day: 31},
    {month: 13}, {hour: 24}, {minute: -1}, {minute: 0.5},
    {calendar: 'lunar', year: 2024, month: 2, day: 1, leapMonth: true},
    {calendar: 'lunar', year: 2023, month: 2, day: 30, leapMonth: true},
    {calendar: 'solar', leapMonth: true},
    {country: 'US'}, {gender: 'other'}, {timeKnown: 'false'},
  ])('rejects invalid or unsupported input %j with a Korean error', changes => {
    expect(() => validateBirthInput(birth(changes as Partial<BirthInput>))).toThrow(/[가-힣]/);
  });
  it('rejects missing time fields only when time is marked known', () => {
    expect(() => validateBirthInput(birth({hour: undefined}))).toThrow(/시각|시간/);
    expect(() => validateBirthInput(birth({timeKnown: false, hour: undefined, minute: undefined}))).not.toThrow();
  });
  it('rejects tomorrow and later dates through both public entry points', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-10T03:00:00Z'));
    for (const date of [{year:2026, month:10, day:11}, {year:2026, month:12, day:31}, {year:2049, month:1, day:1}]) {
      for (const timeKnown of [true,false]) {
        const input = birth({...date,timeKnown});
        expect(() => validateBirthInput(input)).toThrow(/미래|오늘/);
        expect(() => calculateSaju(input, 2026)).toThrow(/미래|오늘/);
      }
    }
    expect(() => calculateSaju(birth({year:2026, month:10, day:10, hour:23, minute:59}), 2026)).not.toThrow();
  });
  it('uses the Korean current date at midnight rather than the UTC date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-31T15:00:00Z'));
    const today = birth({year:2027, month:1, day:1});
    expect(() => validateBirthInput(today)).not.toThrow();
    expect(calculateSaju(today).solarDate).toBe('2027-01-01');
    expect(() => calculateSaju(birth({year:2027, month:1, day:2}))).toThrow(/미래|오늘/);
  });
  it.each([
    [new Date('2023-02-19T15:00:00Z'), {year:2023, month:2, day:1, leapMonth:false}, '2023-02-20'],
    [new Date('2023-03-21T15:00:00Z'), {year:2023, month:2, day:1, leapMonth:true}, '2023-03-22'],
    [new Date('2024-02-08T15:00:00Z'), {year:2023, month:12, day:30, leapMonth:false}, '2024-02-09'],
  ])('checks the converted solar birth date for lunar input at %s', (todayInstant, date, converted) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(todayInstant.getTime() - 60_000));
    const input = birth({calendar:'lunar',...date});
    expect(() => validateBirthInput(input)).toThrow(/미래|오늘/);
    expect(() => calculateSaju(input, 2026)).toThrow(/미래|오늘/);
    vi.setSystemTime(todayInstant);
    expect(() => validateBirthInput(input)).not.toThrow();
    expect(calculateSaju(input, 2026).solarDate).toBe(converted);
  });
  it('retains the supported upper year for calendar fixtures when the reference clock has reached it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2049-12-31T03:00:00Z'));
    expect(calculateSaju(birth({year:2049, month:12, day:31}), 2049).solarDate).toBe('2049-12-31');
    expect(() => validateBirthInput(birth({year:2050, month:1, day:1}))).toThrow(/1909.*2049/);
  });
  it('uses the current Korean year even while UTC is still last year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-31T15:05:00Z'));
    const chart = calculateSaju(birth());
    expect(chart.profile.analysisYear).toBe(2027);
    expect(chart.annual[0]).toMatchObject({year: 2027, pillar: '丁未', element: 'fire'});
  });
  it('only exports derived whitelisted AI fields and never raw identifiers', () => {
    const chart = calculateSaju(birth({name: '개인정보_TEST', gender: 'female'}), 2026);
    expect(Object.keys(chart.profile).sort()).toEqual(['version','dayElement','polarity','elementCounts','tenGodCounts','season','timeKnown','boundaryUncertain','cycles','annual','analysisYear','currentMonth'].sort());
    expect(Object.keys(chart.profile.tenGodCounts).sort()).toEqual(['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'].sort());
    expect(JSON.stringify(chart.profile)).not.toMatch(/개인정보_TEST|1992|1992-10-24|female|birth|hour|minute|name|gender|solarDate|lunarDate/);
    expect(Object.keys(chart.profile.cycles[0]).sort()).toEqual(['startAge','endAge','element'].sort());
    expect(Object.keys(chart.profile.annual[0]).sort()).toEqual(['year','element'].sort());
    chart.profile.elementCounts.wood = 99;
    expect(chart.elementCounts.wood).toBe(2);
  });
});
