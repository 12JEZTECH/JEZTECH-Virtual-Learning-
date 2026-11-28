CREATE TABLE `clip_presentations` (
	`session_id` text PRIMARY KEY NOT NULL,
	`cascade_id` text NOT NULL,
	`position` integer NOT NULL,
	`playing` integer NOT NULL,
	`following` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cascade_id`) REFERENCES `cascaded_clips`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
