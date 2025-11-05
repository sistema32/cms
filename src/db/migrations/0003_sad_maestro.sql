CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`path` text NOT NULL,
	`url` text NOT NULL,
	`storage_provider` text DEFAULT 'local' NOT NULL,
	`type` text NOT NULL,
	`width` integer,
	`height` integer,
	`duration` integer,
	`uploaded_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_hash_unique` ON `media` (`hash`);--> statement-breakpoint
CREATE TABLE `media_seo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`media_id` integer NOT NULL,
	`alt` text,
	`title` text,
	`caption` text,
	`description` text,
	`focus_keyword` text,
	`credits` text,
	`copyright` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_seo_media_id_unique` ON `media_seo` (`media_id`);--> statement-breakpoint
CREATE TABLE `media_sizes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`media_id` integer NOT NULL,
	`size` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`path` text NOT NULL,
	`url` text NOT NULL,
	`file_size` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
