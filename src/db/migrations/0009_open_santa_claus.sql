CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`autoload` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_content` (
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
	`comments_enabled` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`featured_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_content`("id", "content_type_id", "title", "slug", "excerpt", "body", "featured_image_id", "author_id", "status", "visibility", "password", "published_at", "scheduled_at", "view_count", "like_count", "comment_count", "comments_enabled", "created_at", "updated_at") SELECT "id", "content_type_id", "title", "slug", "excerpt", "body", "featured_image_id", "author_id", "status", "visibility", "password", "published_at", "scheduled_at", "view_count", "like_count", "comment_count", "comments_enabled", "created_at", "updated_at" FROM `content`;--> statement-breakpoint
DROP TABLE `content`;--> statement-breakpoint
ALTER TABLE `__new_content` RENAME TO `content`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `content_slug_unique` ON `content` (`slug`);