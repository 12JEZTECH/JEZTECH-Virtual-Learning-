CREATE TABLE `mpesa_b2b_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`request_hash` text NOT NULL,
	`callback_hash` text NOT NULL,
	`amount` integer NOT NULL,
	`receiver_shortcode` text NOT NULL,
	`account_reference` text NOT NULL,
	`status` text NOT NULL,
	`conversation_id` text,
	`originator_id` text,
	`result_code` text,
	`created_at` integer NOT NULL,
	`callback_received_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `b2b_created_by` ON `mpesa_b2b_requests` (`created_by`,`created_at`);