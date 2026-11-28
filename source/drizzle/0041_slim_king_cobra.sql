CREATE TABLE `student_payment_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`student_id` text NOT NULL,
	`payment_id` text NOT NULL,
	`purpose` text NOT NULL,
	`amount` integer NOT NULL,
	`request_fingerprint` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_payment_audit_payment` ON `student_payment_audit` (`payment_id`);--> statement-breakpoint
ALTER TABLE `payment_intents` ADD `initiated_by` text REFERENCES users(id);