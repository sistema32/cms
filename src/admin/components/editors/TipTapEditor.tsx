import { html, raw } from "hono/html";
import { env } from "@/config/env.ts";

interface TipTapEditorProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  editorMode?: 'classic' | 'blocks';
}

export const TipTapEditor = (props: TipTapEditorProps) => {
  const {
    name,
    value = "",
    placeholder = "Escribe tu historia...",
    required = false,
    editorMode = 'classic',
  } = props;

  const editorId = `tiptap-${name}`;
  const inputId = `input-${name}`;
  const toolbarId = `toolbar-${name}`;
  const sourceAreaId = `source-${name}`;

  return html`
    <style>
      /* TipTap Core Styles */
      .ProseMirror {
        outline: none;
        min-height: 300px;
        font-family: 'Merriweather', serif; 
        font-size: 1.125rem;
        line-height: 1.8;
        color: #1e2328;
      }

      .lex-editor-container {
        border: 1px solid #eef0f2;
        border-radius: 0.5rem;
        background: #fff;
        overflow: visible; 
        transition: border-color 0.2s;
      }
      
      .lex-editor-container:focus-within {
        border-color: #167bff;
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .tiptap-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        padding: 0.5rem;
        border-bottom: 1px solid #eef0f2;
        background: #fff;
        align-items: center;
      }

      .tiptap-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid transparent; 
        background: transparent;
        color: #666;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tiptap-btn:hover {
        background: #f3f4f6;
        color: #1e2328;
      }

      .tiptap-btn.is-active {
        background: #e5e7eb;
        color: #000;
        font-weight: 600;
      }

      .tiptap-separator {
        width: 1px;
        height: 20px;
        background: #eef0f2;
        margin: 0 0.5rem;
        align-self: center;
      }

      .tiptap-source-mode {
        display: none; 
        width: 100%;
        min-height: 300px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        padding: 1rem;
        border: none;
        outline: none;
        resize: vertical;
        line-height: 1.6;
        color: #333;
        background: #f8f9fa;
      }
      
      .ProseMirror {
        padding: 1rem;
        min-height: 300px;
      }

      .is-source-mode #tiptap-${name} { display: none; }
      .is-source-mode #source-${name} { display: block; }
      
      /* Bubble Menu & Floating Menu */
      .tiptap-menu-container {
        display: flex;
        align-items: center;
        background: #fff;
        border: 1px solid #eef0f2;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 0.25rem;
        gap: 0.5rem;
        z-index: 50;
      }
      
      .tiptap-floating-menu {
        margin-left: -2rem; 
      }
      
      .bubble-group {
        display: flex;
        gap: 0.25rem;
      }
      
      .bubble-btn {
        background: transparent;
        border: none;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        font-size: 0.85rem;
        color: #666;
        transition: all 0.2s;
        min-width: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .bubble-btn:hover {
        background: #f3f4f6;
        color: #111;
      }
      
      .bubble-btn.is-active {
        background: #e5e7eb;
        color: #000;
        font-weight: 600;
      }
      
      .bubble-separator {
        width: 1px;
        height: 1.25rem;
        background: #e5e7eb;
      }
      
      /* Mode specific styles */
      .editor-mode-blocks .tiptap-toolbar {
          display: none !important;
      }
      
      .editor-mode-classic .tiptap-floating-menu {
          display: none !important;
      }
      
      /* Inserter Menu */
      .inserter-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }
      
      .inserter-btn-main {
        width: 32px;
        height: 32px;
        background: #1e2328;
        color: #fff;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      
      .inserter-btn-main:hover {
        background: #000;
        transform: scale(1.05);
      }
      
      .inserter-btn-main.active {
        transform: rotate(45deg);
        background: #333;
      }
      
      .inserter-menu {
        position: absolute;
        bottom: 110%; 
        left: 0;
        margin-bottom: 0.5rem;
        background: white;
        border: 1px solid #eef0f2;
        border-radius: 0.5rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        padding: 0.5rem;
        width: 240px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 100;
        animation: fadeIn 0.1s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .inserter-section {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }
      
      .inserter-section small {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: #999;
        font-weight: 700;
        padding-left: 0.5rem;
        margin-bottom: 0.25rem;
        letter-spacing: 0.05em;
      }
      
      .inserter-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        border: none;
        background: transparent;
        color: #444;
        font-size: 0.9rem;
        border-radius: 0.375rem;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
        font-weight: 500;
      }
      
      .inserter-item:hover {
        background: #f3f4f6;
        color: #000;
      }
      
      .inserter-item svg {
        opacity: 0.6;
        width: 18px;
        height: 18px;
      }
      .inserter-item:hover svg {
        opacity: 1;
      }
      
      .nexus-box {
        margin: 1.5rem 0;
        position: relative;
      }
      .nexus-box:hover::after {
        content: 'Box';
        position: absolute;
        top: -10px;
        right: 0;
        background: #eee;
        font-size: 0.6rem;
        padding: 2px 4px;
        border-radius: 3px;
        color: #888;
      }
    </style>

    <div class="lex-editor-wrapper ${editorMode === 'blocks' ? 'editor-mode-blocks' : 'editor-mode-classic'}">
      <div id="editor-container-${name}" class="lex-editor-container" style="position: relative;" data-instance-name="${name}" data-placeholder="${placeholder}">
        <!-- Toolbar (Classic Mode) -->
        <div id="${toolbarId}" class="tiptap-toolbar"></div>

        <!-- Editor Content (Visual) -->
        <div id="${editorId}"></div>
        
        <!-- Source Content (HTML) -->
        <textarea id="${sourceAreaId}" class="tiptap-source-mode" spellcheck="false"></textarea>
        
        <input
          type="hidden"
          id="${inputId}"
          name="${name}"
          value="${value.replace(/"/g, "&quot;")}"
          ${required ? "required" : ""}
        />
      </div>
    </div>

    ${raw(`<script type="module">
      import { initTipTap } from '${env.ADMIN_PATH}/assets/js/editor-core.js';
      
      console.log('[NexusEditor] Script module executing, import path:', '${env.ADMIN_PATH}/assets/js/editor-core.js');
      const name = "${name}";
      
      try {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => initTipTap(name));
          } else {
            console.log('[NexusEditor] Immediate init called for', name);
            initTipTap(name);
          }
      } catch (e) {
          console.error('[NexusEditor] Init error:', e);
      }
    </script>`)
    }
`;
};
