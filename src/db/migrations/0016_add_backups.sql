-- Migration: Add Backup System
-- Created: 2025-01-06

-- ============= BACKUPS =============
CREATE TABLE `backups` (
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
CREATE INDEX `backups_type_idx` ON `backups` (`type`);
--> statement-breakpoint
CREATE INDEX `backups_status_idx` ON `backups` (`status`);
--> statement-breakpoint
CREATE INDEX `backups_created_at_idx` ON `backups` (`created_at` DESC);
--> statement-breakpoint
CREATE INDEX `backups_storage_provider_idx` ON `backups` (`storage_provider`);
