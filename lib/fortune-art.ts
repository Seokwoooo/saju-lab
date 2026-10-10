export type FortuneKind='opportunity'|'caution'|'action';
export const FORTUNE_ART={
  'golden-coins':['재물 기회','빛나는 황금 동전과 차곡차곡 쌓인 동전'],
  'leaking-wallet':['지출 주의','열린 지갑 아래로 흘러나오는 동전'],
  'coin-jar':['돈 관리','동전을 모으는 민트색 저축 항아리'],
  'contract-pen':['약속과 계약','서류의 조건을 확인하는 펜과 체크 표시'],
  'torn-contract':['조건 확인','중간이 찢어져 서로 어긋난 계약서'],
  'rising-star':['일과 성과','위로 올라가는 화살표와 빛나는 황금 별'],
  'overloaded-briefcase':['일정 주의','서류와 책이 가득 쌓인 업무 가방'],
  'heart-bloom':['연애 기회','하트 꽃이 피어나는 줄기와 새잎'],
  'split-heart':['연애 갈등 주의','서로 떨어진 두 조각의 분홍 하트'],
  'heart-letter':['마음 전하기','마음을 전하는 봉투 위의 분홍 하트'],
  'handshake':['만남과 협력','서로 마주 잡은 두 손과 작은 별'],
  'crossed-messages':['말과 오해 주의','서로 엇갈리는 두 개의 대화 말풍선'],
  'speech-bubble':['대화의 시작','말을 나눌 준비가 된 민트색 말풍선'],
  'open-book':['배움의 기회','양쪽으로 펼쳐진 책과 발견을 상징하는 별'],
  'stacked-books':['배움의 과부하','여러 권이 비스듬하게 쌓인 책 더미'],
  'focus-lamp':['하나에 집중','책 한 권을 비추는 초록색 스탠드'],
  'open-door':['새로운 시작','따뜻한 빛이 들어오는 열린 문'],
  'forked-road':['선택 주의','서로 다른 방향으로 갈라지는 두 갈래 길'],
  'shield-boundary':['내 기준 지키기','주의 표시가 새겨진 둥근 방패'],
  'compass':['지금 할 일','갈 방향을 가리키는 황금 테두리 나침반'],
} as const;
export type FortuneArtKey=keyof typeof FORTUNE_ART;
export function fortuneArt(key:FortuneArtKey){const [label,alt]=FORTUNE_ART[key];return {key,label,alt,src:`/illustrations/fortune/${key}.svg`};}
/** Title only: a caution illustration must not be selected by incidental words in a rationale. */
export function selectFortuneArt(title:string,kind:FortuneKind){
  const caution=kind==='caution',action=kind==='action';
  let key:FortuneArtKey;
  if(/강의|공부|수업|학습|배움|배울|배우|자격|시험|연습/.test(title))key=caution?'stacked-books':action?'focus-lamp':'open-book';
  else if(/계약|서명|보증|조건|약관/.test(title))key=caution?'torn-contract':'contract-pen';
  else if(/돈|지출|금전|재물|수입|수익|정산|결제|할부|저축|예산|구매|비용|통장/.test(title))key=caution?'leaking-wallet':action?'coin-jar':'golden-coins';
  else if(/연인|사랑|연애|데이트|애정|고백|썸/.test(title))key=caution&&/다툼|갈등|오해|말|싸움|상처|감정|따지|섭섭|서운/.test(title)?'split-heart':caution?'crossed-messages':action?'heart-letter':'heart-bloom';
  else if(/친구|소개|동료|사람|모임|대화|관계|연락|말을|말하기|답장/.test(title)&&!/업무|작업물|프로젝트|성과|마감/.test(title))key=caution?'crossed-messages':action?'speech-bubble':'handshake';
  else if(/직장|업무|프로젝트|제안|실력|성과|작업|마감|일정|맡|부탁/.test(title))key=caution?'overloaded-briefcase':action?'compass':'rising-star';
  else if(/이사|이동|여행|선택|결정|출발|시작|환경|낯선/.test(title))key=caution?'forked-road':action?'compass':'open-door';
  else key=caution?'shield-boundary':action?'compass':'open-door';
  return fortuneArt(key);
}
