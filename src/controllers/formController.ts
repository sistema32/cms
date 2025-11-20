/**
 * Form Controller
 * HTTP handlers for form operations
 */

import type { Context } from "hono";
import { formService } from "../services/formService.ts";
import { successResponse, ErrorResponses } from "../utils/api-response.ts";
import { z } from "zod";
import * as captchaService from "../services/captchaService.ts";
import * as settingsService from "../services/settingsService.ts";

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
            console.error("Failed to list forms:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Get form by ID
     */
    async getById(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            const form = await formService.getFormById(id);

            if (!form) {
                return ErrorResponses.notFound(c, "Form");
            }

            return successResponse(c, { form });
        } catch (error) {
            console.error("Failed to get form:", error);
            return ErrorResponses.internalError(c);
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
                return ErrorResponses.notFound(c, "Form");
            }

            // Only return active forms for public access
            if (form.status !== "active") {
                return ErrorResponses.notFound(c, "Form");
            }

            return successResponse(c, { form });
        } catch (error) {
            console.error("Failed to get form:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Create new form
     */
    async create(c: Context) {
        try {
            const user = c.get("user");
            if (!user) {
                return ErrorResponses.unauthorized(c);
            }

            const body = await c.req.json();
            const validated = createFormSchema.parse(body);

            const form = await formService.createForm(validated, user.id);

            return successResponse(c, { form }, undefined, 201);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return ErrorResponses.badRequest(c, "Validation failed", error.errors);
            }
            console.error("Failed to create form:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Update form
     */
    async update(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            const body = await c.req.json();
            const validated = createFormSchema.partial().parse(body);

            const form = await formService.updateForm(id, validated);

            if (!form) {
                return ErrorResponses.notFound(c, "Form");
            }

            return successResponse(c, { form });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return ErrorResponses.badRequest(c, "Validation failed", error.errors);
            }
            console.error("Failed to update form:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Delete form
     */
    async delete(c: Context) {
        try {
            const id = parseInt(c.req.param("id"));
            await formService.deleteForm(id);

            return successResponse(c, { message: "Form deleted successfully" });
        } catch (error) {
            console.error("Failed to delete form:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Add field to form
     */
    async addField(c: Context) {
        try {
            const formId = parseInt(c.req.param("id"));
            const body = await c.req.json();
            const validated = createFieldSchema.parse(body);

            const field = await formService.addField(formId, validated);

            return successResponse(c, { field }, undefined, 201);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return ErrorResponses.badRequest(c, "Validation failed", error.errors);
            }
            console.error("Failed to add field:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Update field
     */
    async updateField(c: Context) {
        try {
            const fieldId = parseInt(c.req.param("fieldId"));
            const body = await c.req.json();
            const validated = createFieldSchema.partial().parse(body);

            const field = await formService.updateField(fieldId, validated);

            return successResponse(c, { field });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return ErrorResponses.badRequest(c, "Validation failed", error.errors);
            }
            console.error("Failed to update field:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Delete field
     */
    async deleteField(c: Context) {
        try {
            const fieldId = parseInt(c.req.param("fieldId"));
            await formService.deleteField(fieldId);

            return successResponse(c, { message: "Field deleted successfully" });
        } catch (error) {
            console.error("Failed to delete field:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Submit form (public)
     */
    async submit(c: Context) {
        try {
            const formId = parseInt(c.req.param("id"));
            const body = await c.req.json();

            // Get form to validate fields
            const form = await formService.getFormById(formId);
            if (!form || form.status !== "active") {
                return ErrorResponses.notFound(c, "Form");
            }

            // Validate CAPTCHA if enabled
            const captchaEnabled = await settingsService.getSetting("captcha_enabled", false);
            if (captchaEnabled) {
                const captchaToken = body.captchaToken;
                const captchaProvider = body.captchaProvider;

                if (!captchaToken || !captchaProvider) {
                    return ErrorResponses.badRequest(c, "CAPTCHA es requerido");
                }

                const isValidCaptcha = await captchaService.verifyCaptcha(
                    captchaToken,
                    captchaProvider
                );

                if (!isValidCaptcha) {
                    return ErrorResponses.badRequest(c, "CAPTCHA inválido. Por favor intenta de nuevo.");
                }
            }

            // Validate required fields
            for (const field of form.fields) {
                if (field.required && !body[field.name]) {
                    return ErrorResponses.validationError(
                        c,
                        field.name,
                        `${field.label} es requerido`
                    );
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
            console.error("Failed to submit form:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Get submissions
     */
    async getSubmissions(c: Context) {
        try {
            const formId = parseInt(c.req.param("id"));
            const page = parseInt(c.req.query("page") || "1");
            const limit = parseInt(c.req.query("limit") || "20");

            const result = await formService.getSubmissions(formId, page, limit);

            return successResponse(c, result);
        } catch (error) {
            console.error("Failed to get submissions:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Mark submission as read
     */
    async markAsRead(c: Context) {
        try {
            const submissionId = parseInt(c.req.param("submissionId"));
            await formService.markAsRead(submissionId);

            return successResponse(c, { message: "Submission marked as read" });
        } catch (error) {
            console.error("Failed to mark submission as read:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Delete submission
     */
    async deleteSubmission(c: Context) {
        try {
            const submissionId = parseInt(c.req.param("submissionId"));
            await formService.deleteSubmission(submissionId);

            return successResponse(c, { message: "Submission deleted successfully" });
        } catch (error) {
            console.error("Failed to delete submission:", error);
            return ErrorResponses.internalError(c);
        }
    }

    /**
     * Export submissions to CSV
     */
    async exportCSV(c: Context) {
        try {
            const formId = parseInt(c.req.param("id"));
            const csv = await formService.exportToCSV(formId);

            return c.text(csv, 200, {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="form-${formId}-submissions.csv"`,
            });
        } catch (error) {
            console.error("Failed to export submissions:", error);
            return ErrorResponses.internalError(c);
        }
    }
}

export const formController = new FormController();
