import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

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
  parent?: string;
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

interface ThemesNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  themes: ThemeSummary[];
  activeTheme: string;
  customSettings?: ThemeCustomSetting[];
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

// XSS safe - screenshot rendering
const renderScreenshot = (screenshots?: ThemeSummary["screenshots"]) => {
  if (!screenshots?.desktop) {
    return html`
      <div class="theme-screenshot-placeholder">
        Sin vista previa
      </div>
    `;
  }

  return html`
    <img
      src="${screenshots.desktop}"
      alt="Vista previa del theme"
      class="theme-screenshot"
    />
  `;
};

export const ThemesNexusPage = (props: ThemesNexusPageProps) => {
  const {
    user,
    themes,
    activeTheme,
    customSettings = [],
    settingsSaved = false,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

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

      /* ========== LAYOUT ========== */
      .themes-layout {
        display: grid;
        gap: 1.5rem;
      }

      @media (min-width: 1024px) {
        .themes-layout {
          grid-template-columns: 2fr 1fr;
        }
      }

      /* ========== SUCCESS NOTICE ========== */
      .success-notice {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-radius: var(--nexus-radius-lg, 0.75rem);
        background: rgba(23, 201, 100, 0.1);
        border: 1px solid rgba(23, 201, 100, 0.3);
        color: var(--nexus-success, #17c964);
        margin-bottom: 1.5rem;
      }

      .success-notice svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      /* ========== THEME GRID ========== */
      .theme-grid {
        display: grid;
        gap: 1.5rem;
      }

      @media (min-width: 768px) {
        .theme-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* ========== THEME CARD ========== */
      .theme-card {
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        overflow: hidden;
        background: var(--nexus-base-100, #fff);
        transition: all 0.2s;
      }

      .theme-card:hover {
        box-shadow: 0 4px 12px rgba(22, 123, 255, 0.15);
        border-color: var(--nexus-primary, #167bff);
      }

      .theme-screenshot {
        width: 100%;
        height: 10rem;
        object-fit: cover;
      }

      .theme-screenshot-placeholder {
        width: 100%;
        height: 10rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--nexus-base-200, #eef0f2);
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
        font-size: 0.875rem;
      }

      .theme-card-body {
        padding: 1.5rem;
      }

      .theme-card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }

      .theme-card-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0;
      }

      .theme-version {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .theme-meta {
        display: grid;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
        margin-bottom: 1rem;
      }

      .theme-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      /* ========== SETTINGS CARD ========== */
      .settings-card {
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: 1.5rem;
        background: var(--nexus-base-100, #fff);
        margin-top: 1.5rem;
      }

      .settings-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 1rem 0;
      }

      .settings-group {
        margin-bottom: 1.5rem;
      }

      .settings-group:last-child {
        margin-bottom: 0;
      }

      .settings-group-title {
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin: 0 0 0.75rem 0;
        font-weight: 600;
      }

      .settings-grid {
        display: grid;
        gap: 1rem;
      }

      @media (min-width: 768px) {
        .settings-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .settings-field {
        margin-bottom: 1rem;
      }

      .settings-field.full-width {
        grid-column: 1 / -1;
      }

      .settings-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .settings-input,
      .settings-select,
      .settings-textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .settings-input:focus,
      .settings-select:focus,
      .settings-textarea:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .settings-hint {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
        margin-top: 0.25rem;
      }

      .settings-checkbox-field {
        display: flex;
        align-items: start;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
      }

      .settings-checkbox {
        width: 18px;
        height: 18px;
        border: 2px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-sm, 0.25rem);
        cursor: pointer;
        margin-top: 0.15rem;
      }

      .settings-checkbox:checked {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
      }

      .settings-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      /* ========== QUICK LINKS ========== */
      .quick-link {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border: 1px dashed var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
        color: var(--nexus-base-content, #1e2328);
        text-decoration: none;
      }

      .quick-link:hover {
        background: rgba(22, 123, 255, 0.08);
        border-color: var(--nexus-primary, #167bff);
      }

      .quick-link-content strong {
        display: block;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .quick-link-content span {
        font-size: 0.75rem;
        opacity: 0.6;
      }

      .quick-link svg {
        width: 16px;
        height: 16px;
        color: var(--nexus-primary, #167bff);
      }

      /* ========== INFO CARD ========== */
      .info-list {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
      }

      .info-list li {
        margin-bottom: 0.5rem;
      }

      .info-list strong {
        font-weight: 600;
        opacity: 1;
      }

      /* ========== UTILITIES ========== */
      .space-y-3 > * + * {
        margin-top: 0.75rem;
      }

      .space-y-6 > * + * {
        margin-top: 1.5rem;
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <h1 class="page-title-nexus">Themes</h1>
        ${NexusButton({
          label: "Gestionar menús",
          type: "outline",
          href: `${adminPath}/appearance/menus`
        })}
      </div>
    </div>

    <div class="themes-layout">
      <!-- Main Column -->
      <div class="space-y-6">
        <!-- Success Notice -->
        ${settingsSaved ? html`
          <div class="success-notice">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293A1 1 0 106.293 10.707l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>Los ajustes del theme se guardaron correctamente.</span>
          </div>
        ` : ""}

        <!-- Active Theme -->
        ${NexusCard({
          children: html`
            ${renderScreenshot(active?.screenshots)}
            <div class="theme-card-body">
              <div class="theme-card-header">
                <h2 class="theme-card-title">
                  ${active?.displayName || active?.name || "Theme activo"}
                  ${active?.version ? html`<span class="theme-version">v${active.version}</span>` : ""}
                </h2>
                ${active ? NexusBadge({ label: "Activo", type: "success", soft: true }) : ""}
                ${active?.parent ? NexusBadge({ label: `Child de ${active.parent}`, type: "info", soft: true }) : ""}
              </div>

              <div class="theme-meta">
                <p>${active?.description || "Theme activo actualmente."}</p>
                ${active?.author?.name ? html`
                  <span>
                    Autor:
                    ${active.author.url ? html`
                      <a href="${active.author.url}" style="color: var(--nexus-primary);" target="_blank">
                        ${active.author.name}
                      </a>
                    ` : active.author.name}
                  </span>
                ` : ""}
              </div>

              <div class="theme-actions">
                ${NexusButton({
                  label: "Editar código",
                  type: "outline",
                  size: "sm",
                  href: `${adminPath}/appearance/themes/editor?theme=${activeTheme}`
                })}
                ${NexusButton({
                  label: "Vista previa",
                  type: "outline",
                  size: "sm",
                  href: `${adminPath}/appearance/themes/preview?theme=${activeTheme}`,
                  target: "_blank"
                })}
              </div>

              <!-- Custom Settings -->
              ${customSettings.length > 0 ? html`
                <div class="settings-card">
                  <h3 class="settings-title">Ajustes personalizados</h3>
                  <form method="POST" action="${adminPath}/appearance/themes/custom-settings">
                    <input type="hidden" name="theme" value="${activeTheme}" />
                    ${Object.entries(groupedCustomSettings).map(([group, settings]) => html`
                      <div class="settings-group">
                        <h4 class="settings-group-title">${group === "general" ? "General" : group}</h4>
                        <div class="settings-grid">
                          ${settings.map((setting) => {
                            const fieldName = `custom_${setting.key}`;
                            const currentValue = setting.value ?? setting.defaultValue ?? "";

                            switch (setting.type) {
                              case "boolean": {
                                const isChecked = currentValue === true ||
                                  currentValue === "true" ||
                                  currentValue === 1 ||
                                  currentValue === "1";
                                return html`
                                  <div class="settings-checkbox-field">
                                    <input type="hidden" name="${fieldName}" value="false" />
                                    <input
                                      type="checkbox"
                                      name="${fieldName}"
                                      value="true"
                                      class="settings-checkbox"
                                      ${isChecked ? "checked" : ""}
                                    />
                                    <div>
                                      <span class="settings-label" style="margin: 0;">${setting.label}</span>
                                      ${setting.description ? html`
                                        <div class="settings-hint">${setting.description}</div>
                                      ` : ""}
                                    </div>
                                  </div>
                                `;
                              }
                              case "select": {
                                return html`
                                  <div class="settings-field">
                                    <label class="settings-label">${setting.label}</label>
                                    <select name="${fieldName}" class="settings-select">
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
                                      <div class="settings-hint">${setting.description}</div>
                                    ` : ""}
                                  </div>
                                `;
                              }
                              case "color": {
                                const colorValue = toStringValue(currentValue) || "#000000";
                                return html`
                                  <div class="settings-field">
                                    <label class="settings-label">${setting.label}</label>
                                    <input
                                      type="color"
                                      name="${fieldName}"
                                      value="${colorValue}"
                                      class="settings-input"
                                      style="height: 2.5rem;"
                                    />
                                    ${setting.description ? html`
                                      <div class="settings-hint">${setting.description}</div>
                                    ` : ""}
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
                                    ${setting.description ? html`
                                      <div class="settings-hint">${setting.description}</div>
                                    ` : ""}
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
                                    ${setting.description ? html`
                                      <div class="settings-hint">${setting.description}</div>
                                    ` : ""}
                                  </div>
                                `;
                              }
                              case "url": {
                                return html`
                                  <div class="settings-field">
                                    <label class="settings-label">${setting.label}</label>
                                    <input
                                      type="url"
                                      name="${fieldName}"
                                      value="${toStringValue(currentValue)}"
                                      placeholder="https://..."
                                      class="settings-input"
                                    />
                                    ${setting.description ? html`
                                      <div class="settings-hint">${setting.description}</div>
                                    ` : ""}
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
                                      data-range-value-id="${fieldName}_value"
                                    />
                                    ${setting.description ? html`
                                      <div class="settings-hint">${setting.description}</div>
                                    ` : ""}
                                  </div>
                                `;
                              }
                              case "image_upload": {
                                return html`
                                  <div class="settings-field full-width">
                                    <label class="settings-label">${setting.label}</label>
                                    ${currentValue ? html`
                                      <img
                                        src="${currentValue}"
                                        alt="Preview"
                                        style="height: 8rem; width: auto; border-radius: var(--nexus-radius-md); border: 1px solid var(--nexus-base-300); margin-bottom: 0.5rem;"
                                      />
                                    ` : ""}
                                    <div style="display: flex; gap: 0.5rem;">
                                      <input
                                        type="text"
                                        name="${fieldName}"
                                        value="${toStringValue(currentValue)}"
                                        placeholder="URL de la imagen"
                                        class="settings-input"
                                        style="flex: 1;"
                                      />
                                      <button
                                        type="button"
                                        class="btn-media-library"
                                        style="padding: 0.75rem 1rem; border: 1px solid var(--nexus-base-300); background: var(--nexus-base-100); border-radius: var(--nexus-radius-md); cursor: pointer;"
                                      >
                                        Examinar
                                      </button>
                                    </div>
                                    ${setting.description ? html`
                                      <div class="settings-hint">${setting.description}</div>
                                    ` : ""}
                                  </div>
                                `;
                              }
                              case "text":
                              case "image":
                              default: {
                                return html`
                                  <div class="settings-field">
                                    <label class="settings-label">${setting.label}</label>
                                    <input
                                      type="text"
                                      name="${fieldName}"
                                      value="${toStringValue(currentValue)}"
                                      class="settings-input"
                                    />
                                    ${setting.description ? html`
                                      <div class="settings-hint">${setting.description}</div>
                                    ` : ""}
                                  </div>
                                `;
                              }
                            }
                          })}
                        </div>
                      </div>
                    `)}
                    <div class="settings-actions">
                      ${NexusButton({ label: "Guardar ajustes", type: "primary", isSubmit: true })}
                    </div>
                  </form>
                </div>
              ` : ""}
            </div>
          `
        })}

        <!-- Available Themes -->
        ${NexusCard({
          children: html`
            <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0 0 1rem 0;">Themes disponibles</h2>
            ${available.length === 0 ? html`
              <p style="font-size: 0.875rem; opacity: 0.6;">
                No hay otros themes instalados en este momento.
              </p>
            ` : html`
              <div class="theme-grid">
                ${available.map((theme) => html`
                  <div class="theme-card">
                    ${renderScreenshot(theme.screenshots)}
                    <div class="theme-card-body">
                      <div class="theme-card-header">
                        <h3 class="theme-card-title" style="font-size: 1.125rem;">
                          ${theme.displayName || theme.name}
                        </h3>
                        ${theme.version ? html`<span class="theme-version">v${theme.version}</span>` : ""}
                        ${theme.parent ? NexusBadge({ label: `Child de ${theme.parent}`, type: "info", soft: true }) : ""}
                      </div>

                      <p style="font-size: 0.875rem; opacity: 0.7; margin-bottom: 1rem;">
                        ${theme.description || "Theme disponible para activar."}
                      </p>

                      ${theme.author?.name ? html`
                        <p style="font-size: 0.75rem; opacity: 0.6; margin-bottom: 1rem;">
                          Autor:
                          ${theme.author.url ? html`
                            <a href="${theme.author.url}" style="color: var(--nexus-primary);" target="_blank">
                              ${theme.author.name}
                            </a>
                          ` : theme.author.name}
                        </p>
                      ` : ""}

                      <div class="theme-actions">
                        <form method="POST" action="${adminPath}/appearance/themes/activate" style="flex: 1;">
                          <input type="hidden" name="theme" value="${theme.name}" />
                          ${NexusButton({ label: "Activar", type: "primary", size: "sm", isSubmit: true, fullWidth: true })}
                        </form>
                        ${NexusButton({
                          label: "Vista previa",
                          type: "outline",
                          size: "sm",
                          href: `${adminPath}/appearance/themes/preview?theme=${theme.name}`,
                          target: "_blank",
                          fullWidth: true
                        })}
                      </div>
                      ${NexusButton({
                        label: "Editar código",
                        type: "ghost",
                        size: "sm",
                        href: `${adminPath}/appearance/themes/editor?theme=${theme.name}`,
                        fullWidth: true
                      })}
                    </div>
                  </div>
                `)}
              </div>
            `}
          `
        })}
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Links -->
        ${NexusCard({
          children: html`
            <h3 style="font-size: 1.125rem; font-weight: 600; margin: 0 0 1rem 0;">Siguientes pasos</h3>
            <div class="space-y-3">
              <a href="${adminPath}/appearance/menus" class="quick-link">
                <div class="quick-link-content">
                  <strong>Menús</strong>
                  <span>Gestiona los menús y enlaces del sitio</span>
                </div>
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                </svg>
              </a>
              <a href="${adminPath}/settings?category=theme" class="quick-link">
                <div class="quick-link-content">
                  <strong>Otros ajustes visuales</strong>
                  <span>Configura detalles adicionales de la apariencia</span>
                </div>
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                </svg>
              </a>
            </div>
          `
        })}

        <!-- Info -->
        ${NexusCard({
          children: html`
            <h3 style="font-size: 1.125rem; font-weight: 600; margin: 0 0 1rem 0;">Información</h3>
            <ul class="info-list">
              <li>Theme activo: <strong>${activeTheme}</strong></li>
              <li>Total de themes instalados: <strong>${themes.length}</strong></li>
            </ul>
          `
        })}
      </div>
    </div>

    ${raw(`<script>
      // XSS safe - event handlers in addEventListener
      document.addEventListener('DOMContentLoaded', function() {
        // Range input handlers - XSS safe
        const rangeInputs = document.querySelectorAll('input[type="range"][data-range-value-id]');
        rangeInputs.forEach(input => {
          input.addEventListener('input', function() {
            const valueId = this.getAttribute('data-range-value-id');
            const valueElement = document.getElementById(valueId || '');
            if (valueElement) {
              // XSS safe - using textContent
              valueElement.textContent = this.value;
            }
          });
        });

        // Media library buttons - XSS safe
        document.addEventListener('click', function(e) {
          const mediaBtn = e.target.closest('.btn-media-library');
          if (mediaBtn) {
            alert('Media library integration coming soon');
          }
        });
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Themes",
    children: content,
    activePage: "appearance.themes",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default ThemesNexusPage;
