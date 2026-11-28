CREATE TABLE `payment_receipt_reservations` (
	`receipt` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`payment_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registration_fee_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registration_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`phone` text NOT NULL,
	`receipt` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`verified_at` integer,
	`reviewed_by` text,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registration_receipt` ON `registration_payments` (`receipt`);--> statement-breakpoint
ALTER TABLE `payment_intents` ADD `purpose` text DEFAULT 'tuition' NOT NULL;
--> statement-breakpoint
INSERT INTO registration_fee_settings(id,amount,updated_at) VALUES('main',100,0) ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO payment_receipt_reservations(receipt,kind,payment_id,created_at) SELECT receipt,'lesson',id,created_at FROM payments WHERE 1 ON CONFLICT(receipt) DO NOTHING;
--> statement-breakpoint
INSERT INTO payment_receipt_reservations(receipt,kind,payment_id,created_at) SELECT receipt,'tuition',id,created_at FROM subscriptions WHERE 1 ON CONFLICT(receipt) DO NOTHING;
