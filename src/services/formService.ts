/**
 * Form Service
 * Business logic for form management
 */

import { db } from "../config/db.ts";
import { forms, formFields, formSubmissions } from "../db/schema.ts";
import { eq, desc, and } from "drizzle-orm";
import type { Context } from "hono";

export interface FormData {
    name: string;
    slug: string;
    description?: string;
    settings?: Record<string, any>;
    status?: "active" | "inactive" | "archived";
}

export interface FormFieldData {
    type: string;
    label: string;
    name: string;
    placeholder?: string;
    helpText?: string;
    required?: boolean;
    validation?: Record<string, any>;
    options?: string[];
    conditionalLogic?: Record<string, any>;
    orderIndex?: number;
}

export class FormService {
    /**
     * Get all forms
     */
    async getAllForms(userId?: number) {
        const query = db.select().from(forms);

        if (userId) {
            return await query.where(eq(forms.createdBy, userId));
        }

        return await query.orderBy(desc(forms.createdAt));
    }

    /**
     * Get form by ID
     */
    async getFormById(id: number) {
        const form = await db.select().from(forms).where(eq(forms.id, id)).limit(1);

        if (!form || form.length === 0) {
            return null;
        }

        // Get form fields
        const fields = await db
            .select()
            .from(formFields)
            .where(eq(formFields.formId, id))
            .orderBy(formFields.orderIndex);

        return {
            ...form[0],
            fields,
        };
    }

    /**
     * Get form by slug
     */
    async getFormBySlug(slug: string) {
        const form = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1);

        if (!form || form.length === 0) {
            return null;
        }

        // Get form fields
        const fields = await db
            .select()
            .from(formFields)
            .where(eq(formFields.formId, form[0].id))
            .orderBy(formFields.orderIndex);

        return {
            ...form[0],
            fields,
        };
    }

    /**
     * Create a new form
     */
    async createForm(data: FormData, userId: number) {
        const result = await db.insert(forms).values({
            name: data.name,
            slug: data.slug,
            description: data.description,
            settings: data.settings ? JSON.stringify(data.settings) : null,
            status: data.status || "active",
            createdBy: userId,
        }).returning();

        return result[0];
    }

    /**
     * Update form
     */
    async updateForm(id: number, data: Partial<FormData>) {
        const updateData: any = {
            ...data,
            updatedAt: new Date(),
        };

        if (data.settings) {
            updateData.settings = JSON.stringify(data.settings);
        }

        const result = await db
            .update(forms)
            .set(updateData)
            .where(eq(forms.id, id))
            .returning();

        return result[0];
    }

    /**
     * Delete form
     */
    async deleteForm(id: number) {
        await db.delete(forms).where(eq(forms.id, id));
    }

    /**
     * Add field to form
     */
    async addField(formId: number, fieldData: FormFieldData) {
        const result = await db.insert(formFields).values({
            formId,
            type: fieldData.type,
            label: fieldData.label,
            name: fieldData.name,
            placeholder: fieldData.placeholder,
            helpText: fieldData.helpText,
            required: fieldData.required || false,
            validation: fieldData.validation ? JSON.stringify(fieldData.validation) : null,
            options: fieldData.options ? JSON.stringify(fieldData.options) : null,
            conditionalLogic: fieldData.conditionalLogic ? JSON.stringify(fieldData.conditionalLogic) : null,
            orderIndex: fieldData.orderIndex || 0,
        }).returning();

        return result[0];
    }

    /**
     * Update field
     */
    async updateField(fieldId: number, fieldData: Partial<FormFieldData>) {
        const updateData: any = { ...fieldData };

        if (fieldData.validation) {
            updateData.validation = JSON.stringify(fieldData.validation);
        }
        if (fieldData.options) {
            updateData.options = JSON.stringify(fieldData.options);
        }
        if (fieldData.conditionalLogic) {
            updateData.conditionalLogic = JSON.stringify(fieldData.conditionalLogic);
        }

        const result = await db
            .update(formFields)
            .set(updateData)
            .where(eq(formFields.id, fieldId))
            .returning();

        return result[0];
    }

    /**
     * Delete field
     */
    async deleteField(fieldId: number) {
        await db.delete(formFields).where(eq(formFields.id, fieldId));
    }

    /**
     * Submit form
     */
    async submitForm(
        formId: number,
        data: Record<string, any>,
        context: {
            userId?: number;
            ipAddress?: string;
            userAgent?: string;
            referrer?: string;
        }
    ) {
        const result = await db.insert(formSubmissions).values({
            formId,
            data: JSON.stringify(data),
            userId: context.userId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            referrer: context.referrer,
            status: "new",
        }).returning();

        return result[0];
    }

    /**
     * Get form submissions
     */
    async getSubmissions(formId: number, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const submissions = await db
            .select()
            .from(formSubmissions)
            .where(eq(formSubmissions.formId, formId))
            .orderBy(desc(formSubmissions.submittedAt))
            .limit(limit)
            .offset(offset);

        const total = await db
            .select()
            .from(formSubmissions)
            .where(eq(formSubmissions.formId, formId));

        return {
            submissions,
            total: total.length,
            page,
            limit,
            totalPages: Math.ceil(total.length / limit),
        };
    }

    /**
     * Mark submission as read
     */
    async markAsRead(submissionId: number) {
        await db
            .update(formSubmissions)
            .set({ status: "read", readAt: new Date() })
            .where(eq(formSubmissions.id, submissionId));
    }

    /**
     * Delete submission
     */
    async deleteSubmission(submissionId: number) {
        await db.delete(formSubmissions).where(eq(formSubmissions.id, submissionId));
    }

    /**
     * Export submissions to CSV
     */
    async exportToCSV(formId: number) {
        const form = await this.getFormById(formId);
        if (!form) {
            throw new Error("Form not found");
        }

        const submissions = await db
            .select()
            .from(formSubmissions)
            .where(eq(formSubmissions.formId, formId))
            .orderBy(desc(formSubmissions.submittedAt));

        // Build CSV header
        const headers = ["ID", "Submitted At", "Status", ...form.fields.map((f: any) => f.label)];

        // Build CSV rows
        const rows = submissions.map((sub: any) => {
            const data = JSON.parse(sub.data);
            return [
                sub.id,
                new Date(sub.submittedAt).toISOString(),
                sub.status,
                ...form.fields.map((f: any) => data[f.name] || ""),
            ];
        });

        // Convert to CSV string
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
        ].join("\n");

        return csvContent;
    }
}

export const formService = new FormService();
