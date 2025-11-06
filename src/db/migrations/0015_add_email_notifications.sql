-- Migration: Add Email and Notification System
-- Created: 2025-01-06

-- ============= EMAIL QUEUE =============
CREATE TABLE `email_queue` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `to` text NOT NULL,
  `from` text,
  `subject` text NOT NULL,
  `text` text,
  `html` text,
  `attachments` text,
  `headers` text,
  `priority` text DEFAULT 'normal' NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `max_attempts` integer DEFAULT 3 NOT NULL,
  `last_attempt_at` integer,
  `next_retry_at` integer,
  `sent_at` integer,
  `error` text,
  `provider` text,
  `provider_message_id` text,
  `metadata` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `email_queue_status_idx` ON `email_queue` (`status`);
CREATE INDEX `email_queue_priority_idx` ON `email_queue` (`priority`);
CREATE INDEX `email_queue_next_retry_idx` ON `email_queue` (`next_retry_at`);
CREATE INDEX `email_queue_created_at_idx` ON `email_queue` (`created_at` DESC);

-- ============= EMAIL TEMPLATES =============
CREATE TABLE `email_templates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL UNIQUE,
  `subject` text NOT NULL,
  `text_template` text NOT NULL,
  `html_template` text NOT NULL,
  `variables` text,
  `description` text,
  `category` text,
  `is_active` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX `email_templates_name_idx` ON `email_templates` (`name`);
CREATE INDEX `email_templates_category_idx` ON `email_templates` (`category`);
CREATE INDEX `email_templates_is_active_idx` ON `email_templates` (`is_active`);

-- ============= NOTIFICATIONS =============
CREATE TABLE `notifications` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL,
  `type` text NOT NULL,
  `title` text NOT NULL,
  `message` text NOT NULL,
  `icon` text,
  `link` text,
  `action_label` text,
  `action_url` text,
  `data` text,
  `is_read` integer DEFAULT 0 NOT NULL,
  `read_at` integer,
  `email_sent` integer DEFAULT 0 NOT NULL,
  `email_sent_at` integer,
  `priority` text DEFAULT 'normal' NOT NULL,
  `expires_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);
CREATE INDEX `notifications_type_idx` ON `notifications` (`type`);
CREATE INDEX `notifications_is_read_idx` ON `notifications` (`is_read`);
CREATE INDEX `notifications_priority_idx` ON `notifications` (`priority`);
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`created_at` DESC);

-- ============= NOTIFICATION PREFERENCES =============
CREATE TABLE `notification_preferences` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL UNIQUE,
  `email_notifications` integer DEFAULT 1 NOT NULL,
  `email_digest` text DEFAULT 'daily' NOT NULL,
  `notify_comments` integer DEFAULT 1 NOT NULL,
  `notify_replies` integer DEFAULT 1 NOT NULL,
  `notify_mentions` integer DEFAULT 1 NOT NULL,
  `notify_content_published` integer DEFAULT 1 NOT NULL,
  `notify_system_alerts` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE INDEX `notification_preferences_user_id_idx` ON `notification_preferences` (`user_id`);

-- ============= INSERT DEFAULT EMAIL TEMPLATES =============
INSERT INTO `email_templates` (`name`, `subject`, `text_template`, `html_template`, `variables`, `category`, `description`)
VALUES (
  'welcome',
  'Welcome to {{site_name}}!',
  'Hi {{name}},\n\nWelcome to {{site_name}}! Your account has been successfully created.\n\nEmail: {{email}}\n\nYou can now log in at: {{login_url}}\n\nBest regards,\nThe {{site_name}} Team',
  '<h1>Welcome to {{site_name}}!</h1><p>Hi {{name}},</p><p>Welcome to {{site_name}}! Your account has been successfully created.</p><p><strong>Email:</strong> {{email}}</p><p><a href="{{login_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In</a></p><p>Best regards,<br>The {{site_name}} Team</p>',
  '["name", "email", "site_name", "login_url"]',
  'auth',
  'Welcome email sent to new users after registration'
);

INSERT INTO `email_templates` (`name`, `subject`, `text_template`, `html_template`, `variables`, `category`, `description`)
VALUES (
  'password_reset',
  'Reset your password - {{site_name}}',
  'Hi {{name}},\n\nYou requested to reset your password. Click the link below to create a new password:\n\n{{reset_url}}\n\nThis link will expire in {{expires_in}}.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe {{site_name}} Team',
  '<h1>Reset Your Password</h1><p>Hi {{name}},</p><p>You requested to reset your password. Click the button below to create a new password:</p><p><a href="{{reset_url}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p><p>This link will expire in {{expires_in}}.</p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>The {{site_name}} Team</p>',
  '["name", "reset_url", "expires_in", "site_name"]',
  'auth',
  'Password reset email with secure link'
);

INSERT INTO `email_templates` (`name`, `subject`, `text_template`, `html_template`, `variables`, `category`, `description`)
VALUES (
  'new_comment',
  'New comment on your post - {{site_name}}',
  'Hi {{author_name}},\n\n{{commenter_name}} commented on your post "{{post_title}}":\n\n{{comment_text}}\n\nView the comment: {{comment_url}}\n\nBest regards,\nThe {{site_name}} Team',
  '<h1>New Comment</h1><p>Hi {{author_name}},</p><p><strong>{{commenter_name}}</strong> commented on your post "<a href="{{post_url}}">{{post_title}}</a>":</p><blockquote style="border-left: 3px solid #ccc; padding-left: 15px; color: #666;">{{comment_text}}</blockquote><p><a href="{{comment_url}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Comment</a></p><p>Best regards,<br>The {{site_name}} Team</p>',
  '["author_name", "commenter_name", "post_title", "post_url", "comment_text", "comment_url", "site_name"]',
  'notification',
  'Notification sent when someone comments on user content'
);

INSERT INTO `email_templates` (`name`, `subject`, `text_template`, `html_template`, `variables`, `category`, `description`)
VALUES (
  'comment_reply',
  'New reply to your comment - {{site_name}}',
  'Hi {{recipient_name}},\n\n{{replier_name}} replied to your comment on "{{post_title}}":\n\n{{reply_text}}\n\nView the reply: {{reply_url}}\n\nBest regards,\nThe {{site_name}} Team',
  '<h1>New Reply</h1><p>Hi {{recipient_name}},</p><p><strong>{{replier_name}}</strong> replied to your comment on "<a href="{{post_url}}">{{post_title}}</a>":</p><blockquote style="border-left: 3px solid #ccc; padding-left: 15px; color: #666;">{{reply_text}}</blockquote><p><a href="{{reply_url}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Reply</a></p><p>Best regards,<br>The {{site_name}} Team</p>',
  '["recipient_name", "replier_name", "post_title", "post_url", "reply_text", "reply_url", "site_name"]',
  'notification',
  'Notification sent when someone replies to user comment'
);
