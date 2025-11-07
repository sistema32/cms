// CKEditor Initialization Script
// This file is loaded by CKEditorField.tsx

async function initCKEditor(config) {
  const {
    editorId,
    inputId,
    tocId,
    mediaModalId,
    mediaContentId,
    name,
    bundlePath,
    mediaListEndpoint,
    mediaUploadEndpoint,
    adminPath,
    initialContent,
    placeholderText
  } = config;

  const editorElement = document.getElementById(editorId);
  const hiddenInput = document.getElementById(inputId);
  const tocElement = document.getElementById(tocId);
  const mediaModal = document.getElementById(mediaModalId);
  const mediaContent = document.getElementById(mediaContentId);

  const ensureStylesheet = () => {
    if (typeof document === 'undefined') return;
    const id = 'ckeditor-lark-theme';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = adminPath + '/assets/css/ckeditor.css';
    document.head.appendChild(link);
  };

  const enableFallback = () => {
    if (!editorElement) return;
    editorElement.innerHTML = '';
    const textarea = document.createElement('textarea');
    textarea.className = 'lex-editor-fallback form-input';
    textarea.name = name;
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
    CKEditorBundle = await import(bundlePath);
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

        const response = await fetch(mediaUploadEndpoint, {
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
            errorMsg = 'Error HTTP ' + response.status + ': ' + response.statusText;
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

      const anchorId = heading.id || 'lex-heading-' + index;
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
    if (!url || !window['editor_' + name]) return;
    window['editor_' + name].execute('insertImage', { source: [{ src: url, alt }] });
    closeMediaPicker();
  };

  let mediaItems = [];
  const renderMediaGrid = (items) => {
    if (!mediaContent) return;
    const grid = mediaContent.querySelector('#' + name + '_grid');
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
    mediaContent.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button type="button" class="btn-secondary" onclick="document.getElementById('mediaUploadInput-` + name + `').click()">Subir imagen</button>
        <input type="file" id="mediaUploadInput-` + name + `" class="hidden" accept="image/*" />
        <div class="flex-1 min-w-[12rem]"><input type="text" id="mediaPickerSearch-` + name + `" class="form-input" placeholder="Buscar por nombre..." /></div>
      </div>
      <div id="` + name + `_grid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"></div>
      <div id="` + name + `_uploadMessage" class="hidden text-sm mt-3"></div>
    `;
  };

  const loadMediaLibrary = async () => {
    showMediaLayout();
    const grid = mediaContent?.querySelector('#' + name + '_grid');
    if (grid) {
      grid.innerHTML =
        '<div class="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">Cargando biblioteca de medios...</div>';
    }

    const searchInput = mediaContent?.querySelector('#mediaPickerSearch-' + name);
    const uploadInput = mediaContent?.querySelector('#mediaUploadInput-' + name);
    const uploadMessage = mediaContent?.querySelector('#' + name + '_uploadMessage');

    try {
      const response = await fetch(mediaListEndpoint + '?limit=100', { credentials: 'include' });
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
            const res = await fetch(mediaUploadEndpoint, {
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
                errorMsg = 'Error HTTP ' + res.status + ': ' + res.statusText;
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

  window['openMediaPicker_' + name] = openMediaPicker;
  window['closeMediaPicker_' + name] = closeMediaPicker;

  const editorConfig = {
    placeholder: placeholderText || '',
    lexcmsMediaLibrary: () => openMediaPicker(),
  };

  try {
    const editor = await ClassicEditor.create(editorElement, editorConfig);
    window['editor_' + name] = editor;

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

    // Sobrescribir el comportamiento del botón de imagen de CKEditor
    // para que abra nuestro modal de media library en lugar del diálogo nativo
    const insertImageCommand = editor.commands.get('insertImage');
    if (insertImageCommand) {
      const originalExecute = insertImageCommand.execute.bind(insertImageCommand);

      insertImageCommand.execute = function(options) {
        // Si viene con opciones (desde drag&drop, paste, o nuestro modal), ejecutar normalmente
        if (options && (options.source || options.file)) {
          originalExecute(options);
        } else {
          // Si no tiene opciones, significa que el usuario hizo clic en el botón
          // Abrir nuestro modal en lugar del diálogo nativo
          openMediaPicker();
        }
      };
    }

    // También interceptar el comando imageInsert (usado en versiones más nuevas)
    const imageInsertCommand = editor.commands.get('imageInsert');
    if (imageInsertCommand) {
      const originalImageInsertExecute = imageInsertCommand.execute.bind(imageInsertCommand);

      imageInsertCommand.execute = function(options) {
        // Si viene con opciones, ejecutar normalmente
        if (options && (options.source || options.file)) {
          originalImageInsertExecute(options);
        } else {
          // Si no, abrir nuestro modal
          openMediaPicker();
        }
      };
    }

    // También manejar el comando uploadImage (para el botón de subir)
    const uploadImageCommand = editor.commands.get('uploadImage');
    if (uploadImageCommand) {
      const originalUploadExecute = uploadImageCommand.execute.bind(uploadImageCommand);

      uploadImageCommand.execute = function(options) {
        // Si viene con archivo, ejecutar normalmente (drag&drop, paste)
        if (options && options.file) {
          originalUploadExecute(options);
        } else {
          // Si no, abrir nuestro modal que también permite subir
          openMediaPicker();
        }
      };
    }

    // IMPORTANTE: Interceptar el UI del botón imageUpload para prevenir el explorador de archivos nativo
    // El botón imageUpload tiene un input type="file" que queremos desactivar
    const interceptFileInputs = () => {
      try {
        // Buscar todos los inputs de tipo file en el editor
        const editorWrapper = editorElement.closest('.lex-editor-wrapper') || document;
        const fileInputs = editorWrapper.querySelectorAll('.ck input[type="file"]');

        fileInputs.forEach(input => {
          // Desactivar completamente el input
          input.disabled = true;
          input.style.display = 'none';
          input.style.visibility = 'hidden';
          input.style.pointerEvents = 'none';

          // Encontrar el botón padre
          const button = input.closest('.ck-button');
          if (button) {
            // Remover todos los event listeners clonando el botón
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            // Agregar nuestro event listener
            newButton.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              openMediaPicker();
              return false;
            }, true);

            // Desactivar el input dentro del nuevo botón también
            const newInput = newButton.querySelector('input[type="file"]');
            if (newInput) {
              newInput.disabled = true;
              newInput.remove(); // Eliminar completamente del DOM
            }
          }
        });

        console.log('[CKEditor] Interceptados', fileInputs.length, 'inputs de tipo file');
      } catch (error) {
        console.warn('[CKEditor] No se pudo interceptar el botón de upload:', error);
      }
    };

    // Ejecutar múltiples veces para asegurar que capture el input
    setTimeout(() => interceptFileInputs(), 100);
    setTimeout(() => interceptFileInputs(), 300);
    setTimeout(() => interceptFileInputs(), 500);
    setTimeout(() => interceptFileInputs(), 1000); // Un último intento después de 1 segundo

    // Interceptar clicks específicamente en el área del editor
    // Solo para este editor específico, no para todo el documento
    const editorWrapper = editorElement.closest('.lex-editor-wrapper') || editorElement.parentElement;
    if (editorWrapper) {
      editorWrapper.addEventListener('click', (e) => {
        const target = e.target;

        // Si es un input file en CKEditor, prevenir y abrir modal
        if (target && target.tagName === 'INPUT' && target.type === 'file' && target.closest('.ck')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          openMediaPicker();
          return false;
        }

        // Si es un botón que contiene input file, también interceptar
        const ckButton = target.closest('.ck-button');
        if (ckButton) {
          const fileInput = ckButton.querySelector('input[type="file"]');
          if (fileInput && !fileInput.disabled) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openMediaPicker();
            return false;
          }
        }
      }, true);
    }

    editor.editing.view.change((writer) => {
      writer.setStyle('min-height', '280px', editor.editing.view.document.getRoot());
    });
  } catch (error) {
    console.error('CKEditor init error:', error);
    enableFallback();
  }
}

// Export for use in modules
if (typeof window !== 'undefined') {
  window.initCKEditor = initCKEditor;
}
