'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, Check, Share2, Sparkles } from 'lucide-react';
import type { Compatibility, Reading, SajuChart } from '@/lib/contracts';
import { CARD_TYPES, createCardContent, getCardDimensions, renderShareCard } from '@/lib/share-card';
import type { CardFormat, CardTheme, CardType } from '@/lib/share-card';

export function ShareStudio({ chart, reading, nickname, compatibility, compatibilityUncertain = false }: { chart: SajuChart; reading: Reading; nickname?: string; compatibility?: Compatibility; compatibilityUncertain?: boolean }) {
  const [type, setType] = useState<CardType>(compatibility ? 'compatibility' : 'headline');
  const [format, setFormat] = useState<CardFormat>('portrait');
  const [theme, setTheme] = useState<CardTheme>('cream');
  const [showNickname, setShowNickname] = useState(false);
  const [rendered, setRendered] = useState<{ blob: Blob; url: string; key: string } | null>(null);
  const [error, setError] = useState<{ message: string; key: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const [shareStatus, setShareStatus] = useState('');
  const urlRef = useRef<string | null>(null);
  const content = useMemo(() => createCardContent({ type, chart, reading, nickname, showNickname: showNickname && type !== 'compatibility', compatibility, compatibilityUncertain }), [type, chart, reading, nickname, showNickname, compatibility, compatibilityUncertain]);
  const key = JSON.stringify({ content, format, theme, retry });
  const ready = rendered?.key === key;
  const currentError = error?.key === key ? error.message : null;
  useEffect(() => {
    let active = true;
    renderShareCard(content, format, theme).then(blob => {
      if (!active) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob); urlRef.current = url;
      setRendered({ blob, url, key });
    }).catch(reason => { if (active) setError({ message: reason instanceof Error ? reason.message : '이미지를 만들지 못했어요.', key }); });
    return () => { active = false; };
  }, [content, format, theme, key]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  function download() {
    if (!ready || !rendered) return;
    const link = document.createElement('a'); link.href = rendered.url; link.download = `saju-lab-${type}-${format}.png`; document.body.appendChild(link); link.click(); link.remove(); setShareStatus('PNG 저장을 시작했어요.');
  }
  async function share() {
    if (!ready || !rendered) return;
    const file = new File([rendered.blob], `saju-lab-${type}-${format}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: '사주랩 · 나를 만나는 작은 연구소' }); setShareStatus('공유 창을 이용했어요.'); }
      catch (reason) { if (!(reason instanceof Error && reason.name === 'AbortError')) setShareStatus('공유 창을 열지 못했어요. PNG 저장을 이용해 주세요.'); }
    } else { download(); setShareStatus('이 브라우저에서는 PNG로 저장한 뒤 공유할 수 있어요.'); }
  }
  const dimensions = getCardDimensions(format);
  return <section id="share" className="share-studio section-space" aria-labelledby="share-title">
    <div className="section-heading"><p className="eyebrow"><Sparkles size={15} /> A LITTLE KEEPSAKE</p><h2 id="share-title">나를 닮은 한 장,<br className="mobile-only" /> 간직하고 나누세요.</h2><p>오늘 만난 나를 작은 카드로. 인스타그램 피드와 스토리에 꼭 맞게.</p></div>
    <div className="studio-layout">
      <div className="studio-controls paper">
        <fieldset className="card-type-field"><legend>어떤 이야기를 담을까요?</legend><div className="card-types">{CARD_TYPES.map(card => <label className={type === card.id ? 'selected' : ''} key={card.id}><input type="radio" name="card-type" value={card.id} checked={type === card.id} disabled={card.id === 'compatibility' && !compatibility} onChange={() => { setType(card.id); setShareStatus(''); }} /><span className="card-type-number">0{CARD_TYPES.indexOf(card) + 1}</span><span><strong>{card.short}</strong><small>{card.note}</small></span>{type === card.id && <Check size={16} aria-hidden="true" />}</label>)}</div>{!compatibility && <p className="field-hint">궁합 카드는 두 사람의 궁합을 계산하면 열려요.</p>}</fieldset>
        <fieldset className="choice-field"><legend>카드 비율</legend><div className="segmented"><label><input type="radio" name="card-format" checked={format === 'portrait'} onChange={() => setFormat('portrait')} /><span>피드 <small>4:5</small></span></label><label><input type="radio" name="card-format" checked={format === 'story'} onChange={() => setFormat('story')} /><span>스토리 <small>9:16</small></span></label></div></fieldset>
        <fieldset className="choice-field"><legend>종이 색</legend><div className="theme-choices">{([{ id: 'cream', label: '크림' }, { id: 'lavender', label: '라벤더' }, { id: 'peach', label: '피치' }] as const).map(item => <label key={item.id}><input type="radio" name="card-theme" checked={theme === item.id} onChange={() => setTheme(item.id)} /><span className={`theme-swatch ${item.id}`}>{theme === item.id && <Check size={16} />}</span><small>{item.label}</small></label>)}</div></fieldset>
        {nickname && type !== 'compatibility' && <label className="check-label nickname-choice"><input type="checkbox" checked={showNickname} onChange={event => setShowNickname(event.target.checked)} /><span>카드에 내 이름 넣기 <small>기본은 숨김</small></span></label>}
        <p className="card-privacy">출생일·시간·성별은 카드에 담지 않아요.<br />미리보기와 저장되는 PNG는 같은 이미지예요.</p>
        <div className="studio-actions"><button className="button primary" onClick={download} disabled={!ready}><ArrowDownToLine size={18} />PNG 저장</button><button className="button secondary" onClick={share} disabled={!ready}><Share2 size={18} />공유</button></div>
        <p className="live-note" role="status">{shareStatus}</p>
      </div>
      <div className="studio-preview-area"><span className="preview-tape" aria-hidden="true" /><div className={`card-preview ${format}`} aria-busy={!ready && !currentError}>
        {ready && rendered ? <>
          {/* Canvas blob preview is intentionally not optimized or re-encoded. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rendered.url} alt={`${CARD_TYPES.find(item => item.id === type)?.label} 공유 카드: ${content.headline}. ${content.body}`} width={dimensions.width} height={dimensions.height} />
        </> : <div className="preview-placeholder">{currentError ? <><p role="alert">{currentError}</p><button className="button secondary" onClick={() => setRetry(value => value + 1)}>다시 만들기</button></> : <><span className="loading-flower" aria-hidden="true">✿</span><p role="status">카드에 이야기를 담고 있어요.</p></>}</div>}
      </div><p className="preview-caption">{dimensions.width} × {dimensions.height} px · PNG · 원본 크기 저장</p><span className="studio-handnote">a little piece of me ↗</span></div>
    </div>
  </section>;
}
