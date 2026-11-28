ALTER TABLE `labs` ADD `class_level` text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `labs` ADD `topic` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `lessons` ADD `class_level` text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `lessons` ADD `topic` text DEFAULT '' NOT NULL;