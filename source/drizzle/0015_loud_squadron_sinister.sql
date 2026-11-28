CREATE TABLE `class_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`removed_at` integer,
	`removed_by` text,
	FOREIGN KEY (`room_id`) REFERENCES `class_chats`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`removed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chat_messages_room_time` ON `class_chat_messages` (`room_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `chat_messages_sender_time` ON `class_chat_messages` (`sender_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `class_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`class_level` text NOT NULL,
	`subject` text NOT NULL,
	`topic` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`lesson_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_chat_topic` ON `class_chats` (`teacher_id`,`class_level`,`subject`,`topic`);