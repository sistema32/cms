import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface ThemeFile {
  name: string;
  path: string;
  type: "file" | "directory";
  extension?: string;
  children?: ThemeFile[];
}

interface ThemeEditorPageProps {
  user: {
    name: string | null;
    email: string;
  };
  themeName: string;
  fileTree: ThemeFile[];
  currentFile?: string;
  currentContent?: string;
  error?: string;
}

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
            onclick="this.parentElement.classList.toggle('collapsed')"
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

export const ThemeEditorPage = (props: ThemeEditorPageProps) => {
  const { user, themeName, fileTree, currentFile, currentContent = "", error } = props;

  const fileExtension = currentFile ? currentFile.split(".").pop() : undefined;
  const language = getLanguageFromExtension(fileExtension);

  const content = html`
    <style>
      .theme-editor-container {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 1.5rem;
        height: calc(100vh - 200px);
      }

      .file-tree-panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1rem;
        padding: 1rem;
        overflow-y: auto;
      }

      .dark .file-tree-panel {
        background: rgba(30, 41, 59, 0.78);
        border-color: rgba(148, 163, 184, 0.16);
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
        border-radius: 0.5rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background 0.2s;
        text-decoration: none;
        color: inherit;
      }

      .file-tree-label:hover {
        background: rgba(124, 58, 237, 0.08);
      }

      .file-tree-icon {
        width: 1.125rem;
        height: 1.125rem;
        flex-shrink: 0;
        color: rgba(100, 116, 139, 0.7);
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
        color: rgba(100, 116, 139, 0.6);
      }

      .editor-panel {
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1rem;
        overflow: hidden;
      }

      .dark .editor-panel {
        background: rgba(30, 41, 59, 0.78);
        border-color: rgba(148, 163, 184, 0.16);
      }

      .editor-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.25);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dark .editor-header {
        border-color: rgba(148, 163, 184, 0.16);
      }

      .editor-content {
        flex: 1;
        display: flex;
        position: relative;
        overflow: hidden;
      }

      .line-numbers {
        padding: 1rem 0;
        background: rgba(248, 250, 252, 0.95);
        border-right: 1px solid rgba(148, 163, 184, 0.25);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        text-align: right;
        color: rgba(100, 116, 139, 0.6);
        user-select: none;
        overflow: hidden;
      }

      .dark .line-numbers {
        background: rgba(15, 23, 42, 0.6);
        border-color: rgba(148, 163, 184, 0.16);
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
        color: inherit;
        overflow-y: auto;
        white-space: pre;
        overflow-wrap: normal;
      }

      .code-editor::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .code-editor::-webkit-scrollbar-track {
        background: rgba(148, 163, 184, 0.1);
      }

      .code-editor::-webkit-scrollbar-thumb {
        background: rgba(124, 58, 237, 0.3);
        border-radius: 4px;
      }

      .code-editor::-webkit-scrollbar-thumb:hover {
        background: rgba(124, 58, 237, 0.5);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: 2rem;
        color: rgba(100, 116, 139, 0.7);
      }

      .empty-state svg {
        width: 4rem;
        height: 4rem;
        margin-bottom: 1rem;
        opacity: 0.4;
      }
    </style>

    <div class="page-header">
      <h1 class="page-title">Editor de Tema: ${themeName}</h1>
      <div class="page-actions">
        <a href="${env.ADMIN_PATH}/appearance/themes" class="btn-secondary">Volver a themes</a>
      </div>
    </div>

    ${error
      ? html`
        <div class="alert alert-error mb-4">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <span>${error}</span>
        </div>
      `
      : ""}

    <div class="theme-editor-container">
      <div class="file-tree-panel">
        <h3 class="text-sm font-semibold mb-3 uppercase tracking-wide text-gray-600 dark:text-gray-400">
          Archivos
        </h3>
        <div class="file-tree">
          ${renderFileTree(fileTree)}
        </div>
      </div>

      <div class="editor-panel">
        ${currentFile
          ? html`
            <div class="editor-header">
              <div>
                <h3 class="font-semibold">${currentFile.split("/").pop()}</h3>
                <p class="text-xs text-gray-500 mt-1">${currentFile}</p>
              </div>
              <div class="flex gap-2">
                <button type="button" class="btn-secondary btn-sm" onclick="document.getElementById('editor-form').reset()">
                  Descartar cambios
                </button>
                <button type="submit" form="editor-form" class="btn-action btn-sm">
                  Guardar archivo
                </button>
              </div>
            </div>

            <form id="editor-form" method="POST" action="${env.ADMIN_PATH}/api/admin/themes/editor/save" class="editor-content">
              <input type="hidden" name="theme" value="${themeName}" />
              <input type="hidden" name="file" value="${currentFile}" />

              <div class="line-numbers" id="line-numbers">
                ${currentContent.split("\n").map((_, i) => html`<div>${i + 1}</div>`).join("")}
              </div>

              <textarea
                name="content"
                class="code-editor"
                id="code-editor"
                spellcheck="false"
                data-language="${language}"
                oninput="updateLineNumbers()"
                onscroll="syncScroll()"
              >${currentContent}</textarea>
            </form>

            <script>
              function updateLineNumbers() {
                const editor = document.getElementById('code-editor');
                const lineNumbers = document.getElementById('line-numbers');
                const lines = editor.value.split('\\n');
                lineNumbers.innerHTML = lines.map((_, i) => \`<div>\${i + 1}</div>\`).join('');
              }

              function syncScroll() {
                const editor = document.getElementById('code-editor');
                const lineNumbers = document.getElementById('line-numbers');
                lineNumbers.scrollTop = editor.scrollTop;
              }

              // Initialize
              document.getElementById('code-editor').addEventListener('keydown', function(e) {
                // Tab key handling
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = this.selectionStart;
                  const end = this.selectionEnd;
                  this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
                  this.selectionStart = this.selectionEnd = start + 2;
                  updateLineNumbers();
                }
              });
            </script>
          `
          : html`
            <div class="empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <h3 class="text-lg font-semibold mb-2">Selecciona un archivo</h3>
              <p>Elige un archivo del árbol de la izquierda para comenzar a editar</p>
            </div>
          `}
      </div>
    </div>
  `;

  return AdminLayout({
    title: `Editor de Tema: ${themeName}`,
    children: content,
    activePage: "appearance.themes",
    user,
  });
};

export default ThemeEditorPage;
