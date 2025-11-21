import { Hono } from "hono";
import { env } from "../../config/env.ts";
import { formService } from "../../services/formService.ts";
import { notificationService } from "../../lib/email/index.ts";
import FormsListPage from "../../admin/pages/FormsListPage.tsx";
import FormEditorPage from "../../admin/pages/FormEditorPage.tsx";
import FormSubmissionsPage from "../../admin/pages/FormSubmissionsPage.tsx";

export const formsRouter = new Hono();

/**
 * GET /forms - Forms list
 */
formsRouter.get("/forms", async (c) => {
    try {
        const user = c.get("user");
        const forms = await formService.getAllForms();

        return c.html(
            FormsListPage({
                user: {
                    name: user.name as string | null,
                    email: user.email,
                },
                forms: forms.map((form) => ({
                    id: form.id,
                    name: form.name,
                    slug: form.slug,
                    description: form.description || undefined,
                    status: form.status,
                    createdAt: form.createdAt.toString(),
                })),
            }),
        );
    } catch (error: any) {
        console.error("Error loading forms:", error);
        return c.text("Error al cargar formularios", 500);
    }
});

/**
 * GET /forms/new - New form
 */
formsRouter.get("/forms/new", async (c) => {
    try {
        const user = c.get("user");

        return c.html(
            FormEditorPage({
                user: {
                    name: user.name as string | null,
                    email: user.email,
                },
                isNew: true,
            }),
        );
    } catch (error: any) {
        console.error("Error loading form editor:", error);
        return c.text("Error al cargar el editor", 500);
    }
});

/**
 * GET /forms/:id/edit - Edit form
 */
formsRouter.get("/forms/:id/edit", async (c) => {
    try {
        const user = c.get("user");
        const id = parseInt(c.req.param("id"));
        const form = await formService.getFormById(id);

        if (!form) {
            return c.text("Formulario no encontrado", 404);
        }

        return c.html(
            FormEditorPage({
                user: {
                    name: user.name as string | null,
                    email: user.email,
                },
                form: {
                    id: form.id,
                    name: form.name,
                    slug: form.slug,
                    description: form.description || undefined,
                    status: form.status,
                    settings: form.settings ? JSON.parse(form.settings) : undefined,
                    fields: form.fields.map((field) => ({
                        id: field.id,
                        type: field.type,
                        label: field.label,
                        name: field.name,
                        placeholder: field.placeholder || undefined,
                        helpText: field.helpText || undefined,
                        required: field.required,
                        options: field.options || undefined,
                        orderIndex: field.orderIndex,
                    })),
                },
                isNew: false,
            }),
        );
    } catch (error: any) {
        console.error("Error loading form:", error);
        return c.text("Error al cargar el formulario", 500);
    }
});

/**
 * GET /forms/:id/submissions - Form submissions
 */
formsRouter.get("/forms/:id/submissions", async (c) => {
    try {
        const user = c.get("user");
        const id = parseInt(c.req.param("id"));
        const page = parseInt(c.req.query("page") || "1");

        const form = await formService.getFormById(id);
        if (!form) {
            return c.text("Formulario no encontrado", 404);
        }

        const submissions = await formService.getSubmissions(id, page);

        return c.html(
            FormSubmissionsPage({
                user: {
                    name: user.name as string | null,
                    email: user.email,
                },
                form: {
                    id: form.id,
                    name: form.name,
                    slug: form.slug,
                    fields: form.fields.map((field) => ({
                        id: field.id,
                        name: field.name,
                        label: field.label,
                        type: field.type,
                    })),
                },
                submissions: {
                    submissions: submissions.submissions.map((sub) => ({
                        id: sub.id,
                        data: sub.data,
                        status: sub.status,
                        submittedAt: sub.submittedAt.toString(),
                        ipAddress: sub.ipAddress || undefined,
                    })),
                    total: submissions.total,
                    page: submissions.page,
                    totalPages: submissions.totalPages,
                },
            }),
        );
    } catch (error: any) {
        console.error("Error loading submissions:", error);
        return c.text("Error al cargar los envíos", 500);
    }
});

/**
 * POST /forms/new - Create new form
 */
formsRouter.post("/forms/new", async (c) => {
    try {
        const user = c.get("user");
        const body = await c.req.parseBody();

        const formData = {
            name: body.name as string,
            slug: body.slug as string,
            description: body.description as string | undefined,
            status: (body.status as string) || "active",
        };

        const form = await formService.createForm(formData, user.id);

        // Process fields if any
        const fieldsData: any = {};
        for (const key in body) {
            if (key.startsWith("fields[")) {
                const match = key.match(/fields\[(\d+)\]\[(\w+)\]/);
                if (match) {
                    const index = match[1];
                    const prop = match[2];
                    if (!fieldsData[index]) fieldsData[index] = {};
                    fieldsData[index][prop] = body[key];
                }
            }
        }

        // Add fields to the form
        for (const index in fieldsData) {
            const fieldData = fieldsData[index];
            await formService.addField(form.id, {
                type: fieldData.type,
                label: fieldData.label,
                name: fieldData.name,
                placeholder: fieldData.placeholder,
                helpText: fieldData.helpText,
                required: fieldData.required === "true",
                options: fieldData.options
                    ? fieldData.options.split("\n").filter((o: string) => o.trim())
                    : undefined,
            });
        }

        return c.redirect(`${env.ADMIN_PATH}/forms`);
    } catch (error: any) {
        console.error("Error creating form:", error);
        return c.text("Error al crear el formulario", 500);
    }
});

/**
 * POST /forms/edit/:id - Update form
 */
formsRouter.post("/forms/edit/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const body = await c.req.parseBody();

        const formData = {
            name: body.name as string,
            slug: body.slug as string,
            description: body.description as string | undefined,
            status: (body.status as string) || "active",
        };

        await formService.updateForm(id, formData);

        // Delete all existing fields
        const existingForm = await formService.getFormById(id);
        if (existingForm && existingForm.fields) {
            for (const field of existingForm.fields) {
                await formService.deleteField(field.id);
            }
        }

        // Process and add new fields
        const fieldsData: any = {};
        for (const key in body) {
            if (key.startsWith("fields[")) {
                const match = key.match(/fields\[(\d+)\]\[(\w+)\]/);
                if (match) {
                    const index = match[1];
                    const prop = match[2];
                    if (!fieldsData[index]) fieldsData[index] = {};
                    fieldsData[index][prop] = body[key];
                }
            }
        }

        // Add fields to the form
        for (const index in fieldsData) {
            const fieldData = fieldsData[index];
            await formService.addField(id, {
                type: fieldData.type,
                label: fieldData.label,
                name: fieldData.name,
                placeholder: fieldData.placeholder,
                helpText: fieldData.helpText,
                required: fieldData.required === "true",
                options: fieldData.options
                    ? fieldData.options.split("\n").filter((o: string) => o.trim())
                    : undefined,
            });
        }

        return c.redirect(`${env.ADMIN_PATH}/forms`);
    } catch (error: any) {
        console.error("Error updating form:", error);
        return c.text("Error al actualizar el formulario", 500);
    }
});
