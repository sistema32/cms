// Minimal SDK types/helpers for plugin authors executed inside plugin workers.
// This is intentionally dependency-light to keep sandbox size small.

export type PluginHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

export interface PluginRoute {
  method: PluginHttpMethod;
  path: string;
  permission?: string;
  handler: (ctx: { req: any; db: any; fetch: typeof fetch }) => Promise<any> | any;
}

export interface PluginHook {
  name: string;
  permission?: string;
  handler: (...args: any[]) => Promise<any> | any;
}

export interface PluginCron {
  schedule: string;
  permission?: string;
  handler: () => Promise<void> | void;
}

export interface PluginUiSlot {
  slot: string;
  label: string;
  url: string;
}

export interface PluginAsset {
  type: "css" | "js";
  url: string;
}

export interface PluginWidget {
  widget: string;
  label: string;
  renderUrl: string;
}

export interface PluginRegisterContext {
  sandbox: { plugin: string; capabilities: any };
  registerRoute: (sandbox: any, route: PluginRoute) => void;
  registerHook: (sandbox: any, hook: PluginHook) => void;
  registerCron: (schedule: string, handler: () => Promise<void> | void, permission?: string) => void;
  registerUiSlot: (slot: string, label: string, url: string) => void;
  registerAsset: (type: "css" | "js", url: string) => void;
  registerWidget: (widget: string, label: string, renderUrl: string) => void;
}

// Helper to enforce required fields when registering routes/hooks.
export function definePlugin(register: (ctx: PluginRegisterContext) => Promise<void> | void) {
  return register;
}

// Sugar helpers for common registration patterns
export function addRoute(ctx: PluginRegisterContext, route: PluginRoute) {
  ctx.registerRoute(ctx.sandbox, route);
}

export function addHook(ctx: PluginRegisterContext, hook: PluginHook) {
  ctx.registerHook(ctx.sandbox, hook);
}

export function addCron(ctx: PluginRegisterContext, cron: PluginCron) {
  ctx.registerCron(cron.schedule, cron.handler, cron.permission);
}

// --- Lightweight sandboxed clients -------------------------------------------------

export class DbClient {
  constructor(private invoke: (req: any) => Promise<any>) { }

  async query(table: string, where?: Record<string, any>) {
    return this.invoke({ operation: "findMany", table, where });
  }

  async findOne(table: string, where: Record<string, any>) {
    return this.invoke({ operation: "findOne", table, where });
  }

  async insert(table: string, data: Record<string, any>) {
    return this.invoke({ operation: "insert", table, data });
  }

  async update(table: string, where: Record<string, any>, data: Record<string, any>) {
    return this.invoke({ operation: "update", table, where, data });
  }

  async delete(table: string, where: Record<string, any>) {
    return this.invoke({ operation: "delete", table, where });
  }
}

export class FsClient {
  constructor(private readTextImpl: (path: string) => Promise<string>, private readFileImpl: (path: string) => Promise<Uint8Array>) { }

  async readText(path: string) {
    return this.readTextImpl(path);
  }

  async readFile(path: string) {
    return this.readFileImpl(path);
  }
}

export async function createHttpClient(fetchImpl: typeof fetch, allowMethods?: string[]) {
  return async (url: string, init?: RequestInit) => {
    const method = (init?.method || "GET").toUpperCase();
    if (allowMethods && allowMethods.length > 0 && !allowMethods.includes(method)) {
      throw new Error(`HTTP method ${method} not allowed by plugin capabilities`);
    }
    return fetchImpl(url, init);
  };
}

// --- Editor Integration SDK ---------------------------------------------------

/**
 * A sidebar widget that plugins can add to the post editor.
 * The widget can have interactive elements that insert shortcodes into the content.
 */
export interface EditorSidebarWidget {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** HTML content for the widget body */
  html: string;
  /** Optional: JS to run when widget is rendered */
  initScript?: string;
  /** Order in sidebar (lower = higher) */
  order?: number;
  /** Icon (emoji or SVG) */
  icon?: string;
  /** Start collapsed */
  collapsed?: boolean;
}

/**
 * A block pattern that appears in the editor's block inserter
 */
