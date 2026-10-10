'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ImageDown, Share2, X } from 'lucide-react';
import type { Reading, SajuChart } from '@/lib/contracts';
import { createCardContent, renderShareCard } from '@/lib/share-card';
import { downloadCard, shareCardFile } from '@/lib/native-share';

export function QuickShareActions({chart,reading}:{chart:SajuChart;reading:Reading}) {
  const content=useMemo(()=>createCardContent({type:reading.monthly?'monthly':'headline',chart,reading}),[chart,reading]);
  const [image,setImage]=useState<{blob:Blob;url:string;key:typeof content}|null>(null);
  const [error,setError]=useState('');const [status,setStatus]=useState('');const [retry,setRetry]=useState(0);
  const dialog=useRef<HTMLDialogElement>(null);
  const ready=image?.key===content;
  const filename=`saju-lab-${content.type}-portrait.png`;
  useEffect(()=>{
    let active=true;let url:string|undefined;
    renderShareCard(content,'portrait','cream').then(blob=>{if(active){url=URL.createObjectURL(blob);setImage({blob,url,key:content});}}).catch(()=>{if(active)setError('저장 이미지를 준비하지 못했어요. 다시 만들기를 눌러 주세요.');});
    return ()=>{active=false;if(url)URL.revokeObjectURL(url);};
  },[content,retry]);
  function save(){setStatus('');dialog.current?.showModal();}
  function download(){if(ready && image){downloadCard(image.url,filename);setStatus('PNG 다운로드를 시작했어요. 브라우저에서 지정한 저장 위치를 확인해 주세요.');}}
  async function share(){
    if(!ready || !image)return;
    try{
      const outcome=await shareCardFile(image.blob,filename);
      if(outcome==='unsupported'){dialog.current?.showModal();setStatus('이 브라우저에서는 이미지를 저장한 뒤 공유해 주세요.');}
      else if(outcome==='shared')setStatus('공유 창에서 선택한 앱을 확인해 주세요.');
    }catch{dialog.current?.showModal();setStatus('공유 창을 열지 못했어요. PNG 다운로드를 이용해 주세요.');}
  }
  function customize(){const target=document.getElementById('share-options');if(target instanceof HTMLDetailsElement){target.open=true;target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}
  return <>
    <div className="result-save-bar" aria-label="결과 저장과 공유"><button className="button secondary" onClick={save} disabled={!ready}><ImageDown size={20} />사진 저장</button><button className="button primary" onClick={()=>void share()} disabled={!ready}><Share2 size={19} />공유하기</button><button className="customize-card" onClick={customize}>카드 꾸미기</button>{!ready && <span className="save-preparing" role="status">{error?<>{error}<button onClick={()=>{setError('');setRetry(n=>n+1);}}>다시 만들기</button></>:'저장 이미지 준비 중'}</span>}</div>
    <dialog className="save-dialog" ref={dialog} aria-labelledby="save-dialog-title" onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close();}}>
      <div className="save-dialog-head"><div><p className="eyebrow">나의 사주 한 장</p><h2 id="save-dialog-title">사진으로 간직하세요</h2></div><button className="dialog-close" aria-label="저장 창 닫기" onClick={()=>dialog.current?.close()}><X size={22} /></button></div>
      {image && <div className="save-dialog-preview">{/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={`저장할 카드: ${content.headline}`} width={1080} height={1350} /></div>}
      <p className="photo-save-help"><strong>휴대폰에서는 공유 창의 ‘이미지 저장’을 선택해 주세요.</strong><br />이미지를 길게 눌러 사진 저장 메뉴를 이용할 수도 있어요. 저장 메뉴가 없다면 PNG를 내려받아 주세요.</p>
      <div className="save-dialog-buttons"><button className="button primary" onClick={()=>void share()}><Share2 size={18} />휴대폰 저장 / 공유 창</button><button className="button secondary" onClick={download}><ArrowDownToLine size={18} />PNG 다운로드</button></div><p className="photo-save-detail">1080 × 1350 px. 이름과 출생정보는 담지 않아요.<br />기기에 따라 사진 앱, 갤러리 또는 다운로드 폴더에 저장돼요.</p><p role="status" className="save-status">{status}</p>
    </dialog>
  </>;
}
