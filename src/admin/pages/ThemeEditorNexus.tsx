import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

interface ThemeFile {
  name: string;
  path: string;
  type: "file" | "directory";
  extension?: string;
  children?: ThemeFile[];
}

interface ThemeEditorNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  themeName: string;
  fileTree: ThemeFile[];
  currentFile?: string;
  currentContent?: string;
  error?: string;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
}

// XSS safe - get language from extension
const getLanguageFromExtension = (ext?: string): string => {
  switch (ext) {
    case "tsx":
    case "ts":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
};

// XSS safe - render file tree
const renderFileTree = (files: ThemeFile[], level = 0): any => {
  return files.map((file) => {
    const indent = level * 1.25;
    const isDirectory = file.type === "directory";

    if (isDirectory) {
      return html`
        <div class="file-tree-item">
          <div
            class="file-tree-label"
            style="padding-left: ${indent}rem;"
            data-tree-toggle
          >
            <svg class="file-tree-icon chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <svg class="file-tree-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <span>${file.name}</span>
          </div>
          ${file.children && file.children.length > 0
            ? html`<div class="file-tree-children">${renderFileTree(file.children, level + 1)}</div>`
            : ""}
        </div>
      `;
    }

    return html`
      <a
        href="?file=${encodeURIComponent(file.path)}"
        class="file-tree-label"
        style="padding-left: ${indent}rem;"
      >
        <svg class="file-tree-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>${file.name}</span>
        ${file.extension ? html`<span class="file-ext">.${file.extension}</span>` : ""}
      </a>
    `;
  });
};

export const ThemeEditorNexusPage = (props: ThemeEditorNexusPageProps) => {
  const {
    user,
    themeName,
    fileTree,
    currentFile,
    currentContent = "",
    error,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  const fileExtension = currentFile ? currentFile.split(".").pop() : undefined;
  const language = getLanguageFromExtension(fileExtension);

  const content = html`
    <style>
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        margin-bottom: 1.5rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0;
      }

      /* ========== ERROR ALERT ========== */
      .alert-error {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-radius: var(--nexus-radius-lg);
        background: rgba(243, 18, 96, 0.1);
        border: 1px solid rgba(243, 18, 96, 0.3);
        color: var(--nexus-error);
        margin-bottom: 1.5rem;
      }

      .alert-error svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      /* ========== EDITOR CONTAINER ========== */
      .theme-editor-container {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 1.5rem;
        height: calc(100vh - 280px);
      }

      @media (max-width: 1024px) {
        .theme-editor-container {
          grid-template-columns: 1fr;
          height: auto;
        }
      }

      /* ========== FILE TREE PANEL ========== */
      .file-tree-panel {
        background: var(--nexus-base-100);
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-lg);
        padding: 1rem;
        overflow-y: auto;
      }

      .file-tree-panel::-webkit-scrollbar {
        width: 6px;
      }

      .file-tree-panel::-webkit-scrollbar-track {
        background: transparent;
      }

      .file-tree-panel::-webkit-scrollbar-thumb {
        background: var(--nexus-base-300);
        border-radius: 3px;
      }

      .file-tree-item {
        margin: 0.25rem 0;
      }

      .file-tree-item.collapsed .file-tree-children {
        display: none;
      }

      .file-tree-item.collapsed .chevron {
        transform: rotate(0deg);
      }

      .file-tree-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: var(--nexus-radius-md);
        font-size: 0.875rem;
        cursor: pointer;
        transition: background 0.2s;
        text-decoration: none;
        color: var(--nexus-base-content);
      }

      .file-tree-label:hover {
        background: rgba(22, 123, 255, 0.08);
      }

      .file-tree-icon {
        width: 1.125rem;
        height: 1.125rem;
        flex-shrink: 0;
        color: var(--nexus-base-content);
        opacity: 0.6;
      }

      .file-tree-icon.chevron {
        width: 0.875rem;
        height: 0.875rem;
        transition: transform 0.2s;
        transform: rotate(90deg);
      }

      .file-ext {
        margin-left: auto;
        font-size: 0.75rem;
        color: var(--nexus-base-content);
        opacity: 0.5;
      }

      /* ========== EDITOR PANEL ========== */
      .editor-panel {
        display: flex;
        flex-direction: column;
        background: var(--nexus-base-100);
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-lg);
        overflow: hidden;
      }

      .editor-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--nexus-base-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .editor-content {
        flex: 1;
        display: flex;
        position: relative;
        overflow: hidden;
        min-height: 400px;
      }

      .line-numbers {
        padding: 1rem 0;
        background: var(--nexus-base-200);
        border-right: 1px solid var(--nexus-base-300);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        text-align: right;
        color: var(--nexus-base-content);
        opacity: 0.5;
        user-select: none;
        overflow: hidden;
      }

      .line-numbers div {
        padding: 0 1rem;
      }

      .code-editor {
        flex: 1;
        padding: 1rem 1.5rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        border: none;
        outline: none;
        resize: none;
        background: transparent;
        color: var(--nexus-base-content);
        overflow-y: auto;
        white-space: pre;
        overflow-wrap: normal;
      }

      .code-editor::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .code-editor::-webkit-scrollbar-track {
        background: var(--nexus-base-200);
      }

      .code-editor::-webkit-scrollbar-thumb {
        background: var(--nexus-primary);
        opacity: 0.3;
        border-radius: 4px;
      }

      .code-editor::-webkit-scrollbar-thumb:hover {
        opacity: 0.5;
      }

      /* ========== EMPTY STATE ========== */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: 2rem;
        color: var(--nexus-base-content);
        opacity: 0.6;
      }

      .empty-state svg {
        width: 4rem;
        height: 4rem;
        margin-bottom: 1rem;
        opacity: 0.4;
      }
    </style>

    <div class="page-header-nexus">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <h1 class="page-title-nexus">Editor de Tema: ${themeName}</h1>
        ${NexusButton({
          label: "Volver a themes",
          type: "outline",
          href: `${adminPath}/appearance/themes`
        })}
      </div>
    </div>

    ${error ? html`
      <div class="alert-error">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span>${error}</span>
      </div>
    ` : ""}

    <div class="theme-editor-container">
      <div class="file-tree-panel">
        <h3 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--nexus-base-content); opacity: 0.6;">
          Archivos
        </h3>
        <div class="file-tree">
          ${renderFileTree(fileTree)}
        </div>
      </div>

      <div class="editor-panel">
        ${currentFile ? html`
          <div class="editor-header">
            <div>
              <h3 style="font-weight: 600; margin-bottom: 0.25rem;">${currentFile.split("/").pop()}</h3>
              <p style="font-size: 0.75rem; color: var(--nexus-base-content); opacity: 0.5;">${currentFile}</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${NexusButton({
                label: "Descartar cambios",
                type: "outline",
                size: "sm",
                dataAttributes: { "data-action": "reset-form" }
              })}
              ${NexusButton({
                label: "Guardar archivo",
                type: "primary",
                size: "sm",
                isSubmit: true,
                dataAttributes: { "form": "editor-form" }
              })}
            </div>
          </div>

          <form id="editor-form" method="POST" action="${adminPath}/api/admin/themes/editor/save" class="editor-content">
            <input type="hidden" name="theme" value="${themeName}" />
            <input type="hidden" name="file" value="${currentFile}" />

            <div class="line-numbers" id="line-numbers"></div>

            <textarea
              name="content"
              class="code-editor"
              id="code-editor"
              spellcheck="false"
              data-language="${language}"
            >${currentContent}</textarea>
          </form>
        ` : html`
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Selecciona un archivo</h3>
            <p>Elige un archivo del árbol de la izquierda para comenzar a editar</p>
          </div>
        `}
      </div>
    </div>

    ${raw(`<script>
      // XSS safe - event handlers in addEventListener
      document.addEventListener('DOMContentLoaded', function() {
        // XSS safe - update line numbers
        function updateLineNumbers() {
          const editor = document.getElementById('code-editor');
          const lineNumbers = document.getElementById('line-numbers');
          if (!editor || !lineNumbers) return;

          const lines = editor.value.split('\\n');
          // XSS safe - using createElement and textContent
          lineNumbers.innerHTML = '';
          lines.forEach((_, i) => {
            const div = document.createElement('div');
            div.textContent = String(i + 1);
            lineNumbers.appendChild(div);
          });
        }

        // XSS safe - sync scroll
        function syncScroll() {
          const editor = document.getElementById('code-editor');
          const lineNumbers = document.getElementById('line-numbers');
          if (!editor || !lineNumbers) return;

          lineNumbers.scrollTop = editor.scrollTop;
        }

        // Initialize line numbers
        const editor = document.getElementById('code-editor');
        if (editor) {
          updateLineNumbers();

          // XSS safe - input handler
          editor.addEventListener('input', updateLineNumbers);

          // XSS safe - scroll handler
          editor.addEventListener('scroll', syncScroll);

          // XSS safe - tab key handling
          editor.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = this.selectionStart;
              const end = this.selectionEnd;
              // XSS safe - direct value manipulation
              this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
              this.selectionStart = this.selectionEnd = start + 2;
              updateLineNumbers();
            }
          });
        }

        // XSS safe - file tree toggle
        document.addEventListener('click', function(e) {
          const toggle = e.target.closest('[data-tree-toggle]');
          if (toggle) {
            const item = toggle.parentElement;
            if (item) {
              item.classList.toggle('collapsed');
            }
          }
        });

        // XSS safe - reset form action
        document.addEventListener('click', function(e) {
          const btn = e.target.closest('[data-action="reset-form"]');
          if (btn) {
            const form = document.getElementById('editor-form');
            if (form && confirm('¿Descartar los cambios?')) {
              form.reset();
              updateLineNumbers();
            }
          }
        });
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: `Editor de Tema: ${themeName}`,
    children: content,
    activePage: "appearance.themes",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default ThemeEditorNexusPage;
