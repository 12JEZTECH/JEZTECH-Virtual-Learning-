CREATE TABLE `lesson_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`session_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`resource_key` text NOT NULL,
	`instructions` text NOT NULL,
	`shared_at` integer NOT NULL,
	`withdrawn_at` integer,
	FOREIGN KEY (`class_id`) REFERENCES `teaching_classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `lesson_resource_session` ON `lesson_resources` (`session_id`,`withdrawn_at`,`shared_at`);--> statement-breakpoint
ALTER TABLE `teacher_pay_agreements` ADD `company_contract` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `teacher_pay_agreements` ADD `accepted_name` text;