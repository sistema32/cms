-- Migration: Add audit logs table
-- Created: 2025-01-06

CREATE TABLE `audit_logs` (
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

-- Create indices for common queries
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity`, `entity_id`);
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);
CREATE INDEX `audit_logs_level_idx` ON `audit_logs` (`level`);
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at` DESC);
