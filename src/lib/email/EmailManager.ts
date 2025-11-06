/**
 * Email Manager
 * Manages email sending, queueing, and provider selection
 */

import { db } from "../../config/db.ts";
import { emailQueue, emailTemplates } from "../../db/schema.ts";
import type { NewEmailQueue } from "../../db/schema.ts";
import { eq, and, lte, or } from "drizzle-orm";
import { env } from "../../config/env.ts";
import type {
  EmailOptions,
  EmailProvider,
  EmailQueueItem,
  IEmailProvider,
  SendEmailResult,
  EmailTemplate,
  EmailTemplateVariables,
} from "./types.ts";
import { ConsoleProvider } from "./providers/ConsoleProvider.ts";
import { SMTPProvider } from "./providers/SMTPProvider.ts";

export class EmailManager {
  private static instance: EmailManager;
  private provider: IEmailProvider;
  private queueProcessor?: number;
  private isProcessing = false;

  private constructor() {
    this.provider = this.initializeProvider();
    this.startQueueProcessor();
  }

  static getInstance(): EmailManager {
    if (!EmailManager.instance) {
      EmailManager.instance = new EmailManager();
    }
    return EmailManager.instance;
  }

  /**
   * Initialize email provider based on environment configuration
   */
  private initializeProvider(): IEmailProvider {
    const provider = env.EMAIL_PROVIDER as EmailProvider || "console";
    const isDevelopment = env.DENO_ENV === "development";

    // In development, always use console provider
    if (isDevelopment) {
      console.log("📧 Email: Using ConsoleProvider (development mode)");
      return new ConsoleProvider();
    }

    // In production, use configured provider
    switch (provider) {
      case "smtp":
        console.log("📧 Email: Using SMTPProvider");
        return new SMTPProvider({
          host: env.SMTP_HOST || "localhost",
          port: parseInt(env.SMTP_PORT || "587"),
          secure: env.SMTP_SECURE === "true",
          auth: {
            user: env.SMTP_USER || "",
            pass: env.SMTP_PASS || "",
          },
          from: {
            email: env.EMAIL_FROM || "noreply@example.com",
            name: env.EMAIL_FROM_NAME || "LexCMS",
          },
        });

      case "console":
      default:
        console.log("📧 Email: Using ConsoleProvider");
        return new ConsoleProvider();
    }
  }

