import { html } from "hono/html";
import { env } from "../../config/env.ts";

interface MediaPickerProps {
  fieldName: string;
  currentImageUrl?: string;
  currentImageId?: number;
  label?: string;
  required?: boolean;
}

export const MediaPicker = (props: MediaPickerProps) => {
  const {
    fieldName,
    currentImageUrl,
    currentImageId,
    label = "Imagen destacada",
    required = false,
  } = props;

  const adminPath = env.ADMIN_PATH;
  const mediaDataEndpoint = `${adminPath}/media/data`;

  return html`
    <div class="media-picker-container">
      <label class="form-label">
        ${label}
        ${required ? html`<span class="text-red-500">*</span>` : ""}
      </label>

      <input
        type="hidden"
        name="${fieldName}"
        id="${fieldName}"
        value="${currentImageId || ""}"
      />

      <div class="mt-2">
        ${currentImageUrl ? html`
          <div id="${fieldName}_preview" class="relative inline-block">
            <img
              src="${currentImageUrl}"
              alt="Vista previa"
              class="w-full max-w-xs rounded-lg shadow-sm"
            />
            <button
              type="button"
              onclick="removeMedia_${fieldName}()"
              class="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              title="Eliminar imagen"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ` : html`
          <div id="${fieldName}_preview" class="hidden">
            <img
              id="${fieldName}_preview_img"
              src=""
              alt="Vista previa"
              class="w-full max-w-xs rounded-lg shadow-sm"
            />
            <button
              type="button"
              onclick="removeMedia_${fieldName}()"
              class="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              title="Eliminar imagen"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        `}

        <div id="${fieldName}_placeholder" class="${currentImageUrl ? "hidden" : ""} mt-2">
          <button
            type="button"
            onclick="openMediaPicker_${fieldName}()"
            class="flex items-center justify-center w-full max-w-xs px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-400 dark:hover:border-purple-400 transition-colors cursor-pointer"
          >
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Haz clic para seleccionar una imagen
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Media Library Modal -->
      <div
        id="${fieldName}_modal"
        class="modal-backdrop hidden fixed inset-0 z-50 flex items-center justify-center"
        onclick="if (event.target === this) closeMediaPicker_${fieldName}()"
      >
        <div class="modal-container max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="modal-title">Seleccionar Imagen</h3>
            <button
              type="button"
              onclick="closeMediaPicker_${fieldName}()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div id="${fieldName}_modal_content">
            <div class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p class="mt-2 text-gray-600 dark:text-gray-400">Cargando biblioteca de medios...</p>
            </div>
          </div>
        </div>
      </div>

      <script>
        const MEDIA_LIST_ENDPOINT = ${JSON.stringify(mediaDataEndpoint)};

        // Open media picker
        async function openMediaPicker_${fieldName}() {
          const modal = document.getElementById('${fieldName}_modal');
          const modalContent = document.getElementById('${fieldName}_modal_content');

          modal.classList.remove('hidden');

          try {
            const response = await fetch(MEDIA_LIST_ENDPOINT + '?limit=50', {
              credentials: 'include',
            });
            if (!response.ok) throw new Error('Error al cargar medios');

            const data = await response.json();
            const media = data.media;

            modalContent.innerHTML = \`
              <div class="mb-4">
                <input
                  type="text"
                  id="${fieldName}_search"
                  class="form-input"
                  placeholder="Buscar por nombre..."
                  onkeyup="filterModalMedia_${fieldName}(this.value)"
                />
              </div>

              <div id="${fieldName}_grid" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                \${media.length === 0 ? \`
                  <div class="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">
                    No hay imágenes disponibles
                  </div>
                \` : media.filter(m => m.type === 'image').map(item => \`
                  <div
                    class="media-item-modal relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition-colors"
                    data-filename="\${item.originalFilename}"
                    onclick="selectMediaFromModal_${fieldName}(\${item.id}, '\${item.url}')"
                  >
                    <div class="aspect-square bg-gray-100 dark:bg-gray-700">
                      <img
                        src="\${item.url}"
                        alt="\${item.originalFilename}"
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <div class="opacity-0 group-hover:opacity-100">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                \`).join('')}
              </div>
            \`;
          } catch (error) {
            modalContent.innerHTML = \`
              <div class="text-center py-8 text-red-600">
                Error al cargar la biblioteca de medios: \${error.message}
              </div>
            \`;
          }
        }

        // Close media picker
        function closeMediaPicker_${fieldName}() {
          document.getElementById('${fieldName}_modal').classList.add('hidden');
        }

        // Select media from modal
        function selectMediaFromModal_${fieldName}(id, url) {
          document.getElementById('${fieldName}').value = id;
          document.getElementById('${fieldName}_preview_img').src = url;
          document.getElementById('${fieldName}_preview').classList.remove('hidden');
          document.getElementById('${fieldName}_placeholder').classList.add('hidden');
          closeMediaPicker_${fieldName}();
        }

        // Remove media
        function removeMedia_${fieldName}() {
          document.getElementById('${fieldName}').value = '';
          document.getElementById('${fieldName}_preview').classList.add('hidden');
          document.getElementById('${fieldName}_placeholder').classList.remove('hidden');
        }

        // Filter media in modal
        function filterModalMedia_${fieldName}(query) {
          const items = document.querySelectorAll('.media-item-modal');
          const lowerQuery = query.toLowerCase();

          items.forEach(item => {
            const filename = item.dataset.filename.toLowerCase();
            if (!query || filename.includes(lowerQuery)) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
        }
      </script>
    </div>
  `;
};

export default MediaPicker;
