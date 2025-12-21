// @ts-nocheck
/**
 * Form Controller
 * HTTP handlers for form operations
 */

import type { Context } from "hono";
import { formService } from "@/services/formService.ts";
import { successResponse } from "@/utils/api-response.ts";
import { z } from "zod";
import * as captchaService from "@/services/system/captchaService.ts";
import * as settingsService from "@/services/system/settingsService.ts";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("formController");

// Validation schemas
const createFormSchema = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    settings: z.record(z.any()).optional(),
    status: z.enum(["active", "inactive", "archived"]).optional(),
});

const createFieldSchema = z.object({
    type: z.enum(["text", "email", "tel", "number", "textarea", "select", "radio", "checkbox", "file", "date"]),
    label: z.string().min(1),
    name: z.string().min(1).regex(/^[a-zA-Z0-9_]+$/),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    required: z.boolean().optional(),
    validation: z.record(z.any()).optional(),
    options: z.array(z.string()).optional(),
    conditionalLogic: z.record(z.any()).optional(),
    orderIndex: z.number().optional(),
});

export class FormController {
    /**
     * List all forms
     */
    async list(c: Context) {
        try {
            const user = c.get("user");
            const forms = await formService.getAllForms(user?.id);

            return successResponse(c, { forms });
        } catch (error) {
            log.error("Failed to list forms", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_list_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Get form by ID
     */
    async getById(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "Form ID");
            const form = await formService.getFormById(id);

            if (!form) {
                throw AppError.fromCatalog("form_not_found");
            }

            return successResponse(c, { form });
        } catch (error) {
            if (error instanceof AppError) throw error;
            log.error("Failed to get form", error instanceof Error ? error : undefined);
            throw new AppError("form_get_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Get form by slug (public)
     */
    async getBySlug(c: Context) {
        try {
            const slug = c.req.param("slug");
            const form = await formService.getFormBySlug(slug);

            if (!form) {
                throw AppError.fromCatalog("form_not_found");
            }

            // Only return active forms for public access
            if (form.status !== "active") {
                throw AppError.fromCatalog("form_not_found");
            }

            return successResponse(c, { form });
        } catch (error) {
            if (error instanceof AppError) throw error;
            log.error("Failed to get form by slug", error instanceof Error ? error : undefined);
            throw new AppError("form_get_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Create new form
     */
    async create(c: Context) {
        try {
            const user = c.get("user");
            if (!user) {
                throw new AppError("unauthorized", "No autenticado", 401);
            }

            const body = await c.req.json();
            const validated = createFormSchema.parse(body);

            const form = await formService.createForm(validated, user.id);

            return successResponse(c, { form }, undefined, 201);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors }, message: "Validation failed" });
            }
            log.error("Failed to create form", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_create_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Update form
     */
    async update(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "Form ID");
            const body = await c.req.json();
            const validated = createFormSchema.partial().parse(body);

            const form = await formService.updateForm(id, validated);

            if (!form) {
                throw AppError.fromCatalog("form_not_found");
            }

            return successResponse(c, { form });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors }, message: "Validation failed" });
            }
            log.error("Failed to update form", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_update_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Delete form
     */
    async delete(c: Context) {
        try {
            const id = parseNumericParam(c.req.param("id"), "Form ID");
            await formService.deleteForm(id);

            return successResponse(c, { message: "Form deleted successfully" });
        } catch (error) {
            log.error("Failed to delete form", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_delete_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Add field to form
     */
    async addField(c: Context) {
        try {
            const formId = parseNumericParam(c.req.param("id"), "Form ID");
            const body = await c.req.json();
            const validated = createFieldSchema.parse(body);

            const field = await formService.addField(formId, validated);

            return successResponse(c, { field }, undefined, 201);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors }, message: "Validation failed" });
            }
            log.error("Failed to add field", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_field_add_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Update field
     */
    async updateField(c: Context) {
        try {
            const fieldId = parseNumericParam(c.req.param("fieldId"), "Field ID");
            const body = await c.req.json();
            const validated = createFieldSchema.partial().parse(body);

            const field = await formService.updateField(fieldId, validated);

            return successResponse(c, { field });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors }, message: "Validation failed" });
            }
            log.error("Failed to update field", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_field_update_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Delete field
     */
    async deleteField(c: Context) {
        try {
            const fieldId = parseNumericParam(c.req.param("fieldId"), "Field ID");
            await formService.deleteField(fieldId);

            return successResponse(c, { message: "Field deleted successfully" });
        } catch (error) {
            log.error("Failed to delete field", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_field_delete_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Submit form (public)
     */
    async submit(c: Context) {
        try {
            const formId = parseNumericParam(c.req.param("id"), "Form ID");
            const body = await c.req.json();

            // Get form to validate fields
            const form = await formService.getFormById(formId);
            if (!form || form.status !== "active") {
                throw AppError.fromCatalog("form_not_found");
            }

            // Validate CAPTCHA if enabled
            const captchaEnabled = await settingsService.getSetting("captcha_enabled", false);
            if (captchaEnabled) {
                const captchaToken = body.captchaToken;
                const captchaProvider = body.captchaProvider;

                if (!captchaToken || !captchaProvider) {
                    throw new AppError("captcha_required", "CAPTCHA es requerido", 400);
                }

                const isValidCaptcha = await captchaService.verifyCaptcha(
                    captchaToken,
                    captchaProvider
                );

                if (!isValidCaptcha) {
                    throw new AppError("captcha_invalid", "CAPTCHA inválido. Por favor intenta de nuevo.", 400);
                }
            }

            // Validate required fields
            for (const field of form.fields) {
                if (field.required && !body[field.name]) {
                    throw AppError.fromCatalog("validation_error", { message: `${field.label} es requerido`, details: { field: field.name } });
                }
            }

            // Remove CAPTCHA data from submission
            const submissionData = { ...body };
            delete submissionData.captchaToken;
            delete submissionData.captchaProvider;

            // Get context
            const user = c.get("user");
            const submission = await formService.submitForm(formId, submissionData, {
                userId: user?.id,
                ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
                userAgent: c.req.header("user-agent"),
                referrer: c.req.header("referer"),
            });

            return successResponse(c, { submission }, undefined, 201);
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error instanceof z.ZodError) {
                throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
            }
            log.error("Failed to submit form", error instanceof Error ? error : undefined);
            throw new AppError("form_submit_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Get submissions
     */
    async getSubmissions(c: Context) {
        try {
            const formId = parseNumericParam(c.req.param("id"), "Form ID");
            const page = parseInt(c.req.query("page") || "1");
            const limit = parseInt(c.req.query("limit") || "20");

            const result = await formService.getSubmissions(formId, page, limit);

            return successResponse(c, result);
        } catch (error) {
            log.error("Failed to get submissions", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_submissions_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Mark submission as read
     */
    async markAsRead(c: Context) {
        try {
            const submissionId = parseNumericParam(c.req.param("submissionId"), "Submission ID");
            await formService.markAsRead(submissionId);

            return successResponse(c, { message: "Submission marked as read" });
        } catch (error) {
            log.error("Failed to mark submission as read", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_mark_read_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Delete submission
     */
    async deleteSubmission(c: Context) {
        try {
            const submissionId = parseNumericParam(c.req.param("submissionId"), "Submission ID");
            await formService.deleteSubmission(submissionId);

            return successResponse(c, { message: "Submission deleted successfully" });
        } catch (error) {
            log.error("Failed to delete submission", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_delete_submission_failed", getErrorMessage(error), 500);
        }
    }

    /**
     * Export submissions to CSV
     */
    async exportCSV(c: Context) {
        try {
            const formId = parseNumericParam(c.req.param("id"), "Form ID");
            const csv = await formService.exportToCSV(formId);

            return c.text(csv, 200, {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="form-${formId}-submissions.csv"`,
            });
        } catch (error) {
            log.error("Failed to export submissions", error instanceof Error ? error : undefined);
            throw error instanceof AppError ? error : new AppError("form_export_failed", getErrorMessage(error), 500);
        }
    }
}

export const formController = new FormController();
