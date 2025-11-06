-- Migration: Add Multi-language Support
-- Created: 2025-01-06

-- Languages
CREATE TABLE `languages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `code` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `native_name` text NOT NULL,
  `is_default` integer DEFAULT 0 NOT NULL,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- Insert default languages
INSERT INTO languages (code, name, native_name, is_default, is_active) VALUES
  ('en', 'English', 'English', 1, 1),
  ('es', 'Spanish', 'Español', 0, 1),
  ('fr', 'French', 'Français', 0, 1);

-- Content translations
CREATE TABLE `content_translations` (
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

CREATE INDEX `content_translations_content_id_idx` ON `content_translations` (`content_id`);
CREATE INDEX `content_translations_language_code_idx` ON `content_translations` (`language_code`);
CREATE INDEX `content_translations_slug_idx` ON `content_translations` (`slug`);

-- Category translations
CREATE TABLE `category_translations` (
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

CREATE INDEX `category_translations_category_id_idx` ON `category_translations` (`category_id`);
CREATE INDEX `category_translations_language_code_idx` ON `category_translations` (`language_code`);
