CREATE TABLE `call_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`call_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `classroom_calls`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `signals_call_id` ON `call_signals` (`call_id`,`id`);--> statement-breakpoint
CREATE TABLE `cctv_cameras` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`format` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `classroom_rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `classroom_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`topic` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created_at` integer NOT NULL,
	`accepted_at` integer,
	`ended_at` integer,
	`last_seen` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `classroom_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `calls_room_status` ON `classroom_calls` (`room_id`,`status`);--> statement-breakpoint
CREATE TABLE `classroom_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learner_access` (
	`student_id` text PRIMARY KEY NOT NULL,
	`login_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`issued_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_login_id` ON `learner_access` (`login_id`);--> statement-breakpoint
CREATE TABLE `virtual_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`experiment` text NOT NULL,
	`inputs` text NOT NULL,
	`results` text NOT NULL,
	`notes` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
