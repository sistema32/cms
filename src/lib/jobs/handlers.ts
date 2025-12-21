/**
 * Built-in Job Handlers
 * Common job types for the CMS
 */

import { jobQueue } from "./JobQueue.ts";
import { emailManager } from "../email/index.ts";
import { backupManager } from "../backup/index.ts";
import { webhookManager } from "../webhooks/WebhookManager.ts";

/**
 * Register all built-in job handlers
 */
export function registerBuiltInHandlers(): void {
  // Email sending job
  jobQueue.registerHandler("send-email", async (data) => {
    const { to, subject, body, from } = data;
    await emailManager.sendNow({ to, subject, html: body, from });
    return { sent: true, to };
  });

  // Backup creation job
  jobQueue.registerHandler("create-backup", async (data) => {
    const { type, includeMedia } = data;
    const backupId = await backupManager.createBackup({ type, includeMedia });
    return { backupId };
  });

  // Webhook delivery job
  jobQueue.registerHandler("deliver-webhook", async (data) => {
    const { webhookId, event, payload } = data;
    await webhookManager.dispatch(webhookId, event, payload);
    return { delivered: true };
  });

  // Content indexing job
  jobQueue.registerHandler("index-content", async (data) => {
    const { contentId } = data;
    // Index content for search
    // This would integrate with search service
    return { indexed: true, contentId };
  });

  // Image optimization job
  jobQueue.registerHandler("optimize-image", async (data) => {
    const { imagePath, quality } = data;
    // Optimize image
    // This would use image processing library
    return { optimized: true, imagePath };
  });

  console.log("✅ Registered built-in job handlers");
}
