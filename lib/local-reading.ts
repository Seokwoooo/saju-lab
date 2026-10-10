import {ELEMENT_LABELS, ELEMENTS, type Compatibility, type Element, type Reading, type ReadingSection, type SajuChart} from './contracts';

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
const GROUPS = [
  {name:'비겁', gods:['비견','겁재'], meaning:'자기 기준과 동료 사이의 균형', question:'내가 맡을 몫과 함께 결정할 몫을 나눠 보세요.'},
  {name:'식상', gods:['식신','상관'], meaning:'표현과 결과물 만들기', question:'생각 하나를 다른 사람이 볼 수 있는 작은 결과물로 만들어 보세요.'},
  {name:'재성', gods:['편재','정재'], meaning:'시간·돈·자원의 배분', question:'가용 시간과 비용을 적은 뒤 우선순위를 한 가지 줄여 보세요.'},
  {name:'관성', gods:['편관','정관'], meaning:'책임과 약속의 기준', question:'잘해야 한다는 기대를 실제 약속과 스스로 만든 기대 중 어디에서 왔는지 나눠 보세요.'},
  {name:'인성', gods:['편인','정인'], meaning:'학습과 생각을 정리하는 과정', question:'배운 내용을 자신의 말로 세 문장에 정리하고 작은 행동으로 확인해 보세요.'},
] as const;
const seasonText: Record<string, string> = {
  봄:'시작과 성장이라는 계절의 상징', 여름:'표현과 활동이라는 계절의 상징',
  가을:'정리와 기준이라는 계절의 상징', 겨울:'관찰과 준비라는 계절의 상징',
  '절기 경계 미확정':'출생 시각을 알아야 결정되는 계절의 경계',
};

function countSummary(chart: SajuChart) {
  return ELEMENTS.map(element => `${ELEMENT_LABELS[element]} ${chart.elementCounts[element]}개`).join(' · ');
}
function leadingElements(chart: SajuChart): Element[] {
  const max = Math.max(...ELEMENTS.map(element => chart.elementCounts[element]));
  return ELEMENTS.filter(element => chart.elementCounts[element] === max);
}
function focusGroups(chart: SajuChart) {
  const counts = GROUPS.map(group => ({...group, count:group.gods.reduce((sum, god) => sum + (chart.tenGodCounts[god] ?? 0),0)}));
  const max = Math.max(...counts.map(group => group.count));
  return counts.filter(group => group.count === max);
}
function relation(a: Element, b: Element): string {
  if (a === b) return '같은 빛깔의 리듬을 나누는 모습에 빗대어 볼 수 있어요';
  if (GENERATES[a] === b) return `${SUBJECT_LABELS[a]} ${ELEMENT_LABELS[b]}의 움직임을 돕는 모습에 빗대어 볼 수 있어요`;
  if (GENERATES[b] === a) return `${SUBJECT_LABELS[b]} ${ELEMENT_LABELS[a]}의 움직임을 돕는 모습에 빗대어 볼 수 있어요`;
  return '서로 다른 기준이 만나 조율하는 관계로 읽어요';
}
function section(title:string, body:string, tip:string, evidence:string[]): ReadingSection {
  return {title,body,tip,evidence};
}

