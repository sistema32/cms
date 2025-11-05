CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`parent_id` integer,
	`content_type_id` integer,
	`color` text,
	`icon` text,
	`order` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_type_id` integer NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text,
	`body` text,
	`featured_image_id` integer,
	`author_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`password` text,
	`published_at` integer,
	`scheduled_at` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`comment_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_slug_unique` ON `content` (`slug`);--> statement-breakpoint
CREATE TABLE `content_categories` (
	`content_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	PRIMARY KEY(`content_id`, `category_id`),
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `content_meta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`type` text DEFAULT 'string',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `content_seo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`meta_title` text,
	`meta_description` text,
	`canonical_url` text,
	`og_title` text,
	`og_description` text,
	`og_image` text,
	`og_type` text DEFAULT 'article',
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
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_seo_content_id_unique` ON `content_seo` (`content_id`);--> statement-breakpoint
CREATE TABLE `content_tags` (
	`content_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`content_id`, `tag_id`),
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `content_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`is_public` integer DEFAULT true NOT NULL,
	`has_categories` integer DEFAULT true NOT NULL,
	`has_tags` integer DEFAULT true NOT NULL,
	`has_comments` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_types_name_unique` ON `content_types` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `content_types_slug_unique` ON `content_types` (`slug`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`color` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);