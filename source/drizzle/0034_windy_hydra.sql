ALTER TABLE `assignment_entries` ADD `uploaded_work` text;--> statement-breakpoint
ALTER TABLE `assignment_entries` ADD `feedback` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `assignments` ADD `grading_bands` text;