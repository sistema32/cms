import { html, raw } from "hono/html";
import { env } from "@/config/env.ts";

interface CKEditorFieldProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  mediaListEndpoint?: string;
  mediaUploadEndpoint?: string;
}

export const CKEditorField = (props: CKEditorFieldProps) => {
  const {
    name,
    value = "",
    placeholder = "Escribe tu contenido aquí...",
    required = false,
    mediaListEndpoint = "/api/media",
    mediaUploadEndpoint = "/api/media",
  } = props;

  const editorId = `ckeditor-${name}`;
  const inputId = `input-${name}`;
  const tocId = `toc-${name}`;
  const mediaModalId = `mediaPicker-${name}`;
  const mediaContentId = `mediaPickerContent-${name}`;
  const bundlePath = `${env.ADMIN_PATH}/assets/js/ckeditor-bundle.js`;

  return html`
    <style>
      .lex-editor-wrapper {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0;
      }

      @media (max-width: 1024px) {
        .lex-editor-wrapper {
          grid-template-columns: 1fr;
        }

        .lex-editor-toc {
          order: -1;
        }
      }

      .lex-editor-container {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 0.75rem;
        border: 1px solid rgba(148, 163, 184, 0.25);
        padding: 0.75rem;
        min-height: 20rem;
      }

      .dark .lex-editor-container {
        background: rgba(15, 23, 42, 0.55);
        border-color: rgba(71, 85, 105, 0.55);
      }

      .ck.ck-editor__editable_inline {
        min-height: 18rem;
        max-height: 50rem;
        overflow-y: auto;
      }

      .ck .ck-icon,
      .ck-icon {
        width: 1.1em;
        height: 1.1em;
      }

      .lex-editor-toc {
        background: rgba(248, 250, 252, 0.85);
        border-radius: 0.75rem;
        border: 1px solid rgba(148, 163, 184, 0.25);
        padding: 1rem;
        font-size: 0.875rem;
        line-height: 1.45;
        position: sticky;
        top: 1.25rem;
        height: fit-content;
      }

      .dark .lex-editor-toc {
        background: rgba(15, 23, 42, 0.45);
        border-color: rgba(71, 85, 105, 0.55);
      }

      .lex-editor-toc ul {
        list-style: none;
        margin: 0;
        padding-left: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .lex-editor-toc li {
        color: rgba(30, 41, 59, 0.9);
        cursor: pointer;
        transition: color 0.15s ease;
      }

      .lex-editor-toc li:hover {
        color: rgb(124, 58, 237);
      }

      .dark .lex-editor-toc li {
        color: rgba(226, 232, 240, 0.88);
      }

      .dark .lex-editor-toc li:hover {
        color: rgba(196, 181, 253, 0.9);
      }

      .lex-editor-fallback {
        min-height: 18rem;
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 0.75rem;
        padding: 1rem;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        z-index: 60;
      }

      .modal-backdrop.hidden {
        display: none !important;
      }

      .modal-container {
        background: #fff;
        border-radius: 0.75rem;
        padding: 1.5rem;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
      }

      .dark .modal-container {
        background: rgba(15, 23, 42, 0.95);
        color: rgba(226, 232, 240, 0.95);
      }
    </style>


    <div class="lex-editor-wrapper">
      <div>
        <div class="lex-editor-container">
          <div id="${editorId}" data-placeholder="${placeholder}"></div>
        </div>
        <input
          type="hidden"
          id="${inputId}"
          name="${name}"
          value="${value.replace(/"/g, "&quot;")}"
          ${required ? "required" : ""}
        />
      </div>
    </div>

    <div
      id="${mediaModalId}"
      class="modal-backdrop hidden"
      onclick="if (event.target === this) closeMediaPicker_${name}()"
    >
      <div class="modal-container max-w-6xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Biblioteca de Medios</h3>
          <button
            type="button"
            onclick="closeMediaPicker_${name}()"
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div id="${mediaContentId}">
          <div class="text-center py-8">
            <div
              class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-b-transparent border-purple-600"
            >
            </div>
            <p class="mt-3 text-gray-600 dark:text-gray-400">
              Cargando biblioteca de medios...
            </p>
          </div>
        </div>
      </div>
    </div>

    ${raw(`<script src="${env.ADMIN_PATH}/assets/js/ckeditor-init.js"></script>
    <script type="module">
      (async () => {
        await initCKEditor({
          editorId: '${editorId}',
          inputId: '${inputId}',
          tocId: '${tocId}',
          mediaModalId: '${mediaModalId}',
          mediaContentId: '${mediaContentId}',
          name: '${name}',
          bundlePath: '${bundlePath}',
          mediaListEndpoint: '${mediaListEndpoint}',
          mediaUploadEndpoint: '${mediaUploadEndpoint}',
          adminPath: '${env.ADMIN_PATH}',
          initialContent: ${JSON.stringify(value || "<p></p>")},
          placeholderText: ${JSON.stringify(placeholder)}
        });
      })();
    </script>`)}
  `;
};

export default CKEditorField;
