import type {Metadata} from 'next';
import InfoLayout from '@/components/InfoLayout';
import {GITHUB_URL, SITE_URL} from '@/lib/site-config';

const description = '출생정보의 브라우저 계산, 자동 AI 풀이에 전달하는 특성과 짧게 보관하는 남용 방지 기록을 안내합니다.';
export const metadata:Metadata = {
  title:'개인정보 안내', description, alternates:{canonical:'/privacy'},
  openGraph:{title:'개인정보 안내 | 사주랩',description,url:`${SITE_URL}/privacy`,type:'website',locale:'ko_KR',siteName:'사주랩 · Saju Lab',images:[{url:'/og.png',width:1200,height:630,alt:'사주랩의 다섯 오행 친구'}]},
  twitter:{card:'summary_large_image',title:'개인정보 안내 | 사주랩',description,images:['/og.png']},
};

export default function PrivacyPage() {
  return <InfoLayout title="내 정보는 어떻게 쓰이나요?" intro="출생정보는 브라우저에서 계산하고, 입력을 마치면 계산된 특성으로 AI 풀이를 시작해요. 어떤 정보가 어디로 전달되는지 안내할게요." eyebrow="A LITTLE CARE FOR YOUR PRIVACY">
    <section><h2>기본 사주와 궁합은 내 브라우저에서</h2><p>입력한 이름, 생년월일, 양력·음력 및 윤달 여부, 출생 시각과 성별 선택은 브라우저 안에서 계산에 사용해요. 기본 사주·로컬 풀이·두 사람의 궁합을 계산하기 위해 이 입력을 앱의 AI 서버로 보내지 않아요.</p><p>앱은 출생정보나 결과를 쿠키, localStorage, 서버 데이터베이스에 저장하지 않아요. 화면을 새로고침하면 처음부터 다시 입력하게 돼요. 자동 완성·다운로드 기록처럼 브라우저 자체가 관리하는 정보는 해당 브라우저 설정을 따라요.</p></section>
    <section><h2>입력을 마치면 AI 풀이를 시작해요</h2><p>마지막 입력 화면에 전달 정보 안내가 나와요. 출생 시간을 입력해 시작 버튼을 누르거나 &lsquo;시간을 몰라요&rsquo;를 선택하면, 계산된 특성을 서버를 거쳐 OpenRouter와 해당 모델 제공자에 전달해요. 별도의 AI 선택 단계는 없어요. 분석 중 취소하면 입력으로 돌아가며 이미 전달된 요청을 외부 제공자에서 회수한다고 보장하지는 않아요.</p><ul><li>일간의 오행·음양, 오행·십성 개수, 계절</li><li>출생 시간 확인 여부와 절기·시각 경계의 불확정 여부</li><li>계산된 대운의 나이 구간·오행, 분석 연도와 연도별 오행</li><li>현재 분석 월과 그 달의 절기 구간, 월별 오행·십성 특성</li></ul><p><strong>이름, 출생일, 출생 시각·분, 성별, 전체 사주 기둥은 AI 요청에 넣지 않아요.</strong> 분석 연월과 절기 시각은 현재 달의 정보이며 출생일이나 출생 시각이 아니에요. 정보를 줄여 보내는 조치이며 파생된 특성이 아무 정보도 담지 않는다는 보장은 아니에요. AI가 실패하거나 운영 한도에 도달하면 기본 풀이를 표시하며 AI 결과와 구분해요.</p></section>
    <section><h2>남용을 막기 위한 짧은 서버 기록</h2><p>AI 사용량·비용과 동시 요청을 제한하기 위해 D1에 무작위 요청 ID, 일자, 요청 증명 해시, 날짜마다 바뀌는 IP의 HMAC 식별값, 생성·만료·임대 시각, 예약 비용을 기록해요. 원본 IP, 출생정보, AI 입력 프로필, 풀이 결과는 이 기록에 넣지 않아요.</p><p>기록의 유효기간은 생성부터 최대 48시간이에요. 만료한 기록은 이후 API 요청 때 정리하므로 만료 시각에 즉시 물리적으로 삭제된다고 보장하지는 않아요. 앱은 요청 전에 비용을 예약해 하루 사용량을 제한해요. 외부 계정의 일일 한도는 실제 제공자 사용량을 기준으로 별도로 관리해요.</p><p>앱의 AI 진단 로그에는 요청 ID, 모델·제공자, BYOK 여부, generation ID와 비용을 남겨요. 출생정보·프롬프트·풀이 본문·원본 IP는 앱 진단 로그에 기록하지 않아요.</p></section>
    <section><h2>외부 제공자와 호스팅의 처리</h2><p>AI 요청은 설정된 Azure BYOK 경로를 우선 시도하고 실패 시 허용된 OpenRouter 크레딧 경로를 시도할 수 있어요. 서버는 실제 경로의 증거를 확인해요. 이 안내 자체가 현재 사이트의 Azure 연결이나 무보관 정책을 인증하는 것은 아니에요.</p><p>앱은 제공자 데이터 수집을 거부하는 라우팅 조건을 요청해요. OpenRouter 및 Azure·OpenAI의 보관·보안·법적 처리 범위는 각 제공자의 정책과 계정 설정을 따르며 모든 요청에 대해 무보관이나 완전한 익명성을 보장하지 않아요. <a href="https://openrouter.ai/docs/guides/routing/provider-selection" target="_blank" rel="noreferrer">OpenRouter 라우팅 안내</a>에서 관련 설정을 확인할 수 있어요.</p><p>페이지를 열거나 API를 호출할 때 호스팅·네트워크 사업자는 IP와 요청 시각 등의 접근 로그를 처리할 수 있어요. 이는 앱의 D1 기록과 별개이며 해당 플랫폼의 설정·정책을 따라요. 호스팅의 봇 방지 기능이 Cloudflare의 __cf_bm 같은 필수 보안 쿠키를 사용할 수 있어요. __cf_bm은 이용자의 활동이 30분간 없으면 만료되며, 앱이 출생정보를 저장하는 쿠키는 아니에요. 앱에 광고·분석 추적 도구가 없다는 설명이 플랫폼 전체의 로그가 없다는 뜻은 아니에요. <a href="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/" target="_blank" rel="noreferrer">Cloudflare 쿠키 안내</a>에서 호스팅의 처리를 확인할 수 있어요.</p></section>
    <section><h2>이미지를 저장하고 공유할 때</h2><p>공유 PNG는 브라우저에서 만들고 기기에 저장해요. 출생일·출생시간은 카드에 넣지 않으며 이름은 기본 숨김이에요. 이름 표시를 선택하면 이미지에 포함되므로 저장 전 미리보기를 확인해 주세요.</p><p>다른 서비스에 직접 올린 이미지에는 해당 서비스의 정책이 적용돼요. 해석과 오행 분포도 공유하는 정보이므로 공개 범위를 스스로 정해 주세요.</p></section>
    <section><h2>문의와 변경</h2><p>문의는 <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noreferrer">GitHub 이슈</a>로 남길 수 있어요. 공개 글에는 생년월일·출생 시각·IP·비밀키를 적지 말아 주세요. 처리 방식이 바뀌면 이 안내를 업데이트해요.</p><p className="info-date">안내 기준일: 2026년 10월 10일 · 운영: Lucian Labs</p></section>
  </InfoLayout>;
}
