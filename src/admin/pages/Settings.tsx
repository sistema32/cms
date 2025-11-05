import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";

type SettingFieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "select"
  | "boolean"
  | "password"
  | "url";

interface SettingOption {
  value: string;
  label: string;
}

interface SettingsField {
  key: string;
  label: string;
  description?: string;
  type?: SettingFieldType;
  options?: SettingOption[];
  defaultValue?: unknown;
  placeholder?: string;
}

interface SettingsCategory {
  id: string;
  label: string;
  available: boolean;
  fields: SettingsField[];
}

interface SettingsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  settings: Record<string, unknown>;
  categories: SettingsCategory[];
  selectedCategory: string;
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "on";
  }
  return false;
};

const toNumberString = (value: unknown): string => {
  if (typeof value === "number") return Number.isFinite(value) ? `${value}` : "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  }
  return "";
};

const toTextValue = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return `${value}`;
};

export const SettingsPage = (props: SettingsPageProps) => {
  const { user, settings, categories, selectedCategory } = props;

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const currentCategory = categoryMap.get(selectedCategory) ?? categories[0];
  const settingsAvailabilityMap = Object.fromEntries(
    categories.map((category) => [`settings.${category.id}`, category.available] as const),
  );
  const hasFields = currentCategory?.fields?.length > 0;

  const content = html`
    <style>
      .settings-category-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 2rem;
      }
      .settings-category-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.45rem 0.95rem;
        border-radius: 999px;
        background-color: rgba(148, 163, 184, 0.16);
        font-size: 0.9rem;
        text-decoration: none;
        color: inherit;
        transition: background-color 0.2s ease, color 0.2s ease;
      }
      .settings-category-link:hover {
        background-color: rgba(124, 58, 237, 0.1);
        color: #5b21b6;
      }
      .settings-category-link.active {
        background-color: rgba(124, 58, 237, 0.15);
        color: #6d28d9;
        font-weight: 600;
      }
      .dark .settings-category-link {
        background-color: rgba(148, 163, 184, 0.12);
      }
      .dark .settings-category-link:hover {
        background-color: rgba(124, 58, 237, 0.2);
        color: #c4b5fd;
      }
      .dark .settings-category-link.active {
        background-color: rgba(124, 58, 237, 0.28);
        color: #ede9fe;
      }
      .settings-category-link .status-tag {
        display: inline-block;
        padding: 0.1rem 0.4rem;
        font-size: 0.7rem;
        border-radius: 999px;
        background-color: rgba(148, 163, 184, 0.25);
        color: rgba(15, 23, 42, 0.7);
      }
      .dark .settings-category-link .status-tag {
        background-color: rgba(148, 163, 184, 0.35);
        color: rgba(226, 232, 240, 0.85);
      }
      .settings-empty-state {
        padding: 2rem;
        border: 1px dashed rgba(148, 163, 184, 0.6);
        border-radius: 1rem;
        text-align: center;
        color: rgba(100, 116, 139, 1);
      }
      .dark .settings-empty-state {
        border-color: rgba(148, 163, 184, 0.4);
        color: rgba(148, 163, 184, 0.8);
      }
      .settings-field-group {
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 1rem;
        padding: 1.5rem;
        background-color: rgba(255, 255, 255, 0.6);
      }
      .dark .settings-field-group {
        border-color: rgba(148, 163, 184, 0.14);
        background-color: rgba(30, 41, 59, 0.4);
      }
    </style>

    <div class="page-header">
      <h1 class="page-title">Configuración del Sitio</h1>
    </div>

    <div class="settings-category-nav">
      ${categories.map((category) => {
        const isActive = category.id === currentCategory?.id;
        return html`
          <a
            href="/admincp/settings?category=${category.id}"
            class="settings-category-link ${isActive ? "active" : ""}"
          >
            ${category.label}
            ${!category.available ? html`<span class="status-tag">Sin datos</span>` : ""}
          </a>
        `;
      })}
    </div>

    ${currentCategory && hasFields
      ? html`
          <form method="POST" action="/admincp/settings/save" class="space-y-6">
            <input type="hidden" name="settings_category" value="${currentCategory.id}" />

            <div class="settings-field-group">
              <h3 class="text-xl font-semibold mb-6">${currentCategory.label}</h3>
              <div class="space-y-5">
                ${currentCategory.fields.map((field) => {
                  const rawValue =
                    field.key in settings
                      ? settings[field.key]
                      : field.defaultValue;
                  const fieldType = field.type ?? "text";

                  const booleanValue = toBoolean(rawValue);
                  const numberValue = toNumberString(rawValue);
                  const textValue = toTextValue(rawValue);

                  const placeholderAttr = field.placeholder
                    ? `placeholder="${field.placeholder}"`
                    : "";

                  if (fieldType === "boolean") {
                    return html`
                      <div>
                        <label class="form-label block mb-2">${field.label}</label>
                        ${field.description
                          ? html`<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              ${field.description}
                            </p>`
                          : ""}
                        <input type="hidden" name="${field.key}" value="false" />
                        <label class="flex items-center gap-3">
                          <input
                            type="checkbox"
                            name="${field.key}"
                            value="true"
                            class="form-checkbox"
                            ${booleanValue ? "checked" : ""}
                          />
                          <span>${booleanValue ? "Habilitado" : "Deshabilitado"}</span>
                        </label>
                      </div>
                    `;
                  }

                  if (fieldType === "textarea") {
                    return html`
                      <div>
                        <label class="form-label block mb-2">${field.label}</label>
                        ${field.description
                          ? html`<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              ${field.description}
                            </p>`
                          : ""}
                        <textarea
                          name="${field.key}"
                          rows="4"
                          class="form-input"
                          ${placeholderAttr}
                        >${textValue}</textarea>
                      </div>
                    `;
                  }

                  if (fieldType === "select" && field.options) {
                    const selectedValue =
                      textValue === "" && field.defaultValue !== undefined && field.defaultValue !== null
                        ? `${field.defaultValue}`
                        : textValue;
                    return html`
                      <div>
                        <label class="form-label block mb-2">${field.label}</label>
                        ${field.description
                          ? html`<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              ${field.description}
                            </p>`
                          : ""}
                        <select name="${field.key}" class="form-input">
                          <option value=""></option>
                          ${field.options.map((option) => html`
                            <option
                              value="${option.value}"
                              ${option.value === selectedValue ? "selected" : ""}
                            >
                              ${option.label}
                            </option>
                          `)}
                        </select>
                      </div>
                    `;
                  }

                  if (fieldType === "number") {
                    return html`
                      <div>
                        <label class="form-label block mb-2">${field.label}</label>
                        ${field.description
                          ? html`<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              ${field.description}
                            </p>`
                          : ""}
                        <input
                          type="number"
                          name="${field.key}"
                          value="${numberValue}"
                          class="form-input"
                          ${placeholderAttr}
                        />
                      </div>
                    `;
                  }

                  if (fieldType === "password") {
                    return html`
                      <div>
                        <label class="form-label block mb-2">${field.label}</label>
                        ${field.description
                          ? html`<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              ${field.description}
                            </p>`
                          : html`<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              Deja el campo vacío para mantener el valor actual.
                            </p>`}
                        <input
                          type="password"
                          name="${field.key}"
                          value=""
                          class="form-input"
                          ${placeholderAttr}
                        />
                      </div>
                    `;
                  }

                  const inputType =
                    fieldType === "email" ||
                    fieldType === "url" ||
                    fieldType === "text"
                      ? fieldType
                      : "text";

                  return html`
                    <div>
                      <label class="form-label block mb-2">${field.label}</label>
                      ${field.description
                        ? html`<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            ${field.description}
                          </p>`
                        : ""}
                      <input
                        type="${inputType}"
                        name="${field.key}"
                        value="${textValue}"
                        class="form-input"
                        ${placeholderAttr}
                      />
                    </div>
                  `;
                })}
              </div>
            </div>

            <div class="flex justify-end gap-4">
              <button type="button" onclick="window.location.reload()" class="btn-secondary">
                Cancelar
              </button>
              <button type="submit" class="btn-action">
                Guardar Cambios
              </button>
            </div>
          </form>
        `
      : html`
          <div class="settings-empty-state">
            <h3 class="text-lg font-semibold mb-2">Aún no hay ajustes para esta categoría</h3>
            <p class="text-sm">
              Puedes crear nuevos ajustes mediante la API o agregarlos directamente en la base de datos.
            </p>
          </div>
        `}
  `;

  return AdminLayout({
    title: "Configuración",
    children: content,
    activePage: `settings.${currentCategory?.id || "general"}`,
    user,
    settingsAvailability: settingsAvailabilityMap,
  });
};

export default SettingsPage;
