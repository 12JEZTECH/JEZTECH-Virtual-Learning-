CREATE TABLE `cctv_monitors` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `classroom_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cctv_monitor_room_teacher` ON `cctv_monitors` (`room_id`,`teacher_id`);