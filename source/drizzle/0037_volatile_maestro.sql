CREATE TABLE `user_account_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`target_id` text NOT NULL,
	`action` text NOT NULL,
	`before` text NOT NULL,
	`after` text NOT NULL,
	`at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `user_account_audit_target` ON `user_account_audit` (`target_id`,`at`);--> statement-breakpoint
ALTER TABLE `users` ADD `deleted_at` integer;