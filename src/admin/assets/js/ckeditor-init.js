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
      placeholder.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;';
      placeholder.textContent = 'No hay imágenes disponibles';
      grid.appendChild(placeholder);
      return;
    }

    images.forEach((media) => {
      const card = document.createElement('div');
      card.style.cssText = 'position: relative; cursor: pointer; border-radius: 0.5rem; overflow: hidden; border: 2px solid transparent; transition: border-color 0.2s;';
      card.dataset.url = media.url || '';
      card.dataset.filename = media.originalFilename || '';

      const thumb = document.createElement('div');
      thumb.style.cssText = 'aspect-ratio: 1; background: #f3f4f6; position: relative;';
      const img = document.createElement('img');
      img.src = media.url || '';
      img.alt = media.originalFilename || '';
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
      img.loading = 'lazy';
      thumb.appendChild(img);

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0); transition: background-color 0.2s; display: flex; align-items: center; justify-content: center;';
      const overlayText = document.createElement('div');
      overlayText.style.cssText = 'opacity: 0; color: white; font-size: 0.875rem; font-weight: 500; transition: opacity 0.2s;';
      overlayText.textContent = 'Usar imagen';
      overlay.appendChild(overlayText);

      card.addEventListener('click', () => selectMedia(card));
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = '#167bff';
        overlayText.style.opacity = '1';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'transparent';
        overlayText.style.opacity = '0';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      });

      card.appendChild(thumb);
      card.appendChild(overlay);
      grid.appendChild(card);
    });
  };

  const showMediaLayout = () => {
    if (!mediaContent) return;
    mediaContent.innerHTML = `
      <style>
        .media-upload-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .media-upload-btn {
          padding: 0.5rem 1rem;
          background: #167bff;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.2s;
        }
        .media-upload-btn:hover {
          background: #0d5fd6;
        }
        .media-search-input {
          flex: 1;
          min-width: 12rem;
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .media-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>
      <div class="media-upload-bar">
        <button type="button" class="media-upload-btn" id="mediaUploadBtn-` + name + `">Subir imagen</button>
        <input type="file" id="mediaUploadInput-` + name + `" style="display: none;" accept="image/*" />
        <input type="text" id="mediaPickerSearch-` + name + `" class="media-search-input" placeholder="Buscar por nombre..." />
      </div>
      <div id="` + name + `_grid" class="media-grid"></div>
      <div id="` + name + `_uploadMessage" style="display: none; font-size: 0.875rem; margin-top: 1rem;"></div>
    `;

    // Attach upload button click handler
    const uploadBtn = mediaContent.querySelector('#mediaUploadBtn-' + name);
    const uploadInput = mediaContent.querySelector('#mediaUploadInput-' + name);
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', () => {
        uploadInput.click();
      });
    }
  };

  const loadMediaLibrary = async () => {
    showMediaLayout();
    const grid = mediaContent?.querySelector('#' + name + '_grid');
    if (grid) {
      grid.innerHTML =
        '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">Cargando biblioteca de medios...</div>';
    }

    const searchInput = mediaContent?.querySelector('#mediaPickerSearch-' + name);
    const uploadInput = mediaContent?.querySelector('#mediaUploadInput-' + name);
    const uploadMessage = mediaContent?.querySelector('#' + name + '_uploadMessage');

    try {
      const response = await fetch(mediaListEndpoint + '?limit=100', { credentials: 'include' });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CKEditor] Error al cargar medios:', response.status, errorText);
        throw new Error(`Error al cargar medios (${response.status}): ${errorText}`);
      }
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
            uploadMessage.style.display = 'block';
            uploadMessage.style.color = '#0d5fd6';
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
              uploadMessage.style.display = 'block';
              uploadMessage.style.color = '#10b981';
            }
            // Reset the file input so the same file can be uploaded again
            if (target) target.value = '';
            await loadMediaLibrary();
          } catch (error) {
            if (uploadMessage) {
              uploadMessage.textContent = error.message || 'Error al subir imagen';
              uploadMessage.style.display = 'block';
              uploadMessage.style.color = '#f31260';
            }
            // Reset the file input
            if (target) target.value = '';
          }
        });
      }
    } catch (error) {
      console.error('[CKEditor] Media library error:', error);
      if (mediaContent) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        mediaContent.innerHTML =
          '<div style="text-align: center; padding: 2rem; color: #f31260;"><p>Error al cargar la biblioteca de medios</p><p style="font-size: 0.875rem; margin-top: 0.5rem;">' + errorMsg + '</p></div>';
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
