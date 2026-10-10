import { CircleAlert, Sparkles } from 'lucide-react';

/** An explicitly labelled excerpt of the checked synthetic October 2026 reading. */
export function LandingPreview() {
  return <div className="landing-preview" aria-label="사주풀이 결과 예시">
    <div className="sample-caption"><span>이렇게 알려드려요</span><strong>결과 예시</strong></div>
    <article className="sample-reading"><p className="sample-period">2026.10.01 ~ 2026.10.31</p><p className="month-label"><Sparkles size={17} aria-hidden="true" />이런 기회가 올 수 있어요</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sample-image" src="/illustrations/connection.webp" width={1536} height={1024} alt="차를 마시며 모임 이야기를 나누는 두 친구" fetchPriority="high" />
      <div className="sample-copy"><h2>친구와 모임 준비를<br />나눠 맡을 수 있어요</h2><p><strong>순서와 비용을 잘 챙기는 성향</strong>이라, 여럿이 함께 준비할 때 빠진 일을 찾는 데 도움이 돼요.</p><div className="sample-caution"><CircleAlert size={17} aria-hidden="true" /><span>함께 내는 돈은 <strong>결제 전에 나눠 정하세요.</strong></span></div></div>
    </article><p className="sample-disclaimer">이해를 돕기 위한 예시예요. 내 풀이는 사주에 따라 달라져요.</p>
  </div>;
}
