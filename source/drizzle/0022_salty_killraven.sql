ALTER TABLE `class_sessions` ADD `start_mode` text DEFAULT 'automatic' NOT NULL;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `started_at` integer;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `started_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `teacher_present_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `teacher_joined_at` integer;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `teacher_last_seen` integer;