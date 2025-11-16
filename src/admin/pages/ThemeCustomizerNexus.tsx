import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
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

export interface ThemeCustomizerNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  themeName: string;
  themeDisplayName: string;
  customSettings: CustomSetting[];
  sessionId: string;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
}

// XSS safe - helper function
const toStringValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

export const ThemeCustomizerNexusPage = (props: ThemeCustomizerNexusPageProps) => {
  const {
    user,
    themeName,
    themeDisplayName,
    customSettings,
    sessionId,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  // XSS safe - group settings
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
      /* ========== CUSTOMIZER CONTAINER ========== */
      .customizer-container {
        position: fixed;
        top: 144px;
        left: 280px;
        right: 0;
        bottom: 0;
        display: flex;
        background: var(--nexus-root-bg);
      }

      @media (max-width: 1024px) {
        .customizer-container {
          left: 0;
          top: 132px;
        }
      }

      /* ========== SIDEBAR ========== */
      .customizer-sidebar {
        width: 360px;
        background: var(--nexus-base-100);
        border-right: 1px solid var(--nexus-base-300);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .customizer-sidebar {
          width: 100%;
        }
      }

      .customizer-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--nexus-base-200);
      }

      .customizer-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--nexus-base-content);
        margin-bottom: 0.5rem;
      }

      .customizer-subtitle {
        font-size: 0.875rem;
        color: var(--nexus-base-content);
        opacity: 0.6;
      }

      .customizer-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }

      .customizer-body::-webkit-scrollbar {
        width: 6px;
      }

      .customizer-body::-webkit-scrollbar-track {
        background: transparent;
      }

      .customizer-body::-webkit-scrollbar-thumb {
        background: var(--nexus-base-300);
        border-radius: 3px;
      }

      /* ========== SETTINGS ========== */
      .setting-group {
        margin-bottom: 2rem;
      }

      .setting-group-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nexus-base-content);
        opacity: 0.6;
        margin-bottom: 1rem;
      }

      .setting-item {
        margin-bottom: 1.25rem;
      }

      .setting-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nexus-base-content);
        margin-bottom: 0.5rem;
      }

      .setting-description {
        font-size: 0.75rem;
        color: var(--nexus-base-content);
        opacity: 0.5;
        margin-top: 0.25rem;
      }

      .setting-input,
      .setting-select,
      .setting-textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-md);
        font-size: 0.875rem;
        background: var(--nexus-base-100);
        color: var(--nexus-base-content);
        transition: all 0.2s;
      }

      .setting-input:focus,
      .setting-select:focus,
      .setting-textarea:focus {
        outline: none;
        border-color: var(--nexus-primary);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .setting-color {
        height: 40px;
        cursor: pointer;
      }

      .setting-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .setting-range {
        width: 100%;
      }

      /* ========== FOOTER ========== */
      .customizer-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--nexus-base-200);
        background: var(--nexus-base-100);
      }

      .history-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .customizer-actions {
        display: flex;
        gap: 0.5rem;
      }

      /* ========== PREVIEW ========== */
      .customizer-preview {
        flex: 1;
        position: relative;
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .customizer-preview {
          display: none;
        }
      }

      .preview-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: var(--nexus-base-100);
      }

      .preview-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .preview-loading.hidden {
        display: none;
      }

      .spinner {
        border: 3px solid var(--nexus-base-300);
        border-top: 3px solid var(--nexus-primary);
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
                          <label style="display: flex; align-items: start; gap: 0.75rem;">
                            <input
                              type="checkbox"
                              name="${setting.key}"
                              value="true"
                              class="setting-checkbox"
                              ${isChecked ? "checked" : ""}
                              data-setting-key="${setting.key}"
                            />
                            <div style="flex: 1;">
                              <span class="setting-label" style="margin: 0;">${setting.label}</span>
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
                            data-setting-key="${setting.key}"
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
                            class="setting-select"
                            data-setting-key="${setting.key}"
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
                            <span id="${setting.key}_value" style="margin-left: 0.5rem; font-family: monospace; color: var(--nexus-primary);">
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
                            data-setting-key="${setting.key}"
                            data-value-display="${setting.key}_value"
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
                            data-setting-key="${setting.key}"
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
                            class="setting-textarea"
                            data-setting-key="${setting.key}"
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
                            data-setting-key="${setting.key}"
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
            ${NexusButton({
              label: "Deshacer",
              type: "outline",
              size: "sm",
              fullWidth: true,
              dataAttributes: { "data-action": "undo" }
            })}
            ${NexusButton({
              label: "Rehacer",
              type: "outline",
              size: "sm",
              fullWidth: true,
              dataAttributes: { "data-action": "redo" }
            })}
          </div>

          <div class="customizer-actions">
            ${NexusButton({
              label: "Cancelar",
              type: "outline",
              size: "sm",
              fullWidth: true,
              dataAttributes: { "data-action": "close" }
            })}
            ${NexusButton({
              label: "Publicar cambios",
              type: "primary",
              size: "sm",
              fullWidth: true,
              dataAttributes: { "data-action": "publish" }
            })}
          </div>
        </div>
      </div>

      <div class="customizer-preview">
        <div class="preview-loading" id="loading">
          <div class="spinner"></div>
          <p style="color: var(--nexus-base-content); opacity: 0.6;">Cargando preview...</p>
        </div>

        <iframe
          src="/"
          class="preview-iframe"
          id="preview-frame"
          title="Vista previa personalizada"
        ></iframe>
      </div>
    </div>

    ${raw(`<script>
      // XSS safe - event handlers in addEventListener
      document.addEventListener('DOMContentLoaded', function() {
        let changeHistory = [];
        let historyIndex = -1;
        let autoSaveTimeout = null;

        const iframe = document.getElementById('preview-frame');
        const loading = document.getElementById('loading');
        const form = document.getElementById('customizer-form');

        // XSS safe - iframe load handler
        if (iframe) {
          iframe.addEventListener('load', function() {
            if (loading) {
              loading.classList.add('hidden');
            }
          });
        }

        // XSS safe - setting change handlers
        const settingInputs = document.querySelectorAll('[data-setting-key]');
        settingInputs.forEach(input => {
          const eventType = input.type === 'range' ? 'input' : 'change';

          input.addEventListener(eventType, function() {
            const key = this.getAttribute('data-setting-key');
            const value = this.type === 'checkbox' ? this.checked : this.value;

            // XSS safe - update range display
            if (this.type === 'range') {
              const displayId = this.getAttribute('data-value-display');
              if (displayId) {
                const display = document.getElementById(displayId);
                if (display) {
                  // XSS safe - using textContent
                  display.textContent = this.value;
                }
              }
            }

            // Add to history
            changeHistory = changeHistory.slice(0, historyIndex + 1);
            changeHistory.push({ key: key, value: value });
            historyIndex++;

            // Reload preview
            reloadPreview();

            // Auto-save after 2 seconds
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(saveDraft, 2000);
          });
        });

        // XSS safe - action buttons
        document.addEventListener('click', function(e) {
          const btn = e.target.closest('[data-action]');
          if (!btn) return;

          const action = btn.getAttribute('data-action');

          if (action === 'undo') {
            if (historyIndex > 0) {
              historyIndex--;
              reloadPreview();
            }
          } else if (action === 'redo') {
            if (historyIndex < changeHistory.length - 1) {
              historyIndex++;
              reloadPreview();
            }
          } else if (action === 'close') {
            if (confirm('¿Descartar los cambios no guardados?')) {
              window.location.href = '${adminPath}/appearance/themes';
            }
          } else if (action === 'publish') {
            publishChanges();
          }
        });

        // XSS safe - reload preview function
        function reloadPreview() {
          if (iframe && loading) {
            loading.classList.remove('hidden');
            iframe.src = iframe.src;
          }
        }

        // XSS safe - save draft function
        async function saveDraft() {
          if (!form) return;

          const formData = new FormData(form);
          const data = Object.fromEntries(formData);

          try {
            await fetch('${adminPath}/api/admin/themes/customizer/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            console.log('Draft saved');
          } catch (error) {
            console.error('Error saving draft:', error);
          }
        }

        // XSS safe - publish function
        async function publishChanges() {
          if (!form) return;

          const formData = new FormData(form);

          try {
            const response = await fetch('${adminPath}/appearance/themes/custom-settings', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              window.location.href = '${adminPath}/appearance/themes?saved=1';
            } else {
              alert('Error al publicar los cambios');
            }
          } catch (error) {
            console.error('Error publishing changes:', error);
            alert('Error al publicar los cambios');
          }
        }
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: `Personalizar: ${themeDisplayName}`,
    children: content,
    activePage: "appearance.themes",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default ThemeCustomizerNexusPage;
