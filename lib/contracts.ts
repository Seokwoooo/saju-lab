export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
export type Element = (typeof ELEMENTS)[number];
export const ELEMENT_LABELS: Record<Element, string> = {wood:'나무', fire:'불', earth:'흙', metal:'쇠', water:'물'};
export type Gender = 'male' | 'female' | 'unspecified';
export interface BirthInput {
  name?: string;
  gender: Gender;
  calendar: 'solar' | 'lunar';
  leapMonth: boolean;
  year: number;
  month: number;
  day: number;
  timeKnown: boolean;
  hour?: number;
  minute?: number;
  country: 'KR';
}
export interface Pillar {
  stem: string;
  branch: string;
  stemKo: string;
  branchKo: string;
  stemElement: Element;
  branchElement: Element;
  tenGod: string;
  hiddenStems: string[];
}
export interface Cycle {
  startAge: number;
  endAge: number;
  pillar: string;
  element: Element;
  description: string;
}
export interface Annual {
  year: number;
  pillar: string;
  element: Element;
  description: string;
}
export interface MonthlyContext {
  year: number;
  month: number;
  periods: { startsAt: string; endsAt: string; element: Element; branchElement: Element; tenGod: string; branchTenGod: string }[];
}
/** The only birth-related information allowed to cross the AI boundary. */
export interface AIProfile {
  version: 1;
  dayElement: Element;
  polarity: 'yin' | 'yang';
  elementCounts: Record<Element, number>;
  tenGodCounts: Record<string, number>;
  season: string;
  timeKnown: boolean;
  boundaryUncertain: boolean;
  cycles: {startAge: number; endAge: number; element: Element}[];
  annual: {year: number; element: Element}[];
  analysisYear: number;
  currentMonth?: MonthlyContext;
}
export interface SajuChart {
  solarDate: string;
  lunarDate: string;
  pillars: {year: Pillar | null; month: Pillar | null; day: Pillar; hour: Pillar | null};
  dayElement: Element;
  polarity: 'yin' | 'yang';
  elementCounts: Record<Element, number>;
  elementTotal: number;
  elementMethod: string;
  tenGodCounts: Record<string, number>;
  season: string;
  cycles: Cycle[];
  annual: Annual[];
  warnings: string[];
  boundaryUncertain: boolean;
  timeKnown: boolean;
  conventions: string[];
  profile: AIProfile;
}
export const SECTION_KEYS = ['personality','strengths','relationships','love','career','money','year','cycles','advice'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export interface ReadingSection {title: string; body: string; tip: string; evidence: string[]}
export interface Reading {
  headline: string;
  intro: string;
  sections: Record<SectionKey, ReadingSection>;
  source: 'local' | 'ai';
  monthly?: {
    headline: string;
    opportunity: Pick<ReadingSection, 'title'|'body'|'evidence'>;
    caution: Pick<ReadingSection, 'title'|'body'|'evidence'>;
    action: Pick<ReadingSection, 'title'|'body'|'evidence'>;
  };
}
export interface Compatibility {
  title: string;
  summary: string;
  harmony: string;
  difference: string;
  advice: string;
  elements: [Element, Element];
  source: 'local';
}
export interface AIResponse {reading?: Reading; error?: string; code?: string; retryAfter?: number}
