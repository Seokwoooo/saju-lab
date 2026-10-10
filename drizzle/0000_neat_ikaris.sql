CREATE TABLE `ai_reservations` (
	`request_id` text PRIMARY KEY NOT NULL,
	`challenge_hash` text NOT NULL,
	`ip_hash` text NOT NULL,
	`day_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`leased_until` integer NOT NULL,
	`reserved_microusd` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_reservations_challenge` ON `ai_reservations` (`challenge_hash`);--> statement-breakpoint
CREATE INDEX `ai_reservations_day` ON `ai_reservations` (`day_key`);--> statement-breakpoint
CREATE INDEX `ai_reservations_ip_created` ON `ai_reservations` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `ai_reservations_expiry` ON `ai_reservations` (`expires_at`);--> statement-breakpoint
CREATE INDEX `ai_reservations_lease` ON `ai_reservations` (`leased_until`);