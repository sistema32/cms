/**
 * Public Forms Routes
 * Rutas públicas para renderizar formularios
 */

import { Hono } from "hono";
import { formService } from "@/services/formService.ts";
import FormRenderer from "../components/FormRenderer.tsx";
import * as captchaService from "@/services/system/captchaService.ts";
import * as settingsService from "@/services/system/settingsService.ts";

const publicFormsRouter = new Hono();

/**
 * GET /forms/:slug - Página pública del formulario
 */
publicFormsRouter.get("/:slug", async (c) => {
    try {
        const slug = c.req.param("slug");

        // Obtener formulario por slug
        const form = await formService.getFormBySlug(slug);

        if (!form) {
            return c.html(
                `<html>
          <head>
            <title>Formulario no encontrado</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui, -apple-system, sans-serif; padding: 2rem; text-align: center;">
            <h1>Formulario no encontrado</h1>
            <p>El formulario que buscas no existe o ha sido eliminado.</p>
          </body>
        </html>`,
                404
            );
        }

        if (form.status !== 'active') {
            return c.html(
                `<html>
          <head>
            <title>Formulario no disponible</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui, -apple-system, sans-serif; padding: 2rem; text-align: center;">
            <h1>Formulario no disponible</h1>
            <p>Este formulario no está activo en este momento.</p>
          </body>
        </html>`,
                403
            );
        }

        // Obtener configuración de CAPTCHA
        const captchaEnabled = await settingsService.getSetting("captcha_enabled", false);
        let captchaProvider = null;
        let captchaSiteKey = null;

        if (captchaEnabled) {
            captchaProvider = await captchaService.selectRandomProvider();

            // Obtener site key según el provider
            switch (captchaProvider) {
                case 'recaptcha':
                    captchaSiteKey = await settingsService.getSetting("captcha_recaptcha_site", "");
                    break;
                case 'hcaptcha':
                    captchaSiteKey = await settingsService.getSetting("captcha_hcaptcha_site", "");
                    break;
                case 'turnstile':
                    captchaSiteKey = await settingsService.getSetting("captcha_turnstile_site", "");
                    break;
            }
        }

        const normalizedFields = form.fields.map((field) => ({
            ...field,
            placeholder: field.placeholder ?? undefined,
            helpText: field.helpText ?? undefined,
            validation: field.validation ?? undefined,
            options: field.options ?? undefined,
            conditionalLogic: field.conditionalLogic ?? undefined,
        }));

        // Renderizar formulario
        const formHtml = FormRenderer({
            formId: form.id,
            formSlug: form.slug,
            formName: form.name,
            formDescription: form.description || undefined,
            fields: normalizedFields,
            captchaProvider: captchaProvider || undefined,
            captchaSiteKey: captchaSiteKey || undefined,
        });

        return c.html(
            `<!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${form.name}</title>
          <meta name="description" content="${form.description || form.name}">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background: #f8fafc;
              min-height: 100vh;
              padding: 2rem 1rem;
            }
          </style>
        </head>
        <body>
          ${formHtml}
        </body>
      </html>`
        );
    } catch (error: any) {
        console.error("Error loading public form:", error);
        return c.html(
            `<html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; padding: 2rem; text-align: center;">
          <h1>Error</h1>
          <p>Ocurrió un error al cargar el formulario.</p>
        </body>
      </html>`,
            500
        );
    }
});

export default publicFormsRouter;
