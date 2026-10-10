import { Miniflare } from 'miniflare';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { reserveJob, releaseJob, cleanupReservations } from '../lib/server/limits';

let mf: Miniflare;
let db: D1Database;
const now = Date.UTC(2026,9,10,12);
const input = (id:string, ip:string, time=now) => ({requestId:id, challengeHash:`challenge-${id}`, ipHash:ip, now:time, dailyCalls:50, dailyBudgetMicros:2_000_000, reserveMicros:40_000});
beforeEach(async () => {
  mf = new Miniflare({modules:true, script:'export default {fetch(){return new Response("ok")}}', d1Databases:['DB']});
  db = await mf.getD1Database('DB') as unknown as D1Database;
  await db.prepare(`CREATE TABLE ai_reservations (request_id TEXT PRIMARY KEY, challenge_hash TEXT NOT NULL UNIQUE, ip_hash TEXT NOT NULL, day_key TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, leased_until INTEGER NOT NULL, reserved_microusd INTEGER NOT NULL)`).run();
});
afterEach(async () => {await mf.dispose();});

describe('real Miniflare D1 distributed limits', () => {
  it('atomically admits at most two simultaneous jobs across different IPs', async () => {
    const results = await Promise.all(Array.from({length:12}, (_,i) => reserveJob(db,input(`r${i}`,`ip${i}`))));
    expect(results.filter(x=>x.ok)).toHaveLength(2);
    expect((await db.prepare('SELECT COUNT(*) AS n FROM ai_reservations').first<{n:number}>())?.n).toBe(2);
  });
  it('blocks challenge replay even after the lease releases', async () => {
    expect((await reserveJob(db,input('first','ip'))).ok).toBe(true);
    await releaseJob(db,'first');
    expect(await reserveJob(db,{...input('second','ip'),challengeHash:'challenge-first'})).toMatchObject({ok:false,code:'CHALLENGE_REPLAY'});
  });
  it('enforces rolling minute and daily IP limits with no budget refund', async () => {
    for(let i=0;i<8;i++) {
      const result = await reserveJob(db,input(`r${i}`,'same-ip', now+Math.floor(i/2)*61_000));
      expect(result.ok).toBe(true);
      await releaseJob(db,`r${i}`);
      if(i===1) expect(await reserveJob(db,input('too-fast','same-ip',now+1))).toMatchObject({ok:false,code:'IP_MINUTE_LIMIT'});
    }
    expect(await reserveJob(db,input('ninth','same-ip',now+300_000))).toMatchObject({ok:false,code:'IP_DAY_LIMIT'});
    expect((await db.prepare('SELECT SUM(reserved_microusd) AS cost FROM ai_reservations').first<{cost:number}>())?.cost).toBe(320_000);
  });
  it('keeps the rolling minute limit across the daily IP-HMAC rotation at UTC midnight', async () => {
    const midnight=Date.UTC(2026,9,11);
    for(let i=0;i<2;i++) {
      expect((await reserveJob(db,input(`previous-${i}`,'previous-day-hash',midnight-10_000+i))).ok).toBe(true);
      await releaseJob(db,`previous-${i}`);
    }
    expect(await reserveJob(db,{...input('new-day','current-day-hash',midnight+1000),previousIpHash:'previous-day-hash'})).toMatchObject({ok:false,code:'IP_MINUTE_LIMIT'});
    expect((await reserveJob(db,{...input('later','current-day-hash',midnight+61_000),previousIpHash:'previous-day-hash'})).ok).toBe(true);
  });
  it('enforces lower daily budget and global call caps atomically', async () => {
    expect((await reserveJob(db,{...input('one','ip1'),dailyBudgetMicros:40_000})).ok).toBe(true);
    await releaseJob(db,'one');
    expect(await reserveJob(db,{...input('two','ip2'),dailyBudgetMicros:40_000})).toMatchObject({ok:false,code:'DAILY_BUDGET_LIMIT'});
    expect(await reserveJob(db,{...input('three','ip3'),dailyCalls:1})).toMatchObject({ok:false,code:'DAILY_CALL_LIMIT'});
  });
  it('allows expired lease replacement and deletes rows within 48 hours', async () => {
    await reserveJob(db,input('one','ip1'));
    await reserveJob(db,input('two','ip2'));
    expect((await reserveJob(db,input('three','ip3',now+121_000))).ok).toBe(true);
    await cleanupReservations(db,now+48*60*60*1000);
    expect((await db.prepare('SELECT COUNT(*) AS n FROM ai_reservations').first<{n:number}>())?.n).toBe(0);
  });
});
