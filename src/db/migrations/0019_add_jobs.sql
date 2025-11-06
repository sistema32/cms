-- Migration: Add Background Jobs
-- Created: 2025-01-06

-- ============= JOBS =============
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

CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);
CREATE INDEX `jobs_name_idx` ON `jobs` (`name`);
CREATE INDEX `jobs_priority_idx` ON `jobs` (`priority`);
CREATE INDEX `jobs_scheduled_for_idx` ON `jobs` (`scheduled_for`);
CREATE INDEX `jobs_created_at_idx` ON `jobs` (`created_at` DESC);

-- ============= SCHEDULED JOBS =============
CREATE TABLE `scheduled_jobs` (
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

CREATE INDEX `scheduled_jobs_enabled_idx` ON `scheduled_jobs` (`enabled`);
CREATE INDEX `scheduled_jobs_next_run_at_idx` ON `scheduled_jobs` (`next_run_at`);
