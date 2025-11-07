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

  // Helper to safely escape strings for use in JavaScript strings within HTML attributes
  const escapeJs = (str: string): string => {
    return str
      .replace(/\\/g, "\\\\")  // Escape backslashes first
      .replace(/'/g, "\\'")     // Escape single quotes
      .replace(/"/g, '\\"')     // Escape double quotes
      .replace(/\n/g, "\\n")    // Escape newlines
      .replace(/\r/g, "\\r")    // Escape carriage returns
      .replace(/\t/g, "\\t");   // Escape tabs
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
          onclick="${pickerMode ? `selectMedia(${item.id}, '${escapeJs(item.url)}', '${escapeJs(item.originalFilename)}')` : "viewMediaDetails(this)"}"
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
                onclick="event.stopPropagation(); openImageEditor(${item.id}, '${escapeJs(item.url)}')"
                class="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Editar imagen"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onclick="event.stopPropagation(); openSeoEditor(${item.id})"
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
                onclick="event.stopPropagation(); deleteMedia(${item.id}, '${escapeJs(item.originalFilename)}')"
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
          onclick="${pickerMode ? `selectMedia(${item.id}, '${escapeJs(item.url)}', '${escapeJs(item.originalFilename)}')` : "viewMediaDetails(this)"}"
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
                  onclick="event.stopPropagation(); openImageEditor(${item.id}, '${escapeJs(item.url)}')"
                  class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900 rounded transition-colors"
                  title="Editar imagen"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onclick="event.stopPropagation(); openSeoEditor(${item.id})"
                  class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                  title="Editar SEO"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </button>
              ` : ""}
              <button
                onclick="event.stopPropagation(); deleteMedia(${item.id}, '${escapeJs(item.originalFilename)}')"
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

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      // Drag and drop setup
      let dragCounter = 0;

      document.addEventListener('DOMContentLoaded', () => {
        const body = document.body;
        const dropZone = document.getElementById('dropZone');

        body.addEventListener('dragenter', (e) => {
          e.preventDefault();
          dragCounter++;
          if (dragCounter === 1) {
            dropZone.classList.remove('hidden');
          }
        });

        body.addEventListener('dragleave', (e) => {
          e.preventDefault();
          dragCounter--;
          if (dragCounter === 0) {
            dropZone.classList.add('hidden');
          }
        });

        body.addEventListener('dragover', (e) => {
          e.preventDefault();
        });

        body.addEventListener('drop', (e) => {
          e.preventDefault();
          dragCounter = 0;
          dropZone.classList.add('hidden');

          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFilesUpload(Array.from(files));
          }
        });
      });

      // Upload handling
      async function handleFileUpload(event) {
        const files = Array.from(event.target.files);
        await handleFilesUpload(files);
      }

      async function handleFilesUpload(files) {
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

            console.log('[Upload] Response status:', response.status, response.statusText);

            // Accept any 2xx status code as success (200, 201, 204, etc.)
            if (response.status < 200 || response.status >= 300) {
              let errorMsg = 'Error al subir archivo';
              try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
              } catch (e) {
                errorMsg = \`Error HTTP \${response.status}: \${response.statusText}\`;
              }
              throw new Error(errorMsg);
            }

            // Try to parse JSON response for success
            try {
              const data = await response.json();
              console.log('[Upload] Success:', data);
            } catch (e) {
              console.log('[Upload] Success but no JSON response');
            }

            uploadBar.style.width = \`\${((i + 1) / files.length) * 100}%\`;
          } catch (error) {
            console.error('[Upload] Error:', error);
            errorText.textContent = \`Error al subir \${file.name}: \${error.message}\`;
            errorMessage.classList.remove('hidden');
            break;
          }
        }

        // Reload page after upload
        if (errorMessage.classList.contains('hidden')) {
          console.log('[Upload] All files uploaded successfully, reloading page...');
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

      // View details
      async function viewMediaDetails(element) {
        if (!element) return;
        const mediaId = element.dataset.id;

        try {
          const response = await fetch(\`\${ADMIN_BASE_PATH}/media/\${mediaId}\`, {
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error('Error al cargar los detalles del archivo');
          }

          const data = await response.json();
          showMediaDetailsModal(data.media);
        } catch (error) {
          console.error('Error loading media details:', error);
          alert('Error al cargar los detalles del archivo');
        }
      }

      function showMediaDetailsModal(mediaData) {
        const modal = document.getElementById('mediaDetailsModal');
        const preview = document.getElementById('mediaPreview');

        // Populate preview
        if (mediaData.type === 'image') {
          preview.innerHTML = \`<img src="\${mediaData.url}" alt="\${mediaData.originalFilename}" class="max-w-full max-h-[400px] rounded-lg" />\`;
        } else if (mediaData.type === 'video') {
          preview.innerHTML = \`<video src="\${mediaData.url}" controls class="max-w-full max-h-[400px] rounded-lg"></video>\`;
        } else if (mediaData.type === 'audio') {
          preview.innerHTML = \`<audio src="\${mediaData.url}" controls class="w-full"></audio>\`;
        } else {
          preview.innerHTML = \`
            <div class="text-center">
              <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Documento</p>
            </div>
          \`;
        }

        // Populate file info
        document.getElementById('detailFilename').textContent = mediaData.originalFilename;
        document.getElementById('detailType').textContent = mediaData.type;
        document.getElementById('detailSize').textContent = formatFileSize(mediaData.size);

        if (mediaData.width && mediaData.height) {
          document.getElementById('detailDimensions').textContent = \`\${mediaData.width} × \${mediaData.height}\`;
          document.getElementById('detailDimensionsContainer').style.display = 'flex';
        } else {
          document.getElementById('detailDimensionsContainer').style.display = 'none';
        }

        document.getElementById('detailDate').textContent = new Date(mediaData.createdAt).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Populate URLs
        const urlsList = document.getElementById('urlsList');
        let urlsHtml = \`
          <div class="space-y-2">
            <div>
              <label class="text-xs text-gray-600 dark:text-gray-400">URL Original:</label>
              <div class="flex gap-2">
                <input type="text" value="\${mediaData.url}" readonly class="form-input text-xs flex-1" id="urlOriginal" />
                <button onclick="copyToClipboard('urlOriginal')" class="btn-secondary text-xs px-3" title="Copiar">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
        \`;

        // Add sizes if available
        if (mediaData.sizes && mediaData.sizes.length > 0) {
          mediaData.sizes.forEach((size, index) => {
            urlsHtml += \`
              <div>
                <label class="text-xs text-gray-600 dark:text-gray-400">URL \${size.size} (\${size.width}×\${size.height}):</label>
                <div class="flex gap-2">
                  <input type="text" value="\${size.url}" readonly class="form-input text-xs flex-1" id="urlSize\${index}" />
                  <button onclick="copyToClipboard('urlSize\${index}')" class="btn-secondary text-xs px-3" title="Copiar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            \`;
          });
        }

        urlsHtml += '</div>';
        urlsList.innerHTML = urlsHtml;

        // Populate SEO metadata
        const seoSection = document.getElementById('seoMetadataSection');
        const seoList = document.getElementById('seoMetadataList');

        if (mediaData.seo) {
          const seo = mediaData.seo;
          let seoHtml = '';

          if (seo.alt) seoHtml += \`<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Alt:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">\${seo.alt}</dd></div>\`;
          if (seo.title) seoHtml += \`<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Título:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">\${seo.title}</dd></div>\`;
          if (seo.caption) seoHtml += \`<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Leyenda:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">\${seo.caption}</dd></div>\`;
          if (seo.description) seoHtml += \`<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Descripción:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">\${seo.description}</dd></div>\`;
          if (seo.credits) seoHtml += \`<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Créditos:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">\${seo.credits}</dd></div>\`;
          if (seo.copyright) seoHtml += \`<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Copyright:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">\${seo.copyright}</dd></div>\`;

          if (seoHtml) {
            seoList.innerHTML = seoHtml;
            seoSection.style.display = 'block';
          } else {
            seoSection.style.display = 'none';
          }
        } else {
          seoSection.style.display = 'none';
        }

        // Populate HTML snippets (only for images)
        const snippetsSection = document.getElementById('htmlSnippetsSection');
        if (mediaData.type === 'image') {
          const altText = mediaData.seo?.alt || mediaData.originalFilename;
          document.getElementById('snippetBasic').value = \`<img src="\${mediaData.url}" />\`;
          document.getElementById('snippetWithAlt').value = \`<img src="\${mediaData.url}" alt="\${altText}" />\`;
          snippetsSection.style.display = 'block';
        } else {
          snippetsSection.style.display = 'none';
        }

        modal.classList.remove('hidden');
      }

      function closeMediaDetails() {
        document.getElementById('mediaDetailsModal').classList.add('hidden');
      }

      function copyToClipboard(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices

        try {
          document.execCommand('copy');

          // Show feedback
          const btn = event.target.closest('button');
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';

          setTimeout(() => {
            btn.innerHTML = originalHTML;
          }, 1000);
        } catch (err) {
          console.error('Error copying to clipboard:', err);
        }
      }

      function formatFileSize(bytes) {
        if (bytes < 1024) return \`\${bytes} B\`;
        if (bytes < 1024 * 1024) return \`\${(bytes / 1024).toFixed(1)} KB\`;
        return \`\${(bytes / (1024 * 1024)).toFixed(1)} MB\`;
      }

      // SEO Editor functions
      let currentMediaData = null;

      async function openSeoEditor(mediaId) {
        document.getElementById('seoMediaId').value = mediaId;

        // Hide warning initially
        document.getElementById('aiConnectionWarning').classList.add('hidden');

        // Fetch current SEO data
        try {
          const response = await fetch(\`\${ADMIN_BASE_PATH}/media/\${mediaId}\`, {
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            currentMediaData = data.media;
            const seo = data.media.seo || {};

            document.getElementById('seoAlt').value = seo.alt || '';
            document.getElementById('seoTitle').value = seo.title || '';
            document.getElementById('seoCaption').value = seo.caption || '';
            document.getElementById('seoDescription').value = seo.description || '';
            document.getElementById('seoFocusKeyword').value = seo.focusKeyword || '';
            document.getElementById('seoCredits').value = seo.credits || '';
            document.getElementById('seoCopyright').value = seo.copyright || '';

            // Auto-generate alt if empty and it's an image
            if ((!seo.alt || seo.alt.trim() === '') && data.media.type === 'image') {
              await generateAltWithAI(true);
            }
          }
        } catch (error) {
          console.error('Error loading SEO data:', error);
        }

        document.getElementById('seoEditorModal').classList.remove('hidden');
      }

      async function generateAltWithAI(isAutomatic = false) {
        if (!currentMediaData) return;

        const generateBtn = document.getElementById('generateAltBtn');
        const generateBtnText = document.getElementById('generateAltBtnText');
        const altInput = document.getElementById('seoAlt');
        const aiWarning = document.getElementById('aiConnectionWarning');

        // Show loading state
        generateBtn.disabled = true;
        generateBtnText.textContent = 'Generando...';

        try {
          const response = await fetch('/api/seo/suggest/media-alt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              originalFilename: currentMediaData.originalFilename,
              title: currentMediaData.seo?.title || '',
              caption: currentMediaData.seo?.caption || '',
              description: currentMediaData.seo?.description || '',
            }),
          });

          if (!response.ok) {
            throw new Error('Error al generar ALT text');
          }

          const result = await response.json();

          if (result.success && result.altSuggestion) {
            altInput.value = result.altSuggestion;

            // Hide warning if it was showing
            aiWarning.classList.add('hidden');

            // Show success feedback
            if (!isAutomatic) {
              const originalBg = generateBtn.className;
              generateBtn.className = generateBtn.className.replace('bg-purple-600', 'bg-green-600');
              generateBtnText.textContent = '¡Generado!';

              setTimeout(() => {
                generateBtn.className = originalBg;
                generateBtnText.textContent = 'Generar con IA';
              }, 2000);
            }
          } else {
            throw new Error('No se recibió sugerencia de ALT');
          }
        } catch (error) {
          console.error('Error generating ALT with AI:', error);

          // Show warning only if automatic (on open)
          if (isAutomatic) {
            aiWarning.classList.remove('hidden');
          } else {
            // Show error in button for manual attempts
            generateBtnText.textContent = 'Error - Reintentar';
            setTimeout(() => {
              generateBtnText.textContent = 'Generar con IA';
            }, 3000);
          }
        } finally {
          generateBtn.disabled = false;
          if (isAutomatic) {
            generateBtnText.textContent = 'Generar con IA';
          }
        }
      }

      function onAltInputChange() {
        // Hide warning when user starts typing manually
        const aiWarning = document.getElementById('aiConnectionWarning');
        if (!aiWarning.classList.contains('hidden')) {
          aiWarning.classList.add('hidden');
        }
      }

      function dismissAiWarning() {
        document.getElementById('aiConnectionWarning').classList.add('hidden');
      }

      function closeSeoEditor() {
        document.getElementById('seoEditorModal').classList.add('hidden');
        document.getElementById('seoForm').reset();
        document.getElementById('aiConnectionWarning').classList.add('hidden');
        currentMediaData = null;
      }

      async function saveSeoData() {
        const mediaId = document.getElementById('seoMediaId').value;

        const seoData = {
          alt: document.getElementById('seoAlt').value,
          title: document.getElementById('seoTitle').value,
          caption: document.getElementById('seoCaption').value,
          description: document.getElementById('seoDescription').value,
          focusKeyword: document.getElementById('seoFocusKeyword').value,
          credits: document.getElementById('seoCredits').value,
          copyright: document.getElementById('seoCopyright').value
        };

        try {
          const response = await fetch(\`\${ADMIN_BASE_PATH}/api/media/\${mediaId}/seo\`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(seoData)
          });

          if (!response.ok) {
            throw new Error('Error al guardar los datos SEO');
          }

          closeSeoEditor();
          alert('Metadatos SEO guardados exitosamente');
        } catch (error) {
          alert('Error al guardar los datos SEO: ' + error.message);
        }
      }

      // Image Editor - similar to MediaPicker
      function openImageEditor(mediaId, mediaUrl) {
        const editorModalHtml = \`
          <div id="imageEditorModal" class="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center">
            <div class="modal-container max-w-7xl w-full max-h-[95vh] overflow-hidden">
              <div class="flex items-center justify-between mb-4">
                <h3 class="modal-title">Editor de Imágenes</h3>
                <button
                  type="button"
                  onclick="closeImageEditor()"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(95vh-8rem)]">
                <div class="lg:col-span-3 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center relative">
                  <canvas id="imageEditorCanvas" class="max-w-full max-h-full"></canvas>
                  <div id="imageEditorLoading" class="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-y-auto space-y-4">
                  <div class="space-y-3">
                    <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Transformar</h4>
                    <button onclick="imgEditor.rotate(-90)" class="btn-secondary w-full">Rotar Izquierda</button>
                    <button onclick="imgEditor.rotate(90)" class="btn-secondary w-full">Rotar Derecha</button>
                    <button onclick="imgEditor.flipHorizontal()" class="btn-secondary w-full">Voltear Horizontal</button>
                    <button onclick="imgEditor.flipVertical()" class="btn-secondary w-full">Voltear Vertical</button>
                  </div>

                  <hr class="border-gray-200 dark:border-gray-700" />

                  <div class="space-y-3">
                    <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Ajustes</h4>
                    <div>
                      <label class="text-xs text-gray-600 dark:text-gray-400">
                        Brillo: <span id="brightnessValue">0</span>
                      </label>
                      <input type="range" id="brightness" min="-100" max="100" value="0" class="w-full" oninput="imgEditor.setBrightness(this.value)" />
                    </div>
                    <div>
                      <label class="text-xs text-gray-600 dark:text-gray-400">
                        Contraste: <span id="contrastValue">0</span>
                      </label>
                      <input type="range" id="contrast" min="-100" max="100" value="0" class="w-full" oninput="imgEditor.setContrast(this.value)" />
                    </div>
                    <div>
                      <label class="text-xs text-gray-600 dark:text-gray-400">
                        Saturación: <span id="saturationValue">0</span>
                      </label>
                      <input type="range" id="saturation" min="-100" max="100" value="0" class="w-full" oninput="imgEditor.setSaturation(this.value)" />
                    </div>
                  </div>

                  <hr class="border-gray-200 dark:border-gray-700" />

                  <div class="space-y-3">
                    <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Filtros</h4>
                    <button onclick="imgEditor.applyFilter('grayscale')" class="btn-secondary w-full text-sm">Blanco y Negro</button>
                    <button onclick="imgEditor.applyFilter('sepia')" class="btn-secondary w-full text-sm">Sepia</button>
                    <button onclick="imgEditor.applyFilter('invert')" class="btn-secondary w-full text-sm">Invertir</button>
                    <button onclick="imgEditor.applyFilter('blur')" class="btn-secondary w-full text-sm">Desenfocar</button>
                  </div>

                  <hr class="border-gray-200 dark:border-gray-700" />

                  <div class="space-y-3">
                    <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Recortar</h4>
                    <button onclick="imgEditor.enableCrop()" id="cropButton" class="btn-secondary w-full">Activar Recorte</button>
                    <button onclick="imgEditor.applyCrop()" id="applyCropButton" class="btn-action w-full hidden">Aplicar Recorte</button>
                    <button onclick="imgEditor.cancelCrop()" id="cancelCropButton" class="btn-secondary w-full hidden">Cancelar Recorte</button>
                  </div>

                  <hr class="border-gray-200 dark:border-gray-700" />

                  <button onclick="imgEditor.reset()" class="btn-secondary w-full">Restablecer</button>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-4">
                <button onclick="closeImageEditor()" class="btn-secondary">Cancelar</button>
                <button onclick="imgEditor.save()" class="btn-action">Guardar Cambios</button>
              </div>
            </div>
          </div>
        \`;

        document.body.insertAdjacentHTML('beforeend', editorModalHtml);
        initializeImageEditor(mediaUrl);
      }

      function initializeImageEditor(imageUrl) {
        const canvas = document.getElementById('imageEditorCanvas');
        const ctx = canvas.getContext('2d');
        const loading = document.getElementById('imageEditorLoading');

        let originalImage = null;
        let currentImage = null;
        let rotation = 0;
        let flipH = false;
        let flipV = false;
        let brightness = 0;
        let contrast = 0;
        let saturation = 0;
        let cropMode = false;
        let cropStart = null;
        let cropEnd = null;
        let cropRect = null;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          originalImage = img;
          currentImage = img;
          canvas.width = img.width;
          canvas.height = img.height;
          render();
          loading.style.display = 'none';
        };
        img.onerror = () => {
          loading.innerHTML = '<p class="text-red-500">Error al cargar la imagen</p>';
        };
        img.src = imageUrl;

        function render() {
          if (!currentImage) return;

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
          ctx.filter = \`brightness(\${100 + brightness}%) contrast(\${100 + contrast}%) saturate(\${100 + saturation}%)\`;
          ctx.drawImage(currentImage, -currentImage.width / 2, -currentImage.height / 2);
          ctx.restore();

          if (cropMode && cropRect) {
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
            ctx.setLineDash([]);
          }
        }

        window.imgEditor = {
          rotate: (degrees) => { rotation = (rotation + degrees) % 360; render(); },
          flipHorizontal: () => { flipH = !flipH; render(); },
          flipVertical: () => { flipV = !flipV; render(); },
          setBrightness: (value) => { brightness = parseInt(value); document.getElementById('brightnessValue').textContent = value; render(); },
          setContrast: (value) => { contrast = parseInt(value); document.getElementById('contrastValue').textContent = value; render(); },
          setSaturation: (value) => { saturation = parseInt(value); document.getElementById('saturationValue').textContent = value; render(); },
          applyFilter: (filterType) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);
            const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            switch (filterType) {
              case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                  data[i] = data[i + 1] = data[i + 2] = avg;
                }
                break;
              case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i], g = data[i + 1], b = data[i + 2];
                  data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                  data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                  data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
                }
                break;
              case 'invert':
                for (let i = 0; i < data.length; i += 4) {
                  data[i] = 255 - data[i];
                  data[i + 1] = 255 - data[i + 1];
                  data[i + 2] = 255 - data[i + 2];
                }
                break;
              case 'blur':
                const radius = 2;
                const tempData = new Uint8ClampedArray(data);
                for (let y = 0; y < canvas.height; y++) {
                  for (let x = 0; x < canvas.width; x++) {
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let dy = -radius; dy <= radius; dy++) {
                      for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                          const idx = (ny * canvas.width + nx) * 4;
                          r += tempData[idx];
                          g += tempData[idx + 1];
                          b += tempData[idx + 2];
                          count++;
                        }
                      }
                    }
                    const idx = (y * canvas.width + x) * 4;
                    data[idx] = r / count;
                    data[idx + 1] = g / count;
                    data[idx + 2] = b / count;
                  }
                }
                break;
            }

            tempCtx.putImageData(imageData, 0, 0);
            const newImg = new Image();
            newImg.onload = () => { currentImage = newImg; render(); };
            newImg.src = tempCanvas.toDataURL();
          },
          enableCrop: () => {
            cropMode = true;
            document.getElementById('cropButton').classList.add('hidden');
            document.getElementById('applyCropButton').classList.remove('hidden');
            document.getElementById('cancelCropButton').classList.remove('hidden');
            canvas.style.cursor = 'crosshair';
            canvas.onmousedown = (e) => {
              if (!cropMode) return;
              const rect = canvas.getBoundingClientRect();
              cropStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
              canvas.onmousemove = (e) => {
                if (!cropStart) return;
                const rect = canvas.getBoundingClientRect();
                cropEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                cropRect = {
                  x: Math.min(cropStart.x, cropEnd.x),
                  y: Math.min(cropStart.y, cropEnd.y),
                  width: Math.abs(cropEnd.x - cropStart.x),
                  height: Math.abs(cropEnd.y - cropStart.y)
                };
                render();
              };
              canvas.onmouseup = () => {
                canvas.onmousemove = null;
                canvas.onmouseup = null;
              };
            };
          },
          applyCrop: () => {
            if (!cropRect) return;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = cropRect.width;
            tempCanvas.height = cropRect.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height);
            const newImg = new Image();
            newImg.onload = () => {
              currentImage = newImg;
              canvas.width = newImg.width;
              canvas.height = newImg.height;
              window.imgEditor.cancelCrop();
              render();
            };
            newImg.src = tempCanvas.toDataURL();
          },
          cancelCrop: () => {
            cropMode = false;
            cropStart = null;
            cropEnd = null;
            cropRect = null;
            canvas.style.cursor = 'default';
            canvas.onmousedown = null;
            document.getElementById('cropButton').classList.remove('hidden');
            document.getElementById('applyCropButton').classList.add('hidden');
            document.getElementById('cancelCropButton').classList.add('hidden');
            render();
          },
          reset: () => {
            rotation = 0;
            flipH = false;
            flipV = false;
            brightness = 0;
            contrast = 0;
            saturation = 0;
            currentImage = originalImage;
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            document.getElementById('brightness').value = 0;
            document.getElementById('contrast').value = 0;
            document.getElementById('saturation').value = 0;
            document.getElementById('brightnessValue').textContent = 0;
            document.getElementById('contrastValue').textContent = 0;
            document.getElementById('saturationValue').textContent = 0;
            window.imgEditor.cancelCrop();
            render();
          },
          save: async () => {
            try {
              const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
              const formData = new FormData();
              formData.append('file', blob, 'edited-image.webp');
              const response = await fetch(ADMIN_BASE_PATH + '/media', {
                method: 'POST',
                body: formData,
                credentials: 'include'
              });
              if (!response.ok) throw new Error('Error al guardar la imagen');
              const data = await response.json();
              closeImageEditor();
              window.location.reload();
            } catch (error) {
              alert('Error al guardar la imagen: ' + error.message);
            }
          }
        };
      }

      function closeImageEditor() {
        const modal = document.getElementById('imageEditorModal');
        if (modal) modal.remove();
        delete window.imgEditor;
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

      // View switching
      let selectedMediaIds = new Set();

      function switchView(view) {
        const gridView = document.getElementById('mediaGrid');
        const listView = document.getElementById('mediaList');
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');

        if (view === 'grid') {
          gridView.classList.remove('hidden');
          listView.classList.add('hidden');
          gridBtn.classList.add('bg-purple-600', 'text-white');
          gridBtn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
          listBtn.classList.remove('bg-purple-600', 'text-white');
          listBtn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        } else {
          gridView.classList.add('hidden');
          listView.classList.remove('hidden');
          listBtn.classList.add('bg-purple-600', 'text-white');
          listBtn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
          gridBtn.classList.remove('bg-purple-600', 'text-white');
          gridBtn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        }
      }

      // Bulk selection
      function toggleMediaSelection(mediaId, isSelected) {
        if (isSelected) {
          selectedMediaIds.add(mediaId);
        } else {
          selectedMediaIds.delete(mediaId);
        }
        updateBulkActionsBar();
      }

      function updateBulkActionsBar() {
        const bulkActionsBar = document.getElementById('bulkActionsBar');
        const selectedCount = document.getElementById('selectedCount');

        selectedCount.textContent = selectedMediaIds.size;

        if (selectedMediaIds.size > 0) {
          bulkActionsBar.classList.remove('hidden');
        } else {
          bulkActionsBar.classList.add('hidden');
        }
      }

      function clearSelection() {
        selectedMediaIds.clear();
        const checkboxes = document.querySelectorAll('.media-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        updateBulkActionsBar();
      }

      async function bulkDelete() {
        const count = selectedMediaIds.size;
        if (count === 0) return;

        if (!confirm(\`¿Estás seguro de que deseas eliminar \${count} archivo(s)?\`)) {
          return;
        }

        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        let errors = [];

        for (const mediaId of selectedMediaIds) {
          try {
            const response = await fetch(\`\${ADMIN_BASE_PATH}/media/\${mediaId}\`, {
              method: 'DELETE',
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              errors.push(\`ID \${mediaId}: \${error.error || 'Error desconocido'}\`);
            }
          } catch (error) {
            errors.push(\`ID \${mediaId}: \${error.message}\`);
          }
        }

        if (errors.length > 0) {
          errorText.textContent = 'Errores al eliminar algunos archivos: ' + errors.join(', ');
          errorMessage.classList.remove('hidden');
          setTimeout(() => errorMessage.classList.add('hidden'), 5000);
        }

        // Reload page after deletion
        window.location.reload();
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
