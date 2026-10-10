export async function shareCardFile(blob:Blob,filename:string,target:Pick<Navigator,'share'|'canShare'>=navigator):Promise<'shared'|'cancelled'|'unsupported'> {
  const files=[new File([blob],filename,{type:'image/png'})];
  if(!target.share || !target.canShare?.({files}))return 'unsupported';
  try {await target.share({files,title:'나의 사주풀이 | 사주랩'});return 'shared';}
  catch(error){if(error instanceof Error && error.name==='AbortError')return 'cancelled';throw error;}
}

export function downloadCard(url:string,filename:string) {
  const link=document.createElement('a');link.href=url;link.download=filename;
  document.body.appendChild(link);link.click();link.remove();
}
