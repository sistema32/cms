-- Migration: Add Media Folders and Metadata
-- Created: 2025-01-06

-- Media Folders
CREATE TABLE `media_folders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `parent_id` integer,
  `path` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer,
  FOREIGN KEY (`parent_id`) REFERENCES `media_folders`(`id`) ON DELETE CASCADE
);

CREATE INDEX `media_folders_parent_id_idx` ON `media_folders` (`parent_id`);
CREATE INDEX `media_folders_path_idx` ON `media_folders` (`path`);

-- Add folder_id to media table
ALTER TABLE media ADD COLUMN `folder_id` integer REFERENCES `media_folders`(`id`) ON DELETE SET NULL;
CREATE INDEX `media_folder_id_idx` ON `media` (`folder_id`);

-- Media metadata (dimensions, EXIF, etc.)
ALTER TABLE media ADD COLUMN `width` integer;
ALTER TABLE media ADD COLUMN `height` integer;
ALTER TABLE media ADD COLUMN `duration` integer;
ALTER TABLE media ADD COLUMN `metadata` text;
