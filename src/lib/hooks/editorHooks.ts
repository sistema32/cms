/**
 * Editor Hooks - Types and utilities for plugin extensions in the post editor
 * 
 * Plugins can register:
 * - Sidebar widgets (e.g., slider picker that inserts shortcodes)
 * - Block patterns (appear in editor block menu)
 * - Toolbar buttons
 */

import { registerFilter, applyFilters } from "./index.ts";

// Re-export for plugin convenience
export { registerFilter, applyFilters };

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
    /** Optional: JS to run when widget is rendered (function name, will be called) */
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
    /** Unique identifier */
    id: string;
    /** Display label */
    label: string;
    /** Icon (emoji or SVG path) */
    icon: string;
    /** Category: 'media', 'layout', 'text', 'plugin' */
    category?: string;
    /** HTML content to insert OR shortcode string */
    content: string;
    /** If true, content is a shortcode like [plugin arg="val"] */
    isShortcode?: boolean;
}

/**
 * A custom toolbar button
 */
export interface EditorToolbarButton {
    id: string;
    label: string;
    icon: string;
    /** JS function name to call on click */
    action: string;
    order?: number;
}

// Hook names as constants
export const EDITOR_HOOKS = {
    SIDEBAR_WIDGETS: "cms_admin:editor:sidebar_widgets",
    BLOCK_PATTERNS: "cms_admin:editor:block_patterns",
    TOOLBAR_BUTTONS: "cms_admin:editor:toolbar_buttons",
    EDITOR_SCRIPTS: "cms_admin:editor:scripts",
    EDITOR_STYLES: "cms_admin:editor:styles",
} as const;

/**
 * Get all registered sidebar widgets for the editor
 */
export async function getEditorSidebarWidgets(context: { postId?: number; postType?: string } = {}): Promise<EditorSidebarWidget[]> {
    const widgets = await applyFilters<EditorSidebarWidget[]>(EDITOR_HOOKS.SIDEBAR_WIDGETS, [], context);
    return widgets.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

/**
 * Get all registered block patterns for the editor
 */
export async function getEditorBlockPatterns(context: { postId?: number } = {}): Promise<EditorBlockPattern[]> {
    return applyFilters<EditorBlockPattern[]>(EDITOR_HOOKS.BLOCK_PATTERNS, [], context);
}

/**
 * Get all registered toolbar buttons for the editor
 */
export async function getEditorToolbarButtons(context: { postId?: number } = {}): Promise<EditorToolbarButton[]> {
    const buttons = await applyFilters<EditorToolbarButton[]>(EDITOR_HOOKS.TOOLBAR_BUTTONS, [], context);
    return buttons.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

/**
 * Get additional scripts to load in the editor (URLs or inline)
 */
export async function getEditorScripts(context: { postId?: number } = {}): Promise<string[]> {
    return applyFilters<string[]>(EDITOR_HOOKS.EDITOR_SCRIPTS, [], context);
}

/**
 * Get additional styles to load in the editor (URLs or inline)
 */
export async function getEditorStyles(context: { postId?: number } = {}): Promise<string[]> {
    return applyFilters<string[]>(EDITOR_HOOKS.EDITOR_STYLES, [], context);
}

/**
 * Helper: Create a shortcode inserter widget
 * This creates a standard widget with a dropdown and insert button
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
        
        // Fetch options
        fetch('${fetchOptionsUrl}')
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
        
        // Insert shortcode on click
        btn?.addEventListener('click', () => {
          const val = select.value;
          if (!val) {
            alert('Por favor selecciona un elemento');
            return;
          }
          const shortcode = '[${shortcodeName} id="' + val + '"]';
          
          // Insert into editor
          if (window.insertIntoEditor) {
            window.insertIntoEditor(shortcode);
          } else {
            // Fallback: try to find TipTap editor and insert
            const bodyInput = document.querySelector('[name="body"]');
            if (bodyInput) {
              bodyInput.value += '\\n' + shortcode;
              bodyInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        });
      })();
    `,
        order: 50,
        collapsed: false,
    };
}
