import {
  calculateFourPillars, EARTHLY_BRANCHES, EARTHLY_BRANCHES_HANJA,
  getBranchTenGod, getEarthlyBranchElement, getHeavenlyStemElement,
  getHeavenlyStemYinYang, getTenGod, HEAVENLY_STEMS, HEAVENLY_STEMS_HANJA,
  isValidSolarDate, lunarToSolar, solarToLunar,
  type EarthlyBranch, type FiveElement, type FourPillarsDetail,
  type HeavenlyStem, type Pillar as EnginePillar, type SolarDate,
} from 'manseryeok';
import {ELEMENT_LABELS, type Annual, type BirthInput, type Element, type Pillar, type SajuChart} from './contracts';

// Full years after Korean standard-time introduction, within the KASI-backed lunar table.
export const SUPPORTED_MIN_YEAR = 1909;
export const SUPPORTED_MAX_YEAR = 2049;
const MINUTE_MS = 60_000;
const KST_MINUTES = 540;
const ELEMENT_MAP: Record<FiveElement, Element> = {목:'wood', 화:'fire', 토:'earth', 금:'metal', 수:'water'};
const TEN_GODS = ['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'] as const;
// Residual/intermediate/main order; hidden stems are shown but not added to simple element counts.
const HIDDEN_STEMS: Record<EarthlyBranch, HeavenlyStem[]> = {
  자:['계'], 축:['계','신','기'], 인:['무','병','갑'], 묘:['을'],
  진:['을','계','무'], 사:['무','경','병'], 오:['기','정'], 미:['정','을','기'],
  신:['무','임','경'], 유:['신'], 술:['신','정','무'], 해:['갑','임'],
};
const seoulClock = new Intl.DateTimeFormat('en-GB', {
  timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit',
  hour:'2-digit', minute:'2-digit', hourCycle:'h23',
});
const pad = (n: number) => String(n).padStart(2, '0');
const dateText = (date: SolarDate) => `${date.year}-${pad(date.month)}-${pad(date.day)}`;
const emptyElements = (): Record<Element, number> => ({wood:0, fire:0, earth:0, metal:0, water:0});

function solarDate(input: BirthInput): SolarDate {
  if (input.calendar === 'solar') return {year:input.year, month:input.month, day:input.day};
  try {
    return lunarToSolar(input.year, input.month, input.day, input.leapMonth);
  } catch {
    throw new Error('존재하지 않는 음력 날짜 또는 윤달입니다. 평달·윤달과 일자를 다시 확인해 주세요.');
  }
}

export function validateBirthInput(input: BirthInput): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('출생 정보를 입력해 주세요.');
  if (input.country !== 'KR') throw new Error('현재는 대한민국에서 태어난 분의 출생 시각만 지원해요.');
  if (!['male','female','unspecified'].includes(input.gender)) throw new Error('대운 계산에 사용할 성별 항목을 확인해 주세요.');
  if (!['solar','lunar'].includes(input.calendar)) throw new Error('양력 또는 음력을 선택해 주세요.');
  if (typeof input.leapMonth !== 'boolean' || typeof input.timeKnown !== 'boolean') throw new Error('윤달과 출생 시간 선택을 확인해 주세요.');
  if (!Number.isInteger(input.year) || input.year < SUPPORTED_MIN_YEAR || input.year > SUPPORTED_MAX_YEAR) {
    throw new Error(`출생 연도는 ${SUPPORTED_MIN_YEAR}년부터 ${SUPPORTED_MAX_YEAR}년까지 지원해요.`);
  }
  if (input.calendar === 'solar' && input.leapMonth) throw new Error('윤달은 음력에서만 선택할 수 있어요.');
  if (input.calendar === 'solar' && !isValidSolarDate(input.year, input.month, input.day)) {
    throw new Error('존재하지 않는 양력 날짜입니다. 월·일과 윤년을 확인해 주세요.');
  }
  const solar = solarDate(input);
  if (solar.year < SUPPORTED_MIN_YEAR || solar.year > SUPPORTED_MAX_YEAR) {
    throw new Error(`변환된 양력 날짜도 ${SUPPORTED_MIN_YEAR}년부터 ${SUPPORTED_MAX_YEAR}년까지여야 해요.`);
  }
  const today = new Date(Date.now() + KST_MINUTES * MINUTE_MS);
  const todayDate = `${today.getUTCFullYear()}-${pad(today.getUTCMonth() + 1)}-${pad(today.getUTCDate())}`;
  if (dateText(solar) > todayDate) {
    throw new Error('미래의 생일은 입력할 수 없어요. 음력은 양력으로 변환한 날짜가 한국의 오늘 날짜까지여야 해요.');
  }
  if (input.timeKnown && (!Number.isInteger(input.hour) || input.hour! < 0 || input.hour! > 23 ||
    !Number.isInteger(input.minute) || input.minute! < 0 || input.minute! > 59)) {
    throw new Error('출생 시간을 0~23시, 0~59분으로 모두 입력해 주세요.');
  }
}

