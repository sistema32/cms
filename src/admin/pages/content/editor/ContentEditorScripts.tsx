import { raw } from "hono/html";
import { env } from "@/config/env.ts";

export const ContentEditorScripts = () => {
    return raw(`<script>
      // Auto-generate slug from title (XSS safe)
      document.addEventListener('DOMContentLoaded', function() {
        const titleInput = document.querySelector('input[name="title"]');
        const slugInput = document.querySelector('input[name="slug"]');
        const statusRadios = document.querySelectorAll('input[name="status"]');
        const scheduledField = document.getElementById('scheduledAtField');
        const visibilitySelect = document.querySelector('select[name="visibility"]');
        const passwordField = document.getElementById('passwordField');

        // Auto-generate slug
        if (titleInput && slugInput) {
          titleInput.addEventListener('input', function() {
            if (!slugInput.dataset.manuallyEdited) {
              const slug = titleInput.value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
              slugInput.value = slug;
            }
          });

          slugInput.addEventListener('input', function() {
            slugInput.dataset.manuallyEdited = 'true';
          });
        }

        // Show/hide scheduled date field
        if (statusRadios && scheduledField) {
          statusRadios.forEach(radio => {
            radio.addEventListener('change', function() {
              scheduledField.style.display = this.value === 'scheduled' ? 'block' : 'none';
            });
          });
        }

        // Show/hide password field
        if (visibilitySelect && passwordField) {
          visibilitySelect.addEventListener('change', function() {
            passwordField.style.display = this.value === 'password' ? 'block' : 'none';
          });
        }
      });

      // Featured Image Picker Functions
      let mediaItems = [];

      async function openFeaturedImagePicker() {
        const modal = document.getElementById('featuredImageModal');
        const modalContent = document.getElementById('featuredImageModalContent');

        modal.style.display = 'block';
        modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Cargando biblioteca de medios...</div>';

        try {
          const response = await fetch('${env.ADMIN_PATH}/media/data?limit=100', { credentials: 'include' });
          if (!response.ok) throw new Error('Error al cargar medios');

          const data = await response.json();
          mediaItems = Array.isArray(data.media) ? data.media : [];
          renderFeaturedImageGrid(mediaItems);
        } catch (error) {
          console.error('Error loading media:', error);
          modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #f31260;">Error al cargar la biblioteca de medios</div>';
        }
      }

      // Handle image upload
      document.addEventListener('DOMContentLoaded', function() {
        const uploadInput = document.getElementById('featuredImageUploadInput');
        if (uploadInput) {
          uploadInput.addEventListener('change', async function(e) {
            const file = e.target.files?.[0];
            if (!file) return;

            const uploadProgress = document.getElementById('uploadProgress');
            uploadProgress.style.display = 'block';
            uploadProgress.textContent = 'Subiendo imagen...';

            try {
              const formData = new FormData();
              formData.append('file', file);

              const response = await fetch('${env.ADMIN_PATH}/media', {
                method: 'POST',
                body: formData,
                credentials: 'include'
              });

              if (!response.ok) throw new Error('Error al subir imagen');

              const result = await response.json();
              uploadProgress.textContent = '✓ Imagen subida exitosamente';

              // Reload media grid
              setTimeout(() => {
                uploadProgress.style.display = 'none';
                uploadProgress.textContent = '';
                uploadInput.value = '';
                openFeaturedImagePicker();
              }, 1000);

            } catch (error) {
              console.error('Upload error:', error);
              uploadProgress.textContent = '✗ Error al subir imagen';
              uploadProgress.style.color = '#f31260';
              setTimeout(() => {
                uploadProgress.style.display = 'none';
                uploadProgress.textContent = '';
                uploadProgress.style.color = '#167bff';
              }, 3000);
            }
          });
        }
      });

      function closeFeaturedImagePicker() {
        document.getElementById('featuredImageModal').style.display = 'none';
      }

      function renderFeaturedImageGrid(items) {
        const modalContent = document.getElementById('featuredImageModalContent');
        const images = items.filter(item => item.type === 'image');

        if (!images.length) {
          modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No hay imágenes disponibles</div>';
          return;
        }

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">';
        images.forEach(media => {
          html += \`
            <div
              onclick="selectFeaturedImage(\${media.id}, '\${media.url}')"
              style="position: relative; cursor: pointer; border-radius: 0.5rem; overflow: hidden; border: 2px solid transparent; transition: border-color 0.2s;"
              onmouseover="this.style.borderColor='#167bff'"
              onmouseout="this.style.borderColor='transparent'"
            >
              <div style="aspect-ratio: 1; background: #f3f4f6;">
                <img
                  src="\${media.url}"
                  alt="\${media.originalFilename || ''}"
                  style="width: 100%; height: 100%; object-fit: cover;"
                  loading="lazy"
                />
              </div>
            </div>
          \`;
        });
        html += '</div>';
        modalContent.innerHTML = html;
      }

      function selectFeaturedImage(id, url) {
        const previewDiv = document.getElementById('featuredImagePreview');
        const hiddenInput = document.getElementById('featuredImageId');

        hiddenInput.value = id;

        previewDiv.innerHTML = \`
          <img
            id="featuredImageImg"
            src="\${url}"
            alt="Imagen destacada"
            style="width: 100%; border-radius: 0.5rem; margin-bottom: 0.5rem;"
          />
          <button
            type="button"
            onclick="removeFeaturedImage()"
            style="width: 100%; padding: 0.5rem; background: #f31260; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
          >
            Eliminar imagen
          </button>
        \`;

        closeFeaturedImagePicker();
      }

      function removeFeaturedImage() {
        const previewDiv = document.getElementById('featuredImagePreview');
        const hiddenInput = document.getElementById('featuredImageId');

        hiddenInput.value = '';
        previewDiv.innerHTML = \`
          <div style="text-align: center; padding: 2rem; border: 2px dashed #dcdee0; border-radius: 0.5rem; color: #888;">
            No hay imagen seleccionada
          </div>
        \`;
      }

      // Close modal when clicking outside
      document.getElementById('featuredImageModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
          closeFeaturedImagePicker();
        }
      });

      // Add new category
      const newCategories = [];
      function addNewCategory() {
        const input = document.getElementById('newCategoryInput');
        const categoryName = input.value.trim();

        if (!categoryName) {
          alert('Por favor ingresa un nombre para la categoría');
          return;
        }

        // Add to temporary array
        newCategories.push(categoryName);

        // Update hidden input
        document.getElementById('newCategoriesData').value = JSON.stringify(newCategories);

        // Add visual feedback
        const checkboxList = input.closest('.nexus-card').querySelector('.checkbox-list');
        if (!checkboxList) {
          // Create checkbox list if it doesn't exist
          const paragraph = input.closest('.nexus-card').querySelector('p');
          if (paragraph) {
            const newList = document.createElement('div');
            newList.className = 'checkbox-list';
            newList.style.marginBottom = '1rem';
            paragraph.replaceWith(newList);
            checkboxList = newList;
          }
        }

        if (checkboxList) {
          const newItem = document.createElement('div');
          newItem.className = 'checkbox-item';
          newItem.style.background = '#e8f4ff';
          newItem.innerHTML = \`
            <input type="checkbox" checked disabled style="width: 18px; height: 18px;">
            <label style="font-size: 0.875rem; color: #1e2328;">\${categoryName} <em style="color: #167bff;">(nueva)</em></label>
          \`;
          checkboxList.appendChild(newItem);
        }

        // Clear input
        input.value = '';

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.textContent = '✓ Categoría agregada';
        successMsg.style.cssText = 'margin-top: 0.5rem; color: #00a651; font-size: 0.875rem;';
        input.parentElement.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      }

      // Add new tag
      const newTags = [];
      function addNewTag() {
        const input = document.getElementById('newTagInput');
        const tagName = input.value.trim();

        if (!tagName) {
          alert('Por favor ingresa un nombre para la etiqueta');
          return;
        }

        // Add to temporary array
        newTags.push(tagName);

        // Update hidden input
        document.getElementById('newTagsData').value = JSON.stringify(newTags);

        // Add visual feedback
        const checkboxList = input.closest('.nexus-card').querySelector('.checkbox-list');
        if (!checkboxList) {
          // Create checkbox list if it doesn't exist
          const paragraph = input.closest('.nexus-card').querySelector('p');
          if (paragraph) {
            const newList = document.createElement('div');
            newList.className = 'checkbox-list';
            newList.style.marginBottom = '1rem';
            paragraph.replaceWith(newList);
            checkboxList = newList;
          }
        }

        if (checkboxList) {
          const newItem = document.createElement('div');
          newItem.className = 'checkbox-item';
          newItem.style.background = '#e8f4ff';
          newItem.innerHTML = \`
            <input type="checkbox" checked disabled style="width: 18px; height: 18px;">
            <label style="font-size: 0.875rem; color: #1e2328;">\${tagName} <em style="color: #167bff;">(nueva)</em></label>
          \`;
          checkboxList.appendChild(newItem);
        }

        // Clear input
        input.value = '';

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.textContent = '✓ Etiqueta agregada';
        successMsg.style.cssText = 'margin-top: 0.5rem; color: #00a651; font-size: 0.875rem;';
        input.parentElement.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      }

      // Allow Enter key to add categories/tags
      document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('newCategoryInput')?.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            addNewCategory();
          }
        });

        document.getElementById('newTagInput')?.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            addNewTag();
          }
        });
      });
    </script>`);
};
