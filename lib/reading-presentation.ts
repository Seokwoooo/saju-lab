import { getSolarTermsOfYear } from 'manseryeok';
import type { MonthlyContext } from './contracts';

export { cleanDisplayText } from './display-text';
export function monthWindow(month:Pick<MonthlyContext,'year'|'month'>) {
  const prefix=`${month.year}-${String(month.month).padStart(2,'0')}`;
  const start=`${prefix}-01`;
  const end=`${prefix}-${new Date(Date.UTC(month.year,month.month,0)).getUTCDate()}`;
  return {start,end,label:`${start.replaceAll('-','.')} ~ ${end.replaceAll('-','.')}`};
}
function koreanInstant(date:Date) {
  return new Date(date.getTime()+9*3600000).toISOString().slice(0,16).replaceAll('-','.').replace('T',' ');
}
export function annualWindow(year:number) {
  const start=koreanInstant(getSolarTermsOfYear(year).find(term=>term.index===2)!.date);
  const end=koreanInstant(getSolarTermsOfYear(year+1).find(term=>term.index===2)!.date);
  return {start,end,label:`${start} ~ ${end} 직전`};
}
export const OPPORTUNITY_ART=[
  {key:'career',label:'일과 제안',alt:'작업을 소개하며 새로운 제안을 나누는 두 친구',match:/직장|업무|동료|프로젝트|제안|실력|성과|작업|일을|일할|일하|맡/},
  {key:'money',label:'돈과 생활',alt:'저축통에 동전을 나누어 담으며 돈 쓸 계획을 세우는 친구들',match:/돈|금전|재물|지출|저축|수입|구매|정산|비용|예산/},
  {key:'love',label:'연애와 마음',alt:'우산을 함께 쓰고 꽃길을 걷는 두 친구',match:/연애|연인|사랑|데이트|애정|고백/},
  {key:'learning',label:'배움과 발견',alt:'책을 읽으며 새로운 생각을 떠올리는 새싹 친구',match:/배우|배움|배울|수업|공부|학습|강의|시험|자격|연습/},
  {key:'connection',label:'만남과 관계',alt:'차를 마시며 이야기를 나누는 새싹 친구와 별 친구',match:/친구|소개|사람|모임|인연|대화|관계|연락/},
  {key:'new-start',label:'새로운 시작',alt:'열린 문을 지나 새로운 길로 걸어가는 새싹 친구',match:/새|시작|출발|이동|여행|이사|환경/},
] as const;
export function selectOpportunityArt(title:string) {
  // Match the main takeaway, never private input or a model-supplied asset URL.
  const ordered=[OPPORTUNITY_ART[2],OPPORTUNITY_ART[1],OPPORTUNITY_ART[3],OPPORTUNITY_ART[4],OPPORTUNITY_ART[0],OPPORTUNITY_ART[5]];
  const art=ordered.find(item=>item.match.test(title))??OPPORTUNITY_ART[5];
  return {...art,src:`/illustrations/${art.key}.webp`};
}
