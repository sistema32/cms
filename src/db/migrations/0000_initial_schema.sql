-- ============================================================================
-- LexCMS Database Schema - Unified Migration
-- Created: 2025-01-06
-- Description: Complete database schema for LexCMS including all tables,
--              indexes, and initial data
-- ============================================================================

-- ============================================================================
-- CORE TABLES: Roles, Permissions, Users
-- ============================================================================

CREATE TABLE IF NOT EXISTS `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `roles_name_unique` ON `roles` (`name`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `role_permissions` (
	`role_id` integer NOT NULL,
	`permission_id` integer NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text,
	`avatar` text,
	`status` text DEFAULT 'active' NOT NULL,
	`role_id` integer,
	`two_factor_enabled` integer DEFAULT false NOT NULL,
	`two_factor_secret` text,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `user_2fa` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`secret` text NOT NULL,
	`backup_codes` text NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_2fa_user_id_unique` ON `user_2fa` (`user_id`);
--> statement-breakpoint

-- ============================================================================
-- CONTENT TYPES AND TAXONOMY
-- ============================================================================

CREATE TABLE IF NOT EXISTS `content_types` (
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
CREATE UNIQUE INDEX IF NOT EXISTS `content_types_name_unique` ON `content_types` (`name`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `content_types_slug_unique` ON `content_types` (`slug`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`parent_id` integer,
	`content_type_id` integer,
	`color` text,
	`icon` text,
	`order` integer DEFAULT 0,
	`deleted_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `categories_slug_unique` ON `categories` (`slug`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`color` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `tags_name_unique` ON `tags` (`name`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `tags_slug_unique` ON `tags` (`slug`);
--> statement-breakpoint

-- ============================================================================
-- MEDIA MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS `media` (
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
	`metadata` text,
	`folder_id` integer,
	`uploaded_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `media_hash_unique` ON `media` (`hash`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_folder_id_idx` ON `media` (`folder_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `media_sizes` (
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
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `media_seo` (
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
CREATE UNIQUE INDEX IF NOT EXISTS `media_seo_media_id_unique` ON `media_seo` (`media_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `media_folders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `parent_id` integer,
  `path` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer,
  FOREIGN KEY (`parent_id`) REFERENCES `media_folders`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_folders_parent_id_idx` ON `media_folders` (`parent_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_folders_path_idx` ON `media_folders` (`path`);
--> statement-breakpoint

-- ============================================================================
-- CONTENT MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS `content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_type_id` integer NOT NULL,
	`parent_id` integer,
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
	`featured` integer DEFAULT false NOT NULL,
	`sticky` integer DEFAULT false NOT NULL,
	`workflow_state_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`featured_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `content_slug_unique` ON `content` (`slug`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `content_categories` (
	`content_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	PRIMARY KEY(`content_id`, `category_id`),
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `content_tags` (
	`content_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`content_id`, `tag_id`),
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `content_meta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`type` text DEFAULT 'string',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `content_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text,
	`body` text,
	`status` text NOT NULL,
	`visibility` text NOT NULL,
	`password` text,
	`featured_image_id` integer,
	`published_at` integer,
	`scheduled_at` integer,
	`revision_number` integer NOT NULL,
	`author_id` integer NOT NULL,
	`changes_summary` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `content_filters` (
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
--> statement-breakpoint

-- ============================================================================
-- SEO
-- ============================================================================

CREATE TABLE IF NOT EXISTS `content_seo` (
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
CREATE UNIQUE INDEX IF NOT EXISTS `content_seo_content_id_unique` ON `content_seo` (`content_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `category_seo` (
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
CREATE UNIQUE INDEX IF NOT EXISTS `category_seo_category_id_unique` ON `category_seo` (`category_id`);
--> statement-breakpoint

-- ============================================================================
-- COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `comments` (
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

-- ============================================================================
-- MENUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `menus_slug_unique` ON `menus` (`slug`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `menu_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`menu_id` integer NOT NULL,
	`parent_id` integer,
	`label` text NOT NULL,
	`title` text,
	`url` text,
	`content_id` integer,
	`category_id` integer,
	`tag_id` integer,
	`icon` text,
	`css_class` text,
	`target` text DEFAULT '_self',
	`order` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`required_permission` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint

-- ============================================================================
-- SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`category` text DEFAULT 'general' NOT NULL,
	`autoload` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `settings_key_unique` ON `settings` (`key`);
--> statement-breakpoint

-- ============================================================================
-- PLUGINS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `plugins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`settings` text,
	`installed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `plugins_name_unique` ON `plugins` (`name`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `plugin_hooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plugin_id` integer NOT NULL,
	`hook_name` text NOT NULL,
	`priority` integer DEFAULT 10 NOT NULL,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer REFERENCES `users`(`id`) ON DELETE SET NULL,
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
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_logs_entity_idx` ON `audit_logs` (`entity`, `entity_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_logs_action_idx` ON `audit_logs` (`action`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_logs_level_idx` ON `audit_logs` (`level`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_logs_created_at_idx` ON `audit_logs` (`created_at` DESC);
--> statement-breakpoint

-- ============================================================================
-- WEBHOOKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `secret` text,
  `events` text NOT NULL,
  `is_active` integer DEFAULT 1 NOT NULL,
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

CREATE TABLE IF NOT EXISTS `webhook_deliveries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `webhook_id` integer NOT NULL REFERENCES `webhooks`(`id`) ON DELETE CASCADE,
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
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `webhooks_is_active_idx` ON `webhooks` (`is_active`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `webhooks_events_idx` ON `webhooks` (`events`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `webhook_deliveries_webhook_id_idx` ON `webhook_deliveries` (`webhook_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `webhook_deliveries_status_idx` ON `webhook_deliveries` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `webhook_deliveries_next_retry_idx` ON `webhook_deliveries` (`next_retry_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `webhook_deliveries_event_idx` ON `webhook_deliveries` (`event`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `webhook_deliveries_created_at_idx` ON `webhook_deliveries` (`created_at` DESC);
--> statement-breakpoint

-- ============================================================================
-- EMAIL AND NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `email_queue` (
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
CREATE INDEX IF NOT EXISTS `email_queue_status_idx` ON `email_queue` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_queue_priority_idx` ON `email_queue` (`priority`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_queue_next_retry_idx` ON `email_queue` (`next_retry_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_queue_created_at_idx` ON `email_queue` (`created_at` DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL UNIQUE,
  `subject` text NOT NULL,
  `text_template` text NOT NULL,
  `html_template` text NOT NULL,
  `variables` text,
  `description` text,
  `category` text,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_templates_name_idx` ON `email_templates` (`name`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_templates_category_idx` ON `email_templates` (`category`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_templates_is_active_idx` ON `email_templates` (`is_active`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `notifications` (
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
  `is_read` integer DEFAULT 0 NOT NULL,
  `read_at` integer,
  `email_sent` integer DEFAULT 0 NOT NULL,
  `email_sent_at` integer,
  `priority` text DEFAULT 'normal' NOT NULL,
  `expires_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `notifications_user_id_idx` ON `notifications` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `notifications_type_idx` ON `notifications` (`type`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `notifications_is_read_idx` ON `notifications` (`is_read`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `notifications_priority_idx` ON `notifications` (`priority`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `notifications_created_at_idx` ON `notifications` (`created_at` DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL UNIQUE,
  `email_notifications` integer DEFAULT 1 NOT NULL,
  `email_digest` text DEFAULT 'daily' NOT NULL,
  `notify_comments` integer DEFAULT 1 NOT NULL,
  `notify_replies` integer DEFAULT 1 NOT NULL,
  `notify_mentions` integer DEFAULT 1 NOT NULL,
  `notify_content_published` integer DEFAULT 1 NOT NULL,
  `notify_system_alerts` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `notification_preferences_user_id_idx` ON `notification_preferences` (`user_id`);
--> statement-breakpoint

-- ============================================================================
-- BACKUPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `backups` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `filename` text NOT NULL,
  `type` text NOT NULL,
  `size` integer NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `storage_provider` text DEFAULT 'local' NOT NULL,
  `storage_path` text NOT NULL,
  `compressed` integer DEFAULT 1 NOT NULL,
  `includes_media` integer DEFAULT 0 NOT NULL,
  `includes_database` integer DEFAULT 0 NOT NULL,
  `includes_config` integer DEFAULT 0 NOT NULL,
  `checksum` text NOT NULL,
  `error` text,
  `started_at` integer NOT NULL,
  `completed_at` integer,
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `backups_type_idx` ON `backups` (`type`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `backups_status_idx` ON `backups` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `backups_created_at_idx` ON `backups` (`created_at` DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `backups_storage_provider_idx` ON `backups` (`storage_provider`);
--> statement-breakpoint

-- ============================================================================
-- SECURITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS `ip_block_rules` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ip` text NOT NULL UNIQUE,
  `type` text NOT NULL,
  `reason` text,
  `expires_at` integer,
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ip_block_rules_ip_idx` ON `ip_block_rules` (`ip`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ip_block_rules_type_idx` ON `ip_block_rules` (`type`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `ip_block_rules_expires_at_idx` ON `ip_block_rules` (`expires_at`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `security_events` (
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
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `security_events_type_idx` ON `security_events` (`type`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `security_events_ip_idx` ON `security_events` (`ip`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `security_events_severity_idx` ON `security_events` (`severity`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `security_events_created_at_idx` ON `security_events` (`created_at` DESC);
--> statement-breakpoint

-- ============================================================================
-- API KEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `key` text NOT NULL UNIQUE,
  `user_id` integer NOT NULL,
  `permissions` text NOT NULL,
  `rate_limit` integer,
  `expires_at` integer,
  `last_used_at` integer,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `api_keys_key_idx` ON `api_keys` (`key`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `api_keys_user_id_idx` ON `api_keys` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `api_keys_is_active_idx` ON `api_keys` (`is_active`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `api_keys_expires_at_idx` ON `api_keys` (`expires_at`);
--> statement-breakpoint

-- ============================================================================
-- BACKGROUND JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `jobs` (
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
CREATE INDEX IF NOT EXISTS `jobs_status_idx` ON `jobs` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_name_idx` ON `jobs` (`name`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_priority_idx` ON `jobs` (`priority`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_scheduled_for_idx` ON `jobs` (`scheduled_for`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `jobs_created_at_idx` ON `jobs` (`created_at` DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `scheduled_jobs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `schedule` text NOT NULL,
  `job_name` text NOT NULL,
  `job_data` text NOT NULL,
  `enabled` integer DEFAULT 1 NOT NULL,
  `last_run_at` integer,
  `next_run_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `scheduled_jobs_enabled_idx` ON `scheduled_jobs` (`enabled`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `scheduled_jobs_next_run_at_idx` ON `scheduled_jobs` (`next_run_at`);
--> statement-breakpoint

-- ============================================================================
-- INTERNATIONALIZATION (I18N)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `languages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `code` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `native_name` text NOT NULL,
  `is_default` integer DEFAULT 0 NOT NULL,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `content_translations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `content_id` integer NOT NULL,
  `language_code` text NOT NULL,
  `title` text NOT NULL,
  `slug` text NOT NULL,
  `body` text,
  `excerpt` text,
  `meta_title` text,
  `meta_description` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer,
  FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`language_code`) REFERENCES `languages`(`code`) ON DELETE CASCADE,
  UNIQUE(`content_id`, `language_code`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `content_translations_content_id_idx` ON `content_translations` (`content_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `content_translations_language_code_idx` ON `content_translations` (`language_code`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `content_translations_slug_idx` ON `content_translations` (`slug`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `category_translations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `category_id` integer NOT NULL,
  `language_code` text NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`language_code`) REFERENCES `languages`(`code`) ON DELETE CASCADE,
  UNIQUE(`category_id`, `language_code`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `category_translations_category_id_idx` ON `category_translations` (`category_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `category_translations_language_code_idx` ON `category_translations` (`language_code`);
--> statement-breakpoint

-- ============================================================================
-- WORKFLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `workflows` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `content_type_id` integer,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `workflow_states` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workflow_id` integer NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `color` text,
  `is_initial` integer DEFAULT 0 NOT NULL,
  `is_final` integer DEFAULT 0 NOT NULL,
  `order` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `workflow_transitions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workflow_id` integer NOT NULL,
  `from_state_id` integer,
  `to_state_id` integer NOT NULL,
  `name` text NOT NULL,
  `required_role_id` integer,
  `requires_approval` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_state_id`) REFERENCES `workflow_states`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_state_id`) REFERENCES `workflow_states`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`required_role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `workflow_history` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `content_id` integer NOT NULL,
  `from_state_id` integer,
  `to_state_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `comment` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_state_id`) REFERENCES `workflow_states`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`to_state_id`) REFERENCES `workflow_states`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `workflow_history_content_id_idx` ON `workflow_history` (`content_id`);
--> statement-breakpoint

-- ============================================================================
-- FORMS BUILDER
-- ============================================================================

CREATE TABLE IF NOT EXISTS `forms` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `description` text,
  `fields` text NOT NULL,
  `settings` text,
  `is_active` integer DEFAULT 1 NOT NULL,
  `submit_button_text` text DEFAULT 'Submit',
  `success_message` text DEFAULT 'Form submitted successfully',
  `email_notifications` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `forms_slug_idx` ON `forms` (`slug`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `forms_is_active_idx` ON `forms` (`is_active`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `form_submissions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `form_id` integer NOT NULL,
  `data` text NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `user_id` integer,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `form_submissions_form_id_idx` ON `form_submissions` (`form_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `form_submissions_status_idx` ON `form_submissions` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `form_submissions_created_at_idx` ON `form_submissions` (`created_at` DESC);
--> statement-breakpoint

-- ============================================================================
-- INITIAL DATA: Email Templates
-- ============================================================================

INSERT OR IGNORE INTO `email_templates` (`name`, `subject`, `text_template`, `html_template`, `variables`, `category`, `description`)
VALUES (
  'welcome',
  'Welcome to {{site_name}}!',
  'Hi {{name}},\n\nWelcome to {{site_name}}! Your account has been successfully created.\n\nEmail: {{email}}\n\nYou can now log in at: {{login_url}}\n\nBest regards,\nThe {{site_name}} Team',
  '<h1>Welcome to {{site_name}}!</h1><p>Hi {{name}},</p><p>Welcome to {{site_name}}! Your account has been successfully created.</p><p><strong>Email:</strong> {{email}}</p><p><a href="{{login_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In</a></p><p>Best regards,<br>The {{site_name}} Team</p>',
  '["name", "email", "site_name", "login_url"]',
  'auth',
  'Welcome email sent to new users after registration'
);
--> statement-breakpoint

INSERT OR IGNORE INTO `email_templates` (`name`, `subject`, `text_template`, `html_template`, `variables`, `category`, `description`)
VALUES (
  'password_reset',
  'Reset your password - {{site_name}}',
  'Hi {{name}},\n\nYou requested to reset your password. Click the link below to create a new password:\n\n{{reset_url}}\n\nThis link will expire in {{expires_in}}.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe {{site_name}} Team',
  '<h1>Reset Your Password</h1><p>Hi {{name}},</p><p>You requested to reset your password. Click the button below to create a new password:</p><p><a href="{{reset_url}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p><p>This link will expire in {{expires_in}}.</p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>The {{site_name}} Team</p>',
  '["name", "reset_url", "expires_in", "site_name"]',
  'auth',
  'Password reset email with secure link'
);
--> statement-breakpoint

INSERT OR IGNORE INTO `email_templates` (`name`, `subject`, `text_template`, `html_template`, `variables`, `category`, `description`)
VALUES (
  'new_comment',
  'New comment on your post - {{site_name}}',
  'Hi {{author_name}},\n\n{{commenter_name}} commented on your post "{{post_title}}":\n\n{{comment_text}}\n\nView the comment: {{comment_url}}\n\nBest regards,\nThe {{site_name}} Team',
  '<h1>New Comment</h1><p>Hi {{author_name}},</p><p><strong>{{commenter_name}}</strong> commented on your post "<a href="{{post_url}}">{{post_title}}</a>":</p><blockquote style="border-left: 3px solid #ccc; padding-left: 15px; color: #666;">{{comment_text}}</blockquote><p><a href="{{comment_url}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Comment</a></p><p>Best regards,<br>The {{site_name}} Team</p>',
  '["author_name", "commenter_name", "post_title", "post_url", "comment_text", "comment_url", "site_name"]',
  'notification',
  'Notification sent when someone comments on user content'
);
--> statement-breakpoint

INSERT OR IGNORE INTO `email_templates` (`name`, `subject`, `text_template`, `html_template`, `variables`, `category`, `description`)
VALUES (
  'comment_reply',
  'New reply to your comment - {{site_name}}',
  'Hi {{recipient_name}},\n\n{{replier_name}} replied to your comment on "{{post_title}}":\n\n{{reply_text}}\n\nView the reply: {{reply_url}}\n\nBest regards,\nThe {{site_name}} Team',
  '<h1>New Reply</h1><p>Hi {{recipient_name}},</p><p><strong>{{replier_name}}</strong> replied to your comment on "<a href="{{post_url}}">{{post_title}}</a>":</p><blockquote style="border-left: 3px solid #ccc; padding-left: 15px; color: #666;">{{reply_text}}</blockquote><p><a href="{{reply_url}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Reply</a></p><p>Best regards,<br>The {{site_name}} Team</p>',
  '["recipient_name", "replier_name", "post_title", "post_url", "reply_text", "reply_url", "site_name"]',
  'notification',
  'Notification sent when someone replies to user comment'
);
--> statement-breakpoint

-- ============================================================================
-- INITIAL DATA: Languages
-- ============================================================================

INSERT OR IGNORE INTO languages (code, name, native_name, is_default, is_active) VALUES
  ('en', 'English', 'English', 1, 1),
  ('es', 'Spanish', 'Español', 0, 1),
  ('fr', 'French', 'Français', 0, 1);
--> statement-breakpoint
