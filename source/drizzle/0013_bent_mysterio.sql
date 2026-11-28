CREATE TABLE `lesson_access_events` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text,
	`resource` text NOT NULL,
	`reason` text NOT NULL,
	`bucket` integer NOT NULL,
	`attempt_count` integer DEFAULT 1 NOT NULL,
	`first_at` integer NOT NULL,
	`last_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_event_window` ON `lesson_access_events` (`student_id`,`resource`,`reason`,`bucket`);--> statement-breakpoint
CREATE INDEX `access_event_teacher` ON `lesson_access_events` (`teacher_id`,`last_at`);