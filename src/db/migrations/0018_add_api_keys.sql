-- Migration: Add API Keys
-- Created: 2025-01-06

-- ============= API KEYS =============
CREATE TABLE `api_keys` (
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

CREATE INDEX `api_keys_key_idx` ON `api_keys` (`key`);
CREATE INDEX `api_keys_user_id_idx` ON `api_keys` (`user_id`);
CREATE INDEX `api_keys_is_active_idx` ON `api_keys` (`is_active`);
CREATE INDEX `api_keys_expires_at_idx` ON `api_keys` (`expires_at`);
