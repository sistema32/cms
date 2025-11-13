CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`user_id` integer NOT NULL,
	`permissions` text NOT NULL,
	`rate_limit` integer,
	`expires_at` integer,
	`last_used_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`user_email` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`description` text,
	`changes` text,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`level` text DEFAULT 'info' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`storage_provider` text DEFAULT 'local' NOT NULL,
	`storage_path` text NOT NULL,
	`compressed` integer DEFAULT true NOT NULL,
	`includes_media` integer DEFAULT false NOT NULL,
	`includes_database` integer DEFAULT false NOT NULL,
	`includes_config` integer DEFAULT false NOT NULL,
	`checksum` text NOT NULL,
	`error` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `email_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`to` text NOT NULL,
	`from` text,
	`subject` text NOT NULL,
	`text` text,
	`html` text,
	`attachments` text,
	`headers` text,
	`priority` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`last_attempt_at` integer,
	`next_retry_at` integer,
	`sent_at` integer,
	`error` text,
	`provider` text,
	`provider_message_id` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`text_template` text NOT NULL,
	`html_template` text NOT NULL,
	`variables` text,
	`description` text,
	`category` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_templates_name_unique` ON `email_templates` (`name`);--> statement-breakpoint
CREATE TABLE `ip_block_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip` text NOT NULL,
	`type` text NOT NULL,
	`reason` text,
	`expires_at` integer,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ip_block_rules_ip_unique` ON `ip_block_rules` (`ip`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`result` text,
	`error` text,
	`started_at` integer,
	`completed_at` integer,
	`failed_at` integer,
	`scheduled_for` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`email_notifications` integer DEFAULT true NOT NULL,
	`email_digest` text DEFAULT 'daily' NOT NULL,
	`notify_comments` integer DEFAULT true NOT NULL,
	`notify_replies` integer DEFAULT true NOT NULL,
	`notify_mentions` integer DEFAULT true NOT NULL,
	`notify_content_published` integer DEFAULT true NOT NULL,
	`notify_system_alerts` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preferences_user_id_unique` ON `notification_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`icon` text,
	`link` text,
	`action_label` text,
	`action_url` text,
	`data` text,
	`is_read` integer DEFAULT false NOT NULL,
	`read_at` integer,
	`email_sent` integer DEFAULT false NOT NULL,
	`email_sent_at` integer,
	`priority` text DEFAULT 'normal' NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plugin_hooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plugin_id` integer NOT NULL,
	`hook_name` text NOT NULL,
	`priority` integer DEFAULT 10 NOT NULL,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plugins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`settings` text,
	`installed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plugins_name_unique` ON `plugins` (`name`);--> statement-breakpoint
CREATE TABLE `scheduled_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`schedule` text NOT NULL,
	`job_name` text NOT NULL,
	`job_data` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`next_run_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`ip` text NOT NULL,
	`user_agent` text,
	`path` text,
	`method` text,
	`user_id` integer,
	`details` text,
	`severity` text DEFAULT 'low' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`webhook_id` integer NOT NULL,
	`event` text NOT NULL,
	`payload` text NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`status` text NOT NULL,
	`response_status` integer,
	`response_body` text,
	`response_time` integer,
	`error_message` text,
	`scheduled_at` integer DEFAULT (unixepoch()) NOT NULL,
	`delivered_at` integer,
	`next_retry_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`secret` text,
	`events` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`max_retries` integer DEFAULT 3 NOT NULL,
	`retry_delay` integer DEFAULT 60 NOT NULL,
	`total_deliveries` integer DEFAULT 0 NOT NULL,
	`successful_deliveries` integer DEFAULT 0 NOT NULL,
	`failed_deliveries` integer DEFAULT 0 NOT NULL,
	`last_delivery_at` integer,
	`last_success_at` integer,
	`last_failure_at` integer,
	`description` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `widget_areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`theme` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `widget_areas_slug_unique` ON `widget_areas` (`slug`);--> statement-breakpoint
CREATE TABLE `widgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`area_id` integer,
	`type` text NOT NULL,
	`title` text,
	`settings` text,
	`order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `widget_areas`(`id`) ON UPDATE no action ON DELETE cascade
);
