CREATE TABLE `cascaded_clips` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`clip_id` text NOT NULL,
	`status` text DEFAULT 'cascaded' NOT NULL,
	`duration_seconds` integer NOT NULL,
	`display_order` integer NOT NULL,
	`shared_at` integer NOT NULL,
	`shared_by` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clip_id`) REFERENCES `learning_videos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shared_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cascade_session_clip` ON `cascaded_clips` (`session_id`,`clip_id`);--> statement-breakpoint
CREATE INDEX `cascade_lesson_order` ON `cascaded_clips` (`session_id`,`status`,`display_order`,`shared_at`);--> statement-breakpoint
CREATE TABLE `class_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`enrolled_at` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `teaching_classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_class_student` ON `class_enrollments` (`class_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `enrollment_student_class` ON `class_enrollments` (`student_id`,`class_id`);--> statement-breakpoint
CREATE TABLE `clip_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`cascade_id` text NOT NULL,
	`bucket` integer NOT NULL,
	`affected` integer NOT NULL,
	`viewers` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`cascade_id`) REFERENCES `cascaded_clips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clip_alert_bucket` ON `clip_alerts` (`cascade_id`,`bucket`);--> statement-breakpoint
CREATE TABLE `clip_permits` (
	`id` text PRIMARY KEY NOT NULL,
	`cascade_id` text NOT NULL,
	`user_id` text NOT NULL,
	`issued_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`reserved_seconds` integer NOT NULL,
	FOREIGN KEY (`cascade_id`) REFERENCES `cascaded_clips`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `clip_permit_user` ON `clip_permits` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `clip_telemetry` (
	`id` text PRIMARY KEY NOT NULL,
	`permit_id` text NOT NULL,
	`cascade_id` text NOT NULL,
	`student_id` text NOT NULL,
	`kind` text NOT NULL,
	`position` integer NOT NULL,
	`watched_ms` integer DEFAULT 0 NOT NULL,
	`occurred_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	FOREIGN KEY (`permit_id`) REFERENCES `clip_permits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cascade_id`) REFERENCES `cascaded_clips`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `clip_events_lesson_student` ON `clip_telemetry` (`cascade_id`,`student_id`,`occurred_at`);