/**
 * Email and Notification System Types
 */

// Email Provider Types
export type EmailProvider = "smtp" | "sendgrid" | "mailgun" | "resend" | "console";

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Uint8Array | string;
  contentType: string;
  encoding?: "base64" | "utf-8";
}

export interface EmailOptions {
  to: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  replyTo?: EmailAddress;
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: "high" | "normal" | "low";
  tags?: string[];
}

export interface EmailTemplate {
  id?: number;
  name: string;
  subject: string;
  textTemplate: string;
  htmlTemplate: string;
  variables?: string[]; // List of expected variables like {{name}}, {{url}}
  description?: string;
  category?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailQueueItem {
  id?: number;
  to: string; // JSON stringified EmailAddress[]
  from?: string; // JSON stringified EmailAddress
  subject: string;
  text?: string;
  html?: string;
  attachments?: string; // JSON stringified
  headers?: string; // JSON stringified
  priority: "high" | "normal" | "low";
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  sentAt?: Date;
  error?: string;
  provider?: EmailProvider;
  providerMessageId?: string;
  metadata?: string; // JSON stringified
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email Provider Interface
export interface IEmailProvider {
  send(options: EmailOptions): Promise<SendEmailResult>;
  verify(): Promise<boolean>;
}

// SMTP Configuration
export interface SMTPConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: EmailAddress;
}

// SendGrid Configuration
export interface SendGridConfig {
  apiKey: string;
  from: EmailAddress;
}

// Mailgun Configuration
export interface MailgunConfig {
  apiKey: string;
  domain: string;
  from: EmailAddress;
}

// Resend Configuration
export interface ResendConfig {
  apiKey: string;
  from: EmailAddress;
}

// Notification Types
export type NotificationType =
  | "comment.new"
  | "comment.reply"
  | "mention"
  | "content.published"
  | "content.updated"
  | "user.welcome"
  | "user.password_reset"
  | "user.email_verification"
  | "user.role_changed"
  | "system.backup_completed"
  | "system.error"
  | "system.warning"
  | "custom";

export interface Notification {
  id?: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  actionLabel?: string;
  actionUrl?: string;
  data?: string; // JSON stringified additional data
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  priority: "low" | "normal" | "high";
  expiresAt?: Date;
  createdAt?: Date;
}

export interface NotificationPreferences {
  id?: number;
  userId: number;
  emailNotifications: boolean;
  emailDigest: "never" | "daily" | "weekly";
  notifyComments: boolean;
  notifyReplies: boolean;
  notifyMentions: boolean;
  notifyContentPublished: boolean;
  notifySystemAlerts: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  actionLabel?: string;
  actionUrl?: string;
  data?: Record<string, any>;
  priority?: "low" | "normal" | "high";
  expiresAt?: Date;
  sendEmail?: boolean;
}

export interface NotificationFilter {
  userId?: number;
  type?: NotificationType;
  isRead?: boolean;
  priority?: "low" | "normal" | "high";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface EmailTemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}
