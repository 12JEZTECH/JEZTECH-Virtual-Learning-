CREATE TABLE `assignment_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'assigned' NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`score` integer,
	`total` integer NOT NULL,
	`assigned_at` integer NOT NULL,
	`submitted_at` integer,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assignment_entry_student` ON `assignment_entries` (`assignment_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `assignment_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`position` integer NOT NULL,
	`text` text NOT NULL,
	`choices` text NOT NULL,
	`correct` integer NOT NULL,
	`explanation` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assignment_question_position` ON `assignment_questions` (`assignment_id`,`position`);--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`class_level` text NOT NULL,
	`subject` text NOT NULL,
	`topic` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`due_at` integer,
	`created_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
