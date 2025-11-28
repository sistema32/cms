-- Migration: DB-first plugin tables
-- Created: 2025-11-27
-- Description: Introduces plugins, plugin_migrations, plugin_health tables (sqlite)

-- ============= PLUGINS =============
CREATE TABLE IF NOT EXISTS `plugins` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL UNIQUE,
  `display_name` text,
  `version` text,
  `description` text,
  `author` text,
  `homepage` text,
  `source_url` text,
  `manifest_hash` text,
  `status` text NOT NULL DEFAULT 'inactive',
  `is_system` integer NOT NULL DEFAULT 0,
  `settings` text,
  `permissions` text,
  `created_at` integer NOT NULL DEFAULT (unixepoch()),
  `updated_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint

-- ============= PLUGIN MIGRATIONS =============
CREATE TABLE IF NOT EXISTS `plugin_migrations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `plugin_id` integer NOT NULL,
  `name` text NOT NULL,
  `applied_at` integer NOT NULL DEFAULT (unixepoch()),
  CONSTRAINT `plugin_migrations_plugin_unique` UNIQUE (`plugin_id`, `name`),
  CONSTRAINT `plugin_migrations_plugin_id_plugins_id_fk` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint

-- ============= PLUGIN HEALTH =============
CREATE TABLE IF NOT EXISTS `plugin_health` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `plugin_id` integer NOT NULL,
  `status` text NOT NULL DEFAULT 'ok',
  `last_checked_at` integer,
  `last_error` text,
  CONSTRAINT `plugin_health_plugin_id_plugins_id_fk` FOREIGN KEY (`plugin_id`) REFERENCES `plugins` (`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint

