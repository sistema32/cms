import { html, raw } from "hono/html";
import { env } from "../../config/env.ts";

interface CKEditorFieldProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
}

export const CKEditorField = (props: CKEditorFieldProps) => {
  const {
    name,
    value = "",
    placeholder = "Escribe tu contenido aquí...",
    required = false,
  } = props;

  const editorId = `ckeditor-${name}`;
  const inputId = `input-${name}`;
  const tocId = `toc-${name}`;
  const mediaModalId = `mediaPicker-${name}`;
  const mediaContentId = `mediaPickerContent-${name}`;
  const bundlePath = `${env.ADMIN_PATH}/assets/js/ckeditor-bundle.js`;
  const mediaListEndpoint = `${env.ADMIN_PATH}/media/data`;
  const mediaUploadEndpoint = `${env.ADMIN_PATH}/media`;

  return html`
    <style>
      .lex-editor-wrapper {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(220px, 1fr);
        gap: 1.5rem;
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

      .lex-media-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.75rem;
      }

      .lex-media-toolbar button {
        background: linear-gradient(
          135deg,
          rgba(124, 58, 237, 0.85),
          rgba(96, 165, 250, 0.75),
        );
        color: #f8fafc;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 0.85rem;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .lex-media-toolbar button:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px -12px rgba(124, 58, 237, 0.9);
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
        <div class="lex-media-toolbar">
          <button type="button" id="mediaLibraryButton-${name}">
            <span aria-hidden="true">📁</span>
            Biblioteca de medios
          </button>
        </div>
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

      <aside class="lex-editor-toc">
        <h4
          class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3"
        >
          Contenido
        </h4>
        <div id="${tocId}" class="space-y-1 text-sm"></div>
      </aside>
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

    ${raw(`<script type="module">
      (async () => {
        const editorElement = document.getElementById('${editorId}');
        const hiddenInput = document.getElementById('${inputId}');
        const tocElement = document.getElementById('${tocId}');
        const mediaModal = document.getElementById('${mediaModalId}');
        const mediaContent = document.getElementById('${mediaContentId}');
        const mediaButton = document.getElementById('mediaLibraryButton-${name}');
        const initialContent = ${JSON.stringify(value || "<p></p>")};
        const placeholderText = ${JSON.stringify(placeholder)};

        const ensureStylesheet = () => {
          if (typeof document === 'undefined') return;
          const id = 'ckeditor-lark-theme';
          if (document.getElementById(id)) return;
          const link = document.createElement('link');
          link.id = id;
          link.rel = 'stylesheet';
          link.href = '${env.ADMIN_PATH}/assets/css/ckeditor.css';
          document.head.appendChild(link);
        };

        const enableFallback = () => {
          if (!editorElement) return;
          editorElement.innerHTML = '';
          const textarea = document.createElement('textarea');
          textarea.className = 'lex-editor-fallback form-input';
          textarea.name = '${name}';
          textarea.placeholder = placeholderText || '';
          textarea.value = initialContent;
          textarea.rows = 20;
          editorElement.appendChild(textarea);

          if (hiddenInput) {
            hiddenInput.disabled = true;
          }
        };

        if (!editorElement) {
          enableFallback();
          return;
        }

        ensureStylesheet();

        let CKEditorBundle;
        try {
          CKEditorBundle = await import('${bundlePath}');
        } catch (error) {
          console.warn('[CKEditor] No se pudo cargar el bundle:', error);
          enableFallback();
          return;
        }

        const { ClassicEditor } = CKEditorBundle ?? {};
        if (!ClassicEditor) {
          enableFallback();
          return;
        }

        const lexUploadAdapter = (loader) => {
          return {
            async upload() {
              const file = await loader.file;
              const formData = new FormData();
              formData.append('file', file);

              const response = await fetch('${mediaUploadEndpoint}', {
                method: 'POST',
                body: formData,
                credentials: 'include',
              });

              console.log('[CKEditor Upload] Response status:', response.status, response.statusText);

              // Accept any 2xx status code as success (200, 201, 204, etc.)
              if (response.status < 200 || response.status >= 300) {
                let errorMsg = 'Error al subir la imagen';
                try {
                  const errorData = await response.json();
                  errorMsg = errorData.error || errorData.message || errorMsg;
                } catch (e) {
                  errorMsg = \`Error HTTP \${response.status}: \${response.statusText}\`;
                }
                throw new Error(errorMsg);
              }

              const data = await response.json();
              console.log('[CKEditor Upload] Success:', data);

              const url = data?.media?.url;
              if (!url) {
                throw new Error('Respuesta inválida del servidor - falta URL');
              }

              return { default: url };
            },
            abort() {},
          };
        };

        const generateTOC = (html) => {
          if (!tocElement) return;
          const temp = document.createElement('div');
          temp.innerHTML = html;
          const headings = temp.querySelectorAll('h1, h2, h3, h4');

          if (!headings.length) {
            tocElement.innerHTML =
              '<p class="text-slate-400 dark:text-slate-500 text-xs">No hay encabezados aún</p>';
            return;
          }

          const list = document.createElement('ul');
          headings.forEach((heading, index) => {
            const text = heading.textContent?.trim();
            if (!text) return;

            const anchorId = heading.id || \`lex-heading-\${index}\`;
            heading.id = anchorId;

            const item = document.createElement('li');
            item.style.marginLeft = ((Number(heading.tagName.replace('H', '')) - 1) * 12) + 'px';
            item.textContent = text;
            item.addEventListener('click', () => {
              const target = document.getElementById(anchorId);
              target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            list.appendChild(item);
          });

          tocElement.innerHTML = '';
          tocElement.appendChild(list);
        };

        const openMediaPicker = async () => {
          if (!mediaModal) return;
          mediaModal.classList.remove('hidden');
          await loadMediaLibrary();
        };

        const closeMediaPicker = () => {
          mediaModal?.classList.add('hidden');
        };

        const selectMedia = (item) => {
          const url = item.dataset.url || '';
          const alt = item.dataset.filename || '';
          if (!url || !window.editor_${name}) return;
          window.editor_${name}.execute('insertImage', { source: [{ src: url, alt }] });
          closeMediaPicker();
        };

        let mediaItems = [];
        const renderMediaGrid = (items) => {
          if (!mediaContent) return;
          const grid = mediaContent.querySelector('#${name}_grid');
          if (!grid) return;
          grid.innerHTML = '';

          const images = items.filter((item) => item.type === 'image');
          if (!images.length) {
            const placeholder = document.createElement('div');
            placeholder.className =
              'col-span-full text-center py-8 text-gray-600 dark:text-gray-400';
            placeholder.textContent = 'No hay imágenes disponibles';
            grid.appendChild(placeholder);
            return;
          }

          images.forEach((media) => {
            const card = document.createElement('div');
            card.className =
              'media-item-modal relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition-colors';
            card.dataset.url = media.url || '';
            card.dataset.filename = media.originalFilename || '';
            card.addEventListener('click', () => selectMedia(card));

            const thumb = document.createElement('div');
            thumb.className = 'aspect-square bg-gray-100 dark:bg-gray-700';
            const img = document.createElement('img');
            img.src = media.url || '';
            img.alt = media.originalFilename || '';
            img.className = 'w-full h-full object-cover';
            img.loading = 'lazy';
            thumb.appendChild(img);

            const overlay = document.createElement('div');
            overlay.className =
              'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center';
            const overlayText = document.createElement('div');
            overlayText.className = 'opacity-0 group-hover:opacity-100 text-white text-sm font-medium';
            overlayText.textContent = 'Usar imagen';
            overlay.appendChild(overlayText);

            card.appendChild(thumb);
            card.appendChild(overlay);
            grid.appendChild(card);
          });
        };

        const showMediaLayout = () => {
          if (!mediaContent) return;
          mediaContent.innerHTML = \`
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <button type="button" class="btn-secondary" onclick="document.getElementById('mediaUploadInput-${name}').click()">Subir imagen</button>
              <input type="file" id="mediaUploadInput-${name}" class="hidden" accept="image/*" />
              <div class="flex-1 min-w-[12rem]"><input type="text" id="mediaPickerSearch-${name}" class="form-input" placeholder="Buscar por nombre..." /></div>
            </div>
            <div id="${name}_grid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"></div>
            <div id="${name}_uploadMessage" class="hidden text-sm mt-3"></div>
          \`;
        };

        const loadMediaLibrary = async () => {
          showMediaLayout();
          const grid = mediaContent?.querySelector('#${name}_grid');
          if (grid) {
            grid.innerHTML =
              '<div class="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">Cargando biblioteca de medios...</div>';
          }

          const searchInput = mediaContent?.querySelector('#mediaPickerSearch-${name}');
          const uploadInput = mediaContent?.querySelector('#mediaUploadInput-${name}');
          const uploadMessage = mediaContent?.querySelector('#${name}_uploadMessage');

          try {
            const response = await fetch('${mediaListEndpoint}?limit=100', { credentials: 'include' });
            if (!response.ok) throw new Error('Error al cargar medios');
            const data = await response.json();
            mediaItems = Array.isArray(data.media) ? data.media : [];
            renderMediaGrid(mediaItems);

            if (searchInput) {
              searchInput.addEventListener('input', (event) => {
                const target = event.target;
                const term = target && typeof target.value === 'string'
                  ? target.value.toLowerCase()
                  : '';
                const filtered = term
                  ? mediaItems.filter((item) =>
                      (item.originalFilename || '').toLowerCase().includes(term),
                    )
                  : mediaItems;
                renderMediaGrid(filtered);
              });
            }

            if (uploadInput) {
              uploadInput.addEventListener('change', async (event) => {
                const target = event.target;
                const files = target && target.files ? target.files : null;
                if (!files || !files.length) return;
                const formData = new FormData();
                formData.append('file', files[0]);
                if (uploadMessage) {
                  uploadMessage.textContent = 'Subiendo imagen...';
                  uploadMessage.className =
                    'text-sm text-blue-600 dark:text-blue-400 mt-3';
                  uploadMessage.classList.remove('hidden');
                }
                try {
                  const res = await fetch('${mediaUploadEndpoint}', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                  });

                  console.log('[CKEditor Modal Upload] Response status:', res.status, res.statusText);

                  // Accept any 2xx status code as success (200, 201, 204, etc.)
                  if (res.status < 200 || res.status >= 300) {
                    let errorMsg = 'Error al subir imagen';
                    try {
                      const errorData = await res.json();
                      errorMsg = errorData.error || errorData.message || errorMsg;
                    } catch (e) {
                      errorMsg = \`Error HTTP \${res.status}: \${res.statusText}\`;
                    }
                    throw new Error(errorMsg);
                  }

                  if (uploadMessage) {
                    uploadMessage.textContent = 'Imagen subida correctamente';
                    uploadMessage.className =
                      'text-sm text-green-600 dark:text-green-400 mt-3';
                  }
                  await loadMediaLibrary();
                } catch (error) {
                  if (uploadMessage) {
                    uploadMessage.textContent = error.message || 'Error al subir imagen';
                    uploadMessage.className =
                      'text-sm text-red-600 dark:text-red-400 mt-3';
                  }
                }
              });
            }
          } catch (error) {
            console.error('Media library error:', error);
            if (mediaContent) {
              mediaContent.innerHTML =
                '<div class="text-center py-8 text-red-600">Error al cargar la biblioteca de medios</div>';
            }
          }
        };

        window.openMediaPicker_${name} = openMediaPicker;
        window.closeMediaPicker_${name} = closeMediaPicker;

        const config = {
          placeholder: placeholderText || '',
          lexcmsMediaLibrary: () => openMediaPicker(),
        };

        try {
          const editor = await ClassicEditor.create(editorElement, config);
          window.editor_${name} = editor;

          editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
            lexUploadAdapter(loader);

          editor.setData(initialContent);

          const syncHiddenInput = () => {
            if (hiddenInput) {
              hiddenInput.value = editor.getData();
            }
          };

          editor.model.document.on('change:data', () => {
            syncHiddenInput();
            generateTOC(editor.getData());
          });

          syncHiddenInput();
          generateTOC(editor.getData());

          if (mediaButton) {
            mediaButton.addEventListener('click', openMediaPicker);
          }

          editor.editing.view.change((writer) => {
            writer.setStyle('min-height', '280px', editor.editing.view.document.getRoot());
          });
        } catch (error) {
          console.error('CKEditor init error:', error);
          enableFallback();
        }
      })();
    </script>`)}
  `;
};

export default CKEditorField;
