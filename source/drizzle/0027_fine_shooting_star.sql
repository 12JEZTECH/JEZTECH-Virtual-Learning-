CREATE TABLE `hls_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`package_id` text NOT NULL,
	`path` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	FOREIGN KEY (`package_id`) REFERENCES `hls_packages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hls_package_path` ON `hls_assets` (`package_id`,`path`);--> statement-breakpoint
CREATE TABLE `hls_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`created_by` text NOT NULL,
	`entry` text DEFAULT 'master.m3u8' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `learning_videos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `hls_video_status` ON `hls_packages` (`video_id`,`status`);