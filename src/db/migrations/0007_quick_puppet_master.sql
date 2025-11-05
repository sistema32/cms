CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`parent_id` integer,
	`author_id` integer,
	`author_name` text,
	`author_email` text,
	`author_website` text,
	`body` text NOT NULL,
	`body_censored` text NOT NULL,
	`captcha_token` text,
	`captcha_provider` text,
	`status` text DEFAULT 'approved' NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `content_filters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`pattern` text NOT NULL,
	`is_regex` integer DEFAULT false NOT NULL,
	`replacement` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
