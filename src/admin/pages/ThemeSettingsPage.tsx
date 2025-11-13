import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface ThemeCustomSetting {
  key: string;
  label: string;
  type: string;
  description?: string;
  options?: string[];
  group?: string;
  defaultValue?: unknown;
  value?: unknown;
}

interface ThemeInfo {
  name: string;
  displayName?: string;
  version?: string;
  description?: string;
  author?: {
    name?: string;
    url?: string;
  };
  screenshots?: {
    desktop?: string;
    mobile?: string;
  };
}

interface ThemeSettingsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  theme: ThemeInfo;
  customSettings: ThemeCustomSetting[];
  settingsSaved?: boolean;
}

const toStringValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

export const ThemeSettingsPage = (props: ThemeSettingsPageProps) => {
  const { user, theme, customSettings = [], settingsSaved = false } = props;

  const groupedCustomSettings = customSettings.reduce(
    (acc, setting) => {
      const group = setting.group || "general";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(setting);
      return acc;
    },
    {} as Record<string, ThemeCustomSetting[]>
  );

  const content = html`
    <style>
      .theme-header-card {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
        border: 1px solid rgba(124, 58, 237, 0.2);
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
      }

      .dark .theme-header-card {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
        border-color: rgba(124, 58, 237, 0.3);
      }

      .settings-section {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 1.5rem;
      }

      .dark .settings-section {
        background: rgba(30, 41, 59, 0.78);
        border-color: rgba(148, 163, 184, 0.16);
      }

      .settings-group-title {
        font-size: 0.875rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(124, 58, 237, 0.8);
        margin-bottom: 1.5rem;
        font-weight: 600;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid rgba(124, 58, 237, 0.2);
      }

      .dark .settings-group-title {
        color: rgba(167, 139, 250, 0.9);
      }

      .settings-grid {
        display: grid;
        gap: 1.5rem;
      }

      @media (min-width: 768px) {
        .settings-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      .success-notice {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-radius: 0.9rem;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.2);
        color: rgba(4, 120, 87, 0.95);
        margin-bottom: 1.5rem;
        animation: slideIn 0.3s ease;
      }

      .dark .success-notice {
        background: rgba(16, 185, 129, 0.18);
        border-color: rgba(16, 185, 129, 0.28);
        color: rgba(167, 243, 208, 0.92);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .action-buttons {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(148, 163, 184, 0.25);
      }

      .dark .action-buttons {
        border-color: rgba(148, 163, 184, 0.16);
      }
    </style>

    <div class="page-header">
      <h1 class="page-title">Configuración del Theme</h1>
      <div class="page-actions">
        <a href="${env.ADMIN_PATH}/appearance/themes/browser" class="btn-secondary">
          Explorar themes
        </a>
        <a href="${env.ADMIN_PATH}/appearance/themes/editor?theme=${theme.name}" class="btn-secondary">
          Editar código
        </a>
      </div>
    </div>

    ${settingsSaved
      ? html`
        <div class="success-notice">
          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293A1 1 0 106.293 10.707l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>Los ajustes del theme se guardaron correctamente.</span>
        </div>
      `
      : ""}

    <div class="theme-header-card">
      <div class="flex items-start gap-4">
        ${theme.screenshots?.desktop
          ? html`
            <img
              src="${theme.screenshots.desktop}"
              alt="${theme.displayName || theme.name}"
              class="w-32 h-20 object-cover rounded-lg shadow-md"
            />
          `
          : ""}
        <div class="flex-1">
          <h2 class="text-2xl font-bold mb-2">
            ${theme.displayName || theme.name}
            ${theme.version ? html`<span class="text-base font-normal text-gray-500 ml-2">v${theme.version}</span>` : ""}
          </h2>
          <p class="text-gray-600 dark:text-gray-300 mb-3">${theme.description || ""}</p>
          ${theme.author?.name
            ? html`
              <p class="text-sm text-gray-500">
                Autor:
                ${theme.author.url
                  ? html`<a href="${theme.author.url}" class="text-purple-600 dark:text-purple-400 hover:underline" target="_blank">${theme.author.name}</a>`
                  : theme.author.name}
              </p>
            `
            : ""}
        </div>
        <div class="flex gap-2">
          <a
            href="${env.ADMIN_PATH}/appearance/themes/preview?theme=${theme.name}"
            class="btn-secondary"
            target="_blank"
          >
            Vista previa
          </a>
        </div>
      </div>
    </div>

    ${customSettings.length > 0
      ? html`
        <form method="POST" action="${env.ADMIN_PATH}/appearance/themes/settings/save">
          <input type="hidden" name="theme" value="${theme.name}" />

          ${Object.entries(groupedCustomSettings).map(([group, settings]) => html`
            <div class="settings-section">
              <h3 class="settings-group-title">
                ${group === "general" ? "Configuración General" : group.charAt(0).toUpperCase() + group.slice(1)}
              </h3>

              <div class="settings-grid">
                ${settings.map((setting) => {
                  const fieldName = `custom_${setting.key}`;
                  const currentValue = setting.value ?? setting.defaultValue ?? "";

                  switch (setting.type) {
                    case "boolean": {
                      const isChecked = currentValue === true || currentValue === "true" || currentValue === 1 || currentValue === "1";
                      return html`
                        <label class="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 transition cursor-pointer">
                          <input type="hidden" name="${fieldName}" value="false" />
                          <input
                            type="checkbox"
                            name="${fieldName}"
                            value="true"
                            class="form-checkbox mt-1"
                            ${isChecked ? "checked" : ""}
                          />
                          <span class="flex-1">
                            <span class="font-medium block">${setting.label}</span>
                            ${setting.description ? html`<span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">${setting.description}</span>` : ""}
                          </span>
                        </label>
                      `;
                    }
                    case "select": {
                      return html`
                        <div>
                          <label class="form-label">${setting.label}</label>
                          <select name="${fieldName}" class="form-input">
                            ${(setting.options || []).map((option) => html`
                              <option value="${option}" ${toStringValue(option) === toStringValue(currentValue) ? "selected" : ""}>
                                ${option}
                              </option>
                            `)}
                          </select>
                          ${setting.description ? html`<p class="text-xs text-gray-500 mt-1">${setting.description}</p>` : ""}
                        </div>
                      `;
                    }
                    case "color": {
                      const colorValue = toStringValue(currentValue) || "#000000";
                      return html`
                        <div>
                          <label class="form-label">${setting.label}</label>
                          <div class="flex gap-2">
                            <input
                              type="color"
                              name="${fieldName}"
                              value="${colorValue}"
                              class="form-input h-12 w-20"
                            />
                            <input
                              type="text"
                              value="${colorValue}"
                              class="form-input flex-1"
                              readonly
                              onclick="this.previousElementSibling.click()"
                            />
                          </div>
                          ${setting.description ? html`<p class="text-xs text-gray-500 mt-1">${setting.description}</p>` : ""}
                        </div>
                      `;
                    }
                    case "textarea": {
                      return html`
                        <div class="col-span-2">
                          <label class="form-label">${setting.label}</label>
                          <textarea
                            name="${fieldName}"
                            rows="4"
                            class="form-input"
                            placeholder="${setting.description || ''}"
                          >${toStringValue(currentValue)}</textarea>
                          ${setting.description ? html`<p class="text-xs text-gray-500 mt-1">${setting.description}</p>` : ""}
                        </div>
                      `;
                    }
                    case "number": {
                      const numberSetting = setting as any;
                      return html`
                        <div>
                          <label class="form-label">${setting.label}</label>
                          <input
                            type="number"
                            name="${fieldName}"
                            value="${toStringValue(currentValue)}"
                            min="${numberSetting.min || ''}"
                            max="${numberSetting.max || ''}"
                            step="${numberSetting.step || '1'}"
                            class="form-input"
                          />
                          ${setting.description ? html`<p class="text-xs text-gray-500 mt-1">${setting.description}</p>` : ""}
                        </div>
                      `;
                    }
                    case "range": {
                      const rangeSetting = setting as any;
                      return html`
                        <div class="col-span-2">
                          <label class="form-label">
                            ${setting.label}
                            <span class="ml-2 text-sm font-mono text-purple-600 dark:text-purple-400" id="${fieldName}_value">
                              ${toStringValue(currentValue)}
                            </span>
                          </label>
                          <input
                            type="range"
                            name="${fieldName}"
                            value="${toStringValue(currentValue)}"
                            min="${rangeSetting.min || 0}"
                            max="${rangeSetting.max || 100}"
                            step="${rangeSetting.step || 1}"
                            class="form-range w-full"
                            oninput="document.getElementById('${fieldName}_value').textContent = this.value"
                          />
                          ${setting.description ? html`<p class="text-xs text-gray-500 mt-1">${setting.description}</p>` : ""}
                        </div>
                      `;
                    }
                    case "text":
                    case "url":
                    case "image":
                    default: {
                      return html`
                        <div>
                          <label class="form-label">${setting.label}</label>
                          <input
                            type="${setting.type === 'url' ? 'url' : 'text'}"
                            name="${fieldName}"
                            value="${toStringValue(currentValue)}"
                            class="form-input"
                            placeholder="${setting.type === 'url' ? 'https://...' : ''}"
                          />
                          ${setting.description ? html`<p class="text-xs text-gray-500 mt-1">${setting.description}</p>` : ""}
                        </div>
                      `;
                    }
                  }
                })}
              </div>
            </div>
          `)}

          <div class="action-buttons">
            <button type="reset" class="btn-secondary">
              Restablecer cambios
            </button>
            <button type="submit" class="btn-action">
              Guardar configuración
            </button>
          </div>
        </form>
      `
      : html`
        <div class="settings-section text-center py-8">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <h3 class="text-lg font-semibold mb-2">No hay configuraciones personalizadas</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Este theme no tiene ajustes personalizados disponibles.
          </p>
        </div>
      `}
  `;

  return AdminLayout({
    title: `Configuración: ${theme.displayName || theme.name}`,
    children: content,
    activePage: "appearance.themes",
    user,
  });
};

export default ThemeSettingsPage;
