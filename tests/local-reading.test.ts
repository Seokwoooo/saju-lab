import {describe, expect, it} from 'vitest';
import {SECTION_KEYS, type BirthInput} from '../lib/contracts';
import {calculateSaju} from '../lib/saju';
import {calculateCompatibility, createLocalReading} from '../lib/local-reading';

const birth: BirthInput = {gender:'unspecified', calendar:'solar', leapMonth:false, year:1992, month:10, day:24, timeKnown:true, hour:5, minute:30, country:'KR'};

describe('local readings based on calculated features', () => {
  it('returns all nine substantial sections with their calculated evidence', () => {
    const chart = calculateSaju(birth, 2026);
    const reading = createLocalReading(chart);
    expect(reading.source).toBe('local');
    expect(Object.keys(reading.sections).sort()).toEqual([...SECTION_KEYS].sort());
    expect(reading.headline).toMatch(/물/);
    for (const section of Object.values(reading.sections)) {
      expect(section.body.length).toBeGreaterThan(100);
      expect(section.tip.length).toBeGreaterThan(15);
      expect(section.evidence.length).toBeGreaterThan(0);
    }
    expect(reading.sections.personality.evidence.join(' ')).toMatch(/癸|계/);
    expect(reading.sections.strengths.evidence.join(' ')).toMatch(/쇠.*3|금.*3/);
    expect(reading.sections.year.evidence.join(' ')).toMatch(/2026.*丙午|2026.*병오/);
    expect(reading.sections.cycles.body).toMatch(/성별|미선택|계산하지/);
    expect(JSON.stringify(reading)).not.toMatch(/반드시 성공|큰 병|질병|투자 수익|운명적으로/);
  });
  it('changes the actual reading when the calculated day element changes', () => {
    const water = createLocalReading(calculateSaju(birth, 2026));
    const wood = createLocalReading(calculateSaju({...birth, day:25}, 2026));
    expect(wood.headline).toMatch(/나무/);
    expect(wood.sections.personality.body).not.toBe(water.sections.personality.body);
    expect(wood.sections.advice.tip).not.toBe(water.sections.advice.tip);
  });
  it('keeps all public copy beginner friendly while technical evidence remains separate', () => {
    for (const changes of [{}, {gender:'male' as const}, {year:2024, month:2, day:4, timeKnown:false}]) {
      const reading = createLocalReading(calculateSaju({...birth,...changes}, 2026));
      const publicCopy = [reading.headline,reading.intro,...Object.values(reading.sections).flatMap(section => [section.title,section.body,section.tip])].join(' ');
      expect(publicCopy).not.toMatch(/[\u3400-\u9fff]|일간|십신|십성|천간|지지|지장간|재성|비겁|식상|관성|인성|대운|연주|월주|일주|시주/);
      expect(reading.sections.personality.evidence.join(' ')).toMatch(/癸|계/);
    }
  });
  it('makes uncertain source data visible throughout the reading', () => {
    const reading = createLocalReading(calculateSaju({...birth, year:2024, month:2, day:4, timeKnown:false}, 2026));
    expect(reading.intro).toMatch(/미확정|확정|시간/);
    expect(reading.sections.strengths.body).toMatch(/현재 확인|시간|여백/);
    expect(reading.sections.cycles.body).toMatch(/시간/);
  });
  it('renders actual cycles rather than placeholders when calculated', () => {
    const reading = createLocalReading(calculateSaju({...birth, gender:'male'}, 2026));
    expect(reading.sections.cycles.evidence.join(' ')).toMatch(/5.*14.*辛亥/);
  });
  it('creates deterministic compatibility from both charts, without a fabricated score', () => {
    const a = calculateSaju(birth, 2026);
    const b = calculateSaju({...birth, day:25, timeKnown:false}, 2026);
    const compatibility = calculateCompatibility(a, b);
    expect(compatibility.elements).toEqual(['water','wood']);
    expect(compatibility.source).toBe('local');
    expect(compatibility.summary).toMatch(/물.*나무|나무.*물/);
    expect(compatibility.harmony).toMatch(/상생|돕/);
    expect(compatibility.advice).toMatch(/시간|시주/);
    expect(JSON.stringify(compatibility)).not.toMatch(/\d+점|\d+%|천생연분|이별/);
    expect(calculateCompatibility(a, b)).toEqual(compatibility);
    expect(calculateCompatibility(b, a).elements).toEqual(['wood','water']);
    const metal = calculateSaju({...birth, day:31}, 2026);
    expect(JSON.stringify(calculateCompatibility(b, metal))).not.toMatch(/나무과|쇠과/);
    expect(createLocalReading(b).sections.year.body).not.toMatch(/나무과|쇠과/);
  });
});
