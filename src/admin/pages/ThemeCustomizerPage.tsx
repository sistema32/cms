import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

export interface CustomSetting {
  key: string;
  label: string;
  type: string;
  description?: string;
  options?: string[];
  group?: string;
  defaultValue?: unknown;
  value?: unknown;
  min?: number;
  max?: number;
  step?: number;
}

export interface ThemeCustomizerPageProps {
  user: {
    name: string | null;
    email: string;
  };
  themeName: string;
  themeDisplayName: string;
  customSettings: CustomSetting[];
  sessionId: string;
}

const toStringValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

export const ThemeCustomizerPage = (props: ThemeCustomizerPageProps) => {
  const {
    user,
    themeName,
    themeDisplayName,
    customSettings,
    sessionId,
  } = props;

  // Agrupar settings por grupo
  const groupedSettings = customSettings.reduce((acc, setting) => {
    const group = setting.group || "general";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(setting);
    return acc;
  }, {} as Record<string, CustomSetting[]>);

  const content = html`
    <style>
      .customizer-container {
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        background: #f8fafc;
      }

      .customizer-sidebar {
        width: 350px;
        background: white;
        border-right: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .customizer-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .customizer-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.5rem;
      }

      .customizer-subtitle {
        font-size: 0.875rem;
        color: #64748b;
      }

      .customizer-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }

      .setting-group {
        margin-bottom: 2rem;
      }

      .setting-group-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        margin-bottom: 1rem;
      }

      .setting-item {
        margin-bottom: 1.25rem;
      }

      .setting-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #334155;
        margin-bottom: 0.5rem;
      }

      .setting-description {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .setting-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }

      .setting-input:focus {
        outline: none;
        border-color: #3b82f6;
        ring: 2px;
        ring-color: rgba(59, 130, 246, 0.1);
      }

      .setting-color {
        height: 40px;
        cursor: pointer;
      }

      .setting-checkbox {
        width: 1rem;
        height: 1rem;
      }

      .setting-range {
        width: 100%;
      }

      .customizer-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .customizer-actions {
        display: flex;
        gap: 0.5rem;
      }

      .action-btn {
        flex: 1;
        padding: 0.625rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-publish {
        background: #3b82f6;
        color: white;
      }

      .btn-publish:hover {
        background: #2563eb;
      }

      .btn-secondary {
        background: #e2e8f0;
        color: #475569;
      }

      .btn-secondary:hover {
        background: #cbd5e1;
      }

      .history-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .customizer-preview {
        flex: 1;
        position: relative;
        overflow: hidden;
      }

      .preview-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
      }

      .preview-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .spinner {
        border: 3px solid #e2e8f0;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>

    <div class="customizer-container">
      <div class="customizer-sidebar">
        <div class="customizer-header">
          <h2 class="customizer-title">Personalizar theme</h2>
          <p class="customizer-subtitle">${themeDisplayName}</p>
        </div>

        <div class="customizer-body">
          <form id="customizer-form">
            <input type="hidden" name="session_id" value="${sessionId}" />
            <input type="hidden" name="theme" value="${themeName}" />

            ${Object.entries(groupedSettings).map(([group, settings]) => html`
              <div class="setting-group">
                <h3 class="setting-group-title">
                  ${group === "general" ? "General" : group}
                </h3>

                ${settings.map((setting) => {
                  const currentValue = setting.value ?? setting.defaultValue ?? "";

                  switch (setting.type) {
                    case "boolean": {
                      const isChecked = currentValue === true ||
                        currentValue === "true" ||
                        currentValue === 1 ||
                        currentValue === "1";
                      return html`
                        <div class="setting-item">
                          <label class="flex items-start gap-2">
                            <input
                              type="checkbox"
                              name="${setting.key}"
                              value="true"
                              class="setting-checkbox mt-1"
                              ${isChecked ? "checked" : ""}
                              onchange="updateSetting('${setting.key}', this.checked)"
                            />
                            <div>
                              <span class="setting-label">${setting.label}</span>
                              ${setting.description ? html`
                                <p class="setting-description">${setting.description}</p>
                              ` : ""}
                            </div>
                          </label>
                        </div>
                      `;
                    }

                    case "color": {
                      const colorValue = toStringValue(currentValue) || "#000000";
                      return html`
                        <div class="setting-item">
                          <label class="setting-label">${setting.label}</label>
                          <input
                            type="color"
                            name="${setting.key}"
                            value="${colorValue}"
                            class="setting-input setting-color"
                            onchange="updateSetting('${setting.key}', this.value)"
                          />
                          ${setting.description ? html`
                            <p class="setting-description">${setting.description}</p>
                          ` : ""}
                        </div>
                      `;
                    }

                    case "select": {
                      return html`
                        <div class="setting-item">
                          <label class="setting-label">${setting.label}</label>
                          <select
                            name="${setting.key}"
                            class="setting-input"
                            onchange="updateSetting('${setting.key}', this.value)"
                          >
                            ${(setting.options || []).map((option) => html`
                              <option
                                value="${option}"
                                ${toStringValue(option) === toStringValue(currentValue) ? "selected" : ""}
                              >
                                ${option}
                              </option>
                            `)}
                          </select>
                          ${setting.description ? html`
                            <p class="setting-description">${setting.description}</p>
                          ` : ""}
                        </div>
                      `;
                    }

                    case "range": {
                      return html`
                        <div class="setting-item">
                          <label class="setting-label">
                            ${setting.label}
                            <span id="${setting.key}_value" class="text-blue-600 font-mono text-xs ml-2">
                              ${toStringValue(currentValue)}
                            </span>
                          </label>
                          <input
                            type="range"
                            name="${setting.key}"
                            value="${toStringValue(currentValue)}"
                            min="${setting.min || 0}"
                            max="${setting.max || 100}"
                            step="${setting.step || 1}"
                            class="setting-range"
                            oninput="document.getElementById('${setting.key}_value').textContent = this.value"
                            onchange="updateSetting('${setting.key}', this.value)"
                          />
                          ${setting.description ? html`
                            <p class="setting-description">${setting.description}</p>
                          ` : ""}
                        </div>
                      `;
                    }

                    case "number": {
                      return html`
                        <div class="setting-item">
                          <label class="setting-label">${setting.label}</label>
                          <input
                            type="number"
                            name="${setting.key}"
                            value="${toStringValue(currentValue)}"
                            min="${setting.min || ''}"
                            max="${setting.max || ''}"
                            step="${setting.step || '1'}"
                            class="setting-input"
                            onchange="updateSetting('${setting.key}', this.value)"
                          />
                          ${setting.description ? html`
                            <p class="setting-description">${setting.description}</p>
                          ` : ""}
                        </div>
                      `;
                    }

                    case "textarea": {
                      return html`
                        <div class="setting-item">
                          <label class="setting-label">${setting.label}</label>
                          <textarea
                            name="${setting.key}"
                            rows="3"
                            class="setting-input"
                            onchange="updateSetting('${setting.key}', this.value)"
                          >${toStringValue(currentValue)}</textarea>
                          ${setting.description ? html`
                            <p class="setting-description">${setting.description}</p>
                          ` : ""}
                        </div>
                      `;
                    }

                    default: {
                      return html`
                        <div class="setting-item">
                          <label class="setting-label">${setting.label}</label>
                          <input
                            type="text"
                            name="${setting.key}"
                            value="${toStringValue(currentValue)}"
                            class="setting-input"
                            onchange="updateSetting('${setting.key}', this.value)"
                          />
                          ${setting.description ? html`
                            <p class="setting-description">${setting.description}</p>
                          ` : ""}
                        </div>
                      `;
                    }
                  }
                })}
              </div>
            `)}
          </form>
        </div>

        <div class="customizer-footer">
          <div class="history-actions">
            <button type="button" class="action-btn btn-secondary" onclick="undoChange()" id="btn-undo">
              ← Deshacer
            </button>
            <button type="button" class="action-btn btn-secondary" onclick="redoChange()" id="btn-redo">
              Rehacer →
            </button>
          </div>

          <div class="customizer-actions">
            <button type="button" class="action-btn btn-secondary" onclick="closeCustomizer()">
              Cancelar
            </button>
            <button type="button" class="action-btn btn-publish" onclick="publishChanges()">
              Publicar cambios
            </button>
          </div>
        </div>
      </div>

      <div class="customizer-preview">
        <div class="preview-loading" id="loading">
          <div class="spinner"></div>
          <p class="text-gray-600">Cargando preview...</p>
        </div>

        <iframe
          src="/"
          class="preview-iframe"
          id="preview-frame"
          onload="document.getElementById('loading').style.display='none'"
        ></iframe>
      </div>
    </div>

    <script>
      let changeHistory = [];
      let historyIndex = -1;

      function updateSetting(key, value) {
        // Agregar al historial
        changeHistory = changeHistory.slice(0, historyIndex + 1);
        changeHistory.push({ key, value });
        historyIndex++;

        // Actualizar preview
        reloadPreview();

        // Auto-save después de 2 segundos
        clearTimeout(window.autoSaveTimeout);
        window.autoSaveTimeout = setTimeout(() => {
          saveDraft();
        }, 2000);
      }

      function undoChange() {
        if (historyIndex > 0) {
          historyIndex--;
          applyHistoryState();
        }
      }

      function redoChange() {
        if (historyIndex < changeHistory.length - 1) {
          historyIndex++;
          applyHistoryState();
        }
      }

      function applyHistoryState() {
        // Apply all changes up to historyIndex
        reloadPreview();
      }

      function reloadPreview() {
        const iframe = document.getElementById('preview-frame');
        iframe.src = iframe.src; // Reload iframe
      }

      async function saveDraft() {
        const formData = new FormData(document.getElementById('customizer-form'));
        const data = Object.fromEntries(formData);

        try {
          await fetch('${env.ADMIN_PATH}/api/admin/themes/customizer/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          console.log('Draft saved');
        } catch (error) {
          console.error('Error saving draft:', error);
        }
      }

      async function publishChanges() {
        const formData = new FormData(document.getElementById('customizer-form'));

        try {
          const response = await fetch('${env.ADMIN_PATH}/appearance/themes/custom-settings', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            window.location.href = '${env.ADMIN_PATH}/appearance/themes?saved=1';
          } else {
            alert('Error al publicar los cambios');
          }
        } catch (error) {
          console.error('Error publishing changes:', error);
          alert('Error al publicar los cambios');
        }
      }

      function closeCustomizer() {
        if (confirm('¿Descartar los cambios no guardados?')) {
          window.location.href = '${env.ADMIN_PATH}/appearance/themes';
        }
      }
    </script>
  `;

  return AdminLayout({
    title: `Personalizar: ${themeDisplayName}`,
    children: content,
    activePage: "appearance.themes",
    user,
  });
};

export default ThemeCustomizerPage;
