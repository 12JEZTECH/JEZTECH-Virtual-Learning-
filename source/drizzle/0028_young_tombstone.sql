CREATE TABLE `sfu_rooms` (
	`session_id` text PRIMARY KEY NOT NULL,
	`room_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_reconciled` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sfu_active_reconcile` ON `sfu_rooms` (`status`,`last_reconciled`);--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `media_mode` text DEFAULT 'peer' NOT NULL;--> statement-breakpoint
ALTER TABLE `class_sessions` ADD `learner_limit` integer DEFAULT 2000 NOT NULL;--> statement-breakpoint
CREATE INDEX `class_sessions_due` ON `class_sessions` (`status`,`ends_at`);--> statement-breakpoint
CREATE INDEX `class_sessions_preparation_due` ON `class_sessions` (`status`,`starts_at`);--> statement-breakpoint
CREATE INDEX `admissions_teacher_status` ON `admissions` (`teacher_id`,`status`);--> statement-breakpoint
CREATE INDEX `class_attendance_student_open` ON `class_attendance` (`student_id`,`left_at`,`last_seen`);