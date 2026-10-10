import {describe,expect,it,vi} from 'vitest';
import {shareCardFile} from '../lib/native-share';

describe('native image sharing',()=>{
  const image=new Blob(['test-image'],{type:'image/png'});
  it('passes an actual PNG file without birth information or a private result URL',async()=>{
    const share=vi.fn<(data:ShareData)=>Promise<void>>(async()=>{});
    expect(await shareCardFile(image,'saju-lab-monthly.png',{share,canShare:()=>true})).toBe('shared');
    const data=share.mock.calls[0][0] as ShareData;
    expect(data.files?.[0].type).toBe('image/png');
    expect(await data.files?.[0].text()).toBe('test-image');
    expect(Object.keys(data)).toEqual(['files','title']);
  });
  it('allows an explicit download alternative when file sharing is unsupported',async()=>{
    const share=vi.fn<(data:ShareData)=>Promise<void>>(async()=>{});
    expect(await shareCardFile(image,'card.png',{share,canShare:()=>false})).toBe('unsupported');
    expect(share).not.toHaveBeenCalled();
  });
  it('does not report cancellation as a saved photo or trigger another share',async()=>{
    const share=vi.fn(async()=>{throw new DOMException('cancelled','AbortError');});
    expect(await shareCardFile(image,'card.png',{share,canShare:()=>true})).toBe('cancelled');
    expect(share).toHaveBeenCalledTimes(1);
  });
});