  /**
   * Send email immediately (not queued)
   */
  async sendNow(options: EmailOptions): Promise<SendEmailResult> {
    try {
      // Set default from if not provided
      if (!options.from) {
        options.from = {
          email: env.EMAIL_FROM || "noreply@example.com",
          name: env.EMAIL_FROM_NAME || "LexCMS",
        };
      }

      const result = await this.provider.send(options);

      // Log in development
      if (env.DENO_ENV === "development") {
        console.log(`✉️ Email sent: ${options.subject} -> ${result.success ? "✓" : "✗"}`);
      }

      return result;
    } catch (error) {
      console.error("Failed to send email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Queue email for later delivery
   */
  async queue(
    options: EmailOptions,
    priority: "high" | "normal" | "low" = "normal",
    maxAttempts = 3,
  ): Promise<number> {
    try {
      // Set default from if not provided
      if (!options.from) {
        options.from = {
          email: env.EMAIL_FROM || "noreply@example.com",
          name: env.EMAIL_FROM_NAME || "LexCMS",
        };
      }

      const toArray = Array.isArray(options.to) ? options.to : [options.to];

      const [queueItem] = await db.insert(emailQueue).values({
        to: JSON.stringify(toArray),
        from: options.from ? JSON.stringify(options.from) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments ? JSON.stringify(options.attachments) : undefined,
        headers: options.headers ? JSON.stringify(options.headers) : undefined,
        priority,
        status: "pending",
        attempts: 0,
        maxAttempts,
        provider: env.EMAIL_PROVIDER || "console",
      }).returning();

      // Log in development
      if (env.DENO_ENV === "development") {
        console.log(`📬 Email queued [${priority}]: ${options.subject} (ID: ${queueItem.id})`);
      }

      return queueItem.id;
    } catch (error) {
      console.error("Failed to queue email:", error);
      throw error;
    }
  }

  /**
   * Send email using template
   */
  async sendWithTemplate(
    templateName: string,
    to: EmailOptions["to"],
    variables: EmailTemplateVariables,
    options: Partial<EmailOptions> = {},
  ): Promise<SendEmailResult> {
    try {
      const template = await this.getTemplate(templateName);

      if (!template) {
        return {
          success: false,
          error: `Template '${templateName}' not found`,
        };
      }

      if (!template.isActive) {
        return {
          success: false,
          error: `Template '${templateName}' is not active`,
        };
      }

      // Render template
      const subject = this.renderTemplate(template.subject, variables);
      const text = this.renderTemplate(template.textTemplate, variables);
      const html = this.renderTemplate(template.htmlTemplate, variables);

      return await this.sendNow({
        ...options,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error("Failed to send email with template:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Queue email using template
   */
  async queueWithTemplate(
    templateName: string,
    to: EmailOptions["to"],
    variables: EmailTemplateVariables,
    priority: "high" | "normal" | "low" = "normal",
    options: Partial<EmailOptions> = {},
  ): Promise<number> {
    const template = await this.getTemplate(templateName);

    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    if (!template.isActive) {
      throw new Error(`Template '${templateName}' is not active`);
    }

    // Render template
    const subject = this.renderTemplate(template.subject, variables);
    const text = this.renderTemplate(template.textTemplate, variables);
    const html = this.renderTemplate(template.htmlTemplate, variables);

    return await this.queue({
      ...options,
      to,
      subject,
      text,
      html,
    }, priority);
  }

  /**
   * Get email template by name
   */
  private async getTemplate(name: string): Promise<EmailTemplate | null> {
    const template = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.name, name),
    });

    if (!template) {
      return null;
    }

    return {
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : [],
    };
  }

  /**
   * Render template with variables
   * Replaces {{variable}} with actual values
   */
  private renderTemplate(template: string, variables: EmailTemplateVariables): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      rendered = rendered.replace(regex, String(value ?? ""));
    }

    return rendered;
  }

  /**
   * Start queue processor (runs every minute)
   */
  private startQueueProcessor(): void {
    this.queueProcessor = setInterval(async () => {
      await this.processQueue();
    }, 60000); // Every minute

    console.log("📧 Email queue processor started");
  }

  /**
   * Stop queue processor
   */
  stopQueueProcessor(): void {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      console.log("📧 Email queue processor stopped");
    }
  }

  /**
   * Process pending emails in queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;

    try {
      // Get pending emails (either never tried or ready for retry)
      const pendingEmails = await db.query.emailQueue.findMany({
        where: and(
          eq(emailQueue.status, "pending"),
          or(
            eq(emailQueue.attempts, 0),
            lte(emailQueue.nextRetryAt, new Date()),
          ),
        ),
        orderBy: (emailQueue, { desc }) => [
          desc(emailQueue.priority),
          emailQueue.createdAt,
        ],
        limit: 10, // Process 10 at a time
      });

      for (const email of pendingEmails) {
        await this.processQueuedEmail(email);
      }
    } catch (error) {
      console.error("Error processing email queue:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single queued email
   */
  private async processQueuedEmail(email: EmailQueueItem): Promise<void> {
    try {
      // Mark as processing
      await db.update(emailQueue)
        .set({ status: "processing", lastAttemptAt: new Date() })
        .where(eq(emailQueue.id, email.id!));

      // Parse data
      const to = JSON.parse(email.to);
      const from = email.from ? JSON.parse(email.from) : undefined;
      const attachments = email.attachments ? JSON.parse(email.attachments) : undefined;
      const headers = email.headers ? JSON.parse(email.headers) : undefined;

      // Send email
      const result = await this.sendNow({
        to,
        from,
        subject: email.subject,
        text: email.text || undefined,
        html: email.html || undefined,
        attachments,
        headers,
        priority: email.priority as "high" | "normal" | "low",
      });

      if (result.success) {
        // Mark as sent
        await db.update(emailQueue)
          .set({
            status: "sent",
            sentAt: new Date(),
            providerMessageId: result.messageId,
          })
          .where(eq(emailQueue.id, email.id!));

        console.log(`✉️ Email sent from queue: ${email.subject} (ID: ${email.id})`);
      } else {
        // Handle failure
        await this.handleQueuedEmailFailure(email, result.error || "Unknown error");
      }
    } catch (error) {
      console.error(`Failed to process queued email ${email.id}:`, error);
      await this.handleQueuedEmailFailure(
        email,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Handle failed queued email
   */
  private async handleQueuedEmailFailure(email: EmailQueueItem, error: string): Promise<void> {
    const attempts = email.attempts + 1;

    if (attempts >= email.maxAttempts) {
      // Max attempts reached - mark as failed
      await db.update(emailQueue)
        .set({
          status: "failed",
          attempts,
          error,
        })
        .where(eq(emailQueue.id, email.id!));

      console.error(`✗ Email failed permanently: ${email.subject} (ID: ${email.id})`);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, attempts) * 60 * 1000; // 2^attempts minutes
      const nextRetryAt = new Date(Date.now() + retryDelay);

      await db.update(emailQueue)
        .set({
          status: "pending",
          attempts,
          error,
          nextRetryAt,
        })
        .where(eq(emailQueue.id, email.id!));

      console.log(
        `⟳ Email retry scheduled: ${email.subject} (ID: ${email.id}, attempt ${attempts}/${email.maxAttempts})`,
      );
    }
  }

  /**
   * Verify provider connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      return await this.provider.verify();
    } catch (error) {
      console.error("Email provider verification failed:", error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    const allEmails = await db.select().from(emailQueue);

    return {
      total: allEmails.length,
      pending: allEmails.filter((e) => e.status === "pending").length,
      processing: allEmails.filter((e) => e.status === "processing").length,
      sent: allEmails.filter((e) => e.status === "sent").length,
      failed: allEmails.filter((e) => e.status === "failed").length,
      cancelled: allEmails.filter((e) => e.status === "cancelled").length,
    };
  }
}

// Export singleton instance
export const emailManager = EmailManager.getInstance();
