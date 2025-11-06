-- Migration: Add Security System
-- Created: 2025-01-06

-- ============= IP BLOCK RULES =============
CREATE TABLE `ip_block_rules` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ip` text NOT NULL UNIQUE,
  `type` text NOT NULL,
  `reason` text,
  `expires_at` integer,
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE INDEX `ip_block_rules_ip_idx` ON `ip_block_rules` (`ip`);
CREATE INDEX `ip_block_rules_type_idx` ON `ip_block_rules` (`type`);
CREATE INDEX `ip_block_rules_expires_at_idx` ON `ip_block_rules` (`expires_at`);

-- ============= SECURITY EVENTS =============
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
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE INDEX `security_events_type_idx` ON `security_events` (`type`);
CREATE INDEX `security_events_ip_idx` ON `security_events` (`ip`);
CREATE INDEX `security_events_severity_idx` ON `security_events` (`severity`);
CREATE INDEX `security_events_created_at_idx` ON `security_events` (`created_at` DESC);
