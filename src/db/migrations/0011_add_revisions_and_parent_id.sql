-- Agregar campo parent_id a la tabla content para páginas hijas
ALTER TABLE `content` ADD `parent_id` integer;--> statement-breakpoint

-- Crear tabla content_revisions para historial de versiones
CREATE TABLE `content_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text,
	`body` text,
	`status` text NOT NULL,
	`visibility` text NOT NULL,
	`password` text,
	`featured_image_id` integer,
	`published_at` integer,
	`scheduled_at` integer,
	`revision_number` integer NOT NULL,
	`author_id` integer NOT NULL,
	`changes_summary` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
