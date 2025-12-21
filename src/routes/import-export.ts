/**
 * Import/Export Routes
 * Content import from WordPress, export to multiple formats
 */

import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.ts";
import { exporter, importer } from "../lib/import-export/index.ts";
import { jobQueue } from "../lib/jobs/index.ts";
import { z } from "zod";

const importExport = new Hono();

// All routes require admin authentication
importExport.use("*", authMiddleware);

/**
 * Export content
 * POST /api/import-export/export
 */
const exportSchema = z.object({
  format: z.enum(["json", "csv", "xml", "wordpress"]),
  includeContent: z.boolean().optional(),
  includeCategories: z.boolean().optional(),
  includeTags: z.boolean().optional(),
  includeUsers: z.boolean().optional(),
  includeMedia: z.boolean().optional(),
  includeComments: z.boolean().optional(),
  filters: z.object({
    status: z.array(z.string()).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    authorId: z.number().optional(),
    categoryId: z.number().optional(),
  }).optional(),
});

importExport.post("/export", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = exportSchema.safeParse(body);

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

    const options = parsed.data;
    const exportOptions = {
      ...options,
      filters: options.filters
        ? {
            ...options.filters,
            dateFrom: options.filters.dateFrom
              ? new Date(options.filters.dateFrom)
              : undefined,
            dateTo: options.filters.dateTo
              ? new Date(options.filters.dateTo)
              : undefined,
          }
        : undefined,
    };
    let result;

    switch (options.format) {
      case "json":
        result = await exporter.exportToJSON(exportOptions);
        break;
      case "csv":
        result = await exporter.exportToCSV(exportOptions);
        break;
      case "wordpress":
      case "xml":
        result = await exporter.exportToWordPress(exportOptions);
        break;
      default:
        return c.json(
          {
            success: false,
            error: "Unsupported format",
          },
          400
        );
    }

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Export failed:", error);
    return c.json(
      {
        success: false,
        error: "Export failed",
      },
      500
    );
  }
});

/**
 * Import content
 * POST /api/import-export/import
 */
const importSchema = z.object({
  source: z.enum(["wordpress", "json", "csv"]),
  content: z.string().min(1, "Content is required"),
  createUsers: z.boolean().optional(),
  createCategories: z.boolean().optional(),
  createTags: z.boolean().optional(),
  downloadMedia: z.boolean().optional(),
  overwriteExisting: z.boolean().optional(),
  defaultAuthorId: z.number().optional(),
  defaultStatus: z.string().optional(),
  async: z.boolean().optional(),
});

importExport.post("/import", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = importSchema.safeParse(body);

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

    const { content: importContent, source, async, ...options } = parsed.data;
    const importOptions = { ...options, source };

    // If async, create a job
    if (async) {
      const jobId = await jobQueue.add("import-content", {
        source,
        content: importContent,
        options: importOptions,
      });

      return c.json({
        success: true,
        message: "Import job created",
        data: { jobId },
      });
    }

    // Otherwise, import synchronously
    let result;
    switch (source) {
      case "wordpress":
        result = await importer.importFromWordPress(importContent, importOptions);
        break;
      case "json":
        result = await importer.importFromJSON(importContent, importOptions);
        break;
      default:
        return c.json(
          {
            success: false,
            error: "Unsupported import source",
          },
          400
        );
    }

    return c.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error("Import failed:", error);
    return c.json(
      {
        success: false,
        error: "Import failed",
      },
      500
    );
  }
});

/**
 * Bulk delete content
 * POST /api/import-export/bulk-delete
 */
const bulkDeleteSchema = z.object({
  ids: z.array(z.number()).min(1, "At least one ID is required"),
});

importExport.post("/bulk-delete", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = bulkDeleteSchema.safeParse(body);

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

    // Create a job for bulk deletion
    const jobId = await jobQueue.add("bulk-delete-content", {
      ids: parsed.data.ids,
    });

    return c.json({
      success: true,
      message: "Bulk delete job created",
      data: { jobId, count: parsed.data.ids.length },
    });
  } catch (error) {
    console.error("Bulk delete failed:", error);
    return c.json(
      {
        success: false,
        error: "Bulk delete failed",
      },
      500
    );
  }
});

/**
 * Bulk update content
 * POST /api/import-export/bulk-update
 */
const bulkUpdateSchema = z.object({
  ids: z.array(z.number()).min(1, "At least one ID is required"),
  updates: z.object({
    status: z.string().optional(),
    authorId: z.number().optional(),
    categoryId: z.number().optional(),
  }),
});

importExport.post("/bulk-update", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = bulkUpdateSchema.safeParse(body);

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

    // Create a job for bulk update
    const jobId = await jobQueue.add("bulk-update-content", {
      ids: parsed.data.ids,
      updates: parsed.data.updates,
    });

    return c.json({
      success: true,
      message: "Bulk update job created",
      data: { jobId, count: parsed.data.ids.length },
    });
  } catch (error) {
    console.error("Bulk update failed:", error);
    return c.json(
      {
        success: false,
        error: "Bulk update failed",
      },
      500
    );
  }
});

export default importExport;
