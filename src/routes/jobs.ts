/**
 * Job Queue Routes
 * Background job management and monitoring
 */

import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.ts";
import { jobQueue } from "../lib/jobs/index.ts";
import { z } from "zod";

const jobsRouter = new Hono();

// All routes require admin authentication
jobsRouter.use("*", authMiddleware);

/**
 * Get queue statistics
 * GET /api/jobs/stats
 */
jobsRouter.get("/stats", async (c) => {
  try {
    const stats = await jobQueue.getStats();

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Failed to get job stats:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get job stats",
      },
      500
    );
  }
});

/**
 * Create a new job
 * POST /api/jobs
 */
const createJobSchema = z.object({
  name: z.string().min(1),
  data: z.record(z.any()).optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  delay: z.number().optional(),
  maxAttempts: z.number().optional(),
});

jobsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        400
      );
    }

    const jobId = await jobQueue.add(parsed.data.name, parsed.data.data, {
      priority: parsed.data.priority,
      delay: parsed.data.delay,
      maxAttempts: parsed.data.maxAttempts,
    });

    return c.json({
      success: true,
      data: { jobId },
    });
  } catch (error) {
    console.error("Failed to create job:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create job",
      },
      500
    );
  }
});

/**
 * Get job by ID
 * GET /api/jobs/:id
 */
jobsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: "Invalid job ID",
        },
        400
      );
    }

    const job = await jobQueue.getJob(id);

    if (!job) {
      return c.json(
        {
          success: false,
          error: "Job not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Failed to get job:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get job",
      },
      500
    );
  }
});

/**
 * Cancel a job
 * POST /api/jobs/:id/cancel
 */
jobsRouter.post("/:id/cancel", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: "Invalid job ID",
        },
        400
      );
    }

    const cancelled = await jobQueue.cancelJob(id);

    if (!cancelled) {
      return c.json(
        {
          success: false,
          error: "Job cannot be cancelled (already running or completed)",
        },
        400
      );
    }

    return c.json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Failed to cancel job:", error);
    return c.json(
      {
        success: false,
        error: "Failed to cancel job",
      },
      500
    );
  }
});

/**
 * Retry a failed job
 * POST /api/jobs/:id/retry
 */
jobsRouter.post("/:id/retry", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: "Invalid job ID",
        },
        400
      );
    }

    const retried = await jobQueue.retryJob(id);

    if (!retried) {
      return c.json(
        {
          success: false,
          error: "Job cannot be retried (not in failed status)",
        },
        400
      );
    }

    return c.json({
      success: true,
      message: "Job will be retried",
    });
  } catch (error) {
    console.error("Failed to retry job:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retry job",
      },
      500
    );
  }
});

export default jobsRouter;
