import {describe,expect,it} from 'vitest';
import {calculateSaju} from '../lib/saju';
import {monthlyEvidence,selectedEvidence} from '../lib/reading-evidence';
const chart=calculateSaju({year:1991,month:6,day:18,calendar:'solar',leapMonth:false,gender:'unspecified',timeKnown:false,country:'KR'},2026,10);
describe('specific calculated reading evidence',()=>{
  it('shows actual positive counts and the ten-god counting convention',()=>{
    const facts=monthlyEvidence(chart.profile);
    for(const [god,count] of Object.entries(chart.tenGodCounts)){
      const item=facts.find(f=>f.id===`ten-god:${god}`);
      if(count)expect(item?.fact).toContain(`${god} ${count}개`);
      else expect(item).toBeUndefined();
    }
    expect(JSON.stringify(facts)).not.toMatch(/1991|1991-06-18|생년월일/);
  });
  it('binds each monthly relation to its exact calculated interval',()=>{
    const facts=monthlyEvidence(chart.profile).filter(f=>f.kind==='month');
    expect(facts).toHaveLength(chart.profile.currentMonth!.periods.length);
    facts.forEach((fact,index)=>{
      const period=chart.profile.currentMonth!.periods[index];
      expect(fact.gods).toEqual([...new Set([period.tenGod,period.branchTenGod])]);
      expect(fact.period).toContain('2026.10.');
      expect(fact.period).toContain('직전');
    });
  });
  it('renders only the facts actually cited by this point, with no invented fallback',()=>{
    const facts=monthlyEvidence(chart.profile);const chosen=[facts[1].id,facts.at(-1)!.id];
    expect(selectedEvidence(chart.profile,[...chosen,'made-up','made-up']).map(f=>f.id)).toEqual(chosen);
    expect(selectedEvidence(chart.profile,['made-up'])).toEqual([]);
  });
});
