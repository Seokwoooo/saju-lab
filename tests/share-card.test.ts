import { describe, expect, it } from 'vitest';
import type { Reading, SajuChart, Compatibility } from '../lib/contracts';
import { CARD_TYPES, createCardContent, getCardDimensions, getCardTextLayout, fitCardText, getElementPercentages } from '../lib/share-card';

const chart = {
  dayElement: 'wood', polarity: 'yang', timeKnown: false, boundaryUncertain: true,
  elementCounts: { wood: 2, fire: 1, earth: 1, metal: 0, water: 2 },
  elementTotal: 6, solarDate: '1990-05-12', lunarDate: '1990-04-18',
  profile: { analysisYear: 2026 }, warnings: ['시간 미상'],
} as SajuChart;
const section = { title: '작은 실험을 시작할 때', body: '새로운 아이디어를 작은 행동으로 옮겨 보세요.', tip: '오늘 한 걸음만.', evidence: ['전문 정보'] };
const reading = { headline: '천천히, 단단하게 자라는 사람', intro: '내 속도로 자라요.', source: 'local', sections: Object.fromEntries(['personality', 'strengths', 'relationships', 'love', 'career', 'money', 'year', 'cycles', 'advice'].map(k => [k, section])) } as Reading;
const compatibility: Compatibility = { title: '서로의 계절이 되어주는 사이', summary: '나누면 더 풍성해지는 관계.', harmony: '함께 자라요.', difference: '속도가 달라요.', advice: '서로의 속도를 존중해요.', elements: ['wood', 'water'], source: 'local' };

describe('sharing privacy and export contract', () => {
  it('omits name by default and never includes raw birth dates, pillars, or evidence', () => {
    for (const type of CARD_TYPES) {
      const card = createCardContent({ type: type.id, chart, reading, compatibility, nickname: '비밀 이름' });
      const serialized = JSON.stringify(card);
      expect(serialized).not.toContain('비밀 이름');
      expect(serialized).not.toContain('1990');
      expect(serialized).not.toContain('전문 정보');
      expect(serialized).not.toContain('solarDate');
    }
  });
  it('includes only an explicitly enabled, bounded nickname', () => {
    expect(createCardContent({ type: 'headline', chart, reading, nickname: '  나의 이름  ', showNickname: true }).nickname).toBe('나의 이름');
    expect(createCardContent({ type: 'headline', chart, reading, nickname: '가'.repeat(100), showNickname: true }).nickname?.length).toBeLessThanOrEqual(20);
  });
  it('uses the actual reading and carries uncertainty onto every personal card', () => {
    expect(createCardContent({ type: 'headline', chart, reading }).headline).toBe(reading.headline);
    for (const type of CARD_TYPES.filter(t => t.id !== 'compatibility')) {
      expect(createCardContent({ type: type.id, chart, reading }).footnote).toContain('시간 미상');
      expect(createCardContent({ type: type.id, chart, reading }).footnote).toContain('절기·시각 경계');
      const historicalBoundary = createCardContent({ type: type.id, chart: { ...chart, timeKnown: true }, reading }).footnote;
      expect(historicalBoundary).toContain('절기·시각 경계');
      expect(historicalBoundary).not.toContain('시간 미상');
    }
  });
  it('selects a concise complete excerpt rather than spilling the full intro into a card', () => {
    const intro = '흐름을 읽는 물처럼 넓게 살피는 리듬이에요. 마음에 남는 문장만 가져가 보세요. 이 세 번째 문장은 카드에 담지 않아요.';
    const card = createCardContent({ type: 'headline', chart, reading: { ...reading, intro } });
    expect(card.body).toBe('흐름을 읽는 물처럼 넓게 살피는 리듬이에요. 마음에 남는 문장만 가져가 보세요.');
    expect(card.body).not.toMatch(/…$/);
  });
  it('requires calculated compatibility for the compatibility layout', () => {
    expect(() => createCardContent({ type: 'compatibility', chart, reading })).toThrow('궁합');
    const card = createCardContent({ type: 'compatibility', chart, reading, compatibility });
    expect(card.headline).toBe(compatibility.title);
    expect(card.elements).toEqual(['wood', 'water']);
  });
  it('defines exact export dimensions for both formats', () => {
    expect(getCardDimensions('portrait')).toEqual({ width: 1080, height: 1350 });
    expect(getCardDimensions('story')).toEqual({ width: 1080, height: 1920 });
  });
  it('keeps all six layout text boxes inside the paper and above the brand footer', () => {
    for (const card of CARD_TYPES) for (const format of ['portrait', 'story'] as const) for (const nickname of [false, true]) {
      const { height } = getCardDimensions(format);
      for (const box of Object.values(getCardTextLayout(card.id, format, nickname))) {
        expect(box.x).toBeGreaterThanOrEqual(84);
        expect(box.x + box.width).toBeLessThanOrEqual(996);
        expect(box.y).toBeGreaterThanOrEqual(170);
        expect(box.y + box.height).toBeLessThanOrEqual(height - 183);
        expect(box.minFontSize).toBeGreaterThanOrEqual(22);
      }
    }
  });
  it('fits long Korean copy without exceeding measured width or line count', () => {
    const lines = fitCardText('한글 문장이 길어져도 카드 밖으로 벗어나지 않도록 정확하게 줄여요.', s => s.length * 10, 80, 3);
    expect(lines).toHaveLength(3);
    expect(lines.every(s => s.length * 10 <= 80)).toBe(true);
    expect(lines.at(-1)).toMatch(/…$/);
    expect(fitCardText('', s => s.length, 80, 3)).toEqual([]);
  });
  it('keeps Korean word endings together when a word fits on the next line', () => {
    expect(fitCardText('차분하게 정리하는 편이에요.', s => Array.from(s).length, 13, 3)).toEqual(['차분하게 정리하는','편이에요.']);
  });
  it('represents actual element ratios, including absent elements, without fabricated values', () => {
    expect(getElementPercentages(chart.elementCounts)).toEqual({ wood: 33, fire: 17, earth: 17, metal: 0, water: 33 });
    expect(getElementPercentages({ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 })).toEqual({ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 });
  });
});
