CREATE INDEX `class_attendance_presence` ON `class_attendance` (`session_id`,`last_seen`);--> statement-breakpoint
CREATE INDEX `class_sessions_status_open` ON `class_sessions` (`status`,`opens_at`);