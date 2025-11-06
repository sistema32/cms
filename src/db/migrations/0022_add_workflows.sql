-- Migration: Add Workflow System
-- Created: 2025-01-06

-- Workflow definitions
CREATE TABLE `workflows` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `content_type_id` integer,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON DELETE CASCADE
);

-- Workflow states
CREATE TABLE `workflow_states` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workflow_id` integer NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `color` text,
  `is_initial` integer DEFAULT 0 NOT NULL,
  `is_final` integer DEFAULT 0 NOT NULL,
  `order` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE CASCADE
);

-- Workflow transitions
CREATE TABLE `workflow_transitions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workflow_id` integer NOT NULL,
  `from_state_id` integer,
  `to_state_id` integer NOT NULL,
  `name` text NOT NULL,
  `required_role_id` integer,
  `requires_approval` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_state_id`) REFERENCES `workflow_states`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_state_id`) REFERENCES `workflow_states`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`required_role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
);

-- Content workflow state
ALTER TABLE content ADD COLUMN `workflow_state_id` integer REFERENCES `workflow_states`(`id`) ON DELETE SET NULL;

-- Workflow history
CREATE TABLE `workflow_history` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `content_id` integer NOT NULL,
  `from_state_id` integer,
  `to_state_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `comment` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_state_id`) REFERENCES `workflow_states`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`to_state_id`) REFERENCES `workflow_states`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE INDEX `workflow_history_content_id_idx` ON `workflow_history` (`content_id`);
