-- Migration: Add Security Admin Panel Tables and Columns
-- Created: 2025-01-19
-- Description: Adds new security management tables and updates security_events

-- ============= UPDATE SECURITY EVENTS TABLE =============
-- Add new columns to security_events (only if they don't exist)
ALTER TABLE `security_events` ADD COLUMN `rule_id` integer;
--> statement-breakpoint
ALTER TABLE `security_events` ADD COLUMN `blocked` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `security_events` ADD COLUMN `referer` text;
--> statement-breakpoint

-- ============= RATE LIMIT RULES TABLE =============
CREATE TABLE IF NOT EXISTS `rate_limit_rules` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `path` text NOT NULL,
  `method` text,
  `max_requests` integer NOT NULL,
  `window_seconds` integer NOT NULL,
  `enabled` integer DEFAULT 1 NOT NULL,
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `rate_limit_rules_path_idx` ON `rate_limit_rules` (`path`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `rate_limit_rules_enabled_idx` ON `rate_limit_rules` (`enabled`);
--> statement-breakpoint

-- ============= SECURITY RULES TABLE =============
CREATE TABLE IF NOT EXISTS `security_rules` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `pattern` text NOT NULL,
  `action` text NOT NULL,
  `severity` text DEFAULT 'medium' NOT NULL,
  `enabled` integer DEFAULT 1 NOT NULL,
  `trigger_count` integer DEFAULT 0 NOT NULL,
  `description` text,
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `security_rules_type_idx` ON `security_rules` (`type`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `security_rules_enabled_idx` ON `security_rules` (`enabled`);
--> statement-breakpoint

-- ============= SECURITY SETTINGS TABLE =============
CREATE TABLE IF NOT EXISTS `security_settings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `key` text NOT NULL UNIQUE,
  `value` text NOT NULL,
  `type` text DEFAULT 'string' NOT NULL,
  `category` text DEFAULT 'general' NOT NULL,
  `description` text,
  `updated_by` integer,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `security_settings_key_idx` ON `security_settings` (`key`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `security_settings_category_idx` ON `security_settings` (`category`);
--> statement-breakpoint

-- ============= ADD FOREIGN KEY FOR RULE_ID =============
-- Note: SQLite doesn't support adding foreign keys to existing tables
-- The foreign key will be enforced at the application level
