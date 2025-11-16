import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
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
  min?: number;
  max?: number;
  step?: number;
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

interface ThemeSettingsNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  theme: ThemeInfo;
  customSettings: ThemeCustomSetting[];
  settingsSaved?: boolean;
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

export const ThemeSettingsNexusPage = (props: ThemeSettingsNexusPageProps) => {
  const {
    user,
    theme,
    customSettings = [],
    settingsSaved = false,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  // XSS safe - group custom settings
  const groupedCustomSettings = customSettings.reduce(
    (acc, setting) => {
      const group = setting.group || "general";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(setting);
      return acc;
    },
    {} as Record<string, ThemeCustomSetting[]>,
  );

  const content = html`
    <style>
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        margin-bottom: 2rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0;
      }

      /* ========== SUCCESS NOTICE ========== */
      .success-notice {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-radius: var(--nexus-radius-lg);
        background: rgba(11, 191, 88, 0.1);
        border: 1px solid rgba(11, 191, 88, 0.3);
        color: var(--nexus-success);
        margin-bottom: 1.5rem;
      }

      .success-notice svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      /* ========== THEME HEADER CARD ========== */
      .theme-header-card {
        background: linear-gradient(135deg, rgba(22, 123, 255, 0.1) 0%, rgba(156, 93, 232, 0.1) 100%);
        border: 1px solid rgba(22, 123, 255, 0.2);
        border-radius: var(--nexus-radius-lg);
        padding: 2rem;
        margin-bottom: 2rem;
      }

      .theme-screenshot {
        width: 8rem;
        height: 5rem;
        object-fit: cover;
        border-radius: var(--nexus-radius-md);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      /* ========== SETTINGS SECTION ========== */
      .settings-section {
        background: var(--nexus-base-100);
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-lg);
        padding: 2rem;
        margin-bottom: 1.5rem;
      }

      .settings-group-title {
        font-size: 0.875rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--nexus-primary);
        margin-bottom: 1.5rem;
        font-weight: 600;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid rgba(22, 123, 255, 0.2);
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

      .settings-field {
        display: flex;
        flex-direction: column;
      }

      .settings-field.full-width {
        grid-column: 1 / -1;
      }

      .settings-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content);
        margin-bottom: 0.5rem;
      }

      .settings-input,
      .settings-select,
      .settings-textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content);
        background: var(--nexus-base-100);
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-md);
        transition: all 0.2s;
      }

      .settings-input:focus,
      .settings-select:focus,
      .settings-textarea:focus {
        outline: none;
        border-color: var(--nexus-primary);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .settings-hint {
        font-size: 0.75rem;
        color: var(--nexus-base-content);
        opacity: 0.5;
        margin-top: 0.25rem;
      }

      .settings-checkbox-field {
        display: flex;
        align-items: start;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-md);
        cursor: pointer;
        transition: all 0.2s;
      }

      .settings-checkbox-field:hover {
        background: rgba(22, 123, 255, 0.05);
      }

      .settings-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
        margin-top: 0.15rem;
      }

      /* ========== ACTION BUTTONS ========== */
      .action-buttons {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--nexus-base-200);
      }

      /* ========== EMPTY STATE ========== */
      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
      }

      .empty-state svg {
        width: 4rem;
        height: 4rem;
        margin: 0 auto 1rem;
        color: var(--nexus-base-content);
        opacity: 0.3;
      }
    </style>

    <div class="page-header-nexus">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <h1 class="page-title-nexus">Configuración del Theme</h1>
        <div style="display: flex; gap: 0.5rem;">
          ${NexusButton({
            label: "Explorar themes",
            type: "outline",
            href: `${adminPath}/appearance/themes`
          })}
          ${NexusButton({
            label: "Editar código",
            type: "outline",
            href: `${adminPath}/appearance/themes/editor?theme=${theme.name}`
          })}
        </div>
      </div>
    </div>

    ${settingsSaved ? html`
      <div class="success-notice">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293A1 1 0 106.293 10.707l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span>Los ajustes del theme se guardaron correctamente.</span>
      </div>
    ` : ""}

    <div class="theme-header-card">
      <div style="display: flex; align-items: start; gap: 1.5rem; flex-wrap: wrap;">
        ${theme.screenshots?.desktop ? html`
          <img
            src="${theme.screenshots.desktop}"
            alt="${theme.displayName || theme.name}"
            class="theme-screenshot"
          />
        ` : ""}
        <div style="flex: 1;">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
            ${theme.displayName || theme.name}
            ${theme.version ? html`<span style="font-size: 1rem; font-weight: 400; color: var(--nexus-base-content); opacity: 0.5; margin-left: 0.5rem;">v${theme.version}</span>` : ""}
          </h2>
          <p style="color: var(--nexus-base-content); opacity: 0.7; margin-bottom: 1rem;">${theme.description || ""}</p>
          ${theme.author?.name ? html`
            <p style="font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.6;">
              Autor:
              ${theme.author.url ? html`
                <a href="${theme.author.url}" style="color: var(--nexus-primary);" target="_blank">
                  ${theme.author.name}
                </a>
              ` : theme.author.name}
            </p>
          ` : ""}
        </div>
        ${NexusButton({
          label: "Vista previa",
          type: "outline",
          href: `${adminPath}/appearance/themes/preview?theme=${theme.name}`,
          target: "_blank"
        })}
      </div>
    </div>

    ${customSettings.length > 0 ? html`
      <form method="POST" action="${adminPath}/appearance/themes/settings/save">
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
                      <label class="settings-checkbox-field">
                        <input type="hidden" name="${fieldName}" value="false" />
                        <input
                          type="checkbox"
                          name="${fieldName}"
                          value="true"
                          class="settings-checkbox"
                          ${isChecked ? "checked" : ""}
                        />
                        <span style="flex: 1;">
                          <span class="settings-label" style="margin: 0; display: block;">${setting.label}</span>
                          ${setting.description ? html`<span class="settings-hint">${setting.description}</span>` : ""}
                        </span>
                      </label>
                    `;
                  }
                  case "select": {
                    return html`
                      <div class="settings-field">
                        <label class="settings-label">${setting.label}</label>
                        <select name="${fieldName}" class="settings-select">
                          ${(setting.options || []).map((option) => html`
                            <option value="${option}" ${toStringValue(option) === toStringValue(currentValue) ? "selected" : ""}>
                              ${option}
                            </option>
                          `)}
                        </select>
                        ${setting.description ? html`<p class="settings-hint">${setting.description}</p>` : ""}
                      </div>
                    `;
                  }
                  case "color": {
                    const colorValue = toStringValue(currentValue) || "#000000";
                    return html`
                      <div class="settings-field">
                        <label class="settings-label">${setting.label}</label>
                        <div style="display: flex; gap: 0.5rem;">
                          <input
                            type="color"
                            name="${fieldName}"
                            value="${colorValue}"
                            class="settings-input"
                            style="height: 3rem; width: 5rem; padding: 0.25rem;"
                          />
                          <input
                            type="text"
                            value="${colorValue}"
                            class="settings-input"
                            style="flex: 1;"
                            readonly
                            data-color-input="${fieldName}"
                          />
                        </div>
                        ${setting.description ? html`<p class="settings-hint">${setting.description}</p>` : ""}
                      </div>
                    `;
                  }
                  case "textarea": {
                    return html`
                      <div class="settings-field full-width">
                        <label class="settings-label">${setting.label}</label>
                        <textarea
                          name="${fieldName}"
                          rows="4"
                          class="settings-textarea"
                          placeholder="${setting.description || ''}"
                        >${toStringValue(currentValue)}</textarea>
                        ${setting.description ? html`<p class="settings-hint">${setting.description}</p>` : ""}
                      </div>
                    `;
                  }
                  case "number": {
                    const numberSetting = setting as any;
                    return html`
                      <div class="settings-field">
                        <label class="settings-label">${setting.label}</label>
                        <input
                          type="number"
                          name="${fieldName}"
                          value="${toStringValue(currentValue)}"
                          min="${numberSetting.min || ''}"
                          max="${numberSetting.max || ''}"
                          step="${numberSetting.step || '1'}"
                          class="settings-input"
                        />
                        ${setting.description ? html`<p class="settings-hint">${setting.description}</p>` : ""}
                      </div>
                    `;
                  }
                  case "range": {
                    const rangeSetting = setting as any;
                    return html`
                      <div class="settings-field full-width">
                        <label class="settings-label">
                          ${setting.label}
                          <span style="margin-left: 0.5rem; font-family: monospace; color: var(--nexus-primary);" id="${fieldName}_value">
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
                          class="settings-input"
                          data-range-value="${fieldName}_value"
                        />
                        ${setting.description ? html`<p class="settings-hint">${setting.description}</p>` : ""}
                      </div>
                    `;
                  }
                  case "text":
                  case "url":
                  case "image":
                  default: {
                    return html`
                      <div class="settings-field">
                        <label class="settings-label">${setting.label}</label>
                        <input
                          type="${setting.type === 'url' ? 'url' : 'text'}"
                          name="${fieldName}"
                          value="${toStringValue(currentValue)}"
                          class="settings-input"
                          placeholder="${setting.type === 'url' ? 'https://...' : ''}"
                        />
                        ${setting.description ? html`<p class="settings-hint">${setting.description}</p>` : ""}
                      </div>
                    `;
                  }
                }
              })}
            </div>
          </div>
        `)}

        <div class="action-buttons">
          ${NexusButton({
            label: "Restablecer cambios",
            type: "outline",
            dataAttributes: { "type": "reset" }
          })}
          ${NexusButton({
            label: "Guardar configuración",
            type: "primary",
            isSubmit: true
          })}
        </div>
      </form>
    ` : html`
      <div class="settings-section empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No hay configuraciones personalizadas</h3>
        <p style="color: var(--nexus-base-content); opacity: 0.6;">
          Este theme no tiene ajustes personalizados disponibles.
        </p>
      </div>
    `}

    ${raw(`<script>
      // XSS safe - event handlers in addEventListener
      document.addEventListener('DOMContentLoaded', function() {
        // XSS safe - color input sync
        const colorInputs = document.querySelectorAll('input[type="color"]');
        colorInputs.forEach(colorInput => {
          colorInput.addEventListener('input', function() {
            const textInput = document.querySelector('[data-color-input="' + this.name + '"]');
            if (textInput) {
              // XSS safe - using value property
              textInput.value = this.value;
            }
          });
        });

        // XSS safe - range input display
        const rangeInputs = document.querySelectorAll('input[type="range"][data-range-value]');
        rangeInputs.forEach(rangeInput => {
          rangeInput.addEventListener('input', function() {
            const valueId = this.getAttribute('data-range-value');
            const valueElement = document.getElementById(valueId || '');
            if (valueElement) {
              // XSS safe - using textContent
              valueElement.textContent = this.value;
            }
          });
        });
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: `Configuración: ${theme.displayName || theme.name}`,
    children: content,
    activePage: "appearance.themes",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default ThemeSettingsNexusPage;
