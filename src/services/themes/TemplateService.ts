import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import * as themeService from "./themeService.ts";
import * as settingsService from "../system/settingsService.ts";
import { applyFilters } from "../../lib/hooks/index.ts";

/**
 * Service responsible for loading theme templates and handling fallbacks.
 * Implements Singleton pattern.
 */
export class TemplateService {
    private static instance: TemplateService;

    private constructor() { }

    public static getInstance(): TemplateService {
        if (!TemplateService.instance) {
            TemplateService.instance = new TemplateService();
        }
        return TemplateService.instance;
    }

    /**
     * Load theme helpers and templates dynamically with fallback to default theme
     */
    public async loadThemeModule(modulePath: string) {
        try {
            const fullPath = join(Deno.cwd(), modulePath);
            const module = await import(`file://${fullPath}`);
            return module;
        } catch (error) {
            console.error(`Error loading theme module ${modulePath}:`, error);
            throw error;
        }
    }

    public async getThemeHelpers() {
        // Use helper loader service (loads once on theme activation, then cached)
        const { loadThemeHelpers } = await import("./themeHelperLoader.ts");
        const activeTheme = await themeService.getActiveTheme();
        return await loadThemeHelpers(activeTheme);
    }

    /**
     * Crea un template de emergencia cuando falla la carga
     */
    private createEmergencyTemplate(templateName: string, themeName: string) {
        return (_props: any) => {
            return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Template no encontrado</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .error-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      padding: 40px;
      text-align: center;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      color: #1a202c;
      font-size: 28px;
      margin-bottom: 16px;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    code {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 2px 8px;
      font-family: 'Courier New', monospace;
      color: #e53e3e;
    }
    .details {
      background: #fff5f5;
      border: 1px solid #feb2b2;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      text-align: left;
    }
    .details h3 {
      color: #c53030;
      font-size: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    a {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    a:hover {
      background: #5a67d8;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h1>Error de configuración del theme</h1>
    <p>El template <code>${templateName}.tsx</code> no se encontró en el theme <code>${themeName}</code> ni en el theme por defecto.</p>

    <div class="details">
      <h3>Detalles técnicos</h3>
      <p><strong>Template solicitado:</strong> ${templateName}.tsx</p>
      <p><strong>Theme activo:</strong> ${themeName}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>

    <p style="margin-top: 24px; font-size: 14px;">
      Este error ha sido reportado automáticamente al administrador del sitio.
    </p>

    <a href="/">Volver al inicio</a>
  </div>
</body>
</html>`;
        };
    }

    /**
     * Notifica al admin sobre templates faltantes
     */
    private async notifyAdminAboutMissingTemplate(
        templateName: string,
        themeName: string,
    ) {
        try {
            const errorKey = `theme_error_missing_template_${Date.now()}`;
            await settingsService.updateSetting(
                errorKey,
                JSON.stringify({
                    type: "missing_template",
                    template: templateName,
                    theme: themeName,
                    timestamp: new Date().toISOString(),
                }),
            );
            console.error(
                `❌ CRITICAL: Missing template "${templateName}.tsx" in theme "${themeName}" - Error logged to settings`,
            );
        } catch (error) {
            console.error("Failed to log missing template error:", error);
        }
    }

    /**
     * Obtiene un template con manejo robusto de errores
     */
    public async getThemeTemplate(templateName: string) {
        const activeTheme = await themeService.getActiveTheme();

        // Try 1: Active theme
        let templatePath =
            `src/themes/${activeTheme}/templates/${templateName}.tsx`;
        let fullPath = join(Deno.cwd(), templatePath);

        try {
            await Deno.stat(fullPath);
            const module = await this.loadThemeModule(templatePath);

            // Apply theme:template filter (allows plugins to override template)
            const filteredPath = await applyFilters("theme:template", templatePath, templateName, activeTheme);
            if (filteredPath !== templatePath) {
                console.log(`🔄 Template overridden by filter: ${filteredPath}`);
                const overrideModule = await this.loadThemeModule(filteredPath);
                return overrideModule.default;
            }

            return module.default;
        } catch (_error) {
            console.warn(
                `⚠️  Template ${templateName}.tsx not found in theme ${activeTheme}, trying fallback...`,
            );
        }

        // Try 2: Default theme
        try {
            const defaultTemplatePath =
                `src/themes/default/templates/${templateName}.tsx`;
            const module = await this.loadThemeModule(defaultTemplatePath);
            console.log(`✅ Using fallback template from default theme`);

            // Apply filter even for fallback
            const filteredPath = await applyFilters("theme:template", defaultTemplatePath, templateName, "default");
            if (filteredPath !== defaultTemplatePath) {
                const overrideModule = await this.loadThemeModule(filteredPath);
                return overrideModule.default;
            }

            return module.default;
        } catch (_error) {
            console.error(
                `❌ CRITICAL: Template ${templateName}.tsx not found in default theme!`,
            );
            // Critical failure: Both active and default themes are broken for this template
            // We should consider activating safe mode if this is a critical template like 'home' or 'post'
            if (["home", "index", "post", "page"].includes(templateName)) {
                await themeService.activateSafeMode(`Critical template missing: ${templateName}`);
            }
        }

        // Try 3: Emergency fallback
        await this.notifyAdminAboutMissingTemplate(templateName, activeTheme);
        return this.createEmergencyTemplate(templateName, activeTheme);
    }

    /**
     * Carga un template de página con sistema de fallback multinivel
     */
    public async loadPageTemplate(
        templateName: string | null,
        activeTheme: string,
    ) {
        // Nivel 1: Template personalizado en tema activo
        if (templateName) {
            let customPath =
                `src/themes/${activeTheme}/templates/pages/${templateName}.tsx`;
            let fullPath = join(Deno.cwd(), customPath);

            try {
                await Deno.stat(fullPath);

                // Apply theme:pageTemplate filter
                customPath = await applyFilters("theme:pageTemplate", customPath, templateName, activeTheme);

                const module = await this.loadThemeModule(customPath);
                console.log(
                    `✅ Cargando template personalizado: ${templateName} (${activeTheme})`,
                );
                return module.default;
            } catch (_error) {
                console.log(
                    `⚠️ Template personalizado no encontrado: ${templateName} en ${activeTheme}`,
                );
            }
        }

        // Nivel 2: Template default del tema activo
        let themeDefaultPath = `src/themes/${activeTheme}/templates/page.tsx`;
        let themeDefaultFullPath = join(Deno.cwd(), themeDefaultPath);

        try {
            await Deno.stat(themeDefaultFullPath);

            // Apply theme:pageTemplate filter
            themeDefaultPath = await applyFilters("theme:pageTemplate", themeDefaultPath, null, activeTheme);

            const module = await this.loadThemeModule(themeDefaultPath);
            console.log(`✅ Usando template default del tema: ${activeTheme}`);
            return module.default;
        } catch (_error) {
            console.log(`⚠️ Template default no encontrado en tema: ${activeTheme}`);
        }

        // Nivel 3: Template default del tema base (fallback final)
        const basePath = `src/themes/base/templates/page.tsx`;
        const baseFullPath = join(Deno.cwd(), basePath);

        try {
            await Deno.stat(baseFullPath);
            const module = await this.loadThemeModule(basePath);
            console.log(`✅ Usando template default del tema base (fallback)`);
            return module.default;
        } catch (_error) {
            console.error(`❌ CRITICAL: No se pudo cargar ningún template de página!`);
        }

        // Nivel 4: Error crítico
        const errorMsg =
            `No se pudo cargar ningún template de página. Template solicitado: ${templateName}, Tema: ${activeTheme}`;
        console.error(errorMsg);
        await this.notifyAdminAboutMissingTemplate(templateName || "page", activeTheme);
        return this.createEmergencyTemplate(templateName || "page", activeTheme);
    }
}
