'use client';

import { ArrowDown, ArrowRight, CalendarDays, Check, ExternalLink, Heart, LockKeyhole, Sparkles } from 'lucide-react';
import { GITHUB_URL, X_URL } from '@/lib/site-config';
import { LandingPreview } from './landing-preview';

function ReadingBook() {
  return <div className="home-book-scene" role="img" aria-label="나의 성향, 사랑과 관계, 일과 돈, 운의 흐름을 담은 사주 풀이서 일러스트">
    <div className="home-book-orbit" /><span className="home-book-spark one">✧</span><span className="home-book-spark two">✧</span>
    <div className="home-book">
      <div className="home-book-top"><span>SAJU LAB</span><span className="home-book-seal">사주<br />풀이</span></div>
      <p className="home-book-subtitle">태어난 날에 담긴 나의 이야기</p>
      <p className="home-book-title">나의 사주 풀이서</p>
      <svg className="home-element-flower" viewBox="0 0 340 320" aria-hidden="true">
        <circle cx="170" cy="165" r="123" fill="none" stroke="#c7bda4" strokeWidth=".8" />
        <circle cx="170" cy="165" r="111" fill="none" stroke="#dcd3bd" strokeWidth=".8" strokeDasharray="2 6" />
        <g stroke="#faf6ea" strokeWidth="2">
          <ellipse cx="170" cy="113" rx="58" ry="78" fill="#d4dfc6" />
          <ellipse cx="170" cy="113" rx="58" ry="78" fill="#efd0be" transform="rotate(72 170 165)" />
          <ellipse cx="170" cy="113" rx="58" ry="78" fill="#e9dcb1" transform="rotate(144 170 165)" />
          <ellipse cx="170" cy="113" rx="58" ry="78" fill="#dcd5e7" transform="rotate(216 170 165)" />
          <ellipse cx="170" cy="113" rx="58" ry="78" fill="#cedfe5" transform="rotate(288 170 165)" />
        </g>
        <circle cx="170" cy="165" r="44" fill="#fffaf0" stroke="#b8b59f" strokeWidth="1" />
        <g fill="#354538" textAnchor="middle" fontFamily="Saju Serif, serif" fontSize="19">
          <text x="170" y="90">나무</text><text x="252" y="146">불</text><text x="220" y="238">흙</text><text x="121" y="238">쇠</text><text x="87" y="146">물</text><text x="170" y="175" fontSize="30">나</text>
        </g>
        <path d="M170 17v9m-4-4h8M32 204v9m-4-4h8M310 220v9m-4-4h8" stroke="#8f967d" strokeWidth="1.3" />
      </svg>
      <div className="home-book-chapters"><span>나의 본모습</span><span>사랑과 관계</span><span>일과 돈</span><span>운의 흐름</span></div>
      <p className="home-book-footer">생년월일로 시작하는, 나를 이해하는 시간</p>
    </div>
  </div>;
}

const chapters = [
  { number: '01', label: '타고난 성향', title: '나는 왜 이런 선택을 할까요?', body: '나의 기질과 강점, 자주 반복하는 습관을 살펴봐요.', tags: '성격 / 강점 / 주의할 점', className: 'nature' },
  { number: '02', label: '연애와 인간관계', title: '나는 어떻게 사랑하는 사람일까요?', body: '마음을 표현하는 방식과 관계에서 놓치기 쉬운 부분을 읽어요.', tags: '연애 성향 / 애정 표현 / 인간관계', className: 'love' },
  { number: '03', label: '직업과 재물', title: '어떤 일을 할 때 내 장점이 살아날까요?', body: '일하는 방식과 맞는 환경, 돈을 대하는 습관을 함께 풀어요.', tags: '일의 방식 / 업무 환경 / 재물 성향', className: 'work' },
  { number: '04', label: '올해와 앞으로의 흐름', title: '지금 무엇을 준비하고 조심하면 좋을까요?', body: '올해와 이번 달의 흐름, 계산 가능한 경우 긴 운세 주기를 살펴봐요.', tags: '올해 운세 / 이번 달 조언 / 10년 주기', className: 'flow' },
];

