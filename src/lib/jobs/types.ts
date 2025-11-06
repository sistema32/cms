/**
 * Background Job Queue Types
 * Task processing, scheduling, and job management
 */

/**
 * Job status
 */
export type JobStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "cancelled";

/**
 * Job priority
 */
export type JobPriority = "low" | "normal" | "high" | "critical";

/**
 * Job definition
 */
export interface Job {
  id?: number;
  name: string; // Job type/name
  data: Record<string, any>; // Job payload
  status: JobStatus;
  priority: JobPriority;
  attempts: number; // Current attempt number
  maxAttempts: number; // Maximum retry attempts
  progress: number; // 0-100
  result?: any; // Job result
  error?: string; // Error message if failed
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  scheduledFor?: Date; // Delayed execution
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Job options
 */
export interface JobOptions {
  priority?: JobPriority;
  maxAttempts?: number;
  delay?: number; // Delay in milliseconds
  scheduledFor?: Date;
  timeout?: number; // Execution timeout in ms
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

/**
 * Job handler function
 */
export type JobHandler<T = any, R = any> = (
  data: T,
  job: Job
) => Promise<R> | R;

/**
 * Job progress callback
 */
export type JobProgressCallback = (progress: number) => void | Promise<void>;

/**
 * Queue configuration
 */
export interface QueueConfig {
  concurrency?: number; // Max concurrent jobs
  maxRetries?: number; // Default max retries
  retryDelay?: number; // Delay between retries in ms
  processInterval?: number; // Job processing interval in ms
  cleanupInterval?: number; // Cleanup interval in ms
  cleanupAge?: number; // Age to cleanup completed/failed jobs in ms
}

/**
 * Queue stats
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

/**
 * Scheduled job (cron-like)
 */
export interface ScheduledJob {
  id?: number;
  name: string;
  schedule: string; // Cron expression
  jobName: string; // Job type to create
  jobData: Record<string, any>;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Job event
 */
export type JobEvent =
  | "job:added"
  | "job:started"
  | "job:progress"
  | "job:completed"
  | "job:failed"
  | "job:retry";

/**
 * Job event listener
 */
export type JobEventListener = (job: Job, data?: any) => void | Promise<void>;
