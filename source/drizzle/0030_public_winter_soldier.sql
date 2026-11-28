CREATE INDEX `class_active_enrollment` ON `class_enrollments` (`class_id`,`status`,`student_id`);--> statement-breakpoint
CREATE INDEX `sessions_learner_status` ON `sessions` (`student_id`,`status`);--> statement-breakpoint
CREATE INDEX `subscription_active_learner` ON `subscriptions` (`student_id`,`status`,`expires_at`);