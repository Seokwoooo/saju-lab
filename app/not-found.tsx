import Link from 'next/link';
export default function NotFound() {
  return <main className="document-page"><p className="eyebrow">SAJU LAB · 404</p><h1>여기는 아직 꽃이 피지 않았어요.</h1><p>주소를 다시 확인하거나 사주랩의 작은 정원으로 돌아가 주세요.</p><Link className="button primary" href="/">처음으로 돌아가기</Link></main>;
}
