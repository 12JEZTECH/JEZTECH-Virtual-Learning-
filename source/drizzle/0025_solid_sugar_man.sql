CREATE TABLE `conference_peers` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	`last_seen` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conference_session_user` ON `conference_peers` (`session_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `conference_recent_peers` ON `conference_peers` (`session_id`,`last_seen`);--> statement-breakpoint
CREATE TABLE `conference_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` text NOT NULL,
	`session_id` text NOT NULL,
	`from_peer` text NOT NULL,
	`to_peer` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conference_signal_event` ON `conference_signals` (`event_id`);--> statement-breakpoint
CREATE INDEX `conference_recipient_cursor` ON `conference_signals` (`to_peer`,`id`);