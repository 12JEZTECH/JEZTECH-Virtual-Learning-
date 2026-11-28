CREATE TABLE `class_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`student_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL,
	`left_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_attendance_learner` ON `class_attendance` (`session_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `class_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'preparing' NOT NULL,
	`opens_at` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `classroom_rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `class_sessions_room` ON `class_sessions` (`room_id`,`opens_at`);--> statement-breakpoint
CREATE TABLE `payment_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`phone` text NOT NULL,
	`amount` integer NOT NULL,
	`days` integer NOT NULL,
	`status` text DEFAULT 'starting' NOT NULL,
	`checkout_id` text,
	`merchant_id` text,
	`message` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`checked_at` integer,
	`confirmed_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_intent_checkout` ON `payment_intents` (`checkout_id`);--> statement-breakpoint
CREATE INDEX `payment_intent_student` ON `payment_intents` (`student_id`,`created_at`);