// Media Library JavaScript
// This file is loaded by MediaLibraryPage.tsx

let ADMIN_BASE_PATH = '';

// Initialize with admin path
function initMediaLibrary(adminPath) {
  ADMIN_BASE_PATH = adminPath;
}

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
    uploadStatus.textContent = 'Subiendo ' + file.name + '... (' + (i + 1) + '/' + files.length + ')';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/media', {
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
          errorMsg = 'Error HTTP ' + response.status + ': ' + response.statusText;
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

      uploadBar.style.width = ((i + 1) / files.length) * 100 + '%';
    } catch (error) {
      console.error('[Upload] Error:', error);
      errorText.textContent = 'Error al subir ' + file.name + ': ' + error.message;
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
  if (!confirm('¿Estás seguro de que deseas eliminar "' + filename + '"?')) {
    return;
  }

  try {
    const response = await fetch('/api/media/' + id, {
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
    errorText.textContent = 'Error al eliminar archivo: ' + error.message;
    errorMessage.classList.remove('hidden');
  }
}

// View details
async function viewMediaDetails(element) {
  if (!element) return;
  const mediaId = element.dataset.id;

  console.log('[viewMediaDetails] Opening details for media ID:', mediaId);

  try {
    const url = '/api/media/' + mediaId;
    console.log('[viewMediaDetails] Fetching from URL:', url);

    const response = await fetch(url, {
      credentials: 'include'
    });

    console.log('[viewMediaDetails] Response status:', response.status, response.statusText);

    if (!response.ok) {
      // Intentar leer el cuerpo del error
      let errorMessage = 'Error al cargar los detalles del archivo';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('[viewMediaDetails] Error response:', errorData);
      } catch (e) {
        console.error('[viewMediaDetails] Could not parse error response');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[viewMediaDetails] Received data:', data);

    if (!data.media) {
      console.error('[viewMediaDetails] No media data in response:', data);
      throw new Error('No se recibieron datos del archivo');
    }

    showMediaDetailsModal(data.media);
  } catch (error) {
    console.error('[viewMediaDetails] Error:', error);
    alert('Error al cargar los detalles del archivo: ' + error.message);
  }
}

function showMediaDetailsModal(mediaData) {
  const modal = document.getElementById('mediaDetailsModal');
  const preview = document.getElementById('mediaPreview');

  // Populate preview
  if (mediaData.type === 'image') {
    preview.innerHTML = '<img src="' + mediaData.url + '" alt="' + mediaData.originalFilename + '" class="max-w-full max-h-[400px] rounded-lg" />';
  } else if (mediaData.type === 'video') {
    preview.innerHTML = '<video src="' + mediaData.url + '" controls class="max-w-full max-h-[400px] rounded-lg"></video>';
  } else if (mediaData.type === 'audio') {
    preview.innerHTML = '<audio src="' + mediaData.url + '" controls class="w-full"></audio>';
  } else {
    preview.innerHTML = `
      <div class="text-center">
        <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Documento</p>
      </div>
    `;
  }

  // Populate file info
  document.getElementById('detailFilename').textContent = mediaData.originalFilename;
  document.getElementById('detailType').textContent = mediaData.type;
  document.getElementById('detailSize').textContent = formatFileSize(mediaData.size);

  if (mediaData.width && mediaData.height) {
    document.getElementById('detailDimensions').textContent = mediaData.width + ' × ' + mediaData.height;
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
  let urlsHtml = `
    <div class="space-y-2">
      <div>
        <label class="text-xs text-gray-600 dark:text-gray-400">URL Original:</label>
        <div class="flex gap-2">
          <input type="text" value="` + mediaData.url + `" readonly class="form-input text-xs flex-1" id="urlOriginal" />
          <button onclick="copyToClipboard('urlOriginal')" class="btn-secondary text-xs px-3" title="Copiar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
  `;

  // Add sizes if available
  if (mediaData.sizes && mediaData.sizes.length > 0) {
    mediaData.sizes.forEach((size, index) => {
      urlsHtml += `
        <div>
          <label class="text-xs text-gray-600 dark:text-gray-400">URL ` + size.size + ` (` + size.width + `×` + size.height + `):</label>
          <div class="flex gap-2">
            <input type="text" value="` + size.url + `" readonly class="form-input text-xs flex-1" id="urlSize` + index + `" />
            <button onclick="copyToClipboard('urlSize` + index + `')" class="btn-secondary text-xs px-3" title="Copiar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      `;
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

    if (seo.alt) seoHtml += '<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Alt:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">' + seo.alt + '</dd></div>';
    if (seo.title) seoHtml += '<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Título:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">' + seo.title + '</dd></div>';
    if (seo.caption) seoHtml += '<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Leyenda:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">' + seo.caption + '</dd></div>';
    if (seo.description) seoHtml += '<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Descripción:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">' + seo.description + '</dd></div>';
    if (seo.credits) seoHtml += '<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Créditos:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">' + seo.credits + '</dd></div>';
    if (seo.copyright) seoHtml += '<div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Copyright:</dt><dd class="font-medium text-gray-900 dark:text-gray-100">' + seo.copyright + '</dd></div>';

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
    document.getElementById('snippetBasic').value = '<img src="' + mediaData.url + '" />';
    document.getElementById('snippetWithAlt').value = '<img src="' + mediaData.url + '" alt="' + altText + '" />';
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
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// SEO Editor functions
let currentMediaData = null;

async function openSeoEditor(mediaId) {
  document.getElementById('seoMediaId').value = mediaId;

  // Hide warning initially
  document.getElementById('aiConnectionWarning').classList.add('hidden');

  // Fetch current SEO data
  try {
    const response = await fetch('/api/media/' + mediaId, {
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
    const response = await fetch('/api/media/' + mediaId + '/seo', {
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
  const editorModalHtml = `
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
  `;

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
    ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
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
        const response = await fetch('/api/media', {
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

  if (!confirm('¿Estás seguro de que deseas eliminar ' + count + ' archivo(s)?')) {
    return;
  }

  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  let errors = [];

  for (const mediaId of selectedMediaIds) {
    try {
      const response = await fetch('/api/media/' + mediaId, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        errors.push('ID ' + mediaId + ': ' + (error.error || 'Error desconocido'));
      }
    } catch (error) {
      errors.push('ID ' + mediaId + ': ' + error.message);
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
