-- Migration: Add webhooks and webhook deliveries tables
-- Created: 2025-01-06

CREATE TABLE `webhooks` (
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

CREATE TABLE `webhook_deliveries` (
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

-- Create indices for common queries
CREATE INDEX `webhooks_is_active_idx` ON `webhooks` (`is_active`);
CREATE INDEX `webhooks_events_idx` ON `webhooks` (`events`);
CREATE INDEX `webhook_deliveries_webhook_id_idx` ON `webhook_deliveries` (`webhook_id`);
CREATE INDEX `webhook_deliveries_status_idx` ON `webhook_deliveries` (`status`);
CREATE INDEX `webhook_deliveries_next_retry_idx` ON `webhook_deliveries` (`next_retry_at`);
CREATE INDEX `webhook_deliveries_event_idx` ON `webhook_deliveries` (`event`);
CREATE INDEX `webhook_deliveries_created_at_idx` ON `webhook_deliveries` (`created_at` DESC);
