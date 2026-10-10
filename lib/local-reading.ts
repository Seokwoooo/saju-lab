import {ELEMENT_LABELS, ELEMENTS, type Compatibility, type Element, type SajuChart} from './contracts';

const SYMBOLS: Record<Element, {phrase:string; habit:string; caution:string; relation:string; work:string; money:string; action:string}> = {
  wood:{phrase:'방향을 정하고 자라는 나무', habit:'새로운 가능성을 찾고 작은 시작을 이어 가는 모습', caution:'앞으로 나아가는 속도가 함께하는 사람의 속도보다 빨라질 때', relation:'함께 해 보고 싶은 일을 구체적으로 제안하는 방식', work:'배우며 방향을 세우는 기획·개선 과정', money:'새로운 계획을 시작하기 전에 필요한 비용과 끝내는 기준을 적는 습관', action:'지금 키우고 싶은 일 하나를 고르고, 이번 주의 가장 작은 첫 단계를 적어 보세요.'},
  fire:{phrase:'마음을 밝히는 불', habit:'생각을 말과 표현으로 나누고 분위기에 온기를 더하는 모습', caution:'표현에 힘이 실려 상대가 대답할 틈이 줄어들 때', relation:'좋았던 순간과 고마운 이유를 말로 전하는 방식', work:'사람에게 생각을 전달하고 참여를 이끄는 과정', money:'기분에 따른 소비 전에 하루의 생각할 시간을 두는 습관', action:'전하고 싶은 생각 하나를 짧게 적고, 말한 뒤에는 상대의 답을 끝까지 들어 보세요.'},
  earth:{phrase:'일상을 받쳐 주는 흙', habit:'사람과 일을 연결하고 꾸준히 자리를 지키는 모습', caution:'모두를 챙기다가 자신의 일정과 경계가 흐려질 때', relation:'약속을 지키며 천천히 신뢰를 쌓는 방식', work:'운영·조율·인수인계처럼 일이 계속되게 만드는 과정', money:'고정 비용과 자유롭게 쓸 비용을 구분해 기록하는 습관', action:'이번 주의 약속을 펼쳐 보고, 지킬 수 있는 범위와 쉬는 시간을 함께 표시해 보세요.'},
  metal:{phrase:'기준을 다듬는 쇠', habit:'복잡한 것을 정리하고 필요한 기준을 세우는 모습', caution:'맞고 틀림을 빨리 정하느라 상대의 상황을 놓칠 때', relation:'명확한 약속과 솔직한 피드백으로 신뢰를 만드는 방식', work:'검토·품질·정리처럼 결과의 기준을 다듬는 과정', money:'결정 전 가격·조건·유지 비용을 같은 기준으로 비교하는 습관', action:'고치고 싶은 기준 하나를 고르고, 충분히 좋은 상태가 무엇인지 한 문장으로 써 보세요.'},
  water:{phrase:'흐름을 읽는 물', habit:'주변의 흐름을 살피고 여러 관점을 연결하는 모습', caution:'가능성을 오래 살피다가 결정의 시점을 놓칠 때', relation:'상대의 이야기를 듣고 맥락을 이해하는 방식', work:'자료·관찰·탐색을 통해 아직 보이지 않는 연결을 찾는 과정', money:'정보를 더 모으는 것과 실제 지출 기록을 확인하는 것을 구분하는 습관', action:'고민 중인 선택 하나에 결정할 날짜를 붙이고, 필요한 정보 세 가지만 먼저 확인해 보세요.'},
};
const GENERATES: Record<Element, Element> = {wood:'fire', fire:'earth', earth:'metal', metal:'water', water:'wood'};
const SUBJECT_LABELS: Record<Element,string> = {wood:'나무가',fire:'불이',earth:'흙이',metal:'쇠가',water:'물이'};
const WITH_LABELS: Record<Element,string> = {wood:'나무와',fire:'불과',earth:'흙과',metal:'쇠와',water:'물과'};
function leadingElements(chart: SajuChart): Element[] {
  const max = Math.max(...ELEMENTS.map(element => chart.elementCounts[element]));
  return ELEMENTS.filter(element => chart.elementCounts[element] === max);
}
function relation(a: Element, b: Element): string {
  if (a === b) return '같은 빛깔의 리듬을 나누는 모습에 빗대어 볼 수 있어요';
  if (GENERATES[a] === b) return `${SUBJECT_LABELS[a]} ${ELEMENT_LABELS[b]}의 움직임을 돕는 모습에 빗대어 볼 수 있어요`;
  if (GENERATES[b] === a) return `${SUBJECT_LABELS[b]} ${ELEMENT_LABELS[a]}의 움직임을 돕는 모습에 빗대어 볼 수 있어요`;
  return '서로 다른 기준이 만나 조율하는 관계로 읽어요';
}
export { createLocalReading } from './plain-local-reading';

export function calculateCompatibility(a: SajuChart, b: SajuChart): Compatibility {
  const second = ELEMENT_LABELS[b.dayElement];
  const topA = leadingElements(a).map(element => ELEMENT_LABELS[element]).join('·');
  const topB = leadingElements(b).map(element => ELEMENT_LABELS[element]).join('·');
  const uncertain = !a.timeKnown || !b.timeKnown || a.boundaryUncertain || b.boundaryUncertain;
  return {
    title:`${WITH_LABELS[a.dayElement]} ${second}, 함께 맞추는 리듬`,
    summary:`두 사람은 ${WITH_LABELS[a.dayElement]} ${second}의 조합으로 살펴볼 수 있어요. ${relation(a.dayElement,b.dayElement)}. 실제 행동과 관계의 결과는 이 조합만으로 결정되지 않아요.`,
    harmony:`첫 사람의 ${SYMBOLS[a.dayElement].relation}과 두 번째 사람의 ${SYMBOLS[b.dayElement].relation}이 만나요. 서로 돕는 방식을 찾으려면 각자 편한 표현과 듣고 싶은 말을 실제로 이야기해 보세요.`,
    difference:`첫 사람은 ${topA}, 두 번째 사람은 ${topB}의 모습을 먼저 살펴볼 수 있어요. 알고 있는 출생 정보의 범위가 다를 수 있으니 이를 점수처럼 비교하지 않아요. 각자 결정하는 속도와 약속의 기준을 확인하는 질문으로 써 보세요.`,
    advice:`함께할 일 하나에서 결정할 사람·들어 줄 사람·마감 시점을 작은 약속으로 정해 보세요. ${uncertain ? '출생 시간을 모르거나 시간에 따라 달라질 수 있는 부분이 있어, 확인할 수 있는 정보만 읽었어요.' : '출생 시간을 함께 살펴봤지만 관계의 좋고 나쁨을 점수로 판정하지 않아요.'}`,
    elements:[a.dayElement,b.dayElement], source:'local',
  };
}
