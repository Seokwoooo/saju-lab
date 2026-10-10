import type { Reading } from './contracts';

export type AnalysisStage='preparing'|'loading'|'accepted'|'retrying'|'verified'|'complete';
export type AnalysisEvent={type:'progress';stage:'accepted'|'retrying'|'verified'}|{type:'result';reading:Reading}|{type:'error';error:string;code?:string;retryAfter?:number};
// Four observable milestones. This is completed-stage progress, not an invented token ETA.
export const ANALYSIS_PROGRESS:Record<AnalysisStage,number>={preparing:25,loading:25,accepted:50,retrying:50,verified:75,complete:100};
export const ANALYSIS_LABELS:Record<AnalysisStage,string>={preparing:'사주 계산 완료, 요청을 준비하고 있어요',loading:'계산한 사주를 전달하고 있어요',accepted:'이번 달 운세와 그 이유를 풀고 있어요',retrying:'풀이를 다시 정리하고 있어요. 조금 더 기다려 주세요',verified:'풀이의 근거를 확인했어요. 결과를 준비하고 있어요',complete:'나만의 사주풀이가 완성됐어요'};
