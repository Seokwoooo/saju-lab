import {describe,expect,it} from 'vitest';
import {estimatedProgress} from '../lib/analysis-progress';
describe('honest animated waiting estimate',()=>{
  it('starts at zero and moves continuously without stage jumps',()=>{
    expect(estimatedProgress(0,'preparing')).toBe(0);
    const values=[100,200,1000,5000,15000,30000].map(ms=>estimatedProgress(ms,'accepted'));
    expect(values.every((value,index)=>!index||value>values[index-1])).toBe(true);
    expect(estimatedProgress(1500,'loading')).toBe(estimatedProgress(1500,'accepted'));
  });
  it('never reports completion from elapsed time or a retry',()=>{
    expect(estimatedProgress(100000,'accepted')).toBeLessThan(95);
    expect(estimatedProgress(100000,'retrying')).toBeLessThan(95);
    expect(estimatedProgress(100000,'verified')).toBeLessThan(100);
    expect(estimatedProgress(1,'complete')).toBe(100);
  });
});
