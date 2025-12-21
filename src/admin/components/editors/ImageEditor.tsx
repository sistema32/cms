import { html } from "hono/html";
import { env } from "@/config/env.ts";

interface ImageEditorProps {
  imageUrl: string;
  imageId: number;
  onSave?: string; // Callback function name
  onCancel?: string; // Callback function name
}

export const ImageEditor = (props: ImageEditorProps) => {
  const { imageUrl, imageId, onSave = "handleImageSaved", onCancel = "handleImageCancelled" } = props;
  const adminPath = env.ADMIN_PATH;

  return html`
    <div id="imageEditorModal" class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
      <div class="modal-container max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div class="flex items-center justify-between mb-4">
          <h3 class="modal-title">Editor de Imágenes</h3>
          <button
            type="button"
            onclick="${onCancel}()"
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
              id="imageEditorCanvas"
              class="max-w-full max-h-full"
            ></canvas>
            <div id="imageEditorLoading" class="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>

          <!-- Tools Panel -->
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-y-auto space-y-4">
            <!-- Transform Tools -->
            <div class="space-y-3">
              <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Transformar</h4>

              <button
                onclick="imageEditor.rotate(-90)"
                class="btn-secondary w-full"
              >
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rotar Izquierda
              </button>

              <button
                onclick="imageEditor.rotate(90)"
                class="btn-secondary w-full"
              >
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rotar Derecha
              </button>

              <button
                onclick="imageEditor.flipHorizontal()"
                class="btn-secondary w-full"
              >
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Voltear Horizontal
              </button>

              <button
                onclick="imageEditor.flipVertical()"
                class="btn-secondary w-full"
              >
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
                  Brillo: <span id="brightnessValue">0</span>
                </label>
                <input
                  type="range"
                  id="brightness"
                  min="-100"
                  max="100"
                  value="0"
                  class="w-full"
                  oninput="imageEditor.setBrightness(this.value)"
                />
              </div>

              <div>
                <label class="text-xs text-gray-600 dark:text-gray-400">
                  Contraste: <span id="contrastValue">0</span>
                </label>
                <input
                  type="range"
                  id="contrast"
                  min="-100"
                  max="100"
                  value="0"
                  class="w-full"
                  oninput="imageEditor.setContrast(this.value)"
                />
              </div>

              <div>
                <label class="text-xs text-gray-600 dark:text-gray-400">
                  Saturación: <span id="saturationValue">0</span>
                </label>
                <input
                  type="range"
                  id="saturation"
                  min="-100"
                  max="100"
                  value="0"
                  class="w-full"
                  oninput="imageEditor.setSaturation(this.value)"
                />
              </div>
            </div>

            <hr class="border-gray-200 dark:border-gray-700" />

            <!-- Filters -->
            <div class="space-y-3">
              <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Filtros</h4>

              <button onclick="imageEditor.applyFilter('grayscale')" class="btn-secondary w-full text-sm">
                Blanco y Negro
              </button>
              <button onclick="imageEditor.applyFilter('sepia')" class="btn-secondary w-full text-sm">
                Sepia
              </button>
              <button onclick="imageEditor.applyFilter('invert')" class="btn-secondary w-full text-sm">
                Invertir
              </button>
              <button onclick="imageEditor.applyFilter('blur')" class="btn-secondary w-full text-sm">
                Desenfocar
              </button>
            </div>

            <hr class="border-gray-200 dark:border-gray-700" />

            <!-- Crop -->
            <div class="space-y-3">
              <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Recortar</h4>

              <button onclick="imageEditor.enableCrop()" id="cropButton" class="btn-secondary w-full">
                Activar Recorte
              </button>
              <button onclick="imageEditor.applyCrop()" id="applyCropButton" class="btn-action w-full hidden">
                Aplicar Recorte
              </button>
              <button onclick="imageEditor.cancelCrop()" id="cancelCropButton" class="btn-secondary w-full hidden">
                Cancelar Recorte
              </button>
            </div>

            <hr class="border-gray-200 dark:border-gray-700" />

            <!-- Resize -->
            <div class="space-y-3">
              <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Redimensionar</h4>

              <div>
                <label class="text-xs text-gray-600 dark:text-gray-400">Ancho (px)</label>
                <input
                  type="number"
                  id="resizeWidth"
                  class="form-input w-full"
                  placeholder="Ancho"
                />
              </div>
              <div>
                <label class="text-xs text-gray-600 dark:text-gray-400">Alto (px)</label>
                <input
                  type="number"
                  id="resizeHeight"
                  class="form-input w-full"
                  placeholder="Alto"
                />
              </div>
              <div>
                <label class="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <input type="checkbox" id="maintainAspect" checked class="mr-2" />
                  Mantener proporción
                </label>
              </div>
              <button onclick="imageEditor.resize()" class="btn-action w-full">
                Redimensionar
              </button>
            </div>

            <hr class="border-gray-200 dark:border-gray-700" />

            <!-- Reset -->
            <button
              onclick="imageEditor.reset()"
              class="btn-secondary w-full"
            >
              <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Restablecer
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 mt-4">
          <button
            onclick="${onCancel}()"
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onclick="imageEditor.save()"
            class="btn-action"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>

    <script>
      const imageEditor = (() => {
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

          // Set initial resize values
          document.getElementById('resizeWidth').value = img.width;
          document.getElementById('resizeHeight').value = img.height;
        };
        img.onerror = () => {
          loading.innerHTML = '<p class="text-red-500">Error al cargar la imagen</p>';
        };
        img.src = ${JSON.stringify(imageUrl)};

        function render() {
          if (!currentImage) return;

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Apply transformations
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

          // Draw image
          ctx.filter = \`brightness(\${100 + brightness}%) contrast(\${100 + contrast}%) saturate(\${100 + saturation}%)\`;
          ctx.drawImage(currentImage, -currentImage.width / 2, -currentImage.height / 2);

          ctx.restore();

          // Draw crop rectangle
          if (cropMode && cropRect) {
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
            ctx.setLineDash([]);
          }
        }

        // Transformations
        function rotate(degrees) {
          rotation = (rotation + degrees) % 360;
          render();
        }

        function flipHorizontal() {
          flipH = !flipH;
          render();
        }

        function flipVertical() {
          flipV = !flipV;
          render();
        }

        // Adjustments
        function setBrightness(value) {
          brightness = parseInt(value);
          document.getElementById('brightnessValue').textContent = value;
          render();
        }

        function setContrast(value) {
          contrast = parseInt(value);
          document.getElementById('contrastValue').textContent = value;
          render();
        }

        function setSaturation(value) {
          saturation = parseInt(value);
          document.getElementById('saturationValue').textContent = value;
          render();
        }

        // Filters
        function applyFilter(filterType) {
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
              // Simple box blur
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
        }

        // Crop
        function enableCrop() {
          cropMode = true;
          document.getElementById('cropButton').classList.add('hidden');
          document.getElementById('applyCropButton').classList.remove('hidden');
          document.getElementById('cancelCropButton').classList.remove('hidden');

          canvas.style.cursor = 'crosshair';
          canvas.onmousedown = startCrop;
        }

        function startCrop(e) {
          if (!cropMode) return;
          const rect = canvas.getBoundingClientRect();
          cropStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
          canvas.onmousemove = updateCrop;
          canvas.onmouseup = endCrop;
        }

        function updateCrop(e) {
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
        }

        function endCrop() {
          canvas.onmousemove = null;
          canvas.onmouseup = null;
        }

        function applyCrop() {
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
            cancelCrop();
            render();
          };
          newImg.src = tempCanvas.toDataURL();
        }

        function cancelCrop() {
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
        }

        // Resize
        function resize() {
          const width = parseInt(document.getElementById('resizeWidth').value);
          const height = parseInt(document.getElementById('resizeHeight').value);

          if (!width || !height || width <= 0 || height <= 0) {
            alert('Por favor, ingrese dimensiones válidas');
            return;
          }

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');

          tempCtx.drawImage(canvas, 0, 0, width, height);

          const newImg = new Image();
          newImg.onload = () => {
            currentImage = newImg;
            canvas.width = width;
            canvas.height = height;
            render();
          };
          newImg.src = tempCanvas.toDataURL();
        }

        // Maintain aspect ratio
        document.getElementById('resizeWidth').addEventListener('input', (e) => {
          if (!document.getElementById('maintainAspect').checked || !originalImage) return;
          const ratio = originalImage.height / originalImage.width;
          document.getElementById('resizeHeight').value = Math.round(e.target.value * ratio);
        });

        document.getElementById('resizeHeight').addEventListener('input', (e) => {
          if (!document.getElementById('maintainAspect').checked || !originalImage) return;
          const ratio = originalImage.width / originalImage.height;
          document.getElementById('resizeWidth').value = Math.round(e.target.value * ratio);
        });

        // Reset
        function reset() {
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
          document.getElementById('resizeWidth').value = originalImage.width;
          document.getElementById('resizeHeight').value = originalImage.height;

          cancelCrop();
          render();
        }

        // Save
        async function save() {
          try {
            // Convert canvas to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));

            // Create FormData
            const formData = new FormData();
            formData.append('file', blob, 'edited-image.webp');

            // Upload
            const response = await fetch(${JSON.stringify(adminPath)} + '/media', {
              method: 'POST',
              body: formData,
              credentials: 'include'
            });

            if (!response.ok) {
              throw new Error('Error al guardar la imagen');
            }

            const data = await response.json();

            // Call success callback
            if (typeof window[${JSON.stringify(onSave)}] === 'function') {
              window[${JSON.stringify(onSave)}](data.media);
            }
          } catch (error) {
            alert('Error al guardar la imagen: ' + error.message);
          }
        }

        return {
          rotate,
          flipHorizontal,
          flipVertical,
          setBrightness,
          setContrast,
          setSaturation,
          applyFilter,
          enableCrop,
          applyCrop,
          cancelCrop,
          resize,
          reset,
          save
        };
      })();
    </script>
  `;
};

export default ImageEditor;
