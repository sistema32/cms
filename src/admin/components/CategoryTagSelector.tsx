import { html } from "hono/html";

interface CategoryTagSelectorProps {
  type: "category" | "tag";
  items: Array<{
    id: number;
    name: string;
    slug: string;
    parentId?: number | null;
  }>;
  selected: number[];
  fieldName: string;
}

export const CategoryTagSelector = (props: CategoryTagSelectorProps) => {
  const { type, items, selected, fieldName } = props;

  const isCategory = type === "category";
  const label = isCategory ? "Categorías" : "Etiquetas";
  const singularLabel = isCategory ? "Categoría" : "Etiqueta";
  const addButtonText = isCategory ? "+ Agregar nueva categoría" : "+ Agregar nueva etiqueta";

  const componentId = `${type}-selector-${fieldName}`;
  const formId = `${type}-form-${fieldName}`;

  return html`
    <div class="category-tag-selector">
      <h3 class="text-lg font-semibold mb-4">${label}</h3>

      <!-- List of items with checkboxes -->
      <div class="space-y-2 max-h-52 overflow-y-auto mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        ${items.length > 0 ? items.map((item) => html`
          <label class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
            <input
              type="checkbox"
              name="${fieldName}[]"
              value="${item.id}"
              class="form-checkbox"
              ${selected.includes(item.id) ? "checked" : ""}
            />
            <span class="text-sm">${item.name}</span>
          </label>
        `) : html`
          <p class="text-sm text-gray-500 dark:text-gray-400">
            No hay ${label.toLowerCase()} disponibles
          </p>
        `}
      </div>

      <!-- Add new button -->
      <button
        type="button"
        onclick="toggle${singularLabel}Form_${componentId}()"
        class="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
      >
        ${addButtonText}
      </button>

      <!-- Add new form (hidden by default) -->
      <div id="${formId}" class="hidden mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="space-y-3">
          <div>
            <label class="form-label text-sm">Nombre</label>
            <input
              type="text"
              id="${formId}-name"
              class="form-input text-sm"
              placeholder="Nombre de la ${singularLabel.toLowerCase()}"
              onkeyup="generateSlug_${componentId}()"
            />
          </div>

          <div>
            <label class="form-label text-sm">Slug</label>
            <input
              type="text"
              id="${formId}-slug"
              class="form-input text-sm"
              placeholder="url-amigable"
            />
          </div>

          ${isCategory ? html`
            <div>
              <label class="form-label text-sm">Categoría padre (opcional)</label>
              <select id="${formId}-parent" class="form-input text-sm">
                <option value="">Ninguna</option>
                ${items.filter(item => !item.parentId).map(item => html`
                  <option value="${item.id}">${item.name}</option>
                `)}
              </select>
            </div>
          ` : ""}

          <div class="flex gap-2">
            <button
              type="button"
              onclick="create${singularLabel}_${componentId}()"
              class="px-3 py-1.5 text-sm btn-action"
            >
              Agregar
            </button>
            <button
              type="button"
              onclick="toggle${singularLabel}Form_${componentId}()"
              class="px-3 py-1.5 text-sm btn-secondary"
            >
              Cancelar
            </button>
          </div>

          <!-- Error message -->
          <div id="${formId}-error" class="hidden text-sm text-red-600 dark:text-red-400"></div>
        </div>
      </div>

      <script>
        // Toggle form visibility
        function toggle${singularLabel}Form_${componentId}() {
          const form = document.getElementById('${formId}');
          const isHidden = form.classList.contains('hidden');

          if (isHidden) {
            form.classList.remove('hidden');
          } else {
            form.classList.add('hidden');
            // Clear form
            document.getElementById('${formId}-name').value = '';
            document.getElementById('${formId}-slug').value = '';
            ${isCategory ? `document.getElementById('${formId}-parent').value = '';` : ""}
            document.getElementById('${formId}-error').classList.add('hidden');
          }
        }

        // Generate slug from name
        function generateSlug_${componentId}() {
          const nameInput = document.getElementById('${formId}-name');
          const slugInput = document.getElementById('${formId}-slug');

          if (!slugInput.dataset.locked) {
            const slug = nameInput.value
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\\u0300-\\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            slugInput.value = slug;
          }
        }

        // Lock slug if manually edited
        document.getElementById('${formId}-slug').addEventListener('input', function() {
          this.dataset.locked = this.value.length > 0 ? 'true' : '';
        });

        // Create new category/tag
        async function create${singularLabel}_${componentId}() {
          const nameInput = document.getElementById('${formId}-name');
          const slugInput = document.getElementById('${formId}-slug');
          const errorDiv = document.getElementById('${formId}-error');
          ${isCategory ? `const parentInput = document.getElementById('${formId}-parent');` : ""}

          const name = nameInput.value.trim();
          const slug = slugInput.value.trim();
          ${isCategory ? `const parentId = parentInput.value ? parseInt(parentInput.value) : null;` : ""}

          // Validation
          if (!name) {
            errorDiv.textContent = 'El nombre es obligatorio';
            errorDiv.classList.remove('hidden');
            return;
          }

          if (!slug) {
            errorDiv.textContent = 'El slug es obligatorio';
            errorDiv.classList.remove('hidden');
            return;
          }

          // Prepare data
          const data = {
            name,
            slug,
            ${isCategory ? `parentId: parentId || null,` : ""}
          };

          try {
            const response = await fetch('/api/${type === "category" ? "categories" : "tags"}', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || error.message || 'Error al crear ${singularLabel.toLowerCase()}');
            }

            const result = await response.json();
            const new${singularLabel} = result.${type === "category" ? "category" : "tag"};

            // Add to list
            const listContainer = document.querySelector('#${componentId} .space-y-2');
            const newCheckbox = document.createElement('label');
            newCheckbox.className = 'flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded';
            newCheckbox.innerHTML = \`
              <input
                type="checkbox"
                name="${fieldName}[]"
                value="\${new${singularLabel}.id}"
                class="form-checkbox"
                checked
              />
              <span class="text-sm">\${new${singularLabel}.name}</span>
            \`;

            // Remove "no items" message if exists
            const noItemsMsg = listContainer.querySelector('.text-gray-500');
            if (noItemsMsg) {
              noItemsMsg.remove();
            }

            listContainer.appendChild(newCheckbox);

            // Reset and hide form
            nameInput.value = '';
            slugInput.value = '';
            ${isCategory ? `parentInput.value = '';` : ""}
            slugInput.dataset.locked = '';
            errorDiv.classList.add('hidden');
            document.getElementById('${formId}').classList.add('hidden');

            // Show success message (optional)
            console.log('${singularLabel} creada exitosamente:', new${singularLabel});
          } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
          }
        }
      </script>
    </div>
  `;
};

export default CategoryTagSelector;
