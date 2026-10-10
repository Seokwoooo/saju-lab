/** Round up so a limit message never invites a retry before the window closes. */
export function retryDelayMessage(seconds:unknown):string {
  if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<=0)return '';
  const [size,unit]=seconds>=86_400?[86_400,'일']:seconds>=3600?[3600,'시간']:[60,'분'];
  return ` 약 ${Math.ceil(seconds/Number(size))}${unit} 후 다시 시도해 주세요.`;
}
