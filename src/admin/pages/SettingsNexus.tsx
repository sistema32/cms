import { html } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton } from "../components/nexus/NexusComponents.tsx";

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

interface SettingsNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  settings: Record<string, unknown>;
  categories: SettingsCategory[];
  selectedCategory: string;
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

export const SettingsNexusPage = (props: SettingsNexusPageProps) => {
  const {
    user,
    settings,
    categories,
    selectedCategory,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const currentCategory = categoryMap.get(selectedCategory) ?? categories[0];
  const settingsAvailabilityMap = Object.fromEntries(
    categories.map((category) => [`settings.${category.id}`, category.available] as const),
  );
  const hasFields = currentCategory?.fields?.length > 0;

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
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle-nexus {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        margin: 0;
      }

      /* ========== CATEGORY NAVIGATION ========== */
      .settings-category-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 2rem;
      }

      .settings-category-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.125rem;
        border-radius: var(--nexus-radius-full, 9999px);
        background: var(--nexus-base-200, #eef0f2);
        border: 1px solid transparent;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        color: var(--nexus-base-content, #1e2328);
        transition: all 0.2s;
        cursor: pointer;
      }

      .settings-category-pill:hover {
        background: rgba(22, 123, 255, 0.08);
        border-color: var(--nexus-primary, #167bff);
        color: var(--nexus-primary, #167bff);
      }

      .settings-category-pill.active {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
        color: #ffffff;
        font-weight: 600;
      }

      .category-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-full, 9999px);
        background: rgba(0, 0, 0, 0.1);
        color: currentColor;
      }

      .settings-category-pill.active .category-badge {
        background: rgba(255, 255, 255, 0.25);
        color: #ffffff;
      }

      /* ========== FORM FIELDS ========== */
      .settings-field-group {
        margin-bottom: 2rem;
      }

      .settings-field-group-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 1.5rem 0;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .field-wrapper {
        margin-bottom: 1.5rem;
      }

      .field-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .field-description {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-bottom: 0.75rem;
        line-height: 1.5;
      }

      .nexus-input-field {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .nexus-input-field:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .nexus-input-field::placeholder {
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.4;
      }

      .nexus-textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
        resize: vertical;
        min-height: 100px;
        font-family: inherit;
      }

      .nexus-textarea:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .nexus-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
        cursor: pointer;
      }

      .nexus-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      /* ========== CHECKBOX TOGGLE ========== */
      .checkbox-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .checkbox-wrapper:hover {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.02);
      }

      .nexus-checkbox {
        width: 20px;
        height: 20px;
        border: 2px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-sm, 0.25rem);
        cursor: pointer;
        transition: all 0.2s;
      }

      .nexus-checkbox:checked {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
      }

      .nexus-checkbox:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .checkbox-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nexus-base-content, #1e2328);
        cursor: pointer;
      }

      /* ========== FORM ACTIONS ========== */
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      /* ========== EMPTY STATE ========== */
      .settings-empty-state {
        padding: 3rem 2rem;
        text-align: center;
        background: var(--nexus-base-100, #fff);
        border: 2px dashed var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-lg, 0.75rem);
      }

      .empty-state-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.3;
      }

      .empty-state-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 0.5rem 0;
      }

      .empty-state-description {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin: 0;
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .page-title-nexus {
          font-size: 1.5rem;
        }

        .settings-category-nav {
          flex-direction: column;
        }

        .settings-category-pill {
          width: 100%;
          justify-content: center;
        }

        .form-actions {
          flex-direction: column;
        }

        .form-actions button {
          width: 100%;
        }
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <h1 class="page-title-nexus">Configuración del Sitio</h1>
      <p class="page-subtitle-nexus">Gestiona los ajustes y configuración de tu sitio web</p>
    </div>

    <!-- Category Navigation -->
    <div class="settings-category-nav">
      ${categories.map((category) => {
        const isActive = category.id === currentCategory?.id;
        return html`
          <a
            href="/admincp/settings?category=${category.id}"
            class="settings-category-pill ${isActive ? "active" : ""}"
          >
            ${category.label}
            ${!category.available ? html`<span class="category-badge">Sin datos</span>` : ""}
          </a>
        `;
      })}
    </div>

    <!-- Settings Form or Empty State -->
    ${currentCategory && hasFields
      ? html`
          ${NexusCard({
            children: html`
              <form method="POST" action="/admincp/settings/save">
                <input type="hidden" name="settings_category" value="${currentCategory.id}" />

                <div class="settings-field-group">
                  <h3 class="settings-field-group-title">${currentCategory.label}</h3>

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
                        <div class="field-wrapper">
                          <label class="field-label">${field.label}</label>
                          ${field.description
                            ? html`<p class="field-description">${field.description}</p>`
                            : ""}
                          <input type="hidden" name="${field.key}" value="false" />
                          <label class="checkbox-wrapper">
                            <input
                              type="checkbox"
                              name="${field.key}"
                              value="true"
                              class="nexus-checkbox"
                              ${booleanValue ? "checked" : ""}
                            />
                            <span class="checkbox-label">
                              ${booleanValue ? "Habilitado" : "Deshabilitado"}
                            </span>
                          </label>
                        </div>
                      `;
                    }

                    if (fieldType === "textarea") {
                      return html`
                        <div class="field-wrapper">
                          <label class="field-label">${field.label}</label>
                          ${field.description
                            ? html`<p class="field-description">${field.description}</p>`
                            : ""}
                          <textarea
                            name="${field.key}"
                            rows="4"
                            class="nexus-textarea"
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
                        <div class="field-wrapper">
                          <label class="field-label">${field.label}</label>
                          ${field.description
                            ? html`<p class="field-description">${field.description}</p>`
                            : ""}
                          <select name="${field.key}" class="nexus-select">
                            <option value="">Selecciona una opción</option>
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
                        <div class="field-wrapper">
                          <label class="field-label">${field.label}</label>
                          ${field.description
                            ? html`<p class="field-description">${field.description}</p>`
                            : ""}
                          <input
                            type="number"
                            name="${field.key}"
                            value="${numberValue}"
                            class="nexus-input-field"
                            ${placeholderAttr}
                          />
                        </div>
                      `;
                    }

                    if (fieldType === "password") {
                      return html`
                        <div class="field-wrapper">
                          <label class="field-label">${field.label}</label>
                          ${field.description
                            ? html`<p class="field-description">${field.description}</p>`
                            : html`<p class="field-description">
                                Deja el campo vacío para mantener el valor actual.
                              </p>`}
                          <input
                            type="password"
                            name="${field.key}"
                            value=""
                            class="nexus-input-field"
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
                      <div class="field-wrapper">
                        <label class="field-label">${field.label}</label>
                        ${field.description
                          ? html`<p class="field-description">${field.description}</p>`
                          : ""}
                        <input
                          type="${inputType}"
                          name="${field.key}"
                          value="${textValue}"
                          class="nexus-input-field"
                          ${placeholderAttr}
                        />
                      </div>
                    `;
                  })}
                </div>

                <div class="form-actions">
                  ${NexusButton({
                    label: "Cancelar",
                    type: "outline",
                    onclick: "window.location.reload()"
                  })}
                  ${NexusButton({
                    label: "Guardar Cambios",
                    type: "primary",
                    isSubmit: true,
                    icon: html`
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                    `
                  })}
                </div>
              </form>
            `
          })}
        `
      : html`
          <div class="settings-empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <h3 class="empty-state-title">Aún no hay ajustes para esta categoría</h3>
            <p class="empty-state-description">
              Puedes crear nuevos ajustes mediante la API o agregarlos directamente en la base de datos.
            </p>
          </div>
        `}
  `;

  return AdminLayoutNexus({
    title: "Configuración",
    children: content,
    activePage: `settings.${currentCategory?.id || "general"}`,
    user,
    notifications,
    unreadNotificationCount,
    settingsAvailability: settingsAvailabilityMap,
  });
};

export default SettingsNexusPage;
