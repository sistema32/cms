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

    <!-- Drag & Drop Zone -->
    <div
      id="dropZone"
      class="mb-6 hidden border-4 border-dashed border-purple-400 bg-purple-50 dark:bg-purple-900 rounded-lg p-8 text-center"
    >
      <svg class="mx-auto h-16 w-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p class="mt-4 text-lg font-medium text-purple-700 dark:text-purple-300">
        Suelta los archivos aquí para subirlos
      </p>
    </div>

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

    <!-- Filters and View Controls -->
    <div class="mb-6 flex gap-4 items-center">
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

      <!-- View Toggle -->
      <div class="flex gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
        <button
          onclick="switchView('grid')"
          id="gridViewBtn"
          class="p-2 rounded bg-purple-600 text-white"
          title="Vista de cuadrícula"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          onclick="switchView('list')"
          id="listViewBtn"
          class="p-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Vista de lista"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div id="bulkActionsBar" class="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg hidden">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
          <span id="selectedCount">0</span> elementos seleccionados
        </span>
        <div class="flex gap-2">
          <button onclick="bulkDelete()" class="btn-secondary text-sm">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
          <button onclick="clearSelection()" class="btn-secondary text-sm">
            Cancelar
          </button>
        </div>
      </div>
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
          onclick="${pickerMode ? "selectMedia(this.dataset.id, this.dataset.url, this.dataset.filename)" : "viewMediaDetails(this)"}"
        >
          <!-- Bulk Selection Checkbox -->
          ${!pickerMode ? html`
            <div class="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <input
                type="checkbox"
                class="media-checkbox w-5 h-5 text-purple-600 bg-white dark:bg-gray-700 border-gray-300 rounded focus:ring-purple-500"
                data-media-id="${item.id}"
                onclick="event.stopPropagation(); toggleMediaSelection(${item.id}, this.checked)"
              />
            </div>
          ` : ""}

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
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            ${!pickerMode && item.type === "image" ? html`
              <button
                data-media-id="${item.id}"
                data-media-url="${item.url}"
                onclick="event.stopPropagation(); openImageEditor(this.dataset.mediaId, this.dataset.mediaUrl)"
                class="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Editar imagen"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                data-media-id="${item.id}"
                onclick="event.stopPropagation(); openSeoEditor(this.dataset.mediaId)"
                class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Editar SEO"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </button>
            ` : ""}
            ${!pickerMode ? html`
              <button
                data-media-id="${item.id}"
                data-media-filename="${item.originalFilename}"
                onclick="event.stopPropagation(); deleteMedia(this.dataset.mediaId, this.dataset.mediaFilename)"
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

    <!-- Media List View -->
    <div id="mediaList" class="hidden space-y-2 mb-6">
      ${media.length === 0 ? html`
        <div class="text-center py-12">
          <p class="text-gray-600 dark:text-gray-400">No hay archivos en la biblioteca</p>
        </div>
      ` : media.map((item) => html`
        <div
          class="media-list-item flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-purple-400"
          data-id="${item.id}"
          data-url="${item.url}"
          data-type="${item.type}"
          data-filename="${item.originalFilename}"
          onclick="${pickerMode ? "selectMedia(this.dataset.id, this.dataset.url, this.dataset.filename)" : "viewMediaDetails(this)"}"
        >
          <!-- Checkbox -->
          ${!pickerMode ? html`
            <input
              type="checkbox"
              class="media-checkbox w-5 h-5 text-purple-600 bg-white dark:bg-gray-700 border-gray-300 rounded focus:ring-purple-500"
              data-media-id="${item.id}"
              onclick="event.stopPropagation(); toggleMediaSelection(${item.id}, this.checked)"
            />
          ` : ""}

          <!-- Thumbnail -->
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
            ${item.type === "image" ? html`
              <img src="${item.url}" alt="${item.originalFilename}" class="w-full h-full object-cover" loading="lazy" />
            ` : html`
              <div class="text-gray-400 dark:text-gray-500">
                ${item.type === "video" ? html`
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ` : item.type === "audio" ? html`
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                ` : html`
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                `}
              </div>
            `}
          </div>

          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">${item.originalFilename}</h4>
            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span class="capitalize">${item.type}</span>
              <span>${formatFileSize(item.size)}</span>
              ${item.width && item.height ? html`<span>${item.width} × ${item.height}</span>` : ""}
              <span>${formatDate(item.createdAt)}</span>
            </div>
          </div>

          <!-- Actions -->
          ${!pickerMode ? html`
            <div class="flex items-center gap-2">
              ${item.type === "image" ? html`
                <button
                  data-media-id="${item.id}"
                  data-media-url="${item.url}"
                  onclick="event.stopPropagation(); openImageEditor(this.dataset.mediaId, this.dataset.mediaUrl)"
                  class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900 rounded transition-colors"
                  title="Editar imagen"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  data-media-id="${item.id}"
                  onclick="event.stopPropagation(); openSeoEditor(this.dataset.mediaId)"
                  class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                  title="Editar SEO"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </button>
              ` : ""}
              <button
                data-media-id="${item.id}"
                data-media-filename="${item.originalFilename}"
                onclick="event.stopPropagation(); deleteMedia(this.dataset.mediaId, this.dataset.mediaFilename)"
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                title="Eliminar"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ` : ""}
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

    <!-- SEO Editor Modal -->
    <div id="seoEditorModal" class="modal-backdrop hidden fixed inset-0 z-50 flex items-center justify-center">
      <div class="modal-container max-w-2xl w-full">
        <div class="flex items-center justify-between mb-4">
          <h3 class="modal-title">Editar Metadatos SEO</h3>
          <button
            type="button"
            onclick="closeSeoEditor()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="seoForm" class="space-y-4">
          <input type="hidden" id="seoMediaId" />

          <!-- AI Connection Warning -->
          <div id="aiConnectionWarning" class="hidden p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300">No se pudo conectar con el servicio de IA</p>
                <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Por favor, agrega el texto alternativo manualmente.</p>
              </div>
              <button type="button" onclick="dismissAiWarning()" class="text-yellow-600 hover:text-yellow-800 dark:text-yellow-500 dark:hover:text-yellow-300">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="form-label mb-0">Texto Alternativo (Alt)</label>
              <button
                type="button"
                id="generateAltBtn"
                onclick="generateAltWithAI()"
                class="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span id="generateAltBtnText">Generar con IA</span>
              </button>
            </div>
            <input
              type="text"
              id="seoAlt"
              class="form-input"
              placeholder="Descripción de la imagen"
              oninput="onAltInputChange()"
            />
            <p class="text-xs text-gray-500 mt-1">Importante para accesibilidad y SEO</p>
          </div>

          <div>
            <label class="form-label">Título</label>
            <input type="text" id="seoTitle" class="form-input" placeholder="Título de la imagen" />
          </div>

          <div>
            <label class="form-label">Leyenda/Caption</label>
            <textarea id="seoCaption" class="form-input" rows="2" placeholder="Leyenda de la imagen"></textarea>
          </div>

          <div>
            <label class="form-label">Descripción</label>
            <textarea id="seoDescription" class="form-input" rows="3" placeholder="Descripción detallada"></textarea>
          </div>

          <div>
            <label class="form-label">Palabra Clave Focus</label>
            <input type="text" id="seoFocusKeyword" class="form-input" placeholder="Palabra clave principal" />
          </div>

          <div>
            <label class="form-label">Créditos</label>
            <input type="text" id="seoCredits" class="form-input" placeholder="Autor/Fotógrafo" />
          </div>

          <div>
            <label class="form-label">Copyright</label>
            <input type="text" id="seoCopyright" class="form-input" placeholder="© 2025 ..." />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" onclick="closeSeoEditor()" class="btn-secondary">
              Cancelar
            </button>
            <button type="button" onclick="saveSeoData()" class="btn-action">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Media Details Modal -->
    <div id="mediaDetailsModal" class="modal-backdrop hidden fixed inset-0 z-50 flex items-center justify-center">
      <div class="modal-container max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="modal-title">Detalles del Archivo</h3>
          <button
            type="button"
            onclick="closeMediaDetails()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Preview -->
          <div class="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
            <div id="mediaPreview"></div>
          </div>

          <!-- Details -->
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Información del Archivo</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-gray-600 dark:text-gray-400">Nombre:</dt>
                  <dd class="font-medium text-gray-900 dark:text-gray-100" id="detailFilename"></dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-600 dark:text-gray-400">Tipo:</dt>
                  <dd class="font-medium text-gray-900 dark:text-gray-100" id="detailType"></dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-600 dark:text-gray-400">Tamaño:</dt>
                  <dd class="font-medium text-gray-900 dark:text-gray-100" id="detailSize"></dd>
                </div>
                <div class="flex justify-between" id="detailDimensionsContainer">
                  <dt class="text-gray-600 dark:text-gray-400">Dimensiones:</dt>
                  <dd class="font-medium text-gray-900 dark:text-gray-100" id="detailDimensions"></dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-600 dark:text-gray-400">Subido:</dt>
                  <dd class="font-medium text-gray-900 dark:text-gray-100" id="detailDate"></dd>
                </div>
              </dl>
            </div>

            <hr class="border-gray-200 dark:border-gray-700" />

            <!-- URLs Section -->
            <div>
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URLs</h4>
              <div class="space-y-2" id="urlsList"></div>
            </div>

            <hr class="border-gray-200 dark:border-gray-700" />

            <!-- SEO Metadata -->
            <div id="seoMetadataSection">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Metadatos SEO</h4>
              <dl class="space-y-2 text-sm" id="seoMetadataList"></dl>
            </div>

            <hr class="border-gray-200 dark:border-gray-700" />

            <!-- HTML Snippets -->
            <div id="htmlSnippetsSection">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Snippets HTML</h4>
              <div class="space-y-3">
                <div>
                  <label class="text-xs text-gray-600 dark:text-gray-400">Imagen básica:</label>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      id="snippetBasic"
                      readonly
                      class="form-input text-xs font-mono flex-1"
                    />
                    <button
                      onclick="copyToClipboard('snippetBasic')"
                      class="btn-secondary text-xs px-3"
                      title="Copiar"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="text-xs text-gray-600 dark:text-gray-400">Imagen con alt (SEO):</label>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      id="snippetWithAlt"
                      readonly
                      class="form-input text-xs font-mono flex-1"
                    />
                    <button
                      onclick="copyToClipboard('snippetWithAlt')"
                      class="btn-secondary text-xs px-3"
                      title="Copiar"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button onclick="closeMediaDetails()" class="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>

    <script src="${adminPath}/assets/js/media-library.js"></script>
    <script>
      // Initialize media library with admin path
      initMediaLibrary(${JSON.stringify(adminPath)});
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
