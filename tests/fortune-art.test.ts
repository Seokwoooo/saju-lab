import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {FORTUNE_ART,fortuneArt,selectFortuneArt,type FortuneKind} from '../lib/fortune-art';

describe('semantic original fortune artwork',()=>{
 it('ships twenty distinct self-contained high-resolution SVG assets',()=>{
  const keys=Object.keys(FORTUNE_ART) as (keyof typeof FORTUNE_ART)[];
  expect(keys).toHaveLength(20);
  const assets=keys.map(key=>readFileSync(new URL(`../public${fortuneArt(key).src}`,import.meta.url),'utf8'));
  expect(new Set(assets).size).toBe(20);
  for(const asset of assets){expect(asset).toContain('viewBox="0 0 600 400"');expect(asset).not.toMatch(/<script|<foreignObject|<image|href=|onload=/);}
 });
 it.each([
  ['추가 수입을 위한 제안을 해보세요','opportunity','golden-coins'],
  ['친구 돈까지 대신 내지 마세요','caution','leaking-wallet'],
  ['연인과 말다툼할 때 지난 일을 꺼내지 마세요','caution','split-heart'],
  ['연인과 데이트 약속을 잡아보세요','opportunity','heart-bloom'],
  ['친구에게 먼저 대화를 걸어보세요','action','speech-bubble'],
  ['강의 여러 개부터 결제하지 마세요','caution','stacked-books'],
  ['계약서에 서명하기 전에 조건부터 보세요','caution','torn-contract'],
  ['마감이 겹치는 부탁을 수락하지 마세요','caution','overloaded-briefcase'],
  ['하던 방식이 맞는지 돌아보세요','caution','shield-boundary'],
 ] as const)('matches %s without inventing an unrelated ominous theme',(title,kind,key)=>expect(selectFortuneArt(title,kind as FortuneKind).key).toBe(key));
});
