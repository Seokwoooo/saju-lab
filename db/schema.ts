import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/** Short-lived abuse and conservative budget reservations. Never store chart/input/output/IP. */
export const aiReservations = sqliteTable('ai_reservations', {
  requestId:text('request_id').primaryKey(),
  challengeHash:text('challenge_hash').notNull(),
  ipHash:text('ip_hash').notNull(),
  dayKey:text('day_key').notNull(),
  createdAt:integer('created_at').notNull(),
  expiresAt:integer('expires_at').notNull(),
  leasedUntil:integer('leased_until').notNull(),
  reservedMicrousd:integer('reserved_microusd').notNull(),
}, table => [
  uniqueIndex('ai_reservations_challenge').on(table.challengeHash),
  index('ai_reservations_day').on(table.dayKey),
  index('ai_reservations_ip_created').on(table.ipHash,table.createdAt),
  index('ai_reservations_expiry').on(table.expiresAt),
  index('ai_reservations_lease').on(table.leasedUntil),
]);
