CREATE TABLE `admissions` (
	`student_id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`phone` text NOT NULL,
	`level` text NOT NULL,
	`goals` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`requested_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `assessment_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`cycle` integer NOT NULL,
	`exam_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_assessment_cycle` ON `assessment_cycles` (`student_id`,`cycle`);--> statement-breakpoint
CREATE TABLE `daily_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`day` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_teacher_daily_report` ON `daily_reports` (`teacher_id`,`day`);--> statement-breakpoint
CREATE TABLE `learner_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`lesson_id` text,
	`question` text NOT NULL,
	`answer` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'pending' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`answered_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `questions_daily_teacher` ON `learner_questions` (`teacher_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `learning_days` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`day` text NOT NULL,
	`at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_lesson_day` ON `learning_days` (`student_id`,`lesson_id`,`day`);--> statement-breakpoint
CREATE TABLE `learning_presence` (
	`student_id` text PRIMARY KEY NOT NULL,
	`last_seen` integer NOT NULL,
	`page` text NOT NULL,
	`hand_raised` integer DEFAULT 0 NOT NULL,
	`hand_note` text DEFAULT '' NOT NULL,
	`raised_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`kind` text NOT NULL,
	`ref` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_notice_ref` ON `notices` (`student_id`,`kind`,`ref`);--> statement-breakpoint
CREATE TABLE `subscription_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`days` integer DEFAULT 30 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`phone` text NOT NULL,
	`receipt` text NOT NULL,
	`amount` integer NOT NULL,
	`days` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`verified_at` integer,
	`expires_at` integer,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_receipt` ON `subscriptions` (`receipt`);--> statement-breakpoint
CREATE TABLE `video_credits` (
	`student_id` text PRIMARY KEY NOT NULL,
	`allowance` integer DEFAULT 1200 NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`lease_id` text,
	`lease_expires` integer,
	`granted_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
