/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

/**
 * LexSlider Plugin - Main Entry Point
 * 
 * This file serves as the plugin's entry point, registering UI elements,
 * hooks, widgets, and delegating route registration to modular files.
 */

// Import route registrars
import {
    registerSliderRoutes,
    registerSlideRoutes,
    registerGlobalLayerRoutes,
    registerRenderRoutes,
    registerTemplateRoutes
} from './routes/index.ts';

// Import services for shortcode rendering
import { renderSliderHTML } from './services/RenderService.ts';
import { escapeHtml } from './utils/escapeHtml.ts';

export default function (ctx: any) {
    console.log("[lexslider] Plugin starting (modular architecture)...");

    // ==================== UI REGISTRATIONS ====================

    // Register Sidebar Slot
    ctx.registerUiSlot("sidebar", "LexSlider", "plugin/lexslider/index.html", "ui:slot:sidebar");

    // Register Widget (for embedding)
    ctx.registerWidget("lexslider_widget", "LexSlider", "/plugins-runtime/lexslider/render", "ui:widget:lexslider_widget");

    // Register Assets
    ctx.registerAsset("css", "/plugins-runtime/plugins-static/lexslider/styles.css", "ui:asset:css");
    ctx.registerAsset("js", "/plugins-runtime/plugins-static/lexslider/lexslider-embed.js", "ui:asset:js");

    // ==================== EDITOR HOOK ====================

    // Register Editor Sidebar Widget (for inserting sliders into posts)
    ctx.registerHook(ctx.sandbox, {
        name: "cms_admin:editor:sidebar_widgets",
        permission: "hook:cms_admin:editor:sidebar_widgets",
        handler: (widgets: any[]) => [...widgets, {
            id: 'lexslider',
            title: 'Slider',
            icon: '🎠',
            html: `
              <div class="lexslider-widget">
                <select id="lexslider-select" class="sidebar-input" style="margin-bottom: 0.5rem;">
                  <option value="">Cargando sliders...</option>
                </select>
                <button type="button" class="pill-btn" id="lexslider-insert" style="width: 100%;">
                  Insertar Slider
                </button>
                <p class="text-hint" style="margin-top: 0.5rem;">El slider se mostrará como shortcode.</p>
              </div>
            `,
            initScript: `
              (function() {
                const select = document.getElementById('lexslider-select');
                const btn = document.getElementById('lexslider-insert');
                
                // Fetch available sliders
                fetch('/plugins-runtime/lexslider/sliders', { credentials: 'include' })
                  .then(r => r.json())
                  .then(data => {
                    const items = Array.isArray(data) ? data : (data.rows || []);
                    select.innerHTML = '<option value="">Seleccionar slider...</option>';
                    items.forEach(s => {
                      const opt = document.createElement('option');
                      opt.value = s.id;
                      opt.textContent = s.title || s.name || 'Slider ' + s.id;
                      select.appendChild(opt);
                    });
                  })
                  .catch(err => {
                    console.error('[LexSlider] Error loading sliders:', err);
                    select.innerHTML = '<option value="">Error al cargar</option>';
                  });
                
                // Insert shortcode on click
                btn?.addEventListener('click', () => {
                  const val = select.value;
                  if (!val) {
                    alert('Por favor selecciona un slider');
                    return;
                  }
                  const shortcode = '[lexslider id="' + val + '"]';
                  
                  if (window.insertIntoEditor) {
                    window.insertIntoEditor(shortcode);
                    select.value = '';
                  } else {
                    console.warn('[LexSlider] insertIntoEditor not available');
                    alert('Editor no disponible');
                  }
                });
              })();
            `,
            order: 30,
            collapsed: false
        }]
    });

    // ==================== SHORTCODE ====================

    // Register Shortcode [lexslider id="X"]
    if (ctx.registerShortcode) {
        ctx.registerShortcode("lexslider", async (attrs: any, _content: string, { db }: any) => {
            const id = attrs.id;
            if (!id) return "<!-- LexSlider: Missing id attribute -->";

            const html = await renderSliderHTML(id, db, escapeHtml);
            return html;
        });
    }

    // ==================== API ROUTES ====================

    // Register all routes from modular files
    registerSliderRoutes(ctx);
    registerSlideRoutes(ctx);
    registerGlobalLayerRoutes(ctx);
    registerRenderRoutes(ctx);
    registerTemplateRoutes(ctx);

    console.log("[lexslider] All routes registered successfully");
}
