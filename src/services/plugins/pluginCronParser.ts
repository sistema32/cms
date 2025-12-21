// @ts-nocheck
/**
 * Cron scheduling utilities using croner library
 * Supports full cron syntax: minute hour day month weekday
 * Examples:
 * - "0 0 * * *" - daily at midnight
 * - "start/5 * * * * " - every 5 minutes
 * - "0 9 * * 1" - every Monday at 9am
 * - "0 0 1 * *" - first day of month
 */

import { Cron } from "https://esm.sh/croner@8.1.1";

/**
 * Parse cron schedule and return next execution time in milliseconds
 * Validates cron syntax and throws on invalid patterns
 */
export function parseCronSchedule(schedule: string): number {
    try {
        // Validate cron pattern by creating a Cron instance
        const cron = new Cron(schedule);

        // Get next run time
        const next = cron.nextRun();
        if (!next) {
            throw new Error(`Invalid cron schedule: ${schedule}`);
        }

        // Calculate milliseconds until next run
        const now = new Date();
        const msUntilNext = next.getTime() - now.getTime();

        return Math.max(msUntilNext, 1000); // At least 1 second
    } catch (err) {
        throw new Error(`Failed to parse cron schedule "${schedule}": ${err instanceof Error ? err.message : String(err)}`);
    }
}

/**
 * Create a cron job that runs on schedule
 * Returns a function to stop the cron job
 */
export function createCronJob(schedule: string, handler: () => void | Promise<void>): () => void {
    const cron = new Cron(schedule, async () => {
        try {
            await handler();
        } catch (err) {
            console.error(`[cron error] ${schedule}:`, err);
        }
    });

    return () => cron.stop();
}

export { Cron };
