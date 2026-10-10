import type {Metadata} from 'next';
import InfoLayout from '@/components/InfoLayout';
import {GITHUB_URL, SITE_URL, X_URL} from '@/lib/site-config';

const description = '루샨이 만든 무료 오픈소스 사주 프로젝트. 실제 계산을 다정한 자기성찰의 언어로 만납니다.';
export const metadata:Metadata = {
  title:'소개', description, alternates:{canonical:'/about'},
  openGraph:{title:'소개 | 사주랩',description,url:`${SITE_URL}/about`,type:'website',locale:'ko_KR',siteName:'사주랩 · Saju Lab',images:[{url:'/og.png',width:1200,height:630,alt:'사주랩의 다섯 오행 친구'}]},
  twitter:{card:'summary_large_image',title:'소개 | 사주랩',description,images:['/og.png']},
};
export default function AboutPage() {
  return <InfoLayout title="누구나 쉽게 만나는 사주풀이." intro="Lucian Labs의 루샨이 만든 무료 오픈소스 사주 서비스예요. 실제 사주 계산을 바탕으로, 성격과 관계부터 일과 돈, 올해의 흐름까지 쉬운 말로 풀어드려요." eyebrow="MADE WITH A LITTLE CURIOSITY">
    <section><h2>계산은 정확하게, 이야기는 다정하게</h2><p>어려운 용어를 모두 알아야 시작할 필요는 없어요. 나무·불·흙·쇠·물의 다섯 캐릭터와 쉬운 한국어 풀이로 나의 리듬을 살펴볼 수 있게 만들었어요.</p><p>생년월일에 맞는 실제 사주를 계산하고 그 결과에서 성격·강점·관계·연애·일·돈·올해·긴 흐름·조언의 아홉 주제를 읽어요. 궁합은 두 사람의 실제 계산값에서 대화를 위한 질문을 제안해요.</p></section>
    <section><h2>모르는 정보에는 여백을 남겨요</h2><p>시간을 모르면 임의의 시주를 만들지 않아요. 절기와 과거 시계 변경의 경계에서는 확정할 수 없는 부분을 알려 드려요. 오행의 많고 적음을 좋고 나쁨이나 능력 점수로 바꾸지 않아요.</p><p className="info-callout">전통적인 상징을 바탕으로 한 재미와 자기성찰용 콘텐츠예요. 실제 경험과 다르면 그 경험을 먼저 믿어도 괜찮아요.</p></section>
    <section><h2>무료로, 가입 없이, 선택할 수 있게</h2><p>기본 계산과 풀이는 내 브라우저 안에서 이루어져요. AI를 선택하지 않아도 전체 기본 결과와 카드를 볼 수 있어요. AI를 요청할 때에는 전달되는 특성을 확인하고 직접 동의해요.</p><p>여섯 가지 공유 카드에 마음에 드는 문장을 담아 저장할 수 있어요. 앱에 광고와 분석 추적 도구를 추가하지 않았으며 정보 처리 범위는 <a href="/privacy">개인정보 안내</a>에 설명했어요.</p></section>
    <section><h2>함께 살펴볼 수 있는 코드</h2><p>프로젝트의 코드를 <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>에서 공개해요. Lucian Labs의 코드는 MIT 라이선스이며 글꼴과 외부 라이브러리에는 각각의 라이선스가 적용돼요. 계산 근거·테스트·운영 한계도 저장소에 담았어요.</p><p>버그나 제안은 <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noreferrer">GitHub 이슈</a>로 남겨 주세요. 공개 글에는 출생정보나 비밀키를 넣지 말아 주세요.{X_URL && <> 프로젝트 이야기는 <a href={X_URL} target="_blank" rel="noreferrer">루샨의 X</a>에서도 만날 수 있어요.</>}</p><p className="info-date">Made with ♡ by Lucian · Lucian Labs</p></section>
  </InfoLayout>;
}