export function createLocalReading(chart: SajuChart): Reading {
  const symbol = SYMBOLS[chart.dayElement];
  const dayLabel = ELEMENT_LABELS[chart.dayElement];
  const dayPillar = chart.pillars.day;
  const polarity = chart.polarity === 'yang' ? '양' : '음';
  const expression = chart.polarity === 'yang' ? '바깥으로 방향을 드러내는' : '세부를 살피며 안에서 다듬는';
  const dayEvidence = `일간 ${dayPillar.stem}(${dayPillar.stemKo}) · ${dayLabel} · ${polarity}`;
  const counts = countSummary(chart);
  const leaders = leadingElements(chart);
  const groups = focusGroups(chart);
  const groupText = groups.map(group => `${group.name} ${group.count}개`).join('·');
  const groupMeanings = groups.map(group => group.meaning).join(', ');
  const sample = '현재 확인할 수 있는 정보에서 다섯 빛깔을 읽었어요.';
  const limit = chart.boundaryUncertain
    ? '태어난 시간에 따라 달라질 수 있는 부분은 여백으로 남겨두었어요.'
    : !chart.timeKnown ? '태어난 시간을 모르니 시간에 따라 달라지는 부분은 열어 두어요.'
      : '어떤 빛깔이 많아도 능력의 우열이나 사람의 가치를 뜻하지 않아요.';
  const annual = chart.annual[0];
  const annualEvidence = `${annual.year}년 ${annual.pillar} · ${ELEMENT_LABELS[annual.element]}`;
  const cycle = chart.cycles[0];
  return {
    source:'local',
    headline:`${dayLabel}의 리듬, 나답게 쓰는 법`,
    intro:`당신의 리듬을 ${symbol.phrase}에 빗대어 읽어 볼게요. 마음에 드는 문장은 가져가고, 실제 경험과 다른 부분은 가볍게 지나쳐도 괜찮아요. ${limit}`,
    sections:{
      personality:section('나의 기본 리듬',
        `${symbol.phrase}처럼 ${symbol.habit}을 떠올려 볼 수 있어요. 자신의 리듬에서는 ${expression} 모습도 살펴보세요. 이 모습이 평소 자신에게 맞는지는 실제 경험으로 확인하는 것이 좋아요. ${symbol.caution}에는 잠깐 멈추고 다른 방식도 시도해 볼 여지가 있어요.`,
        symbol.action, [dayEvidence, `월지 계절: ${chart.season}`]),
      strengths:section('잘 쓰면 힘이 되는 점',
        `다섯 빛깔 중에서는 ${leaders.map(element => ELEMENT_LABELS[element]).join('·')}의 모습을 먼저 살펴볼 수 있어요. ${sample} ${leaders.map(element => SYMBOLS[element].work).join(', ')}에서 자신의 강점을 발견했던 경험이 있는지 돌아보세요. ${limit} 덜 보이는 빛깔이 있어도 그에 해당하는 능력이나 경험이 없다는 뜻은 아니에요. 최근 잘 끝낸 일과 비교하면 이야기를 더 구체적으로 활용할 수 있어요.`,
        '최근 잘 끝낸 일 하나에서 반복해서 쓴 행동을 세 가지 적고, 다음 일에 한 가지를 다시 써 보세요.', [counts, chart.elementMethod]),
      relationships:section('사람 사이에서 편한 방식',
        `${symbol.relation}을 관계의 출발점으로 살펴보세요. 함께 생각해 볼 주제로 ${groupMeanings}도 있어요. 자신이 편한 방식을 상대도 좋아하는지는 말로 확인해야 해요. 차이가 느껴질 때에는 성격을 단정하기보다 답변 속도·역할·약속을 구체적으로 맞추는 편이 도움이 돼요.`,
        groups[0].question, [dayEvidence, `십신 묶음: ${groupText} (일간 제외, 지지 본기 포함)`]),
      love:section('가까운 관계와 애정 표현',
        `가까운 사이에서도 ${symbol.relation}이 편할 수 있는지 돌아보세요. ${symbol.caution}에는 선의가 상대에게 어떻게 전달됐는지 확인할 필요가 있어요. 다섯 빛깔의 이야기로 특정 상대, 결혼 시기 또는 관계의 결과를 정할 수는 없어요. 편안했던 순간의 대화 방식과 불편했던 순간의 기대를 나란히 적어 보면 자신에게 필요한 친밀감의 조건을 더 잘 설명할 수 있어요.`,
        '상대에게 바라는 행동 하나와 내가 해 줄 수 있는 행동 하나를 같은 크기의 약속으로 정해 보세요.', [dayEvidence, `자기 표현의 상징: ${polarity}`]),
      career:section('일과 배움의 방향',
        `${symbol.work}에서 재미를 느꼈던 경험이 있는지 살펴보세요. ${seasonText[chart.season] ?? '계절의 이야기'}과 함께 ${groupMeanings}도 일하는 방식에 대한 질문으로 활용할 수 있어요. 이 풀이로 직업 적성이나 합격·승진을 판정하지는 않아요. 실제로 해 본 과제, 받은 피드백, 앞으로 배우고 싶은 기술을 함께 놓고 작은 실험을 정해 보세요.`,
        '관심 있는 업무 하나를 30분짜리 작은 과제로 만들어 해 보고, 결과와 재미를 따로 기록해 보세요.', [dayEvidence, `계절: ${chart.season}`, `십신 묶음: ${groupText}`]),
      money:section('돈과 자원을 다루는 습관',
        `${symbol.money}을 일상의 점검 방법으로 제안해요. ${(chart.tenGodCounts['편재'] ?? 0) + (chart.tenGodCounts['정재'] ?? 0) > 0 ? '시간과 비용을 나눠 쓰는 주제도 함께 살펴볼 수 있어요.' : '돈을 다루는 특별한 재능을 단정하기보다 일상의 작은 기록부터 시작해 보세요.'} 어떤 빛깔의 사람이든 수입과 지출은 실제 숫자로 확인해야 해요. 자신의 목표를 적고, 선택을 서두를 때 사용할 확인 절차를 정해 두면 좋아요.`,
        '이번 달 지출 중 만족한 것 하나와 줄이고 싶은 것 하나를 골라, 이유와 다음 달 기준을 적어 보세요.', [`재성: 편재 ${chart.tenGodCounts['편재']}개 · 정재 ${chart.tenGodCounts['정재']}개`, counts]),
      year:section(`${annual.year}년을 돌아보는 질문`,
        `${annual.year}년의 이야기는 ${ELEMENT_LABELS[annual.element]}의 모습에 빗대어 살펴볼 수 있어요. 자신의 ${WITH_LABELS[chart.dayElement]} 올해의 ${ELEMENT_LABELS[annual.element]}은 ${relation(chart.dayElement, annual.element)}. 이를 사건이나 좋은 일·나쁜 일에 대한 예고로 보지 않고, 평소의 리듬과 어떤 활동을 함께 놓을지 묻는 틀로 활용해요. 구체적인 계획은 자신의 여건과 실제 일정에 맞춰 천천히 정해 보세요.`,
        `${SYMBOLS[annual.element].action} 한 달 뒤 실행해 본 결과를 다시 확인해 보세요.`, [annualEvidence, dayEvidence]),
      cycles:section('오래 이어지는 나의 리듬',
        cycle
          ? `${cycle.startAge}~${cycle.endAge}세의 구간은 ${ELEMENT_LABELS[cycle.element]}의 모습에 빗대어 돌아볼 수 있어요. 긴 흐름의 나이를 성공·실패의 예정표로 삼을 필요는 없어요. 열 해 단위로 배운 것, 역할이 바뀐 것, 유지하고 싶은 습관을 살펴보는 기록의 구간으로 활용해 보세요. 시간이 지나며 달라진 경험과 선택은 이 풀이보다 더 풍부한 자신의 이야기가 될 수 있어요.`
          : `긴 시기의 흐름을 살펴보려면 정확한 출생 시간과 성별 선택이 함께 필요해요. 현재 정보로는 이 부분을 계산하지 않았어요. 모르는 시각을 임의로 골라 이야기를 만들어 내지는 않아요. 긴 흐름을 보고 싶다면 실제로 역할이 달라졌던 시기와 앞으로의 생활 계획을 먼저 정리해 보세요. 계산되지 않은 구간에 좋은 일·나쁜 일이나 특정 사건을 붙이지 않아요.`,
        '몇 년 뒤에도 이어 가고 싶은 습관 하나를 골라, 다음 달에 다시 확인할 날짜를 정해 보세요.',
        cycle ? chart.cycles.slice(0,3).map(item => `${item.startAge}~${item.endAge}세 ${item.pillar} · ${ELEMENT_LABELS[item.element]}`) : ['대운 미산출: 출생 시간 또는 방향 입력 부족·시각 경계']),
      advice:section('오늘부터 해 볼 작은 선택',
        `${symbol.action} ${leaders.map(element => ELEMENT_LABELS[element]).join('·')}의 모습과 함께 ${groupMeanings}도 돌아볼 수 있어요. ${sample} ${limit} 이 해석을 자신에 대한 고정된 설명으로 삼기보다, 한 번 시도한 뒤 맞는 부분만 남기는 메모로 사용해 보세요. 다른 사람의 조언과 실제 경험이 이 글과 다르면 그 경험을 우선해도 괜찮아요.`,
        symbol.action, [dayEvidence, counts, `계절: ${chart.season}`]),
    },
  };
}

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
