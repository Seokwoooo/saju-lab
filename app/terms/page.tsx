import type {Metadata} from 'next';
import InfoLayout from '@/components/InfoLayout';
import {GITHUB_URL, SITE_URL} from '@/lib/site-config';

const description = '사주랩의 무료 이용 범위, 해석의 한계, 이미지 공유와 오픈소스 라이선스 안내.';
export const metadata:Metadata = {
  title:'이용 안내', description, alternates:{canonical:'/terms'},
  openGraph:{title:'이용 안내 | 사주랩',description,url:`${SITE_URL}/terms`,type:'website',locale:'ko_KR',siteName:'사주랩 · Saju Lab',images:[{url:'/og.png',width:1200,height:630,alt:'사주랩의 다섯 오행 친구'}]},
  twitter:{card:'summary_large_image',title:'이용 안내 | 사주랩',description,images:['/og.png']},
};
export default function TermsPage() {
  return <InfoLayout title="가볍게 만나고, 스스로 선택해요." intro="사주랩을 이용하고 결과를 공유할 때 알아 두면 좋은 범위와 약속을 정리했어요." eyebrow="A FEW THOUGHTFUL NOTES">
    <section><h2>재미와 자기성찰을 위한 서비스</h2><p>사주랩은 전통 사주의 계산과 상징을 쉽게 읽을 수 있도록 만든 무료 도구예요. 미래나 성격을 과학적으로 확정하는 서비스가 아니며 의료·법률·투자 등 전문적인 판단을 대신하지 않아요. 중요한 선택은 자신의 상황과 확인할 수 있는 정보, 필요한 전문가의 조언을 바탕으로 해 주세요.</p></section>
    <section><h2>계산 범위와 기록의 정확성</h2><p>대한민국 출생 기록, 1909~2049년 입력과 변환 후 양력 날짜를 한국의 오늘 날짜까지 지원해요. 음력도 변환한 양력 날짜가 미래이면 계산하지 않아요. 과거 표준시·서머타임을 반영하고 UTC+9 환산 시각의 자정을 일 경계로 사용해요. 다른 시간 보정 관례·학파와 결과가 다를 수 있어요.</p><p>존재하지 않는 날짜·윤달·시각은 계산하지 않아요. 시간 미상과 절기 경계의 불확정 부분을 표시하며 일주까지 확정되지 않으면 정확한 시간 확인을 안내해요. 입력 기록 자체의 정확성까지 서비스가 검증하지는 않아요.</p></section>
    <section><h2>무료 기능과 AI 이용 한도</h2><p>기본 사주·궁합·카드 저장에 회원가입이나 결제가 필요하지 않아요. AI는 별도로 동의해 요청하는 선택 기능이고 운영 설정·비용·요청량·제공자 상태에 따라 제한될 수 있어요. 실패하거나 취소해도 기본 풀이를 계속 볼 수 있어요.</p><p>AI 문장은 검사를 거치지만 모든 자유 문장의 의미가 정확하다고 보장하지 않아요. 계산값과 근거도 함께 읽어 주세요. 과도한 자동 요청, 제한 우회, 다른 이용자의 접근을 방해하는 사용은 제한될 수 있어요.</p></section>
    <section><h2>다른 사람의 정보와 이미지 공유</h2><p>다른 사람의 출생정보를 사용하거나 결과를 공개하려면 당사자의 의사를 먼저 확인해 주세요. 저장 전 카드 미리보기를 확인하고 닉네임 표시와 공개 범위를 스스로 선택해 주세요. 기기에 저장한 파일이나 외부 서비스에 게시한 이미지는 앱에서 회수하거나 삭제할 수 없어요.</p></section>
    <section><h2>코드와 제3자 자료의 라이선스</h2><p>Lucian Labs가 작성한 프로젝트 코드는 MIT 라이선스예요. 재사용 시 저작권·라이선스 고지를 포함해 주세요. 고운바탕·Pretendard와 외부 라이브러리는 각자의 라이선스가 적용되며 프로젝트의 MIT 라이선스로 바뀌지 않아요.</p><p>조건은 저장소의 <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer">LICENSE</a>와 <a href={`${GITHUB_URL}/blob/main/THIRD_PARTY_NOTICES.md`} target="_blank" rel="noreferrer">제3자 고지</a>에서 확인할 수 있어요.</p></section>
    <section><h2>변경과 문의</h2><p>기능·운영 한도는 비용·장애·검증 결과에 따라 바뀔 수 있어요. 정보 처리는 <a href="/privacy">개인정보 안내</a>에 설명하며 문의는 <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noreferrer">GitHub 이슈</a>로 받습니다. 공개 이슈에는 출생정보나 비밀키를 적지 말아 주세요.</p><p className="info-date">안내 기준일: 2026년 10월 10일 · 운영: Lucian Labs</p></section>
  </InfoLayout>;
}
