import type {Metadata} from 'next';
import InfoLayout from '@/components/InfoLayout';
import {SITE_URL} from '@/lib/site-config';

const description = '무료 이용, 시간 미상, 음력, 실제 계산과 AI, 개인정보 및 인스타그램 공유에 관한 여덟 가지 답변.';
export const metadata:Metadata = {
  title:'자주 묻는 질문', description, alternates:{canonical:'/faq'},
  openGraph:{title:'자주 묻는 질문 | 사주랩',description,url:`${SITE_URL}/faq`,type:'website',locale:'ko_KR',siteName:'사주랩 · Saju Lab',images:[{url:'/og.png',width:1200,height:630,alt:'사주랩의 다섯 오행 친구'}]},
  twitter:{card:'summary_large_image',title:'자주 묻는 질문 | 사주랩',description,images:['/og.png']},
};
const QUESTIONS = [
  {title:'사주랩은 정말 무료인가요?', body:<>사주 계산, 기본 풀이, 두 사람의 궁합과 PNG 카드 저장을 무료로 사용할 수 있어요. AI 심화 풀이는 운영 설정과 한도 내에서 제공되는 선택 기능이에요. AI가 꺼져 있거나 한도를 넘으면 기본 풀이와 카드를 계속 이용할 수 있어요. 이용자에게 결제나 유료 회원 가입을 요청하지 않아요.</>},
  {title:'회원가입이 필요한가요?', body:<>아니요. 앱의 사주·궁합 기능에 회원가입이나 로그인이 필요하지 않아요. 이름은 선택 항목이에요. 입력한 이름은 풀이에서 부르는 용도로만 쓰며 사주 계산에는 영향을 주지 않아요.</>},
  {title:'태어난 시간을 몰라도 되나요?', body:<>출생 시간을 모르면 &lsquo;시간을 몰라요&rsquo;를 선택해 주세요. 임의로 시주를 채우지 않고 확정 가능한 기둥만 계산해요. 입춘·월 절입일에는 연주나 월주가 미확정일 수 있어요. 과거 한국 표준시·서머타임 보정으로 일주까지 달라지는 일부 역사 날짜는 정확한 시간 확인 안내가 나와요. 시간 미상에서는 대운을 계산하지 않아요.</>},
  {title:'음력 생일도 사용할 수 있나요?', body:<>네. 음력을 선택하고 윤달 여부를 확인해 주세요. KASI 기반 음양력 표로 양력 날짜를 변환하며 존재하지 않는 윤달과 날짜는 거부해요. 대한민국 출생 기록에 대해 입력 연도와 변환 후 양력 연도 모두 1909~2049년 범위에서 한국의 오늘 날짜까지 지원해요. 음력 생일도 변환된 양력 날짜가 미래이면 입력할 수 없어요. 해외 출생 시각이나 중국 음력을 한국 음력과 같은 것으로 취급하지 않아요.</>},
  {title:'사주 결과는 어떻게 계산하나요?', body:<>manseryeok 2.0.0으로 실제 연주·월주·일주·시주를 계산해요. 연주는 입춘 순간, 월주는 월 절입 순간에 바뀌어요. 당시 한국 시각을 역사 시간대에 따라 UTC+9로 환산하고 일주·시주는 00:00 자정을 일 경계로 삼아요. 진태양시·경도 보정은 적용하지 않아 다른 관례의 만세력과 다를 수 있어요. 오행 비율은 확정된 글자의 단순 개수이며 신강약이나 능력 점수가 아니에요. 자세한 값과 관례는 결과의 계산 근거에서 볼 수 있어요.</>},
  {title:'AI는 어떤 역할을 하나요?', body:<>사주를 계산하는 것은 엔진이고 기본 풀이도 브라우저에서 만들어요. AI는 동의해 요청했을 때 계산된 특성을 자연스러운 이야기로 풀어 주는 선택 기능이에요. 원래 계산값을 바꾸지는 않아요. 실제 사용 가능한 Azure 모델과 비용·데이터 경로는 운영자가 확인해 설정하며, 모델명만으로 연결 성공을 보장하지 않아요. 실패·취소·한도 초과 때 기본 결과가 유지되고 AI 풀이에는 AI 사용 여부가 표시돼요.</>},
  {title:'내 개인정보는 저장되나요?', body:<>앱은 출생 입력과 풀이를 서버 데이터베이스나 localStorage에 저장하지 않아요. AI를 직접 선택하면 최소한의 계산 특성이 외부 제공자에 전달돼요. AI 남용 방지를 위한 요청·비용 기록과 날짜별 IP HMAC에는 최대 48시간의 유효기간을 두고 만료 후 API 요청에서 정리해요. 플랫폼 접근 로그와 외부 제공자의 처리 정책은 별개예요. <a href="/privacy">개인정보 안내</a>에서 범위를 확인해 주세요.</>},
  {title:'사주 결과를 인스타그램에 공유할 수 있나요?', body:<>네. 한 문장·오행 밸런스·연애·올해·일과 재능·궁합의 여섯 카드 중 골라 PNG로 저장한 뒤 직접 올리면 돼요. 피드용 1080×1350과 스토리용 1080×1920을 지원해요. 미리보기에서 문구와 불확정 안내를 확인해 주세요. 이름은 기본 숨김이며 출생일·출생시간은 카드에 들어가지 않아요. 앱이 계정에 대신 게시하지는 않아요.</>},
];
export default function FAQPage() {
  return <InfoLayout title="궁금한 점을 모아 두었어요." intro="시작하기 전에, 그리고 결과를 읽으며 궁금할 수 있는 여덟 가지 질문이에요." eyebrow="EIGHT LITTLE ANSWERS">{QUESTIONS.map((question,index) => <details className="info-faq" key={question.title} open={index === 0}><summary><span><span className="info-faq-number">{String(index + 1).padStart(2,'0')}</span>{question.title}</span></summary><div className="info-faq-answer">{question.body}</div></details>)}</InfoLayout>;
}
