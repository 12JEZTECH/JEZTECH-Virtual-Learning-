CREATE TABLE `timed_access_windows` (
 `id` text PRIMARY KEY NOT NULL,
 `created_by` text NOT NULL REFERENCES `users`(`id`),
 `created_at` integer NOT NULL,
 `expires_at` integer NOT NULL,
 `hours` integer NOT NULL,
 `note` text NOT NULL,
 `revoked_at` integer,
 `revoked_by` text REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `timed_access_members` (
 `window_id` text NOT NULL REFERENCES `timed_access_windows`(`id`),
 `student_id` text NOT NULL REFERENCES `users`(`id`),
 PRIMARY KEY (`window_id`,`student_id`)
);
--> statement-breakpoint
CREATE INDEX `timed_access_student` ON `timed_access_members` (`student_id`,`window_id`);
