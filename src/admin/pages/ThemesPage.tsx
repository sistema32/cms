import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";
import { withAdminPageLogging } from "../helpers/withAdminPageLogging.tsx";

export interface ThemeSummary {
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
  isActive: boolean;
  parent?: string; // Parent theme name for child themes
}

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

interface ThemesPageProps {
  user: {
    name: string | null;
    email: string;
  };
  themes: ThemeSummary[];
  activeTheme: string;
  customSettings?: ThemeCustomSetting[];
  settingsSaved?: boolean;
}

const toStringValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const renderScreenshot = (screenshots?: ThemeSummary["screenshots"]) => {
  if (!screenshots?.desktop) {
    return html`
      <div
        class="h-40 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm"
      >
        Sin vista previa
      </div>
    `;
  }

  return html`
    <img
      src="${screenshots.desktop}"
      alt="Vista previa del theme"
      class="h-40 w-full object-cover rounded-xl shadow-sm"
    />
  `;
};

const PageComponent = (props: ThemesPageProps) => {
  const {
    user,
    themes,
    activeTheme,
    customSettings = [],
    settingsSaved = false,
  } = props;

  const active = themes.find((theme) => theme.isActive);
  const available = themes.filter((theme) => !theme.isActive);

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
      .theme-grid {
        display: grid;
        gap: 1rem;
      }
      @media (min-width: 1024px) {
        .theme-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      .theme-card {
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1rem;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 20px 45px -30px rgba(79, 70, 229, 0.4);
      }
      .dark .theme-card {
        background: rgba(30, 41, 59, 0.78);
        border-color: rgba(148, 163, 184, 0.16);
      }
      .theme-card__body {
        padding: 1.5rem;
      }
      .theme-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        background: rgba(16, 185, 129, 0.14);
        color: rgba(4, 120, 87, 0.95);
      }
      .dark .theme-badge {
        background: rgba(16, 185, 129, 0.22);
        color: rgba(167, 243, 208, 0.92);
      }
      .theme-meta {
        display: grid;
        gap: 0.3rem;
        font-size: 0.85rem;
        color: rgba(71, 85, 105, 0.9);
      }
      .dark .theme-meta {
        color: rgba(203, 213, 225, 0.85);
      }
      .settings-card {
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.92);
      }
      .dark .settings-card {
        background: rgba(30, 41, 59, 0.78);
        border-color: rgba(148, 163, 184, 0.16);
      }
      .settings-group-title {
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(100, 116, 139, 0.8);
        margin-bottom: 0.75rem;
      }
      .dark .settings-group-title {
        color: rgba(148, 163, 184, 0.75);
      }
      .settings-grid {
        display: grid;
        gap: 1rem;
      }
      @media (min-width: 768px) {
        .settings-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      .theme-notice {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.9rem;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.2);
        color: rgba(4, 120, 87, 0.95);
      }
      .dark .theme-notice {
        background: rgba(16, 185, 129, 0.18);
        border-color: rgba(16, 185, 129, 0.28);
        color: rgba(167, 243, 208, 0.92);
      }
      .quick-link-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border: 1px dashed rgba(148, 163, 184, 0.35);
        border-radius: 0.9rem;
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .quick-link-card:hover {
        background: rgba(124, 58, 237, 0.08);
        border-color: rgba(124, 58, 237, 0.35);
      }
      .dark .quick-link-card:hover {
        background: rgba(124, 58, 237, 0.16);
      }
    </style>

    <div class="page-header">
      <h1 class="page-title">Themes</h1>
      <div class="page-actions">
        <a href="${env.ADMIN_PATH}/appearance/menus" class="btn-secondary"
          >Gestionar menús</a
        >
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        ${settingsSaved
          ? html`
            <div class="theme-notice">
              <svg
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293A1 1 0 106.293 10.707l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span>Los ajustes del theme se guardaron correctamente.</span>
            </div>
          `
          : ""}

        <div class="theme-card">
          ${renderScreenshot(active?.screenshots)}
          <div class="theme-card__body space-y-4">
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="text-xl font-semibold">
                ${active?.displayName || active?.name || "Theme activo"}
                ${active?.version
                  ? html`<span class="text-sm text-gray-500">v${active.version}</span>`
                  : ""}
              </h2>
              ${active
                ? html`<span class="theme-badge">Activo</span>`
                : ""}
              ${active?.parent
                ? html`
                  <span class="theme-badge" style="background: rgba(59, 130, 246, 0.14); color: rgba(37, 99, 235, 0.95);">
                    Child de ${active.parent}
                  </span>
                `
                : ""}
            </div>

            <div class="theme-meta">
              <p>${active?.description || "Theme activo actualmente."}</p>
              ${active?.author?.name
                ? html`
                  <span>
                    Autor:
                    ${active.author.url
                      ? html`
                        <a
                          href="${active.author.url}"
                          class="text-purple-600 dark:text-purple-300"
                          target="_blank"
                          >${active.author.name}</a
                        >
                      `
                      : active.author.name}
                  </span>
                `
                : ""}
            </div>

            <div class="flex gap-2 mt-4">
              <a
                href="${env.ADMIN_PATH}/appearance/themes/editor?theme=${activeTheme}"
                class="btn-secondary btn-sm"
              >
                Editar código
              </a>
              <a
                href="${env.ADMIN_PATH}/appearance/themes/preview?theme=${activeTheme}"
                class="btn-secondary btn-sm"
                target="_blank"
              >
                Vista previa
              </a>
            </div>

            ${customSettings.length > 0
              ? html`
                <div class="settings-card">
                  <h3 class="text-lg font-semibold mb-3">
                    Ajustes personalizados
                  </h3>
                  <form
                    method="POST"
                    action="${env.ADMIN_PATH}/appearance/themes/custom-settings"
                    class="space-y-6"
                  >
                    <input type="hidden" name="theme" value="${activeTheme}" />
                    ${Object.entries(groupedCustomSettings).map((
                      [group, settings],
                    ) =>
                      html`
                        <div class="space-y-4">
                          <h4 class="settings-group-title">
                            ${group === "general" ? "General" : group}
                          </h4>
                          <div class="settings-grid">
                            ${settings.map((setting) => {
                              const fieldName = `custom_${setting.key}`;
                              const currentValue = setting.value ??
                                setting.defaultValue ?? "";
                              switch (setting.type) {
                                case "boolean": {
                                  const isChecked = currentValue === true ||
                                    currentValue === "true" ||
                                    currentValue === 1 ||
                                    currentValue === "1";
                                  return html`
                                    <label
                                      class="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg"
                                    >
                                      <input type="hidden" name="${fieldName}" value="false" />
                                      <input
                                        type="checkbox"
                                        name="${fieldName}"
                                        value="true"
                                        class="form-checkbox mt-1"
                                        ${isChecked ? "checked" : ""}
                                      />
                                      <span>
                                        <span class="font-medium">${setting.label}</span>
                                        ${setting.description
                                          ? html`
                                            <span class="block text-xs text-gray-500 dark:text-gray-400">
                                              ${setting.description}
                                            </span>
                                          `
                                          : ""}
                                      </span>
                                    </label>
                                  `;
                                }
                                case "select": {
                                  return html`
                                    <div>
                                      <label class="form-label">${setting.label}</label>
                                      <select name="${fieldName}" class="form-input">
                                        ${(setting.options || []).map((option) =>
                                          html`
                                            <option
                                              value="${option}"
                                              ${toStringValue(option) === toStringValue(currentValue)
                                                ? "selected"
                                                : ""}
                                            >
                                              ${option}
                                            </option>
                                          `
                                        )}
                                      </select>
                                      ${setting.description
                                        ? html`
                                          <p class="text-xs text-gray-500 mt-1">
                                            ${setting.description}
                                          </p>
                                        `
                                        : ""}
                                    </div>
                                  `;
                                }
                                case "color": {
                                  const colorValue = toStringValue(currentValue) ||
                                    "#000000";
                                  return html`
                                    <div>
                                      <label class="form-label">${setting.label}</label>
                                      <input
                                        type="color"
                                        name="${fieldName}"
                                        value="${colorValue}"
                                        class="form-input h-10"
                                      />
                                      ${setting.description
                                        ? html`
                                          <p class="text-xs text-gray-500 mt-1">
                                            ${setting.description}
                                          </p>
                                        `
                                        : ""}
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
                                      ${setting.description
                                        ? html`
                                          <p class="text-xs text-gray-500 mt-1">
                                            ${setting.description}
                                          </p>
                                        `
                                        : ""}
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
                                      ${setting.description
                                        ? html`
                                          <p class="text-xs text-gray-500 mt-1">
                                            ${setting.description}
                                          </p>
                                        `
                                        : ""}
                                    </div>
                                  `;
                                }
                                case "url": {
                                  return html`
                                    <div>
                                      <label class="form-label">${setting.label}</label>
                                      <input
                                        type="url"
                                        name="${fieldName}"
                                        value="${toStringValue(currentValue)}"
                                        placeholder="https://..."
                                        class="form-input"
                                      />
                                      ${setting.description
                                        ? html`
                                          <p class="text-xs text-gray-500 mt-1">
                                            ${setting.description}
                                          </p>
                                        `
                                        : ""}
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
                                      ${setting.description
                                        ? html`
                                          <p class="text-xs text-gray-500 mt-1">
                                            ${setting.description}
                                          </p>
                                        `
                                        : ""}
                                    </div>
                                  `;
                                }
                                case "image_upload": {
                                  return html`
                                    <div class="col-span-2">
                                      <label class="form-label">${setting.label}</label>
                                      <div class="space-y-2">
                                        ${currentValue ? html`
                                          <img
                                            src="${currentValue}"
                                            alt="Preview"
                                            class="h-32 w-auto rounded border border-gray-300 dark:border-gray-600"
                                          />
                                        ` : ""}
                                        <div class="flex gap-2">
                                          <input
                                            type="text"
                                            name="${fieldName}"
                                            value="${toStringValue(currentValue)}"
                                            placeholder="URL de la imagen"
                                            class="form-input flex-1"
                                            id="${fieldName}_input"
                                          />
                                          <button
                                            type="button"
                                            class="btn-secondary"
                                            onclick="alert('Media library integration coming soon')"
                                          >
                                            Examinar
                                          </button>
                                        </div>
                                        ${setting.description
                                          ? html`
                                            <p class="text-xs text-gray-500">
                                              ${setting.description}
                                            </p>
                                          `
                                          : ""}
                                      </div>
                                    </div>
                                  `;
                                }
                                case "text":
                                case "image":
                                default: {
                                  return html`
                                    <div>
                                      <label class="form-label">${setting.label}</label>
                                      <input
                                        type="text"
                                        name="${fieldName}"
                                        value="${toStringValue(currentValue)}"
                                        class="form-input"
                                      />
                                      ${setting.description
                                        ? html`
                                          <p class="text-xs text-gray-500 mt-1">
                                            ${setting.description}
                                          </p>
                                        `
                                        : ""}
                                    </div>
                                  `;
                                }
                              }
                            })}
                          </div>
                        </div>
                      `
                    )}
                    <div class="flex justify-end">
                      <button type="submit" class="btn-action">
                        Guardar ajustes
                      </button>
                    </div>
                  </form>
                </div>
              `
              : ""}
          </div>
        </div>

        <div class="form-card">
          <h2 class="text-lg font-semibold mb-4">Themes disponibles</h2>
          ${available.length === 0
            ? html`
              <p class="text-sm text-gray-500 dark:text-gray-400">
                No hay otros themes instalados en este momento.
              </p>
            `
            : html`
              <div class="theme-grid">
                ${available.map((theme) =>
                  html`
                    <div class="theme-card">
                      ${renderScreenshot(theme.screenshots)}
                      <div class="theme-card__body space-y-3">
                        <div class="flex items-center gap-2 flex-wrap">
                          <h3 class="text-lg font-semibold">
                            ${theme.displayName || theme.name}
                          </h3>
                          ${theme.version
                            ? html`
                              <span class="text-xs text-gray-500">v${theme.version}</span>
                            `
                            : ""}
                          ${theme.parent
                            ? html`
                              <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                Child de ${theme.parent}
                              </span>
                            `
                            : ""}
                        </div>

                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          ${theme.description || "Theme disponible para activar."}
                        </p>

                        ${theme.author?.name
                          ? html`
                            <p class="text-xs text-gray-400">
                              Autor:
                              ${theme.author.url
                                ? html`
                                  <a
                                    href="${theme.author.url}"
                                    class="text-purple-500 hover:text-purple-600"
                                    target="_blank"
                                  >
                                    ${theme.author.name}
                                  </a>
                                `
                                : theme.author.name}
                            </p>
                          `
                          : ""}

                        <div class="flex gap-2 flex-wrap pt-2">
                          <form
                            method="POST"
                            action="${env.ADMIN_PATH}/appearance/themes/activate"
                            class="flex-1"
                          >
                            <input type="hidden" name="theme" value="${theme.name}" />
                            <button type="submit" class="btn-action btn-sm w-full">
                              Activar
                            </button>
                          </form>
                          <a
                            href="${env.ADMIN_PATH}/appearance/themes/preview?theme=${theme.name}"
                            class="btn-secondary btn-sm flex-1 text-center"
                            target="_blank"
                          >
                            Vista previa
                          </a>
                        </div>
                        <a
                          href="${env.ADMIN_PATH}/appearance/themes/customize?theme=${theme.name}"
                          class="btn-ghost btn-sm w-full text-center block"
                        >
                          Personalizar
                        </a>
                        <a
                          href="${env.ADMIN_PATH}/appearance/themes/editor?theme=${theme.name}"
                          class="btn-ghost btn-sm w-full text-center block"
                        >
                          Editar código
                        </a>
                      </div>
                    </div>
                  `
                )}
              </div>
            `}
        </div>
      </div>

      <div class="space-y-6">
        <div class="form-card">
          <h3 class="text-lg font-semibold mb-4">Siguientes pasos</h3>
          <div class="space-y-3">
            <a
              href="${env.ADMIN_PATH}/appearance/menus"
              class="quick-link-card"
            >
              <span>
                <strong>Menús</strong>
                <span class="block text-xs text-gray-500 dark:text-gray-400"
                  >Gestiona los menús y enlaces del sitio</span
                >
              </span>
              <svg
                class="w-4 h-4 text-purple-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
            <a
              href="${env.ADMIN_PATH}/settings?category=theme"
              class="quick-link-card"
            >
              <span>
                <strong>Otros ajustes visuales</strong>
                <span class="block text-xs text-gray-500 dark:text-gray-400"
                  >Configura detalles adicionales de la apariencia</span
                >
              </span>
              <svg
                class="w-4 h-4 text-purple-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
          </div>
        </div>

        <div class="form-card">
          <h3 class="text-lg font-semibold mb-4">Información</h3>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Theme activo: <strong>${activeTheme}</strong></li>
            <li>Total de themes instalados: ${themes.length}</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  return AdminLayout({
    title: "Themes",
    children: content,
    activePage: "appearance.themes",
    user,
  });
};

// Envuelve el componente con el logger antes de exportarlo
export const ThemesPage = withAdminPageLogging(PageComponent, import.meta.url);
export default ThemesPage;
