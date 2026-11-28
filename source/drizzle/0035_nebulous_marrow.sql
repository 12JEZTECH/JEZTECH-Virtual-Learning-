CREATE TABLE `learner_orientation` (
	`student_id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
