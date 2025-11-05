import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface MediaItem {
  id: number;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  type: string;
  width?: number;
  height?: number;
  createdAt: Date;
  uploadedBy?: {
    id: number;
    name?: string;
    email: string;
  };
}

interface MediaLibraryPageProps {
  user: {
    name: string | null;
    email: string;
  };
  media: MediaItem[];
  limit: number;
  offset: number;
  total?: number;
  pickerMode?: boolean;
}

export const MediaLibraryPage = (props: MediaLibraryPageProps) => {
  const { user, media, limit = 20, offset = 0, pickerMode = false } = props;
  const adminPath = env.ADMIN_PATH;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMediaThumbnail = (item: MediaItem): string => {
    if (item.type === "image") {
      return item.url;
    }
    // Placeholder for other types
    if (item.type === "video") return "/assets/video-icon.svg";
    if (item.type === "audio") return "/assets/audio-icon.svg";
    return "/assets/document-icon.svg";
  };

  const content = html`
    <div class="page-header">
      <h1 class="page-title">Biblioteca de Medios</h1>
      <div class="page-actions">
        ${!pickerMode ? html`
          <button
            onclick="document.getElementById('uploadInput').click()"
            class="btn-action"
          >
            <svg class="w-5 h-5 inline-block mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Subir Archivo
          </button>
        ` : ""}
      </div>
    </div>

    <!-- Upload Form (Hidden) -->
    <form id="uploadForm" style="display: none;">
      <input
        type="file"
        id="uploadInput"
        accept="image/*,video/*,audio/*,.pdf"
        multiple
        onchange="handleFileUpload(event)"
      />
    </form>

    <!-- Upload Progress -->
    <div id="uploadProgress" class="mb-6 hidden">
      <div class="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-blue-700 dark:text-blue-300" id="uploadStatus">
            Subiendo archivo...
          </span>
          <span class="text-sm text-blue-600 dark:text-blue-400" id="uploadPercent">0%</span>
        </div>
        <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div
            id="uploadBar"
            class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            style="width: 0%"
          ></div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div id="errorMessage" class="mb-6 hidden">
      <div class="p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-200 dark:text-red-800">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span id="errorText"></span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex gap-4">
      <select
        id="typeFilter"
        class="form-input w-48"
        onchange="filterByType(this.value)"
      >
        <option value="">Todos los tipos</option>
        <option value="image">Imágenes</option>
        <option value="video">Videos</option>
        <option value="audio">Audio</option>
        <option value="document">Documentos</option>
      </select>
      <input
        type="text"
        id="searchInput"
        class="form-input flex-1"
        placeholder="Buscar por nombre de archivo..."
        onkeyup="searchMedia(this.value)"
      />
    </div>

    <!-- Media Grid -->
    <div id="mediaGrid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      ${media.length === 0 ? html`
        <div class="col-span-full text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="mt-4 text-gray-600 dark:text-gray-400">
            No hay archivos en la biblioteca
          </p>
          <button
            onclick="document.getElementById('uploadInput').click()"
            class="mt-4 btn-action"
          >
            Subir el primer archivo
          </button>
        </div>
      ` : media.map((item) => html`
        <div
          class="media-item relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-400"
          data-id="${item.id}"
          data-url="${item.url}"
          data-type="${item.type}"
          data-filename="${item.originalFilename}"
          onclick="${pickerMode ? `selectMedia(${item.id}, '${item.url}', '${item.originalFilename}')` : "viewMediaDetails(this)"}"
        >
          <div class="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            ${item.type === "image" ? html`
              <img
                src="${item.url}"
                alt="${item.originalFilename}"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            ` : html`
              <div class="text-gray-400 dark:text-gray-500">
                ${item.type === "video" ? html`
                  <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ` : item.type === "audio" ? html`
                  <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                ` : html`
                  <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                `}
              </div>
            `}
          </div>

          <!-- Media Info -->
          <div class="p-2">
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" title="${item.originalFilename}">
              ${item.originalFilename}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              ${formatFileSize(item.size)}
            </p>
          </div>

          <!-- Action Overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
            ${!pickerMode ? html`
              <button
                onclick="event.stopPropagation(); deleteMedia(${item.id}, '${item.originalFilename}')"
                class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Eliminar"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ` : ""}
          </div>
        </div>
      `)}
    </div>

    <!-- Pagination -->
    ${media.length > 0 ? html`
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Mostrando ${offset + 1} - ${Math.min(offset + limit, offset + media.length)} archivos
        </p>
        <div class="flex gap-2">
          ${offset > 0 ? html`
            <a
              href="${adminPath}/media?offset=${Math.max(0, offset - limit)}&limit=${limit}"
              class="btn-secondary"
            >
              Anterior
            </a>
          ` : ""}
          ${media.length === limit ? html`
            <a
              href="${adminPath}/media?offset=${offset + limit}&limit=${limit}"
              class="btn-action"
            >
              Siguiente
            </a>
          ` : ""}
        </div>
      </div>
    ` : ""}

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      // Upload handling
      async function handleFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const uploadProgress = document.getElementById('uploadProgress');
        const uploadBar = document.getElementById('uploadBar');
        const uploadStatus = document.getElementById('uploadStatus');
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');

        errorMessage.classList.add('hidden');
        uploadProgress.classList.remove('hidden');

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          uploadStatus.textContent = \`Subiendo \${file.name}... (\${i + 1}/\${files.length})\`;

          const formData = new FormData();
          formData.append('file', file);

          try {
            const response = await fetch(ADMIN_BASE_PATH + '/media', {
              method: 'POST',
              body: formData,
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Error al subir archivo');
            }

            uploadBar.style.width = \`\${((i + 1) / files.length) * 100}%\`;
          } catch (error) {
            errorText.textContent = \`Error al subir \${file.name}: \${error.message}\`;
            errorMessage.classList.remove('hidden');
            break;
          }
        }

        // Reload page after upload
        if (errorMessage.classList.contains('hidden')) {
          window.location.reload();
        } else {
          uploadProgress.classList.add('hidden');
        }
      }

      // Delete media
      async function deleteMedia(id, filename) {
        if (!confirm(\`¿Estás seguro de que deseas eliminar "\${filename}"?\`)) {
          return;
        }

        try {
          const response = await fetch(\`\${ADMIN_BASE_PATH}/media/\${id}\`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar archivo');
          }

          window.location.reload();
        } catch (error) {
          const errorMessage = document.getElementById('errorMessage');
          const errorText = document.getElementById('errorText');
          errorText.textContent = \`Error al eliminar archivo: \${error.message}\`;
          errorMessage.classList.remove('hidden');
        }
      }

      // View details (placeholder)
      function viewMediaDetails(element) {
        if (!element) return;
        const mediaUrl = element.dataset.url;

        if (mediaUrl) {
          const previewWindow = window.open(mediaUrl, '_blank');
          if (previewWindow) {
            previewWindow.opener = null;
          }
        }
      }

      // Filter by type
      function filterByType(type) {
        const items = document.querySelectorAll('.media-item');
        items.forEach(item => {
          if (!type || item.dataset.type === type) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      }

      // Search media
      function searchMedia(query) {
        const items = document.querySelectorAll('.media-item');
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

      // Select media (for picker mode)
      function selectMedia(id, url, filename) {
        if (window.opener && window.opener.handleMediaSelected) {
          window.opener.handleMediaSelected({ id, url, filename });
          window.close();
        }
      }
    </script>
  `;

  return AdminLayout({
    title: "Biblioteca de Medios",
    children: content,
    activePage: "content.media",
    user,
  });
};

export default MediaLibraryPage;