export interface EditorBlockPattern {
  id: string;
  label: string;
  icon: string;
  category?: string;
  content: string;
  isShortcode?: boolean;
}

/** Editor hook names */
export const EditorHooks = {
  SIDEBAR_WIDGETS: "cms_admin:editor:sidebar_widgets",
  BLOCK_PATTERNS: "cms_admin:editor:block_patterns",
  TOOLBAR_BUTTONS: "cms_admin:editor:toolbar_buttons",
  SCRIPTS: "cms_admin:editor:scripts",
  STYLES: "cms_admin:editor:styles",
} as const;

/**
 * Register a sidebar widget for the post editor.
 * Use this to add plugin UI panels in the editor sidebar.
 * 
 * @example
 * registerEditorWidget(ctx, {
 *   id: 'my-slider',
 *   title: 'Slider',
 *   icon: '🎠',
 *   html: '<select id="sliderSelect">...</select>',
 *   initScript: 'fetch("/api/sliders").then(...)'
 * });
 */
export function registerEditorWidget(ctx: PluginRegisterContext, widget: EditorSidebarWidget) {
  ctx.registerHook(ctx.sandbox, {
    name: EditorHooks.SIDEBAR_WIDGETS,
    handler: (widgets: EditorSidebarWidget[]) => [...widgets, widget],
  });
}

/**
 * Register a block pattern for the editor.
 */
export function registerBlockPattern(ctx: PluginRegisterContext, pattern: EditorBlockPattern) {
  ctx.registerHook(ctx.sandbox, {
    name: EditorHooks.BLOCK_PATTERNS,
    handler: (patterns: EditorBlockPattern[]) => [...patterns, pattern],
  });
}

/**
 * Helper: Create a standard shortcode inserter widget.
 * This creates a widget with a dropdown that fetches options from an API
 * and an insert button that adds a shortcode to the editor.
 * 
 * @example
 * registerEditorWidget(ctx, createShortcodeWidget({
 *   id: 'lexslider',
 *   title: 'Slider',
 *   shortcodeName: 'lexslider',
 *   fetchOptionsUrl: '/api/sliders',
 *   icon: '🎠'
 * }));
 */
export function createShortcodeWidget(options: {
  id: string;
  title: string;
  shortcodeName: string;
  icon?: string;
  fetchOptionsUrl: string;
  optionLabel?: string;
  optionValue?: string;
  placeholder?: string;
}): EditorSidebarWidget {
  const {
    id,
    title,
    shortcodeName,
    icon = "📦",
    fetchOptionsUrl,
    optionLabel = "name",
    optionValue = "id",
    placeholder = "Seleccionar...",
  } = options;

  return {
    id,
    title,
    icon,
    html: `
      <div class="shortcode-widget" data-widget-id="${id}">
        <select id="${id}-select" class="sidebar-input" style="margin-bottom: 0.5rem;">
          <option value="">${placeholder}</option>
        </select>
        <button type="button" class="pill-btn" id="${id}-insert" style="width: 100%;">
          Insertar ${title}
        </button>
      </div>
    `,
    initScript: `
      (function() {
        const select = document.getElementById('${id}-select');
        const btn = document.getElementById('${id}-insert');
        
        // Fetch options from API
        fetch('${fetchOptionsUrl}', { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            const items = data.data || data.items || data;
            if (Array.isArray(items)) {
              items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item['${optionValue}'];
                opt.textContent = item['${optionLabel}'];
                select.appendChild(opt);
              });
            }
          })
          .catch(err => console.error('[${id}] Failed to load options:', err));
        
        // Insert shortcode on button click
        btn?.addEventListener('click', () => {
          const val = select.value;
          if (!val) {
            alert('Por favor selecciona un elemento');
            return;
          }
          const shortcode = '[${shortcodeName} id="' + val + '"]';
          
          // Use global insertIntoEditor helper
          if (window.insertIntoEditor) {
            window.insertIntoEditor(shortcode);
          } else {
            console.warn('[${id}] insertIntoEditor not available');
          }
        });
      })();
    `,
    order: 50,
    collapsed: false,
  };
}
