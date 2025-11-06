/**
 * Job Queue Manager
 * Background job processing with retries, scheduling, and concurrency control
 */

import type {
  Job,
  JobOptions,
  JobHandler,
  JobStatus,
  QueueConfig,
  QueueStats,
  JobEvent,
  JobEventListener,
} from "./types.ts";
import { db } from "../../db/db.ts";
import { jobs } from "../../db/schema.ts";
import { eq, and, lte, or } from "drizzle-orm";

export class JobQueue {
  private static instance: JobQueue;
  private handlers = new Map<string, JobHandler>();
  private config: Required<QueueConfig>;
  private processInterval?: number;
  private cleanupInterval?: number;
  private activeJobs = new Set<number>();
  private listeners = new Map<JobEvent, Set<JobEventListener>>();

  private constructor() {
    this.config = {
      concurrency: 5,
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      processInterval: 1000, // 1 second
      cleanupInterval: 3600000, // 1 hour
      cleanupAge: 86400000, // 24 hours
    };
  }

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  /**
   * Configure queue
   */
  configure(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Register a job handler
   */
  registerHandler<T = any, R = any>(name: string, handler: JobHandler<T, R>): void {
    this.handlers.set(name, handler as JobHandler);
  }

  /**
   * Add a job to the queue
   */
  async add(
    name: string,
    data: Record<string, any> = {},
    options: JobOptions = {}
  ): Promise<number> {
    const now = new Date();
    const scheduledFor = options.scheduledFor || (options.delay ? new Date(Date.now() + options.delay) : undefined);

    const [created] = await db
      .insert(jobs)
      .values({
        name,
        data: JSON.stringify(data),
        status: scheduledFor ? "delayed" : "pending",
        priority: options.priority || "normal",
        attempts: 0,
        maxAttempts: options.maxAttempts || this.config.maxRetries,
        progress: 0,
        scheduledFor,
        createdAt: now,
      })
      .returning();

    const jobId = created.id;

    await this.emit("job:added", this.parseJob(created));

    return jobId;
  }

  /**
   * Get job by ID
   */
  async getJob(id: number): Promise<Job | null> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    return this.parseJob(result[0]);
  }

