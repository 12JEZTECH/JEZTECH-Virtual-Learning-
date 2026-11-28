CREATE TABLE `teacher_pay_agreements` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`rate_cents` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`terms` text NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`replaces_id` text,
	`proposed_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`accepted_at` integer,
	`responded_at` integer,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proposed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teacher_pay_periods` ON `teacher_pay_agreements` (`teacher_id`,`status`,`starts_at`);--> statement-breakpoint
CREATE TABLE `teacher_pay_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`record_id` text NOT NULL,
	`details` text NOT NULL,
	`at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teacher_pay_audit_teacher` ON `teacher_pay_audit` (`teacher_id`,`at`);--> statement-breakpoint
CREATE TABLE `teacher_pay_learners` (
	`id` text PRIMARY KEY NOT NULL,
	`statement_id` text NOT NULL,
	`student_id` text NOT NULL,
	FOREIGN KEY (`statement_id`) REFERENCES `teacher_pay_statements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_pay_distinct_learner` ON `teacher_pay_learners` (`statement_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `teacher_pay_statements` (
	`id` text PRIMARY KEY NOT NULL,
	`agreement_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`learner_count` integer NOT NULL,
	`rate_cents` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`paid_at` integer,
	`payment_reference` text,
	`paid_by` text,
	FOREIGN KEY (`agreement_id`) REFERENCES `teacher_pay_agreements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paid_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_pay_once` ON `teacher_pay_statements` (`agreement_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_pay_reference` ON `teacher_pay_statements` (`payment_reference`);--> statement-breakpoint
CREATE INDEX `teacher_pay_teacher` ON `teacher_pay_statements` (`teacher_id`,`created_at`);