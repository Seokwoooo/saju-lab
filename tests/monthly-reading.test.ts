import { describe, expect, it } from 'vitest';
import { SECTION_KEYS, type AIProfile } from '../lib/contracts';
import { calculateMonthlyContext } from '../lib/monthly';
import { makeProviderRequest } from '../lib/server/ai';
import { getConfig } from '../lib/server/config';
import { parseAnalyzeBody, validateReading } from '../lib/server/validation';

const profile:AIProfile={version:1,dayElement:'wood',polarity:'yang',elementCounts:{wood:2,fire:1,earth:1,metal:1,water:1},tenGodCounts:{비견:1,정인:1},season:'봄',timeKnown:false,boundaryUncertain:false,cycles:[],annual:[{year:2026,element:'fire'}],analysisYear:2026,currentMonth:calculateMonthlyContext('wood','yang',2026,10)};
const point={title:'함께 쓸 돈의 범위를 먼저 정하세요',body:`내 사주의 정인은 배움과 문서의 도움을 상징해요. 이 기간의 ${profile.currentMonth!.periods[0].tenGod}은 함께 살펴야 할 약속을 돌아보게 해요. 모임 비용을 먼저 합의하면 결제 후 의견 차이를 줄일 수 있어요.`,evidence:['month:2026-10:0','ten-god:정인']};
const reading={headline:'계획한 일을 먼저 시작하는 사람',intro:'새로운 일을 해보면서 방법을 찾는 편이에요.',monthly:{headline:'함께할 일의 약속을 확인하세요',opportunity:point,caution:point,action:point},sections:Object.fromEntries(SECTION_KEYS.map(key=>[key,{title:'할 일을 정하고 시작하세요',body:'한꺼번에 시작하는 일을 줄이면 마무리에 집중하기 쉬워요.',tip:'이미 시작한 일 하나를 끝내보세요.',evidence:[key==='year'?'annual:2026':'day-element']}]))};

describe('monthly evidence and derived input boundary',()=>{
  it.each(['무슨 일이든 조심하는 편이 좋아요.','내 사주의 편관은 강하니까 잘 준비하세요.','이번 달은 사주상 최악입니다.'])('rejects a generic or invented rationale: %s',body=>{
    expect(()=>validateReading({...reading,monthly:{...reading.monthly,caution:{...point,body}}},profile)).toThrow();
  });
  it('rejects a natal god falsely attributed to the selected month',()=>{
    const body='내 사주의 정인은 배움을 상징해요. 이 기간의 정인은 공부할 기회를 말해요. 새 강의를 들어보세요.';
    expect(profile.currentMonth!.periods[0].tenGod).not.toBe('정인');
    expect(profile.currentMonth!.periods[0].branchTenGod).not.toBe('정인');
    expect(()=>validateReading({...reading,monthly:{...reading.monthly,caution:{...point,body}}},profile)).toThrow();
  });
  it('allows a concrete explanation of verified elemental polarity in a monthly reason',()=>{
    const body=point.body.replace('배움과 문서의 도움을 상징해요.','나를 돕는 오행이며 음양이 다른 관계로, 배움과 문서를 상징해요.');
    expect(validateReading({...reading,monthly:{...reading.monthly,caution:{...point,body}}},profile).monthly?.caution.body).toBe(body);
  });
  it('rejects the vague headline reported by the user',()=>{
    expect(()=>validateReading({...reading,monthly:{...reading.monthly,headline:'약속은 확인하고 배울 일은 하나만 골라요'}},profile)).toThrow();
  });
  it.each(['AI가 분석한 결과예요.','인공지능이 알려드려요.','언어 모델이 해석해요.'])('rejects implementation labels in public generated reading: %s',body=>{
    expect(()=>validateReading({...reading,monthly:{...reading.monthly,opportunity:{...point,body}}},profile)).toThrow();
  });
  it('normalizes generated middle dots without modifying evidence references',()=>{
    const result=validateReading({...reading,monthly:{...reading.monthly,opportunity:{...point,title:'일·돈ㆍ관계・약속을 함께 정해보세요'}}},profile);
    expect(result.monthly?.opportunity.title).toBe('일, 돈, 관계, 약속을 함께 정해보세요');
    expect(result.monthly?.opportunity.evidence).toEqual(point.evidence);
  });
  it('accepts a calculated full month and grounded monthly points',()=>{
    expect(parseAnalyzeBody({profile}).profile.currentMonth).toEqual(profile.currentMonth);
    expect(validateReading(reading,profile)).toMatchObject({source:'ai',monthly:reading.monthly});
  });
  it('requires monthly output when the month was sent',()=>{
    const {headline,intro,sections}=reading;
    expect(()=>validateReading({headline,intro,sections},profile)).toThrow();
  });
  it.each([
    ['day-element','polarity'],
    ['month:2026-10:0','time-known'],
    ['month:2026-11:0','day-element'],
    ['month:2026-10:0','birthdate'],
  ])('rejects evidence that does not connect the actual month with a personal feature: %j',(...evidence)=>{
    expect(()=>validateReading({...reading,monthly:{...reading.monthly,caution:{...point,evidence}}},profile)).toThrow();
  });
  it('rejects a partial month, overlapping periods and a mismatched year',()=>{
    for(const mutate of [
      (p:AIProfile)=>{p.currentMonth!.periods[0].startsAt='2026-10-01T15:00:00.000Z';},
      (p:AIProfile)=>{p.currentMonth!.periods[1].startsAt=p.currentMonth!.periods[0].startsAt;},
      (p:AIProfile)=>{p.currentMonth!.year=2027;},
    ]) {const changed=structuredClone(profile);mutate(changed);expect(()=>parseAnalyzeBody({profile:changed})).toThrow();}
  });
  it('rejects personal identifiers added to the month',()=>{
    expect(()=>parseAnalyzeBody({profile:{...profile,currentMonth:{...profile.currentMonth,birthdate:'private-value'}}})).toThrow();
  });
  it('applies plain language and prediction guards to monthly reasons as well',()=>{
    for(const body of ['나무의 기운과 리듬이 강해요.','반드시 돈을 벌 수 있어요.','10월 15일에 새로운 사람을 만나요.','이번 달 십성에 따라 좋은 날이에요.']) {
      expect(()=>validateReading({...reading,monthly:{...reading.monthly,opportunity:{...point,body}}},profile)).toThrow();
    }
  });
  it('requires monthly structured output while retaining the daily cost bound',()=>{
    const config=getConfig({AI_ENABLED:'true',SITE_URL:'https://saju.test',OPENROUTER_API_KEY:'test-key',OPENROUTER_AZURE_MODEL:'openai/gpt-6.1-sol',AI_AZURE_BYOK_ONLY_CONFIRMED:'true',AI_IP_HMAC_KEY:'test-hmac-key-at-least-32-characters',DB:{} as D1Database});
    expect(makeProviderRequest(profile,config).response_format).toMatchObject({json_schema:{schema:{required:expect.arrayContaining(['monthly']),properties:{monthly:{required:['headline','opportunity','caution','action']}}}}});
  });
});
