import { html } from "hono/html";
import { formService } from "@/services/formService.ts";
import FormRenderer from "../components/FormRenderer.tsx";
import * as captchaService from "@/services/system/captchaService.ts";
import * as settingsService from "@/services/system/settingsService.ts";

/**
 * Procesa shortcodes de formularios en el contenido
 * Sintaxis: [form slug="contacto"]
 * Atributos opcionales: class, id
 */
export async function processFormShortcodes(content: string): Promise<string> {
    // Regex para detectar [form slug="..." ...]
    const shortcodeRegex = /\[form\s+([^\]]+)\]/g;

    const matches = Array.from(content.matchAll(shortcodeRegex));

    if (matches.length === 0) {
        return content;
    }

    let processedContent = content;

    for (const match of matches) {
        const fullShortcode = match[0];
        const attributes = match[1];

        // Parsear atributos
        const attrs = parseShortcodeAttributes(attributes);

        if (!attrs.slug) {
            // Si no hay slug, reemplazar con mensaje de error
            processedContent = processedContent.replace(
                fullShortcode,
                '<div style="padding: 1rem; background: #fee2e2; color: #991b1b; border-radius: 0.5rem;">Error: El shortcode [form] requiere el atributo "slug"</div>'
            );
            continue;
        }

        try {
            // Obtener formulario por slug
            const form = await formService.getFormBySlug(attrs.slug);

            if (!form) {
                processedContent = processedContent.replace(
                    fullShortcode,
                    `<div style="padding: 1rem; background: #fee2e2; color: #991b1b; border-radius: 0.5rem;">Error: Formulario "${attrs.slug}" no encontrado</div>`
                );
                continue;
            }

            if (form.status !== 'active') {
                processedContent = processedContent.replace(
                    fullShortcode,
                    `<div style="padding: 1rem; background: #fef3c7; color: #92400e; border-radius: 0.5rem;">Este formulario no está activo</div>`
                );
                continue;
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

            // Renderizar formulario
            const formHtml = FormRenderer({
                formId: form.id,
                formSlug: form.slug,
                formName: form.name,
                formDescription: form.description || undefined,
                fields: form.fields,
                captchaProvider: captchaProvider || undefined,
                captchaSiteKey: captchaSiteKey || undefined,
            });

            // Aplicar atributos adicionales si existen
            let wrappedHtml = formHtml;
            if (attrs.class || attrs.id) {
                const classAttr = attrs.class ? ` class="${attrs.class}"` : '';
                const idAttr = attrs.id ? ` id="${attrs.id}"` : '';
                wrappedHtml = html`<div${classAttr}${idAttr}>${formHtml}</div>`;
            }

            processedContent = processedContent.replace(fullShortcode, wrappedHtml.toString());
        } catch (error) {
            console.error(`Error processing form shortcode for slug "${attrs.slug}":`, error);
            processedContent = processedContent.replace(
                fullShortcode,
                `<div style="padding: 1rem; background: #fee2e2; color: #991b1b; border-radius: 0.5rem;">Error al cargar el formulario</div>`
            );
        }
    }

    return processedContent;
}

/**
 * Parsea los atributos de un shortcode
 * Ejemplo: slug="contacto" class="my-form" id="contact-form"
 */
function parseShortcodeAttributes(attributesString: string): Record<string, string> {
    const attrs: Record<string, string> = {};

    // Regex para capturar atributo="valor"
    const attrRegex = /(\w+)="([^"]*)"/g;

    let match;
    while ((match = attrRegex.exec(attributesString)) !== null) {
        attrs[match[1]] = match[2];
    }

    return attrs;
}

/**
 * Verifica si el contenido tiene shortcodes de formularios
 */
export function hasFormShortcodes(content: string): boolean {
    return /\[form\s+([^\]]+)\]/.test(content);
}