export function SajuHome({ onStart }: { onStart: () => void }) {
  return <div className="saju-home">
    <section className="home-intro" aria-labelledby="home-title">
      <div className="home-intro-copy">
        <p className="home-kicker"><span />나를 알아가는 무료 사주풀이</p>
        <h1 id="home-title" tabIndex={-1}>내 사주,<br /><em>처음부터 깊이 있게.</em></h1>
        <p className="home-intro-description">타고난 성향과 사랑하는 방식,<br />나에게 맞는 일과 돈의 흐름까지.</p>
        <p className="home-intro-explanation">생년월일로 계산한 사주를<br className="home-small-break" /> 누구나 이해할 수 있는 말로 풀어드려요.</p>
        <div className="home-start-block"><button className="button primary home-start" onClick={onStart}>내 사주 무료로 풀어보기<ArrowRight size={20} aria-hidden="true" /></button><p><Check size={14} aria-hidden="true" />100% 무료<span />회원가입 없음</p></div>
        <a className="home-preview-link" href="#reading-preview">어떤 풀이를 받는지 먼저 볼까요?<ArrowDown size={15} aria-hidden="true" /></a>
      </div>
      <ReadingBook />
    </section>

    <div className="home-assurance" aria-label="사주랩 이용 안내">
      <div><CalendarDays size={21} aria-hidden="true" /><p><strong>태어난 날을 정확하게</strong><span>양력과 음력, 윤달과 절기 반영</span></p></div>
      <div><Sparkles size={21} aria-hidden="true" /><p><strong>태어난 시간을 몰라도</strong><span>확인할 수 있는 범위부터 풀이</span></p></div>
      <div><LockKeyhole size={21} aria-hidden="true" /><p><strong>내 정보는 소중하니까</strong><span>이름과 생년월일을 저장하지 않아요</span></p></div>
    </div>

    <section className="home-chapters" aria-labelledby="home-chapters-title">
      <div className="home-section-heading"><p className="home-kicker">사주 한 편에 담긴 이야기</p><h2 id="home-chapters-title">오늘의 운세 너머,<br />나를 이해하는 네 가지 장면.</h2><p>궁금했던 나의 모습을 하나씩 짚어보세요.</p></div>
      <div className="home-chapter-list">{chapters.map(chapter => <article className={`home-chapter ${chapter.className}`} key={chapter.number}>
        <div className="home-chapter-number">{chapter.number}<span aria-hidden="true" /></div><div className="home-chapter-copy"><p>{chapter.label}</p><h3>{chapter.title}</h3><p>{chapter.body}</p><span>{chapter.tags}</span></div>
      </article>)}</div>
    </section>

    <section className="home-example" id="reading-preview" aria-labelledby="home-example-title">
      <div className="home-example-intro"><p className="home-kicker">실제로 받게 될 풀이의 모습</p><h2 id="home-example-title">무엇을 조심할지.<br />왜 그런 풀이가 나왔는지.</h2><p>내 사주의 어떤 부분을 읽었는지,<br />언제부터 언제까지의 조언인지 함께 보여드려요.</p><ul><li><Check size={17} aria-hidden="true" /><span><strong>결론부터 또렷하게</strong>지금 할 일과 조심할 일을 먼저 알려드려요.</span></li><li><Check size={17} aria-hidden="true" /><span><strong>내 사주에서 찾은 이유</strong>계산한 구성과 전통적 의미를 연결해요.</span></li><li><Check size={17} aria-hidden="true" /><span><strong>해당하는 기간까지</strong>월별 조언의 시작과 끝을 구체적으로 표시해요.</span></li></ul><button className="home-text-start" onClick={onStart}>내 사주 이야기 만나기<ArrowRight size={17} aria-hidden="true" /></button></div>
      <LandingPreview />
    </section>

    <section className="home-foundation" aria-labelledby="home-foundation-title">
      <div className="home-section-heading"><p className="home-kicker">풀이의 시작은 실제 사주 계산</p><h2 id="home-foundation-title">태어난 날의 정보를,<br />나의 삶에 닿는 이야기로.</h2></div>
      <div className="home-foundation-grid"><article><span>01</span><h3>날짜와 절기부터 확인해요</h3><p>한국 출생을 기준으로 양력과 음력, 윤달을 변환하고 절기가 바뀌는 시각을 반영해 사주를 계산해요.</p></article><article><span>02</span><h3>계산한 사주를 바탕으로 풀어요</h3><p>타고난 구성과 시기별 관계를 읽고, 성격과 일상에서 이해할 수 있는 표현으로 설명해요.</p></article><article><span>03</span><h3>알 수 없는 부분은 구분해요</h3><p>출생 시간이 없으면 임의로 채우지 않아요. 확인할 수 없는 세부 시기는 단정하지 않고 안내해요.</p></article></div>
      <a className="home-method-link" href="/faq">계산 기준과 자주 묻는 질문<ArrowRight size={16} aria-hidden="true" /></a>
    </section>

    <section className="home-invitation" aria-labelledby="home-invitation-title"><Heart size={23} strokeWidth={1.3} aria-hidden="true" /><p className="home-kicker">궁금했던 나를 만나는 시간</p><h2 id="home-invitation-title">이제, 내 사주를 펼쳐볼까요?</h2><p>생년월일만 준비하세요.<br />이름과 태어난 시간은 선택이에요.</p><button className="button primary home-start" onClick={onStart}>내 사주 무료로 풀어보기<ArrowRight size={20} aria-hidden="true" /></button><div className="home-maker"><p>X 루샨이 만든 무료 오픈소스 프로젝트</p><div><a href={GITHUB_URL} target="_blank" rel="noreferrer">오픈소스 보기<ExternalLink size={13} /></a>{X_URL && <a href={X_URL} target="_blank" rel="noreferrer">만든 사람<ExternalLink size={13} /></a>}</div></div><p className="home-limit">사주풀이는 전통 문화에 바탕을 둔 해석과 자기성찰을 위한 콘텐츠예요.<br />미래의 사건을 보장하지 않아요.</p></section>
  </div>;
}
