CREATE TABLE `learner_subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`class_level` text NOT NULL,
	`subject` text NOT NULL,
	`status` text DEFAULT 'attend' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_subject_level` ON `learner_subjects` (`student_id`,`class_level`,`subject`);