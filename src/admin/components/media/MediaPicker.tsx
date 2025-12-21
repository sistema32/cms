import { html } from "hono/html";
import { env } from "@/config/env.ts";

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
          <div id="${fieldName}_preview" class="relative inline-block group">
            <img
              src="${currentImageUrl}"
              alt="Vista previa"
              class="w-full max-w-xs rounded-lg shadow-sm"
            />
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onclick="editMedia_${fieldName}(${currentImageId}, '${currentImageUrl}')"
                class="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mr-2"
                title="Editar imagen"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                onclick="removeMedia_${fieldName}()"
                class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Eliminar imagen"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ` : html`
          <div id="${fieldName}_preview" class="hidden relative inline-block group">
            <img
              id="${fieldName}_preview_img"
              src=""
              alt="Vista previa"
              class="w-full max-w-xs rounded-lg shadow-sm"
            />
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onclick="editMedia_${fieldName}(document.getElementById('${fieldName}').value, document.getElementById('${fieldName}_preview_img').src)"
                class="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mr-2"
                title="Editar imagen"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                onclick="removeMedia_${fieldName}()"
                class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Eliminar imagen"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        `}

        <div
          id="${fieldName}_placeholder"
          class="${currentImageUrl ? "hidden" : ""} mt-2"
          ondrop="handleDrop_${fieldName}(event)"
          ondragover="handleDragOver_${fieldName}(event)"
          ondragleave="handleDragLeave_${fieldName}(event)"
        >
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
                Haz clic o arrastra una imagen aquí
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
        (function() {
          const MEDIA_LIST_ENDPOINT = ${JSON.stringify(mediaDataEndpoint)};
          const ADMIN_PATH = ${JSON.stringify(adminPath)};

          // Drag and drop handlers
          window.handleDragOver_${fieldName} = function(event) {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.classList.add('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900');
        }

          window.handleDragLeave_${fieldName} = function(event) {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900');
        }

          window.handleDrop_${fieldName} = async function(event) {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900');

          const files = event.dataTransfer.files;
          if (files.length === 0) return;

          const file = files[0];
          if (!file.type.startsWith('image/')) {
            alert('Por favor, arrastra solo archivos de imagen');
            return;
          }

          // Upload file
          try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(ADMIN_PATH + '/media', {
              method: 'POST',
              body: formData,
              credentials: 'include'
            });

            if (!response.ok) {
              throw new Error('Error al subir la imagen');
            }

            const data = await response.json();
            window.selectMediaFromModal_${fieldName}(data.media.media.id, data.media.media.url);
          } catch (error) {
            alert('Error al subir la imagen: ' + error.message);
          }
        }

          // Edit media with image editor
          window.editMedia_${fieldName} = function(mediaId, mediaUrl) {
          // Create modal for image editor
          const editorModalHtml = \`
            <div id="imageEditorModal_${fieldName}" class="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center">
              <div class="modal-container max-w-7xl w-full max-h-[95vh] overflow-hidden">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="modal-title">Editor de Imágenes</h3>
                  <button
                    type="button"
                    onclick="closeImageEditor_${fieldName}()"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(95vh-8rem)]">
                  <!-- Canvas Area -->
                  <div class="lg:col-span-3 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center relative">
                    <canvas
                      id="imageEditorCanvas_${fieldName}"
                      class="max-w-full max-h-full"
                    ></canvas>
                    <div id="imageEditorLoading_${fieldName}" class="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  </div>

                  <!-- Tools Panel -->
                  <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-y-auto space-y-4">
                    <!-- Transform Tools -->
                    <div class="space-y-3">
                      <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Transformar</h4>

                      <button onclick="imageEditor_${fieldName}.rotate(-90)" class="btn-secondary w-full">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Rotar Izquierda
                      </button>

                      <button onclick="imageEditor_${fieldName}.rotate(90)" class="btn-secondary w-full">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Rotar Derecha
                      </button>

                      <button onclick="imageEditor_${fieldName}.flipHorizontal()" class="btn-secondary w-full">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Voltear Horizontal
                      </button>

                      <button onclick="imageEditor_${fieldName}.flipVertical()" class="btn-secondary w-full">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Voltear Vertical
                      </button>
                    </div>

                    <hr class="border-gray-200 dark:border-gray-700" />

                    <!-- Adjustments -->
                    <div class="space-y-3">
                      <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Ajustes</h4>

                      <div>
                        <label class="text-xs text-gray-600 dark:text-gray-400">
                          Brillo: <span id="brightnessValue_${fieldName}">0</span>
                        </label>
                        <input
                          type="range"
                          id="brightness_${fieldName}"
                          min="-100"
                          max="100"
                          value="0"
                          class="w-full"
                          oninput="imageEditor_${fieldName}.setBrightness(this.value)"
                        />
                      </div>

                      <div>
                        <label class="text-xs text-gray-600 dark:text-gray-400">
                          Contraste: <span id="contrastValue_${fieldName}">0</span>
                        </label>
                        <input
                          type="range"
                          id="contrast_${fieldName}"
                          min="-100"
                          max="100"
                          value="0"
                          class="w-full"
                          oninput="imageEditor_${fieldName}.setContrast(this.value)"
                        />
                      </div>

                      <div>
                        <label class="text-xs text-gray-600 dark:text-gray-400">
                          Saturación: <span id="saturationValue_${fieldName}">0</span>
                        </label>
                        <input
                          type="range"
                          id="saturation_${fieldName}"
                          min="-100"
                          max="100"
                          value="0"
                          class="w-full"
                          oninput="imageEditor_${fieldName}.setSaturation(this.value)"
                        />
                      </div>
                    </div>

                    <hr class="border-gray-200 dark:border-gray-700" />

                    <!-- Filters -->
                    <div class="space-y-3">
                      <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Filtros</h4>

                      <button onclick="imageEditor_${fieldName}.applyFilter('grayscale')" class="btn-secondary w-full text-sm">
                        Blanco y Negro
                      </button>
                      <button onclick="imageEditor_${fieldName}.applyFilter('sepia')" class="btn-secondary w-full text-sm">
                        Sepia
                      </button>
                      <button onclick="imageEditor_${fieldName}.applyFilter('invert')" class="btn-secondary w-full text-sm">
                        Invertir
                      </button>
                      <button onclick="imageEditor_${fieldName}.applyFilter('blur')" class="btn-secondary w-full text-sm">
                        Desenfocar
                      </button>
                    </div>

                    <hr class="border-gray-200 dark:border-gray-700" />

                    <!-- Crop -->
                    <div class="space-y-3">
                      <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Recortar</h4>

                      <button onclick="imageEditor_${fieldName}.enableCrop()" id="cropButton_${fieldName}" class="btn-secondary w-full">
                        Activar Recorte
                      </button>
                      <button onclick="imageEditor_${fieldName}.applyCrop()" id="applyCropButton_${fieldName}" class="btn-action w-full hidden">
                        Aplicar Recorte
                      </button>
                      <button onclick="imageEditor_${fieldName}.cancelCrop()" id="cancelCropButton_${fieldName}" class="btn-secondary w-full hidden">
                        Cancelar Recorte
                      </button>
                    </div>

                    <hr class="border-gray-200 dark:border-gray-700" />

                    <!-- Reset -->
                    <button onclick="imageEditor_${fieldName}.reset()" class="btn-secondary w-full">
                      <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restablecer
                    </button>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-end gap-3 mt-4">
                  <button onclick="closeImageEditor_${fieldName}()" class="btn-secondary">
                    Cancelar
                  </button>
                  <button onclick="imageEditor_${fieldName}.save()" class="btn-action">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          \`;

          // Insert modal
          document.body.insertAdjacentHTML('beforeend', editorModalHtml);

          // Initialize image editor
          window.initializeImageEditor_${fieldName}(mediaUrl);
        };

        window.initializeImageEditor_${fieldName} = function(imageUrl) {
          const canvas = document.getElementById('imageEditorCanvas_${fieldName}');
          const ctx = canvas.getContext('2d');
          const loading = document.getElementById('imageEditorLoading_${fieldName}');

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

          // Load image
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

          window['imageEditor_${fieldName}'] = {
            rotate: (degrees) => {
              rotation = (rotation + degrees) % 360;
              render();
            },
            flipHorizontal: () => {
              flipH = !flipH;
              render();
            },
            flipVertical: () => {
              flipV = !flipV;
              render();
            },
            setBrightness: (value) => {
              brightness = parseInt(value);
              document.getElementById('brightnessValue_${fieldName}').textContent = value;
              render();
            },
            setContrast: (value) => {
              contrast = parseInt(value);
              document.getElementById('contrastValue_${fieldName}').textContent = value;
              render();
            },
            setSaturation: (value) => {
              saturation = parseInt(value);
              document.getElementById('saturationValue_${fieldName}').textContent = value;
              render();
            },
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
              newImg.onload = () => {
                currentImage = newImg;
                render();
              };
              newImg.src = tempCanvas.toDataURL();
            },
            enableCrop: () => {
              cropMode = true;
              document.getElementById('cropButton_${fieldName}').classList.add('hidden');
              document.getElementById('applyCropButton_${fieldName}').classList.remove('hidden');
              document.getElementById('cancelCropButton_${fieldName}').classList.remove('hidden');

              canvas.style.cursor = 'crosshair';
              canvas.onmousedown = (e) => {
                if (!cropMode) return;
                const rect = canvas.getBoundingClientRect();
                cropStart = {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                };
                canvas.onmousemove = (e) => {
                  if (!cropStart) return;
                  const rect = canvas.getBoundingClientRect();
                  cropEnd = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                  };
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
                window['imageEditor_${fieldName}'].cancelCrop();
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
              document.getElementById('cropButton_${fieldName}').classList.remove('hidden');
              document.getElementById('applyCropButton_${fieldName}').classList.add('hidden');
              document.getElementById('cancelCropButton_${fieldName}').classList.add('hidden');
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

              document.getElementById('brightness_${fieldName}').value = 0;
              document.getElementById('contrast_${fieldName}').value = 0;
              document.getElementById('saturation_${fieldName}').value = 0;
              document.getElementById('brightnessValue_${fieldName}').textContent = 0;
              document.getElementById('contrastValue_${fieldName}').textContent = 0;
              document.getElementById('saturationValue_${fieldName}').textContent = 0;

              window['imageEditor_${fieldName}'].cancelCrop();
              render();
            },
            save: async () => {
              try {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));

                const formData = new FormData();
                formData.append('file', blob, 'edited-image.webp');

                const response = await fetch(ADMIN_PATH + '/media', {
                  method: 'POST',
                  body: formData,
                  credentials: 'include'
                });

                if (!response.ok) {
                  throw new Error('Error al guardar la imagen');
                }

                const data = await response.json();
                window.selectMediaFromModal_${fieldName}(data.media.media.id, data.media.media.url);
                window.closeImageEditor_${fieldName}();
              } catch (error) {
                alert('Error al guardar la imagen: ' + error.message);
              }
            }
          };
        }

          window.closeImageEditor_${fieldName} = function() {
          const modal = document.getElementById('imageEditorModal_${fieldName}');
          if (modal) {
            modal.remove();
          }
          delete window['imageEditor_${fieldName}'];
        }

          // Open media picker
          window.openMediaPicker_${fieldName} = async function() {
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
          window.closeMediaPicker_${fieldName} = function() {
          document.getElementById('${fieldName}_modal').classList.add('hidden');
        }

          // Select media from modal
          window.selectMediaFromModal_${fieldName} = function(id, url) {
          document.getElementById('${fieldName}').value = id;
          document.getElementById('${fieldName}_preview_img').src = url;
          document.getElementById('${fieldName}_preview').classList.remove('hidden');
          document.getElementById('${fieldName}_placeholder').classList.add('hidden');
          window.closeMediaPicker_${fieldName}();
        };

          // Remove media
          window.removeMedia_${fieldName} = function() {
          document.getElementById('${fieldName}').value = '';
          document.getElementById('${fieldName}_preview').classList.add('hidden');
          document.getElementById('${fieldName}_placeholder').classList.remove('hidden');
        }

          // Filter media in modal
          window.filterModalMedia_${fieldName} = function(query) {
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
          };

        })();
      </script>
    </div>
  `;
};

export default MediaPicker;
