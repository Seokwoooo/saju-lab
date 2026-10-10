import {ELEMENT_LABELS,type AIProfile,type Element} from './contracts';

/** Conventional symbolism, distinct from a measured personality or a prediction. */
export const GOD_MEANINGS:Record<string,string>={
  비견:'나와 같은 오행과 음양. 자기 기준, 동료와의 협력을 상징해요.',
  겁재:'나와 같은 오행, 다른 음양. 공동 자원과 몫을 둘러싼 경쟁을 상징해요.',
  식신:'내가 만들어 내는(생하는) 오행, 같은 음양. 꾸준한 표현과 결과물을 상징해요.',
  상관:'내가 만들어 내는(생하는) 오행, 다른 음양. 표현과 기존 규칙에 대한 문제 제기를 상징해요.',
  편재:'내가 제어하는(극하는) 오행, 같은 음양. 유동적인 거래와 자원 운용을 상징해요.',
  정재:'내가 제어하는(극하는) 오행, 다른 음양. 정해진 수입과 지출 관리를 상징해요.',
  편관:'나를 제어하는(극하는) 오행, 같은 음양. 압박, 경쟁과 책임을 상징해요.',
  정관:'나를 제어하는(극하는) 오행, 다른 음양. 약속, 규칙과 책임을 상징해요.',
  편인:'나를 돕는(생하는) 오행, 같은 음양. 탐구와 선택적인 배움을 상징해요.',
  정인:'나를 돕는(생하는) 오행, 다른 음양. 학습, 문서와 도움을 상징해요.',
};
const stems:Record<Element,readonly [string,string]>={wood:['갑목','을목'],fire:['병화','정화'],earth:['무토','기토'],metal:['경금','신금'],water:['임수','계수']};
export interface ReadingEvidence {id:string;kind:'natal'|'month';fact:string;meaning:string;gods:string[];period?:string}
export const kstInstant=(value:string)=>new Date(Date.parse(value)+9*3600000).toISOString().slice(0,16).replaceAll('-','.').replace('T',' ');
export function monthlyEvidence(profile:AIProfile):ReadingEvidence[] {
  const total=Object.values(profile.tenGodCounts).reduce((sum,count)=>sum+count,0);
  return [
    {id:'day-element',kind:'natal',fact:`일간 ${stems[profile.dayElement][profile.polarity==='yang'?0:1]}`,meaning:`나를 기준으로 삼는 글자가 ${profile.polarity==='yang'?'양':'음'}의 ${ELEMENT_LABELS[profile.dayElement]}예요. 아래 관계는 이 글자와 비교한 계산값이에요.`,gods:[]},
    ...Object.entries(profile.tenGodCounts).filter(([,count])=>count>0).map(([god,count]):ReadingEvidence=>({id:`ten-god:${god}`,kind:'natal',fact:`${god} ${count}개 / 확인된 ${total}개 관계`,meaning:GOD_MEANINGS[god]??'',gods:[god]})),
    ...(profile.currentMonth?.periods.map((period,index):ReadingEvidence=>{
      const gods=[...new Set([period.tenGod,period.branchTenGod])];
      return {id:`month:${profile.currentMonth!.year}-${String(profile.currentMonth!.month).padStart(2,'0')}:${index}`,kind:'month',fact:`월의 천간 ${period.tenGod}, 지지 본기 ${period.branchTenGod}`,meaning:gods.map(god=>`${god}: ${GOD_MEANINGS[god]}`).join(' '),gods,period:`${kstInstant(period.startsAt)} ~ ${kstInstant(period.endsAt)} 직전`};
    })??[]),
  ];
}
export function selectedEvidence(profile:AIProfile,ids:readonly string[]) {
  const catalog=new Map(monthlyEvidence(profile).map(fact=>[fact.id,fact]));
  return [...new Set(ids)].flatMap(id=>{const fact=catalog.get(id);return fact?[fact]:[];});
}
