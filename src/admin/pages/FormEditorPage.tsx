import { html, raw } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface FormEditorPageProps {
  user: {
    name: string | null;
    email: string;
  };
  form?: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    status: string;
    settings?: any;
    fields: Array<{
      id: number;
      type: string;
      label: string;
      name: string;
      placeholder?: string;
      helpText?: string;
      required: boolean;
      options?: string;
      orderIndex: number;
    }>;
  };
  isNew: boolean;
  errors?: Record<string, string>;
}

export const FormEditorPage = (props: FormEditorPageProps) => {
  const { user, form, isNew, errors = {} } = props;
  const adminPath = env.ADMIN_PATH;

  const pageTitle = isNew ? "Nuevo Formulario" : "Editar Formulario";
  const formAction = isNew
    ? `${adminPath}/forms/new`
    : `${adminPath}/forms/edit/${form!.id}`;

  const fieldTypes = [
    { value: "text", label: "Texto" },
    { value: "email", label: "Email" },
    { value: "tel", label: "Teléfono" },
    { value: "number", label: "Número" },
    { value: "textarea", label: "Texto Largo" },
    { value: "select", label: "Lista Desplegable" },
    { value: "radio", label: "Opción Única" },
    { value: "checkbox", label: "Opción Múltiple" },
    { value: "file", label: "Archivo" },
    { value: "date", label: "Fecha" },
  ];

  const content = html`
    <style>
      .page-header-nexus {
        margin-bottom: 2rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle-nexus {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        margin: 0;
      }

      .form-layout {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      @media (max-width: 1280px) {
        .form-layout {
          grid-template-columns: 1fr;
        }
      }

      .form-field {
        margin-bottom: 1.5rem;
      }

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .form-input,
      .form-textarea,
      .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .form-textarea {
        min-height: 100px;
        font-family: inherit;
        resize: vertical;
      }

      .form-input:focus,
      .form-textarea:focus,
      .form-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .form-hint {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-top: 0.5rem;
      }

      .form-error {
        color: var(--nexus-error, #f31260);
        font-size: 0.8125rem;
        margin-top: 0.5rem;
      }

      .nexus-card {
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .nexus-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
        cursor: pointer;
        border: none;
        text-decoration: none;
      }

      .nexus-btn-primary {
        background: var(--nexus-primary, #167bff);
        color: #ffffff;
      }

      .nexus-btn-primary:hover {
        background: var(--nexus-primary-focus, #0d5fd9);
      }

      .nexus-btn-secondary {
        background: var(--nexus-base-200, #eef0f2);
        color: var(--nexus-base-content, #1e2328);
      }

      .nexus-btn-secondary:hover {
        background: var(--nexus-base-300, #dcdee0);
      }

      .status-radio-group {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.75rem;
      }

      .status-radio-option {
        position: relative;
      }

      .status-radio-option input[type="radio"] {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .status-radio-option label {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem;
        border: 2px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .status-radio-option input[type="radio"]:checked + label {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.08);
        color: var(--nexus-primary, #167bff);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .field-item {
        padding: 1rem;
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        margin-bottom: 0.75rem;
        background: var(--nexus-base-50, #f9fafb);
      }

      .field-item:hover {
        border-color: var(--nexus-base-300, #dcdee0);
      }
    </style>

    <div class="page-header-nexus">
      <h1 class="page-title-nexus">${pageTitle}</h1>
      <p class="page-subtitle-nexus">
        ${isNew ? "Crea un nuevo formulario personalizado con sus campos" : "Actualiza la configuración del formulario"}
      </p>
    </div>

    <form method="POST" action="${formAction}" id="mainForm">
      <div class="form-layout">
        <!-- Main Content -->
        <div>
          <div class="nexus-card">
            <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 1.5rem 0;">Información del Formulario</h3>

            <!-- Name -->
            <div class="form-field">
              <label class="form-label">Nombre del Formulario *</label>
              <input
                type="text"
                name="name"
                value="${form?.name || ''}"
                placeholder="Formulario de Contacto"
                class="form-input"
                required
              />
              ${errors.name ? html`<p class="form-error">${errors.name}</p>` : ''}
            </div>

            <!-- Slug -->
            <div class="form-field">
              <label class="form-label">Slug *</label>
              <input
                type="text"
                name="slug"
                value="${form?.slug || ''}"
                placeholder="contacto"
                class="form-input"
                required
              />
              <p class="form-hint">URL: /api/forms/public/<span id="slugPreview">${form?.slug || 'contacto'}</span></p>
              ${errors.slug ? html`<p class="form-error">${errors.slug}</p>` : ''}
            </div>

            <!-- Description -->
            <div class="form-field">
              <label class="form-label">Descripción</label>
              <textarea
                name="description"
                rows="3"
                placeholder="Descripción opcional del formulario"
                class="form-textarea"
              >${form?.description || ''}</textarea>
              <p class="form-hint">Opcional. Ayuda a identificar el propósito del formulario</p>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="nexus-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Campos del Formulario</h3>
              <button type="button" onclick="openFieldModal()" class="nexus-btn nexus-btn-primary">
                Agregar Campo
              </button>
            </div>

            <div id="fieldsList">
              ${!form || form.fields.length === 0 ? html`
                <div id="emptyState" style="text-align: center; padding: 3rem 1rem; opacity: 0.6;">
                  <p style="margin: 0;">No hay campos agregados. Haz clic en "Agregar Campo" para comenzar.</p>
                </div>
              ` : html`
                ${form.fields.map((field, index) => html`
                  <div class="field-item" data-field-index="${index}">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                      <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${field.label}</div>
                        <div style="font-size: 0.875rem; opacity: 0.6;">
                          Tipo: ${field.type} • Nombre: ${field.name}
                          ${field.required ? ' • Requerido' : ''}
                        </div>
                        ${field.helpText ? html`
                          <div style="font-size: 0.8125rem; opacity: 0.5; margin-top: 0.25rem;">${field.helpText}</div>
                        ` : ''}
                      </div>
                      <div style="display: flex; gap: 0.5rem;">
                        <button type="button" onclick="editFieldAtIndex(${index})" style="padding: 0.5rem; border: none; background: transparent; cursor: pointer; opacity: 0.6;" title="Editar">
                          <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                          </svg>
                        </button>
                        <button type="button" onclick="removeFieldAtIndex(${index})" style="padding: 0.5rem; border: none; background: transparent; cursor: pointer; color: #dc2626; opacity: 0.6;" title="Eliminar">
                          <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <input type="hidden" name="fields[${index}][type]" value="${field.type}" />
                    <input type="hidden" name="fields[${index}][label]" value="${field.label}" />
                    <input type="hidden" name="fields[${index}][name]" value="${field.name}" />
                    <input type="hidden" name="fields[${index}][placeholder]" value="${field.placeholder || ''}" />
                    <input type="hidden" name="fields[${index}][helpText]" value="${field.helpText || ''}" />
                    <input type="hidden" name="fields[${index}][required]" value="${field.required}" />
                    <input type="hidden" name="fields[${index}][options]" value="${field.options || ''}" />
                  </div>
                `)}
              `}
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div>
          <div class="nexus-card">
            <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 1rem 0;">Configuración</h3>

            <!-- Status -->
            <div class="form-field" style="margin-bottom: 0;">
              <label class="form-label">Estado</label>
              <div class="status-radio-group">
                <div class="status-radio-option">
                  <input
                    type="radio"
                    id="status-active"
                    name="status"
                    value="active"
                    ${!form || form.status === 'active' ? 'checked' : ''}
                  />
                  <label for="status-active">Activo</label>
                </div>
                <div class="status-radio-option">
                  <input
                    type="radio"
                    id="status-inactive"
                    name="status"
                    value="inactive"
                    ${form?.status === 'inactive' ? 'checked' : ''}
                  />
                  <label for="status-inactive">Inactivo</label>
                </div>
                <div class="status-radio-option">
                  <input
                    type="radio"
                    id="status-archived"
                    name="status"
                    value="archived"
                    ${form?.status === 'archived' ? 'checked' : ''}
                  />
                  <label for="status-archived">Archivado</label>
                </div>
              </div>
            </div>
          </div>

          ${!isNew && form ? html`
            <div class="nexus-card">
              <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 1rem 0;">Integración</h3>
              
              <div style="margin-bottom: 1rem;">
                <label class="form-label">Endpoint Público</label>
                <div style="display: flex; gap: 0.5rem;">
                  <input 
                    type="text" 
                    value="/api/forms/public/${form.slug}" 
                    readonly 
                    class="form-input" 
                    style="flex: 1; font-family: monospace; font-size: 0.8125rem;"
                    onclick="this.select()"
                  />
                  <button 
                    type="button" 
                    onclick="copyToClipboard('/api/forms/public/${form.slug}')"
                    class="nexus-btn nexus-btn-secondary"
                    style="padding: 0.75rem;"
                    title="Copiar"
                  >
                    <svg style="width: 1.125rem; height: 1.125rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
                <p class="form-hint">GET - Obtiene la estructura del formulario</p>
              </div>

              <div style="margin-bottom: 1rem;">
                <label class="form-label">Endpoint de Envío</label>
                <div style="display: flex; gap: 0.5rem;">
                  <input 
                    type="text" 
                    value="/api/forms/${form.id}/submit" 
                    readonly 
                    class="form-input" 
                    style="flex: 1; font-family: monospace; font-size: 0.8125rem;"
                    onclick="this.select()"
                  />
                  <button 
                    type="button" 
                    onclick="copyToClipboard('/api/forms/${form.id}/submit')"
                    class="nexus-btn nexus-btn-secondary"
                    style="padding: 0.75rem;"
                    title="Copiar"
                  >
                    <svg style="width: 1.125rem; height: 1.125rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
                <p class="form-hint">POST - Envía los datos del formulario</p>
              </div>

              <div style="padding: 1rem; background: var(--nexus-base-50, #f9fafb); border-radius: var(--nexus-radius-md, 0.5rem); margin-bottom: 1rem;">
                <div style="font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.5rem;">Shortcode (próximamente)</div>
                <code style="font-size: 0.8125rem; color: var(--nexus-base-content, #1e2328); opacity: 0.8;">[form slug="${form.slug}"]</code>
              </div>

              <a 
                href="${adminPath}/forms/${form.id}/submissions" 
                class="nexus-btn nexus-btn-secondary" 
                style="width: 100%; justify-content: center; text-decoration: none;"
              >
                <svg style="width: 1.125rem; height: 1.125rem;" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                </svg>
                Ver Respuestas
              </a>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Form Actions -->
      <div class="nexus-card">
        <div class="form-actions">
          <a href="${adminPath}/forms" class="nexus-btn nexus-btn-secondary">
            Cancelar
          </a>
          <button type="submit" class="nexus-btn nexus-btn-primary">
            ${isNew ? 'Crear Formulario' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </form>

    <!-- Field Modal -->
    <div id="fieldModal" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 50; align-items: center; justify-content: center;">
      <div style="background: var(--nexus-base-100, #fff); border-radius: var(--nexus-radius-lg, 0.75rem); padding: 2rem; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;" id="fieldModalTitle">Agregar Campo</h3>
        
        <div id="fieldModalForm">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-field">
              <label class="form-label">Tipo de Campo *</label>
              <select id="modalFieldType" class="form-select" required>
                ${fieldTypes.map(type => html`
                  <option value="${type.value}">${type.label}</option>
                `)}
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Nombre del Campo *</label>
              <input type="text" id="modalFieldName" class="form-input" placeholder="nombre_campo" required />
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">Etiqueta *</label>
            <input type="text" id="modalFieldLabel" class="form-input" placeholder="Nombre Completo" required />
          </div>

          <div class="form-field">
            <label class="form-label">Placeholder</label>
            <input type="text" id="modalFieldPlaceholder" class="form-input" placeholder="Ingresa tu nombre..." />
          </div>

          <div class="form-field">
            <label class="form-label">Texto de Ayuda</label>
            <input type="text" id="modalFieldHelpText" class="form-input" placeholder="Información adicional" />
          </div>

          <div class="form-field" id="modalFieldOptionsContainer" style="display:none;">
            <label class="form-label">Opciones (una por línea)</label>
            <textarea id="modalFieldOptions" class="form-textarea" rows="4" placeholder="Opción 1\nOpción 2\nOpción 3"></textarea>
          </div>

          <div class="form-field">
            <label style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: var(--nexus-base-100, #fff); border: 1px solid var(--nexus-base-200, #eef0f2); border-radius: var(--nexus-radius-md, 0.5rem); cursor: pointer;">
              <input type="checkbox" id="modalFieldRequired" style="width: 20px; height: 20px; border: 2px solid var(--nexus-base-300, #dcdee0); border-radius: var(--nexus-radius-sm, 0.25rem); cursor: pointer;" />
              <span style="font-size: 0.875rem; font-weight: 500;">Campo requerido</span>
            </label>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" onclick="closeFieldModal()" class="nexus-btn nexus-btn-secondary">Cancelar</button>
            <button type="button" onclick="saveField()" class="nexus-btn nexus-btn-primary">Guardar Campo</button>
          </div>
        </div>
      </div>
    </div>

    ${raw(`
      <script>
        const ADMIN_PATH = ${JSON.stringify(adminPath)};
        const IS_NEW = ${isNew};
        
        // Initialize fields array from existing form data
        let fields = ${form?.fields ? JSON.stringify(form.fields.map(f => ({
    type: f.type,
    label: f.label,
    name: f.name,
    placeholder: f.placeholder || '',
    helpText: f.helpText || '',
    required: f.required,
    options: f.options || ''
  }))) : '[]'};
        
        let editingIndex = null;

        // Auto-generate slug from name
        document.addEventListener('DOMContentLoaded', function() {
          const nameInput = document.querySelector('input[name="name"]');
          const slugInput = document.querySelector('input[name="slug"]');
          const slugPreview = document.getElementById('slugPreview');

          if (nameInput && slugInput) {
            nameInput.addEventListener('input', function() {
              if (!slugInput.dataset.manuallyEdited) {
                const slug = nameInput.value
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\\u0300-\\u036f]/g, '')
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '');
                slugInput.value = slug;
                if (slugPreview) {
                  slugPreview.textContent = slug || 'contacto';
                }
              }
            });

            slugInput.addEventListener('input', function() {
              slugInput.dataset.manuallyEdited = 'true';
              if (slugPreview) {
                slugPreview.textContent = slugInput.value || 'contacto';
              }
            });
          }

          // Field type change handler
          const fieldType = document.getElementById('modalFieldType');
          if (fieldType) {
            fieldType.addEventListener('change', updateFieldOptions);
          }
        });

        // Copy to clipboard function
        function copyToClipboard(text) {
          navigator.clipboard.writeText(text).then(function() {
            alert('Copiado al portapapeles: ' + text);
          }, function(err) {
            console.error('Error al copiar:', err);
          });
        }

        // Field management functions
        function openFieldModal() {
          const modal = document.getElementById('fieldModal');
          const title = document.getElementById('fieldModalTitle');
          
          if (modal && title) {
            title.textContent = 'Agregar Campo';
            editingIndex = null;
            
            // Reset form
            document.getElementById('modalFieldType').value = 'text';
            document.getElementById('modalFieldName').value = '';
            document.getElementById('modalFieldLabel').value = '';
            document.getElementById('modalFieldPlaceholder').value = '';
            document.getElementById('modalFieldHelpText').value = '';
            document.getElementById('modalFieldOptions').value = '';
            document.getElementById('modalFieldRequired').checked = false;
            
            updateFieldOptions();
            modal.style.display = 'flex';
          }
        }

        function closeFieldModal() {
          const modal = document.getElementById('fieldModal');
          if (modal) {
            modal.style.display = 'none';
          }
        }

        function updateFieldOptions() {
          const type = document.getElementById('modalFieldType');
          const optionsContainer = document.getElementById('modalFieldOptionsContainer');
          if (type && optionsContainer) {
            optionsContainer.style.display = ['select', 'radio', 'checkbox'].includes(type.value) ? 'block' : 'none';
          }
        }

        function saveField() {
          const field = {
            type: document.getElementById('modalFieldType').value,
            label: document.getElementById('modalFieldLabel').value,
            name: document.getElementById('modalFieldName').value,
            placeholder: document.getElementById('modalFieldPlaceholder').value,
            helpText: document.getElementById('modalFieldHelpText').value,
            required: document.getElementById('modalFieldRequired').checked,
            options: document.getElementById('modalFieldOptions').value
          };

          if (!field.label || !field.name) {
            alert('Por favor completa los campos requeridos');
            return;
          }

          if (editingIndex !== null) {
            fields[editingIndex] = field;
          } else {
            fields.push(field);
          }

          renderFields();
          closeFieldModal();
        }

        function editFieldAtIndex(index) {
          const field = fields[index];
          const modal = document.getElementById('fieldModal');
          const title = document.getElementById('fieldModalTitle');
          
          if (modal && title && field) {
            title.textContent = 'Editar Campo';
            editingIndex = index;
            
            document.getElementById('modalFieldType').value = field.type;
            document.getElementById('modalFieldName').value = field.name;
            document.getElementById('modalFieldLabel').value = field.label;
            document.getElementById('modalFieldPlaceholder').value = field.placeholder || '';
            document.getElementById('modalFieldHelpText').value = field.helpText || '';
            document.getElementById('modalFieldOptions').value = field.options || '';
            document.getElementById('modalFieldRequired').checked = field.required;
            
            updateFieldOptions();
            modal.style.display = 'flex';
          }
        }

        function removeFieldAtIndex(index) {
          if (confirm('¿Eliminar este campo?')) {
            fields.splice(index, 1);
            renderFields();
          }
        }

        function renderFields() {
          const container = document.getElementById('fieldsList');
          const emptyState = document.getElementById('emptyState');
          
          if (fields.length === 0) {
            container.innerHTML = '<div id="emptyState" style="text-align: center; padding: 3rem 1rem; opacity: 0.6;"><p style="margin: 0;">No hay campos agregados. Haz clic en "Agregar Campo" para comenzar.</p></div>';
            return;
          }

          container.innerHTML = fields.map((field, index) => \`
            <div class="field-item" data-field-index="\${index}">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="font-weight: 600; margin-bottom: 0.25rem;">\${field.label}</div>
                  <div style="font-size: 0.875rem; opacity: 0.6;">
                    Tipo: \${field.type} • Nombre: \${field.name}
                    \${field.required ? ' • Requerido' : ''}
                  </div>
                  \${field.helpText ? \`<div style="font-size: 0.8125rem; opacity: 0.5; margin-top: 0.25rem;">\${field.helpText}</div>\` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button type="button" onclick="editFieldAtIndex(\${index})" style="padding: 0.5rem; border: none; background: transparent; cursor: pointer; opacity: 0.6;" title="Editar">
                    <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </button>
                  <button type="button" onclick="removeFieldAtIndex(\${index})" style="padding: 0.5rem; border: none; background: transparent; cursor: pointer; color: #dc2626; opacity: 0.6;" title="Eliminar">
                    <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <input type="hidden" name="fields[\${index}][type]" value="\${field.type}" />
              <input type="hidden" name="fields[\${index}][label]" value="\${field.label}" />
              <input type="hidden" name="fields[\${index}][name]" value="\${field.name}" />
              <input type="hidden" name="fields[\${index}][placeholder]" value="\${field.placeholder || ''}" />
              <input type="hidden" name="fields[\${index}][helpText]" value="\${field.helpText || ''}" />
              <input type="hidden" name="fields[\${index}][required]" value="\${field.required}" />
              <input type="hidden" name="fields[\${index}][options]" value="\${field.options || ''}" />
            </div>
          \`).join('');
        }

        // Close modal when clicking outside
        document.addEventListener('click', function(e) {
          const modal = document.getElementById('fieldModal');
          if (modal && e.target === modal) {
            closeFieldModal();
          }
        });
      </script>
    `)}
  `;

  return AdminLayout({
    title: pageTitle,
    children: content,
    activePage: "forms",
    user,
  });
};

export default FormEditorPage;
