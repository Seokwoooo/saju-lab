export interface ReservationInput {requestId:string;challengeHash:string;ipHash:string;previousIpHash?:string;now:number;dailyCalls:number;dailyBudgetMicros:number;reserveMicros:number;ownerCountBypass?:boolean}
export type ReservationResult={ok:true}|{ok:false;code:string;retryAfter:number};
export async function cleanupReservations(db:D1Database,now=Date.now()):Promise<void> {
  await db.prepare('DELETE FROM ai_reservations WHERE expires_at <= ?').bind(now).run();
}
export async function reserveJob(db:D1Database,input:ReservationInput):Promise<ReservationResult> {
  const {requestId,challengeHash,ipHash,now,dailyCalls,dailyBudgetMicros,reserveMicros}=input;
  const previousIpHash=input.previousIpHash??ipHash;
  const bypass=input.ownerCountBypass===true?1:0;
  const day=new Date(now).toISOString().slice(0,10);
  const dayEnd=Date.parse(`${day}T00:00:00Z`)+86_400_000;
  await cleanupReservations(db,now);
  // One SQLite write statement reads and reserves every limit. D1 serializes writes;
  // concurrent Workers cannot interleave the checks and insertion.
  const row=await db.prepare(`INSERT INTO ai_reservations (request_id,challenge_hash,ip_hash,day_key,created_at,expires_at,leased_until,reserved_microusd)
    SELECT ?,?,?,?,?,?,?,?
    WHERE NOT EXISTS (SELECT 1 FROM ai_reservations WHERE challenge_hash = ?)
      AND (? = 1 OR (SELECT COUNT(*) FROM ai_reservations WHERE day_key = ?) < ?)
      AND (SELECT COALESCE(SUM(reserved_microusd),0) FROM ai_reservations WHERE day_key = ?) + ? <= ?
      AND (? = 1 OR (SELECT COUNT(*) FROM ai_reservations WHERE ip_hash IN (?,?) AND created_at > ?) < 2)
      AND (? = 1 OR (SELECT COUNT(*) FROM ai_reservations WHERE ip_hash = ? AND day_key = ?) < 8)
      AND (SELECT COUNT(*) FROM ai_reservations WHERE leased_until > ?) < 2
    RETURNING request_id`).bind(requestId,challengeHash,ipHash,day,now,dayEnd+86_400_000,now+120_000,reserveMicros,challengeHash,bypass,day,dailyCalls,day,reserveMicros,dailyBudgetMicros,bypass,ipHash,previousIpHash,now-60_000,bypass,ipHash,day,now).first();
  if(row) return {ok:true};
  const flags=await db.prepare(`SELECT
    EXISTS (SELECT 1 FROM ai_reservations WHERE challenge_hash = ?) AS replay,
    (SELECT COUNT(*) FROM ai_reservations WHERE day_key = ?) >= ? AS daily,
    (SELECT COALESCE(SUM(reserved_microusd),0) FROM ai_reservations WHERE day_key = ?) + ? > ? AS budget,
    (SELECT COUNT(*) FROM ai_reservations WHERE ip_hash = ? AND day_key = ?) >= 8 AS ip_day,
    (SELECT COUNT(*) FROM ai_reservations WHERE ip_hash IN (?,?) AND created_at > ?) >= 2 AS ip_minute`).bind(challengeHash,day,dailyCalls,day,reserveMicros,dailyBudgetMicros,ipHash,day,ipHash,previousIpHash,now-60_000).first<{replay:number;daily:number;budget:number;ip_day:number;ip_minute:number}>();
  const code=flags?.replay?'CHALLENGE_REPLAY':!bypass&&flags?.daily?'DAILY_CALL_LIMIT':flags?.budget?'DAILY_BUDGET_LIMIT':!bypass&&flags?.ip_day?'IP_DAY_LIMIT':!bypass&&flags?.ip_minute?'IP_MINUTE_LIMIT':'CONCURRENCY_LIMIT';
  return {ok:false,code,retryAfter:['DAILY_CALL_LIMIT','DAILY_BUDGET_LIMIT','IP_DAY_LIMIT'].includes(code)?Math.max(1,Math.ceil((dayEnd-now)/1000)):code==='CONCURRENCY_LIMIT'?120:60};
}
export async function releaseJob(db:D1Database,requestId:string):Promise<void> {
  // Budget and replay reservations stay until expiry even on timeout or cancellation.
  await db.prepare('UPDATE ai_reservations SET leased_until = 0 WHERE request_id = ?').bind(requestId).run();
}
