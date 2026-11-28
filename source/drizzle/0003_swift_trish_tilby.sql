CREATE TABLE `teacher_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`user_id` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`activated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_account_email` ON `teacher_accounts` (`email`);