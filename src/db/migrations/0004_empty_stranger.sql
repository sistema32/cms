CREATE TABLE `category_seo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`meta_title` text,
	`meta_description` text,
	`canonical_url` text,
	`og_title` text,
	`og_description` text,
	`og_image` text,
	`og_type` text DEFAULT 'website',
	`twitter_card` text DEFAULT 'summary_large_image',
	`twitter_title` text,
	`twitter_description` text,
	`twitter_image` text,
	`schema_json` text,
	`focus_keyword` text,
	`no_index` integer DEFAULT false NOT NULL,
	`no_follow` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_seo_category_id_unique` ON `category_seo` (`category_id`);--> statement-breakpoint
ALTER TABLE `categories` ADD `deleted_at` integer;