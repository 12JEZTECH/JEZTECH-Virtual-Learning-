ALTER TABLE `class_attendance` ADD `mic_policy` text DEFAULT 'inherit' NOT NULL;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `duration_minutes` integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `ends_at` integer;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `mute_all` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `classroom_calls` ADD `session_id` text REFERENCES class_sessions(id);
--> statement-breakpoint
UPDATE class_sessions SET ends_at=starts_at+duration_minutes*60000 WHERE ends_at IS NULL;
