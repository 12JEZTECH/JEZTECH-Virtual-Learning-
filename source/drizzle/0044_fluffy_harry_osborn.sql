DROP INDEX `subject_purchase_pending`;--> statement-breakpoint
ALTER TABLE `subject_purchases` ADD `topic` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `subject_purchase_pending` ON `subject_purchases` (`student_id`,`teacher_id`,`class_level`,`subject`,`product`,`topic`) WHERE status='pending';--> statement-breakpoint
ALTER TABLE `subject_question_sets` ADD `source_url` text;--> statement-breakpoint
ALTER TABLE `subject_tutorials` ADD `topic` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE subject_tutorials SET topic=lower(trim(title)) WHERE topic='';
