import { calculateFourPillars, getSolarTermsOfYear, getHeavenlyStemElement, getHeavenlyStemYinYang, getEarthlyBranchElement, getTenGod, getBranchTenGod, HEAVENLY_STEMS, type FiveElement } from 'manseryeok';
import type { Element, MonthlyContext } from './contracts';

const elements:Record<FiveElement,Element>={목:'wood',화:'fire',토:'earth',금:'metal',수:'water'};
const KST=9*60*60*1000;

/** Cover the whole civil month, splitting at the exact KST solar-term transition. */
export function calculateMonthlyContext(dayElement:Element,polarity:'yin'|'yang',year:number,month:number):MonthlyContext {
  if(!Number.isInteger(year)||year<1801||year>2295||!Number.isInteger(month)||month<1||month>12) throw new Error('분석할 연도와 월을 확인해 주세요.');
  const dayStem=HEAVENLY_STEMS.find(stem=>elements[getHeavenlyStemElement(stem)]===dayElement && (getHeavenlyStemYinYang(stem)==='양'?'yang':'yin')===polarity);
  if(!dayStem) throw new Error('계산된 사주 특성을 확인해 주세요.');
  const start=Date.UTC(year,month-1,1)-KST;
  const end=Date.UTC(year,month,1)-KST;
  const boundaries=[start,...getSolarTermsOfYear(year).filter(term=>term.index%2===0 && term.date.getTime()>start && term.date.getTime()<end).map(term=>term.date.getTime()),end];
  const periods=boundaries.slice(0,-1).map((instant,index)=>{
    const date=new Date(instant+KST);
    const {month:pillar}=calculateFourPillars({year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate(),hour:date.getUTCHours(),minute:date.getUTCMinutes(),dayBoundary:'midnight'});
    return {startsAt:new Date(instant).toISOString(),endsAt:new Date(boundaries[index+1]).toISOString(),element:elements[getHeavenlyStemElement(pillar.heavenlyStem)],branchElement:elements[getEarthlyBranchElement(pillar.earthlyBranch)],tenGod:getTenGod(dayStem,pillar.heavenlyStem),branchTenGod:getBranchTenGod(dayStem,pillar.earthlyBranch)};
  });
  return {year,month,periods};
}