/** Resolve every matching UTC instant. Intl/IANA round-trip rejects gaps and preserves folds. */
function matchingInstants(date: SolarDate, hour: number, minute: number): number[] {
  const wallMs = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  const expected = `${pad(date.day)}/${pad(date.month)}/${date.year}, ${pad(hour)}:${pad(minute)}`;
  // The only offsets used by Asia/Seoul in the bounded support interval, including DST.
  return [510,540,570,600].map(offset => wallMs - offset * MINUTE_MS)
    .filter(instant => seoulClock.format(instant) === expected);
}

function calculateAtInstant(instant: number, gender?: 'male' | 'female'): FourPillarsDetail {
  const kst = new Date(instant + KST_MINUTES * MINUTE_MS);
  return calculateFourPillars({
    year:kst.getUTCFullYear(), month:kst.getUTCMonth() + 1, day:kst.getUTCDate(),
    hour:kst.getUTCHours(), minute:kst.getUTCMinutes(), dayBoundary:'midnight', gender,
  });
}

function samePillar(a: EnginePillar, b: EnginePillar) {
  return a.heavenlyStem === b.heavenlyStem && a.earthlyBranch === b.earthlyBranch;
}
function toPillar(pillar: EnginePillar, dayStem: HeavenlyStem, isDay = false): Pillar {
  return {
    stem:HEAVENLY_STEMS_HANJA[HEAVENLY_STEMS.indexOf(pillar.heavenlyStem)],
    branch:EARTHLY_BRANCHES_HANJA[EARTHLY_BRANCHES.indexOf(pillar.earthlyBranch)],
    stemKo:pillar.heavenlyStem, branchKo:pillar.earthlyBranch,
    stemElement:ELEMENT_MAP[getHeavenlyStemElement(pillar.heavenlyStem)],
    branchElement:ELEMENT_MAP[getEarthlyBranchElement(pillar.earthlyBranch)],
    tenGod:isDay ? '일간' : getTenGod(dayStem, pillar.heavenlyStem),
    hiddenStems:HIDDEN_STEMS[pillar.earthlyBranch].map(stem => HEAVENLY_STEMS_HANJA[HEAVENLY_STEMS.indexOf(stem)]),
  };
}
function seasonFor(branch?: EarthlyBranch): string {
  if (!branch) return '절기 경계 미확정';
  if (['인','묘','진'].includes(branch)) return '봄';
  if (['사','오','미'].includes(branch)) return '여름';
  if (['신','유','술'].includes(branch)) return '가을';
  return '겨울';
}
function annualFor(year: number): Annual {
  const stem = HEAVENLY_STEMS[((year - 4) % 10 + 10) % 10];
  const branch = EARTHLY_BRANCHES[((year - 4) % 12 + 12) % 12];
  const element = ELEMENT_MAP[getHeavenlyStemElement(stem)];
  const pillar = HEAVENLY_STEMS_HANJA[HEAVENLY_STEMS.indexOf(stem)] + EARTHLY_BRANCHES_HANJA[EARTHLY_BRANCHES.indexOf(branch)];
  return {year, pillar, element, description:`${year}년 입춘부터 다음 입춘까지의 ${stem}${branch}년. ${ELEMENT_LABELS[element]}의 상징을 한 해의 계획을 돌아보는 질문으로 활용해요.`};
}

