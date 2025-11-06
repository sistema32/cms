-- Migration: Add Forms Builder
-- Created: 2025-01-06

-- Forms
CREATE TABLE `forms` (
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

CREATE INDEX `forms_slug_idx` ON `forms` (`slug`);
CREATE INDEX `forms_is_active_idx` ON `forms` (`is_active`);

-- Form submissions
CREATE TABLE `form_submissions` (
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

CREATE INDEX `form_submissions_form_id_idx` ON `form_submissions` (`form_id`);
CREATE INDEX `form_submissions_status_idx` ON `form_submissions` (`status`);
CREATE INDEX `form_submissions_created_at_idx` ON `form_submissions` (`created_at` DESC);
