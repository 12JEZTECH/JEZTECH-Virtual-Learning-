CREATE TABLE `lab_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`lab_id` text NOT NULL,
	`student_id` text NOT NULL,
	`bench` integer,
	`ready` integer DEFAULT 0 NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`equipment` text DEFAULT '{}' NOT NULL,
	`self_rubric` text DEFAULT '{}' NOT NULL,
	`teacher_rubric` text DEFAULT '{}' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`score` integer,
	`max_score` integer,
	`per_question` text DEFAULT '{}' NOT NULL,
	`feedback` text DEFAULT '' NOT NULL,
	`last_seen` integer NOT NULL,
	`submitted_at` integer,
	`version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`lab_id`) REFERENCES `labs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_lab_entry` ON `lab_entries` (`lab_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `lab_entries_lab_status` ON `lab_entries` (`lab_id`,`status`);--> statement-breakpoint
CREATE TABLE `labs` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`curriculum` text NOT NULL,
	`safety` text NOT NULL,
	`duration` integer NOT NULL,
	`bench_count` integer NOT NULL,
	`apparatus_ids` text NOT NULL,
	`questions` text NOT NULL,
	`rubric` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`deadline` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `labs_teacher` ON `labs` (`teacher_id`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`subject` text NOT NULL,
	`curriculum` text NOT NULL,
	`price` integer DEFAULT 50 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `lessons_teacher` ON `lessons` (`teacher_id`);--> statement-breakpoint
CREATE TABLE `payment_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`business_number` text DEFAULT '' NOT NULL,
	`account_reference` text DEFAULT '' NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`student_id` text NOT NULL,
	`phone` text NOT NULL,
	`amount` integer NOT NULL,
	`receipt` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`review_note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_receipt` ON `payments` (`receipt`);--> statement-breakpoint
CREATE INDEX `payments_student_lesson` ON `payments` (`student_id`,`lesson_id`);