import { describe, expect, it } from 'vitest';
import { monthWindow, annualWindow, selectOpportunityArt, cleanDisplayText } from '../lib/reading-presentation';

describe('unambiguous reading periods and presentation',()=>{
  it('shows the complete Korean civil month including leap days',()=>{
    expect(monthWindow({year:2028,month:2})).toEqual({start:'2028-02-01',end:'2028-02-29',label:'2028.02.01 ~ 2028.02.29'});
    expect(monthWindow({year:2026,month:12}).end).toBe('2026-12-31');
  });
  it('uses actual spring terms for the annual interpretation, not January first',()=>{
    const period=annualWindow(2026);
    expect(period.start).toContain('2026.02.04');
    expect(period.end).toContain('2027.02.04');
    expect(period.label).toContain('직전');
  });
  it.each([['동료에게 프로젝트 제안을 해보세요','career'],['지출과 저축 계획을 함께 정해보세요','money'],['친구의 소개로 새로운 사람을 만날 수 있어요','connection'],['연인과 데이트 약속을 잡아보세요','love'],['배우고 싶던 수업을 시작할 기회예요','learning'],['낯선 곳에서 새 출발을 해보세요','new-start']])('matches the illustration to the actual headline: %s',(title,key)=>{
    expect(selectOpportunityArt(title).key).toBe(key);
  });
  it('removes middle dots from generated and user supplied display copy',()=>{
    expect(cleanDisplayText('일·돈ㆍ관계・사랑')).toBe('일, 돈, 관계, 사랑');
  });
});
