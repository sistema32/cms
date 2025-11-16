-- Migration: Add Page Templates
-- Created: 2025-01-16
-- Description: Adds template field to content table for custom page templates

-- Add template column to content table
ALTER TABLE `content` ADD COLUMN `template` text;

-- Create index for faster template lookups
CREATE INDEX `content_template_idx` ON `content` (`template`);
