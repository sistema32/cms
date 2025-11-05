ALTER TABLE `settings` ADD `category` text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `two_factor_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `two_factor_secret` text;