  /**
   * Update job status
   */
  async updateJobStatus(id: number, status: JobStatus, updates: Partial<Job> = {}): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.result !== undefined) updateData.result = JSON.stringify(updates.result);
    if (updates.error !== undefined) updateData.error = updates.error;
    if (updates.startedAt !== undefined) updateData.startedAt = updates.startedAt;
    if (updates.completedAt !== undefined) updateData.completedAt = updates.completedAt;
    if (updates.failedAt !== undefined) updateData.failedAt = updates.failedAt;
    if (updates.attempts !== undefined) updateData.attempts = updates.attempts;

    await db.update(jobs).set(updateData).where(eq(jobs.id, id));
  }

  /**
   * Start processing jobs
   */
  start(): void {
    console.log("🎯 Starting job queue processor...");

    // Process jobs periodically
    this.processInterval = setInterval(() => {
      this.processJobs();
    }, this.config.processInterval);

    // Cleanup old jobs periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);

    // Process immediately
    this.processJobs();
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    console.log("⏹️ Stopping job queue processor...");

    if (this.processInterval) {
      clearInterval(this.processInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Process pending jobs
   */
  private async processJobs(): Promise<void> {
    try {
      // Check if we can process more jobs
      if (this.activeJobs.size >= this.config.concurrency) {
        return;
      }

      const availableSlots = this.config.concurrency - this.activeJobs.size;
      const now = new Date();

      // Get pending or delayed jobs that are ready
      const pendingJobs = await db
        .select()
        .from(jobs)
        .where(
          or(
            eq(jobs.status, "pending"),
            and(
              eq(jobs.status, "delayed"),
              lte(jobs.scheduledFor, now)
            )
          )!
        )
        .limit(availableSlots);

      for (const jobData of pendingJobs) {
        if (this.activeJobs.size >= this.config.concurrency) {
          break;
        }

        const job = this.parseJob(jobData);
        this.activeJobs.add(job.id!);

        // Process in background
        this.processJob(job).catch((error) => {
          console.error(`Job ${job.id} processing error:`, error);
        });
      }
    } catch (error) {
      console.error("Job processing error:", error);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);

    if (!handler) {
      console.error(`No handler registered for job type: ${job.name}`);
      await this.updateJobStatus(job.id!, "failed", {
        error: `No handler registered for job type: ${job.name}`,
        failedAt: new Date(),
      });
      this.activeJobs.delete(job.id!);
      return;
    }

    try {
      // Mark as started
      await this.updateJobStatus(job.id!, "active", {
        startedAt: new Date(),
        attempts: job.attempts + 1,
      });

      await this.emit("job:started", job);

      // Execute handler
      const result = await handler(job.data, job);

      // Mark as completed
      await this.updateJobStatus(job.id!, "completed", {
        result,
        completedAt: new Date(),
        progress: 100,
      });

      await this.emit("job:completed", job, result);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      const attempts = job.attempts + 1;
      const maxAttempts = job.maxAttempts;

      if (attempts < maxAttempts) {
        // Retry
        await this.updateJobStatus(job.id!, "pending", {
          error: String(error),
          attempts,
        });

        await this.emit("job:retry", job, { error, attempts });
      } else {
        // Max attempts reached, mark as failed
        await this.updateJobStatus(job.id!, "failed", {
          error: String(error),
          failedAt: new Date(),
          attempts,
        });

        await this.emit("job:failed", job, error);
      }
    } finally {
      this.activeJobs.delete(job.id!);
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const allJobs = await db.select().from(jobs);

    const stats: QueueStats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: allJobs.length,
    };

    for (const job of allJobs) {
      switch (job.status) {
        case "pending":
          stats.waiting++;
          break;
        case "active":
          stats.active++;
          break;
        case "completed":
          stats.completed++;
          break;
        case "failed":
          stats.failed++;
          break;
        case "delayed":
          stats.delayed++;
          break;
      }
    }

    return stats;
  }

  /**
   * Cleanup old completed/failed jobs
   */
  async cleanup(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.cleanupAge);

    await db
      .delete(jobs)
      .where(
        and(
          or(eq(jobs.status, "completed"), eq(jobs.status, "failed"))!,
          lte(jobs.completedAt, cutoffDate)
        )!
      );
  }

  /**
   * Cancel a job
   */
  async cancelJob(id: number): Promise<boolean> {
    const job = await this.getJob(id);

    if (!job || job.status === "active" || job.status === "completed") {
      return false;
    }

    await this.updateJobStatus(id, "cancelled");
    return true;
  }

  /**
   * Retry a failed job
   */
  async retryJob(id: number): Promise<boolean> {
    const job = await this.getJob(id);

    if (!job || job.status !== "failed") {
      return false;
    }

    await this.updateJobStatus(id, "pending", {
      attempts: 0,
      error: undefined,
      failedAt: undefined,
    });

    return true;
  }

  /**
   * Add event listener
   */
  on(event: JobEvent, listener: JobEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: JobEvent, listener: JobEventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event
   */
  private async emit(event: JobEvent, job: Job, data?: any): Promise<void> {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          await listener(job, data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Parse job from database
   */
  private parseJob(raw: any): Job {
    return {
      ...raw,
      data: JSON.parse(raw.data),
      result: raw.result ? JSON.parse(raw.result) : undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
      startedAt: raw.startedAt ? new Date(raw.startedAt) : undefined,
      completedAt: raw.completedAt ? new Date(raw.completedAt) : undefined,
      failedAt: raw.failedAt ? new Date(raw.failedAt) : undefined,
      scheduledFor: raw.scheduledFor ? new Date(raw.scheduledFor) : undefined,
    };
  }
}

export const jobQueue = JobQueue.getInstance();
