CREATE TABLE `rate_limit_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`method` text,
	`max_requests` integer NOT NULL,
	`window_seconds` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `security_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`pattern` text NOT NULL,
	`action` text NOT NULL,
	`severity` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`trigger_count` integer DEFAULT 0 NOT NULL,
	`description` text,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `security_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`type` text DEFAULT 'string' NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`updated_by` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `security_settings_key_unique` ON `security_settings` (`key`);--> statement-breakpoint
ALTER TABLE `content` ADD `template` text;--> statement-breakpoint
ALTER TABLE `security_events` ADD `rule_id` integer;--> statement-breakpoint
ALTER TABLE `security_events` ADD `blocked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `security_events` ADD `referer` text;