export function calculateSaju(input: BirthInput, analysisYear = new Date(Date.now() + KST_MINUTES * MINUTE_MS).getUTCFullYear()): SajuChart {
  validateBirthInput(input);
  if (!Number.isInteger(analysisYear) || analysisYear < 1801 || analysisYear > 2295) throw new Error('분석 연도는 1801~2295년 범위로 입력해 주세요.');
  const solar = solarDate(input);
  const lunar = solarToLunar(solar.year, solar.month, solar.day);
  const instants: number[] = [];
  if (input.timeKnown) instants.push(...matchingInstants(solar, input.hour!, input.minute!));
  else {
    // Every valid recorded minute is considered, including both sides of historical clock changes.
    for (let minute = 0; minute < 1440; minute++) {
      instants.push(...matchingInstants(solar, Math.floor(minute / 60), minute % 60));
    }
  }
  if (!instants.length) throw new Error('시계 변경으로 존재하지 않는 출생 시각입니다. 기록된 시간을 다시 확인해 주세요.');
  const exact = input.timeKnown && instants.length === 1;
  const direction = exact && input.gender !== 'unspecified' ? input.gender : undefined;
  const candidates = instants.map(instant => calculateAtInstant(instant, direction));
  const first = candidates[0];
  if (candidates.some(candidate => !samePillar(candidate.day, first.day))) {
    throw new Error('과거 한국 표준시·서머타임 변경으로 출생 시간에 따라 일주가 달라져요. 정확한 시간을 확인해야 계산할 수 있어요. 두 번 나타난 시각은 별도 확인이 필요해요.');
  }
  const yearKnown = candidates.every(candidate => samePillar(candidate.year, first.year));
  const monthKnown = candidates.every(candidate => samePillar(candidate.month, first.month));
  const hourKnown = input.timeKnown && candidates.every(candidate => samePillar(candidate.hour, first.hour));
  const warnings: string[] = [];
  if (!input.timeKnown) warnings.push('출생 시간 미상: 시주와 대운은 계산하지 않았어요. 같은 날짜의 모든 유효한 분을 확인했어요.');
  if (!yearKnown) warnings.push('입춘 절입 전후에 연주가 달라져 연주를 미확정으로 남겼어요.');
  if (!monthKnown) warnings.push('월 절기 절입 전후에 월주가 달라져 월주와 계절을 미확정으로 남겼어요.');
  if (input.timeKnown && instants.length > 1) warnings.push('한국 시계 변경으로 두 번 나타난 시각이에요. 모든 후보에서 일치하는 기둥만 표시하며 대운은 생략해요.');
  if (input.timeKnown && !hourKnown) warnings.push('시계 변경의 두 후보가 서로 다른 시주를 만들어 시주를 미확정으로 남겼어요.');
  const correctedHistory = instants.some(instant => {
    const civil = seoulClock.formatToParts(instant);
    const value = (type: Intl.DateTimeFormatPartTypes) => Number(civil.find(part => part.type === type)?.value);
    const wall = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'));
    return wall - instant !== KST_MINUTES * MINUTE_MS;
  });
  if (correctedHistory) warnings.push('기록된 당시 한국 시각을 역사 표준시·서머타임에 따라 UTC+9 표준시로 환산했어요. 일주·시주가 기록된 날짜·시각과 달라질 수 있어요.');
  const dayStem = first.day.heavenlyStem;
  const pillars: SajuChart['pillars'] = {
    year:yearKnown ? toPillar(first.year, dayStem) : null,
    month:monthKnown ? toPillar(first.month, dayStem) : null,
    day:toPillar(first.day, dayStem, true), hour:hourKnown ? toPillar(first.hour, dayStem) : null,
  };
  const elementCounts = emptyElements();
  const tenGodCounts = Object.fromEntries(TEN_GODS.map(god => [god,0]));
  for (const [key, pillar] of Object.entries(pillars)) {
    if (!pillar) continue;
    elementCounts[pillar.stemElement]++;
    elementCounts[pillar.branchElement]++;
    if (key !== 'day') tenGodCounts[pillar.tenGod]++;
    tenGodCounts[getBranchTenGod(dayStem, pillar.branchKo as EarthlyBranch)]++;
  }
  const cycles = first.luckPillars?.pillars.map(cycle => ({
    startAge:cycle.age, endAge:cycle.age + 9,
    pillar:toPillar(cycle.pillar, dayStem).stem + toPillar(cycle.pillar, dayStem).branch,
    element:ELEMENT_MAP[getHeavenlyStemElement(cycle.pillar.heavenlyStem)],
    description:`${cycle.age}~${cycle.age + 9}세의 ${cycle.korean} 대운. 시작 나이는 인접 절기까지의 일수를 3으로 나눈 반올림값이며, 성취나 사건을 예측하는 값은 아니에요.`,
  })) ?? [];
  if (!cycles.length) warnings.push('대운은 정확한 출생 시각과 순행·역행에 쓰는 성별 선택이 모두 있을 때만 계산해요.');
  const annual = Array.from({length:5}, (_, index) => annualFor(analysisYear + index));
  const dayElement = pillars.day.stemElement;
  const polarity = getHeavenlyStemYinYang(dayStem) === '양' ? 'yang' : 'yin';
  const season = seasonFor(monthKnown ? first.month.earthlyBranch : undefined);
  const boundaryUncertain = !yearKnown || !monthKnown || (input.timeKnown && instants.length > 1);
  return {
    solarDate:dateText(solar), lunarDate:`${lunar.year}-${lunar.isLeapMonth ? '윤' : ''}${pad(lunar.month)}-${pad(lunar.day)}`,
    pillars, dayElement, polarity, elementCounts,
    elementTotal:Object.values(elementCounts).reduce((sum, count) => sum + count, 0),
    elementMethod:'확정된 기둥의 천간·지지 글자를 각각 1개로 세는 단순 오행 개수. 지장간·계절 가중치·신강약은 포함하지 않아요.',
    tenGodCounts, season, cycles, annual, warnings, boundaryUncertain, timeKnown:input.timeKnown,
    conventions:[
      '대한민국 출생 기록을 IANA Asia/Seoul 역사 시각으로 해석한 뒤 UTC+9 표준시로 환산해요.',
      '연주는 입춘 순간, 월주는 12개 절의 절입 순간에 바뀌어요. 절입표는 분 단위예요.',
      '일주와 시주는 환산된 UTC+9 표준시 기준. 일 경계는 00:00이며 23:00에는 일주를 바꾸지 않아요.',
      '출생지 경도·진태양시·균시차 보정은 적용하지 않아요. 다른 학파의 결과와 다를 수 있어요.',
      '십신 개수는 일간을 제외한 천간과 지지 본기의 관계를 세며, 지장간은 잔기·중기·본기 순으로 표시해요.',
    ],
    profile:{
      version:1, dayElement, polarity, elementCounts:{...elementCounts}, tenGodCounts:{...tenGodCounts},
      season, timeKnown:input.timeKnown, boundaryUncertain,
      cycles:cycles.map(({startAge,endAge,element}) => ({startAge,endAge,element})),
      annual:annual.map(({year,element}) => ({year,element})), analysisYear,
    },
  };
}
