ALTER TABLE `payment_intents` ADD `callback_received_at` integer;--> statement-breakpoint
ALTER TABLE `payment_intents` ADD `recording_error` text DEFAULT '' NOT NULL;