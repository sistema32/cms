/**
 * Forms API Routes
 * Routes for form management and submissions
 */

import { Hono } from "hono";
import { formController } from "@/controllers/formController.ts";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission } from "@/middleware/permission.ts";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "../config/db.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";

const formsRouter = new Hono();

// Hybrid auth middleware - supports both session cookies (admin panel) and JWT (API)
const hybridAuth = async (c: Context, next: Next) => {
    console.log("[HybridAuth] Starting authentication...");

    // Try session cookie first (from admin panel)
    const sessionId = getCookie(c, "session_id");
    console.log("[HybridAuth] Session ID from cookie:", sessionId);

    if (sessionId) {
        // Get user from session
        const result = await db
            .select({
                id: users.id,
                userId: users.id,
                email: users.email,
                name: users.name,
            })
            .from(users)
            .where(eq(users.id, parseInt(sessionId)))
            .limit(1);

        console.log("[HybridAuth] User from session:", result);

        if (result && result.length > 0) {
            c.set("user", result[0]);
            console.log("[HybridAuth] User set in context:", result[0]);
            return await next();
        }
    }

    console.log("[HybridAuth] Falling back to JWT auth");
    // Fall back to JWT auth
    return await authMiddleware(c, next);
};

// Public routes
formsRouter.get("/public/:slug", (c) => formController.getBySlug(c));
formsRouter.post("/:id/submit", (c) => formController.submit(c));

// Protected routes - require authentication
formsRouter.use("/*", hybridAuth);

// List and create forms
formsRouter.get("/", requirePermission("forms", "read"), (c) => formController.list(c));
formsRouter.post("/", requirePermission("forms", "create"), (c) => formController.create(c));

// Form CRUD
formsRouter.get("/:id", requirePermission("forms", "read"), (c) => formController.getById(c));
formsRouter.put("/:id", requirePermission("forms", "update"), (c) => formController.update(c));
formsRouter.delete("/:id", requirePermission("forms", "delete"), (c) => formController.delete(c));

// Field management
formsRouter.post("/:id/fields", requirePermission("forms", "update"), (c) => formController.addField(c));
formsRouter.put("/:id/fields/:fieldId", requirePermission("forms", "update"), (c) => formController.updateField(c));
formsRouter.delete("/:id/fields/:fieldId", requirePermission("forms", "update"), (c) => formController.deleteField(c));

// Submissions
formsRouter.get("/:id/submissions", requirePermission("forms", "read"), (c) => formController.getSubmissions(c));
formsRouter.put("/:id/submissions/:submissionId/read", requirePermission("forms", "update"), (c) => formController.markAsRead(c));
formsRouter.delete("/:id/submissions/:submissionId", requirePermission("forms", "delete"), (c) => formController.deleteSubmission(c));

// Export
formsRouter.get("/:id/export/csv", requirePermission("forms", "read"), (c) => formController.exportCSV(c));

export default formsRouter;
