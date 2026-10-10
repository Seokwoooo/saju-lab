'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="document-page"><p className="eyebrow">SAJU LAB</p><h1>잠깐 길을 잃었어요.</h1><p>화면을 다시 열어 볼게요. 입력한 정보는 서버에 저장되지 않아 다시 입력해야 할 수 있어요.</p><button className="button primary" onClick={reset}>다시 시도하기</button></main>;
}
