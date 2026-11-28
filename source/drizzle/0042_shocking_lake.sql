CREATE TABLE `payment_review_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`purpose` text NOT NULL,
	`student_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`status` text NOT NULL,
	`amount` integer NOT NULL,
	`receipt` text NOT NULL,
	`note` text NOT NULL,
	`reviewed_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_review_once` ON `payment_review_audit` (`purpose`,`payment_id`);