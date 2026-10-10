import { CircleAlert, Check } from 'lucide-react';

/** An explicitly labelled excerpt of the checked synthetic October 2026 reading. */
export function LandingPreview() {
  return <div className="landing-preview" aria-label="사주풀이 결과 예시">
    <div className="sample-caption"><span>이렇게 알려드려요</span><strong>결과 예시</strong></div>
    <article className="sample-reading"><p className="sample-period">2026.10.08 15:29 ~ 2026.11.01 00:00 직전</p><p className="month-label"><CircleAlert size={17} aria-hidden="true" />이번 달 꼭 조심할 것</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sample-image" src="/illustrations/money.webp" width={1536} height={1024} alt="함께 쓸 돈을 나누어 담는 새싹 친구" fetchPriority="high" />
      <div className="sample-copy"><h2>모임 비용을 혼자<br />먼저 결제하지 마세요</h2><p><strong>내 사주의 정재는 지출 관리, 이 기간의 겁재는 공동 자원과 몫을 상징해요.</strong> 생활비와 공동 비용을 섞지 않도록 정산 기준을 먼저 정하라는 풀이예요.</p><div className="sample-caution"><Check size={17} aria-hidden="true" /><span>결제 전에 <strong>각자 낼 금액을 메시지로 남기세요.</strong></span></div></div>
    </article><p className="sample-disclaimer">이해를 돕기 위한 예시예요. 내 풀이는 사주에 따라 달라져요.</p>
  </div>;
}
