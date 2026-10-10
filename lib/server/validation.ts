import { z } from 'zod';
import { ELEMENTS, SECTION_KEYS, type AIProfile, type Reading } from '../contracts';
import { ApiError } from './errors';
import { monthlyEvidence, selectedEvidence } from '../reading-evidence';

export const TEN_GODS = ['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'] as const;
const element = z.enum(ELEMENTS);
const count = z.number().int().min(0).max(8);
const year = z.number().int().min(1900).max(2200);
const age = z.number().finite().min(0).max(120);
const counts = z.object({wood:count,fire:count,earth:count,metal:count,water:count}).strict();
const tenGodShape = Object.fromEntries(TEN_GODS.map(key => [key,count.optional()]));
export const profileSchema = z.object({
  version:z.literal(1), dayElement:element, polarity:z.enum(['yin','yang']),
  elementCounts:counts, tenGodCounts:z.object(tenGodShape).strict(),
  season:z.enum(['봄','여름','가을','겨울','절기 경계 미확정']), timeKnown:z.boolean(), boundaryUncertain:z.boolean(),
  cycles:z.array(z.object({startAge:age,endAge:age,element}).strict()).max(10),
  annual:z.array(z.object({year,element}).strict()).min(1).max(12), analysisYear:year,
  currentMonth:z.object({year,month:z.number().int().min(1).max(12),periods:z.array(z.object({startsAt:z.string().datetime(),endsAt:z.string().datetime(),element,branchElement:element,tenGod:z.enum(TEN_GODS),branchTenGod:z.enum(TEN_GODS)}).strict()).min(1).max(3)}).strict().optional(),
}).strict().superRefine((profile,ctx) => {
  const total = Object.values(profile.elementCounts).reduce((a,b)=>a+b,0);
  if(total<2 || total>8 || total%2!==0 || (!profile.timeKnown && total>6)) ctx.addIssue({code:'custom',message:'Invalid element total'});
  if(Object.values(profile.tenGodCounts).reduce<number>((a,b)=>a+(b??0),0)>8) ctx.addIssue({code:'custom',message:'Invalid ten god total'});
  if(profile.cycles.some((cycle,index)=>cycle.endAge<cycle.startAge || cycle.endAge-cycle.startAge>10 || (index>0 && cycle.startAge<=profile.cycles[index-1].endAge))) ctx.addIssue({code:'custom',message:'Invalid cycles'});
  const years=profile.annual.map(item=>item.year);
  if(new Set(years).size!==years.length || years.some(value=>value<profile.analysisYear || value>profile.analysisYear+20)) ctx.addIssue({code:'custom',message:'Invalid annual years'});
  if(profile.currentMonth) {
    const {year:monthYear,month,periods}=profile.currentMonth;
    const start=Date.UTC(monthYear,month-1,1)-9*3_600_000,end=Date.UTC(monthYear,month,1)-9*3_600_000;
    if(monthYear!==profile.analysisYear || Date.parse(periods[0].startsAt)!==start || Date.parse(periods.at(-1)!.endsAt)!==end || periods.some((period,index)=>Date.parse(period.startsAt)>=Date.parse(period.endsAt)||(index>0 && period.startsAt!==periods[index-1].endsAt)))ctx.addIssue({code:'custom',message:'Invalid analysis month'});
  }
});
const proofSchema = z.object({token:z.string().min(20).max(500).regex(/^[A-Za-z0-9_.-]+$/),nonce:z.string().regex(/^\d{1,20}$/)}).strict();
const analyzeSchema=z.object({profile:profileSchema,proof:proofSchema.optional()}).strict();
export function parseAnalyzeBody(value:unknown): {profile:AIProfile;proof?:{token:string;nonce:string}} {
  const parsed=analyzeSchema.safeParse(value);
  if(!parsed.success) throw new ApiError(400,'INVALID_PROFILE','계산된 사주 정보만 보낼 수 있어요. 입력을 다시 확인해 주세요.');
  return parsed.data as {profile:AIProfile;proof?:{token:string;nonce:string}};
}
export async function readBoundedJson(request:Request|Response,maxBytes=12_288):Promise<unknown> {
  const length=request.headers.get('content-length');
  if(length && (!/^\d+$/.test(length) || Number(length)>maxBytes)) throw new ApiError(413,'BODY_TOO_LARGE','요청이 너무 커요.');
  const reader=request.body?.getReader();
  if(!reader) throw new ApiError(400,'INVALID_JSON','요청 정보를 읽을 수 없어요.');
  const parts:Uint8Array[]=[]; let size=0;
  try {
    while(true) {
      const {done,value}=await reader.read(); if(done) break;
      size+=value.byteLength;
      if(size>maxBytes) {await reader.cancel();throw new ApiError(413,'BODY_TOO_LARGE','요청이 너무 커요.');}
      parts.push(value);
    }
  } finally {reader.releaseLock();}
  const bytes=new Uint8Array(size); let offset=0;
  for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch{throw new ApiError(400,'INVALID_JSON','요청 정보가 올바르지 않아요.');}
}
export function evidenceIds(profile:AIProfile):string[] {
  return ['day-element','polarity','season','time-known','boundary-uncertain',...ELEMENTS.map(e=>`element:${e}`),...Object.keys(profile.tenGodCounts).map(g=>`ten-god:${g}`),...profile.annual.map(a=>`annual:${a.year}`),...profile.cycles.map((_,i)=>`cycle:${i}`),...monthlyEvidence(profile).filter(f=>f.kind==='month').map(f=>f.id)];
}
export const OUTPUT_TEXT_LIMITS={headline:70,intro:300,title:40,body:450,tip:120} as const;
export const KOREAN_OUTPUT_PATTERN='^[^<>\\u3400-\\u9fff]*[가-힣][^<>\\u3400-\\u9fff]*$';
export interface SafeValidationIssue {path:string;code:string;rule?:string}
const diagnosticFields=new Set(['headline','intro','sections','monthly','opportunity','caution','action',...SECTION_KEYS,'title','body','tip','evidence','id','model','provider','provider_name','is_byok','choices','finish_reason','message','content','refusal','usage','cost','cost_details','upstream_inference_cost','total_cost']);
const diagnosticRules=new Set(['NO_HANJA','NO_MARKUP_OR_LINKS']);
export function safeValidationIssues(issues:z.ZodIssue[]):SafeValidationIssue[] {
  return issues.slice(0,8).map(issue=>{
    const path=issue.path.slice(0,5).map(part=>typeof part==='number'?'[]':diagnosticFields.has(part)?part:'?').join('.')||'$';
    const rule=issue.code==='custom' && typeof issue.params?.rule==='string' && diagnosticRules.has(issue.params.rule)?issue.params.rule:undefined;
    return {path,code:issue.code,...(rule?{rule}:{})};
  });
}
export class InvalidAIOutputError extends ApiError {
  readonly validationIssues:SafeValidationIssue[];
  constructor(issues:z.ZodIssue[]) {
    super(502,'INVALID_AI_OUTPUT','상세 풀이의 형식을 확인할 수 없어요. 기본 풀이는 그대로 볼 수 있어요.');
    this.validationIssues=safeValidationIssues(issues);
  }
}
type ClaimRule='PILLAR_OR_BIRTH_INFORMATION'|'EXACT_DATE_OR_TIME'|'GUARANTEED_FINANCIAL_OUTCOME'|'MEDICAL_CLAIM'|'FATALISTIC_CLAIM'|'PROHIBITED_TERMINOLOGY'|'UNSUPPORTED_YEAR'|'ELEMENT_COUNT_MISMATCH'|'DAY_ELEMENT_MISMATCH'|'ANNUAL_ELEMENT_MISMATCH'|'TEN_GOD_COUNT_MISMATCH'|'OPAQUE_LANGUAGE'|'UNSUPPORTED_AGE_PERIOD'|'UNSUPPORTED_MONTHLY_REASON'|'VAGUE_HEADLINE';
export class UnsupportedAIClaimError extends ApiError {
  readonly validationIssues:SafeValidationIssue[];
  constructor(path:string,rule:ClaimRule,message='상세 풀이에 확인되지 않은 내용이 있어요. 기본 풀이는 그대로 볼 수 있어요.') {
    super(502,'UNSUPPORTED_AI_CLAIM',message);
    this.validationIssues=[{path,code:'custom',rule}];
  }
}
const koreanText=(max:number)=>z.string().trim().min(2).max(max).regex(/[가-힣]/)
  .refine(value=>!/[\u3400-\u9fff]/.test(value),{message:'No Hanja',params:{rule:'NO_HANJA'}})
  .refine(value=>!/\bAI\b|인공지능|언어\s*모델|OpenRouter/i.test(value),{message:'No implementation copy',params:{rule:'NO_IMPLEMENTATION_COPY'}})
  .refine(value=>!/[<>]|```|https?:\/\/|\b(?:javascript|data):/i.test(value),{message:'Plain text only',params:{rule:'NO_MARKUP_OR_LINKS'}})
  .transform(value=>value.replace(/\s*[·ㆍ・]\s*/g,', '));
const sectionSchema=z.object({title:koreanText(OUTPUT_TEXT_LIMITS.title),body:koreanText(OUTPUT_TEXT_LIMITS.body),tip:koreanText(OUTPUT_TEXT_LIMITS.tip),evidence:z.array(z.string().min(1).max(40)).min(1).max(5)}).strict();
const readingSchema=z.object({headline:koreanText(OUTPUT_TEXT_LIMITS.headline),intro:koreanText(OUTPUT_TEXT_LIMITS.intro),sections:z.object(Object.fromEntries(SECTION_KEYS.map(key=>[key,sectionSchema]))).strict()}).strict();
const monthlyPointSchema=z.object({title:koreanText(60),body:koreanText(250),evidence:z.array(z.string().min(1).max(40)).min(2).max(5)}).strict();
const monthlySchema=z.object({headline:koreanText(60),opportunity:monthlyPointSchema,caution:monthlyPointSchema,action:monthlyPointSchema}).strict();
const koStems=['갑','을','병','정','무','기','경','신','임','계'];
const koBranches=['자','축','인','묘','진','사','오','미','신','유','술','해'];
const validGanji=Array.from({length:60},(_,i)=>koStems[i%10]+koBranches[i%12]).join('|');
const pillarPattern=new RegExp(`(?:[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])|(?:(?:${validGanji})\\s*(?:의\\s*)?(?:년|월|일|시|주|기운|타입|사주))|(?:(?:년주|월주|일주|시주)(?:은|는|이|가)?\\s*(?:${validGanji}|나무|불|흙|쇠|물|목|화|토|금|수))|(?:태어난\\s*날|생년월일)`);
const unsafePattern=/(?:반드시|무조건|틀림없이|확실히)\s*(?:성공|합격|결혼|이혼|돈|수익|손해|죽|병)|(?:암|우울증|질환)\s*(?:진단|발병)|(?:수익|수익률|주가)\s*(?:보장|확정)|(?:사망|죽음|죽을|수명|저주|불치병)|\d{1,2}\s*월\s*\d{1,2}\s*일|\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?/;
export function validateReading(value:unknown,profile:AIProfile):Reading {
  const parsed=(profile.currentMonth?readingSchema.extend({monthly:monthlySchema}):readingSchema).safeParse(value);
  if(!parsed.success) throw new InvalidAIOutputError(parsed.error.issues);
  const reading=parsed.data as Omit<Reading,'source'>;
  const allowed=new Set(evidenceIds(profile));
  for(const key of SECTION_KEYS) {
    const section=reading.sections[key];
    if(section.evidence.some(id=>!allowed.has(id))) throw new ApiError(502,'INVALID_AI_EVIDENCE','상세 풀이의 계산 근거를 확인할 수 없어요.');
    if(key==='year' && !section.evidence.some(id=>id.startsWith('annual:'))) throw new ApiError(502,'INVALID_AI_EVIDENCE','올해 풀이의 근거를 확인할 수 없어요.');
    if(key==='cycles' && profile.cycles.length && !section.evidence.some(id=>id.startsWith('cycle:'))) throw new ApiError(502,'INVALID_AI_EVIDENCE','시기 풀이의 근거를 확인할 수 없어요.');
  }
  if(reading.monthly) for(const key of ['opportunity','caution','action'] as const) {
    const ids=reading.monthly[key].evidence;
    const facts=selectedEvidence(profile,ids);
    if(ids.some(id=>!allowed.has(id)) || facts.filter(f=>f.kind==='month').length!==1 || !facts.some(f=>f.kind==='natal'&&f.gods.length>0)) throw new ApiError(502,'INVALID_AI_EVIDENCE','이번 달 풀이의 사주 근거를 확인하지 못했어요.');
    const gods=new Set(facts.flatMap(f=>f.gods));
    const body=reading.monthly[key].body;
    const natal=body.match(new RegExp(`내 사주의 (${TEN_GODS.join('|')})`))?.[1];
    const month=body.match(new RegExp(`이 기간의 (${TEN_GODS.join('|')})`))?.[1];
    if(!natal || !month || !facts.some(f=>f.kind==='natal'&&f.gods.includes(natal)) || !facts.some(f=>f.kind==='month'&&f.gods.includes(month)) || TEN_GODS.some(god=>body.includes(god)&&!gods.has(god))) throw new UnsupportedAIClaimError(`monthly.${key}.body`,'UNSUPPORTED_MONTHLY_REASON');
  }
  if(reading.monthly && /(?:약속은 확인하고|배울 일은|여러 가지를 조심|기회를 살펴|흐름을 살펴|하나만 골라요)/.test(reading.monthly.headline))throw new UnsupportedAIClaimError('monthly.headline','VAGUE_HEADLINE');
  const fields=[{path:'headline',text:reading.headline},{path:'intro',text:reading.intro},...SECTION_KEYS.flatMap(key=>['title','body','tip'].map(field=>({path:`sections.${key}.${field}`,text:reading.sections[key][field as 'title'|'body'|'tip']}))),...(reading.monthly?[{path:'monthly.headline',text:reading.monthly.headline},...(['opportunity','caution','action'] as const).flatMap(key=>['title','body'].map(field=>({path:`monthly.${key}.${field}`,text:reading.monthly![key][field as 'title'|'body']})))]:[])];
  let offset=0;
  const ranges=fields.map(field=>{const start=offset;offset+=field.text.length+1;return {...field,start};});
  const text=fields.map(field=>field.text).join('\n');
  const claimError=(index:number|undefined,rule:ClaimRule,message?:string)=>new UnsupportedAIClaimError(ranges.find(field=>(index??0)>=field.start && (index??0)<field.start+field.text.length)?.path??'$',rule,message);
  // Preserve the existing joined-text checks, including matches across field boundaries.
  const pillar=pillarPattern.exec(text);
  if(pillar)throw claimError(pillar.index,'PILLAR_OR_BIRTH_INFORMATION');
  const unsafe=unsafePattern.exec(text)??/사주상?\s*최악|망할|파멸|불행이|큰일\s*납니다|절대로?\s*하면\s*안/.exec(text);
  if(unsafe)throw claimError(unsafe.index,/\d/.test(unsafe[0])?'EXACT_DATE_OR_TIME':/수익|주가/.test(unsafe[0])?'GUARANTEED_FINANCIAL_OUTCOME':/암|우울증|질환|병/.test(unsafe[0])?'MEDICAL_CLAIM':'FATALISTIC_CLAIM');
  for(const field of ranges){
    // The requested rationale may explain the verified relations in ordinary Hangul.
    const pattern=/^monthly\.(opportunity|caution|action)\.body$/.test(field.path)?/격국|용신|신강|신약|삼합|천간합|지지충|형충|대운/:/일간|십신|십성|천간|간지|년주|월주|시주|대운|오행|음양|격국|용신|일주(?!일)|지지\s*의\s*기운/;
    if(pattern.test(field.text))throw new UnsupportedAIClaimError(field.path,'PROHIBITED_TERMINOLOGY');
  }
  const allowedYears=new Set(profile.annual.map(a=>a.year));
  for(const match of text.matchAll(/(\d{4})\s*년/g)) if(!allowedYears.has(Number(match[1]))) throw claimError(match.index,'UNSUPPORTED_YEAR','상세 풀이에 없는 연도가 있어요.');
  const elementWords:Record<string,typeof ELEMENTS[number]>={나무:'wood',불:'fire',흙:'earth',쇠:'metal',물:'water'};
  for(const match of text.matchAll(/(나무|불|흙|쇠|물)\s*(?:기운|오행)?\s*(?:은|는|이|가|:)?\s*(\d+)\s*개/g)) if(profile.elementCounts[elementWords[match[1]]]!==Number(match[2])) throw claimError(match.index,'ELEMENT_COUNT_MISMATCH','상세 풀이의 오행 수가 계산과 달라요.');
  for(const match of text.matchAll(/일간(?:은|이|의)?\s*(나무|불|흙|쇠|물)(?:의|\s|이에요|입니다|기운)/g)) if(elementWords[match[1]]!==profile.dayElement) throw claimError(match.index,'DAY_ELEMENT_MISMATCH','상세 풀이의 일간이 계산과 달라요.');
  for(const match of text.matchAll(/(\d{4})\s*년(?:은|의|에는|에)?\s*(나무|불|흙|쇠|물)(?:의|\s|기운)/g)) if(profile.annual.find(item=>item.year===Number(match[1]))?.element!==elementWords[match[2]]) throw claimError(match.index,'ANNUAL_ELEMENT_MISMATCH','상세 풀이의 연도 기운이 계산과 달라요.');
  for(const god of TEN_GODS) {
    const pattern=new RegExp(`${god}\\s*(?:은|는|이|가|:)?\\s*(\\d+)\\s*개`,'g');
    for(const match of text.matchAll(pattern)) if((profile.tenGodCounts[god]??0)!==Number(match[1])) throw claimError(match.index,'TEN_GOD_COUNT_MISMATCH','상세 풀이의 십성 수가 계산과 달라요.');
  }
  const opaque=/리듬|빛깔|기운|에너지|구체화|실용성|재량|역량|(?:타고난|나의|당신의|서로의)\s*결(?:을|이|은|과|도)/.exec(text);
  if(opaque)throw claimError(opaque.index,'OPAQUE_LANGUAGE');
  for(const match of text.matchAll(/(\d{1,3})\s*[~–-]\s*(\d{1,3})\s*세/g)) if(!profile.cycles.some(cycle=>cycle.startAge===Number(match[1])&&cycle.endAge===Number(match[2]))) throw claimError(match.index,'UNSUPPORTED_AGE_PERIOD');
  return {...reading,source:'ai'} as Reading;
}
