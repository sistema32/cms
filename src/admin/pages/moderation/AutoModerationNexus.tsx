import { html, raw } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "@/admin/components/nexus/NexusComponents.tsx";
import { env } from "@/config/env.ts";

interface AutoModerationStats {
  totalChecked: number;
  spamDetected: number;
  hamDetected: number;
  falsePositives: number;
  falseNegatives: number;
}

interface AutoModerationNexusProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  config: {
    enabled: boolean;
    strategy: 'local-only' | 'service-only' | 'hybrid';
    hasAkismet: boolean;
    akismetVerified?: boolean;
    threshold: number;
    autoApprove: boolean;
    autoApproveThreshold: number;
    autoMarkSpam: boolean;
    autoMarkSpamThreshold: number;
    learningEnabled: boolean;
    sendFeedback: boolean;
  };
  stats: AutoModerationStats;
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

export const AutoModerationNexusPage = (props: AutoModerationNexusProps) => {
  const {
    user,
    config,
    stats,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;

  const spamRate = stats.totalChecked > 0
    ? ((stats.spamDetected / stats.totalChecked) * 100).toFixed(1)
    : '0.0';

  const accuracy = (stats.falsePositives + stats.falseNegatives) > 0
    ? (100 - ((stats.falsePositives + stats.falseNegatives) / stats.totalChecked * 100)).toFixed(1)
    : '100.0';

  const content_html = html`
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

      /* ========== STATS GRID ========== */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: 1.5rem;
        transition: all 0.2s;
      }

      .stat-card:hover {
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
        color: var(--nexus-base-content, #1e2328);
      }

      .stat-value.success {
        color: var(--nexus-success, #17c964);
      }

      .stat-value.error {
        color: var(--nexus-error, #f31260);
      }

      .stat-value.warning {
        color: var(--nexus-warning, #f5a524);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
      }

      /* ========== ALERT BOXES ========== */
      .alert-box {
        padding: 1rem 1.25rem;
        border-radius: var(--nexus-radius-md, 0.5rem);
        margin-bottom: 1.5rem;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }

      .alert-box svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 0.125rem;
      }

      .alert-box.info {
        background: rgba(22, 123, 255, 0.08);
        border: 1px solid rgba(22, 123, 255, 0.2);
        color: var(--nexus-primary, #167bff);
      }

      .alert-box.warning {
        background: rgba(245, 165, 36, 0.08);
        border: 1px solid rgba(245, 165, 36, 0.2);
        color: var(--nexus-warning, #f5a524);
      }

      .alert-box.error {
        background: rgba(243, 18, 96, 0.08);
        border: 1px solid rgba(243, 18, 96, 0.2);
        color: var(--nexus-error, #f31260);
      }

      .alert-box.success {
        background: rgba(23, 201, 100, 0.08);
        border: 1px solid rgba(23, 201, 100, 0.2);
        color: var(--nexus-success, #17c964);
      }

      .alert-content strong {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 600;
      }

      /* ========== FORM FIELDS ========== */
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

      .form-hint {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-top: 0.5rem;
      }

      .form-select {
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

      .form-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      /* ========== RANGE SLIDER ========== */
      .range-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .range-value-display {
        text-align: center;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--nexus-primary, #167bff);
        padding: 0.5rem;
        background: rgba(22, 123, 255, 0.08);
        border-radius: var(--nexus-radius-md, 0.5rem);
      }

      .range-input {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: var(--nexus-base-200, #eef0f2);
        outline: none;
        -webkit-appearance: none;
      }

      .range-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--nexus-primary, #167bff);
        cursor: pointer;
        transition: all 0.2s;
      }

      .range-input::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }

      .range-input::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--nexus-primary, #167bff);
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .range-input::-moz-range-thumb:hover {
        transform: scale(1.2);
      }

      /* ========== TOGGLE SWITCH ========== */
      .toggle-wrapper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .toggle-wrapper:hover {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.02);
      }

      .toggle-label-wrapper {
        flex: 1;
      }

      .toggle-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        display: block;
        margin-bottom: 0.25rem;
      }

      .toggle-description {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
      }

      .toggle-switch {
        position: relative;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
      }

      .toggle-switch input[type="checkbox"] {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--nexus-base-300, #dcdee0);
        border-radius: 24px;
        transition: 0.3s;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        border-radius: 50%;
        transition: 0.3s;
      }

      .toggle-switch input:checked + .toggle-slider {
        background-color: var(--nexus-primary, #167bff);
      }

      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }

      /* ========== FORM ACTIONS ========== */
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .page-title-nexus {
          font-size: 1.5rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column;
        }
      }
      .page-header-actions {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div class="page-header-actions">
        <div>
          <h1 class="page-title-nexus">Moderación Automática</h1>
          <p class="page-subtitle-nexus">Configura el sistema de detección y filtrado automático de spam</p>
        </div>
        ${NexusBadge({
    label: config.enabled ? "Activo" : "Inactivo",
    type: config.enabled ? "success" : "warning",
    soft: false
  })}
      </div>
    </div>

    <!-- Alerts -->
    ${!config.enabled ? html`
      <div class="alert-box warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div class="alert-content">
          <strong>Plugin Deshabilitado</strong>
          La moderación automática está deshabilitada. Los comentarios usarán las reglas básicas de moderación.
        </div>
      </div>
    ` : ""}

    ${config.strategy === 'service-only' && !config.hasAkismet ? html`
      <div class="alert-box warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div class="alert-content">
          <strong>Configuración Incompleta</strong>
          La estrategia "service-only" requiere Akismet configurado. Configure AKISMET_API_KEY y AKISMET_SITE_URL en las variables de entorno.
        </div>
      </div>
    ` : ""}

    ${config.hasAkismet && config.akismetVerified === false ? html`
      <div class="alert-box error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div class="alert-content">
          <strong>API Key de Akismet Inválida</strong>
          La API key de Akismet no pudo ser verificada. Por favor, revise su configuración.
        </div>
      </div>
    ` : ""}

    ${config.hasAkismet && config.akismetVerified === true ? html`
      <div class="alert-box success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div class="alert-content">
          <strong>Akismet Verificado</strong>
          Tu API key de Akismet está verificada y funcionando correctamente.
        </div>
      </div>
    ` : ""}

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalChecked}</div>
        <div class="stat-label">Comentarios Analizados</div>
      </div>

      <div class="stat-card">
        <div class="stat-value error">${stats.spamDetected}</div>
        <div class="stat-label">Spam Detectado</div>
      </div>

      <div class="stat-card">
        <div class="stat-value success">${stats.hamDetected}</div>
        <div class="stat-label">Comentarios Legítimos</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${spamRate}%</div>
        <div class="stat-label">Tasa de Spam</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${accuracy}%</div>
        <div class="stat-label">Precisión</div>
      </div>

      <div class="stat-card">
        <div class="stat-value warning">${stats.falsePositives + stats.falseNegatives}</div>
        <div class="stat-label">Errores (FP + FN)</div>
      </div>
    </div>

    <!-- Configuration Form -->
    <form method="POST" action="${env.ADMIN_PATH}/auto-moderation/update">
      <!-- General Settings -->
      ${NexusCard({
    header: html`<h3 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Configuración General</h3>`,
    children: html`
          <div class="form-field">
            <div class="toggle-wrapper">
              <div class="toggle-label-wrapper">
                <span class="toggle-label">Habilitar Plugin</span>
                <span class="toggle-description">Activa o desactiva la moderación automática</span>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  name="enabled"
                  value="true"
                  ${config.enabled ? "checked" : ""}
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">Estrategia de Detección</label>
            <select name="strategy" class="form-select">
              <option value="local-only" ${config.strategy === 'local-only' ? 'selected' : ''}>
                Local (rápido, sin API externa)
              </option>
              <option value="service-only" ${config.strategy === 'service-only' ? 'selected' : ''} ${!config.hasAkismet ? 'disabled' : ''}>
                Servicio (Akismet) ${!config.hasAkismet ? '- Requiere configuración' : ''}
              </option>
              <option value="hybrid" ${config.strategy === 'hybrid' ? 'selected' : ''} ${!config.hasAkismet ? 'disabled' : ''}>
                Híbrido (local + servicio) ${!config.hasAkismet ? '- Requiere Akismet' : ''}
              </option>
            </select>
            <p class="form-hint">Método para detectar spam en comentarios</p>
          </div>

          <div class="form-field" style="margin-bottom: 0;">
            <label class="form-label">Umbral de Spam: <span id="thresholdValue">${config.threshold}</span></label>
            <div class="range-wrapper">
              <div class="range-value-display" id="thresholdDisplay">${config.threshold}</div>
              <input
                type="range"
                name="threshold"
                min="0"
                max="100"
                value="${config.threshold}"
                class="range-input"
                id="thresholdSlider"
              />
            </div>
            <p class="form-hint">Score mínimo (0-100) para considerar un comentario como spam</p>
          </div>
        `
  })}

      <!-- Automatic Actions -->
      ${NexusCard({
    header: html`<h3 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Acciones Automáticas</h3>`,
    children: html`
          <div class="alert-box info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div class="alert-content">
              Configure qué hacer automáticamente con los comentarios según su score de spam.
            </div>
          </div>

          <div class="form-field">
            <div class="toggle-wrapper">
              <div class="toggle-label-wrapper">
                <span class="toggle-label">Auto-aprobar comentarios seguros</span>
                <span class="toggle-description">Aprueba automáticamente comentarios con score muy bajo</span>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  name="autoApprove"
                  value="true"
                  id="autoApproveToggle"
                  ${config.autoApprove ? "checked" : ""}
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-field" id="autoApproveThresholdField" style="display: ${config.autoApprove ? 'block' : 'none'};">
            <label class="form-label">Umbral de Auto-aprobación: <span id="autoApproveValue">${config.autoApproveThreshold}</span></label>
            <div class="range-wrapper">
              <div class="range-value-display" id="autoApproveDisplay">${config.autoApproveThreshold}</div>
              <input
                type="range"
                name="autoApproveThreshold"
                min="0"
                max="50"
                value="${config.autoApproveThreshold}"
                class="range-input"
                id="autoApproveSlider"
              />
            </div>
            <p class="form-hint">Score máximo para auto-aprobar</p>
          </div>

          <div class="form-field">
            <div class="toggle-wrapper">
              <div class="toggle-label-wrapper">
                <span class="toggle-label">Auto-marcar spam obvio</span>
                <span class="toggle-description">Marca automáticamente como spam comentarios con score muy alto</span>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  name="autoMarkSpam"
                  value="true"
                  id="autoMarkSpamToggle"
                  ${config.autoMarkSpam ? "checked" : ""}
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-field" id="autoMarkSpamThresholdField" style="display: ${config.autoMarkSpam ? 'block' : 'none'}; margin-bottom: 0;">
            <label class="form-label">Umbral de Auto-spam: <span id="autoMarkSpamValue">${config.autoMarkSpamThreshold}</span></label>
            <div class="range-wrapper">
              <div class="range-value-display" id="autoMarkSpamDisplay">${config.autoMarkSpamThreshold}</div>
              <input
                type="range"
                name="autoMarkSpamThreshold"
                min="50"
                max="100"
                value="${config.autoMarkSpamThreshold}"
                class="range-input"
                id="autoMarkSpamSlider"
              />
            </div>
            <p class="form-hint">Score mínimo para auto-marcar spam</p>
          </div>
        `
  })}

      <!-- Learning System -->
      ${NexusCard({
    header: html`<h3 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Sistema de Aprendizaje</h3>`,
    children: html`
          <div class="alert-box info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div class="alert-content">
              El sistema puede aprender de tus decisiones de moderación y enviar feedback a Akismet para mejorar la detección.
            </div>
          </div>

          <div class="form-field">
            <div class="toggle-wrapper">
              <div class="toggle-label-wrapper">
                <span class="toggle-label">Habilitar Aprendizaje</span>
                <span class="toggle-description">Permite que el sistema aprenda de falsos positivos/negativos</span>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  name="learningEnabled"
                  value="true"
                  id="learningToggle"
                  ${config.learningEnabled ? "checked" : ""}
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-field" id="sendFeedbackField" style="display: ${config.learningEnabled ? 'block' : 'none'}; margin-bottom: 0;">
            <div class="toggle-wrapper">
              <div class="toggle-label-wrapper">
                <span class="toggle-label">Enviar Feedback a Akismet</span>
                <span class="toggle-description">
                  Reporta falsos positivos/negativos a Akismet ${!config.hasAkismet ? '(requiere Akismet)' : ''}
                </span>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  name="sendFeedback"
                  value="true"
                  ${config.sendFeedback ? "checked" : ""}
                  ${!config.hasAkismet ? "disabled" : ""}
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        `
  })}

      <!-- Akismet Configuration -->
      ${config.hasAkismet ? NexusCard({
    header: html`<h3 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Configuración de Akismet</h3>`,
    children: html`
          <p style="font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.7; margin-bottom: 1rem;">
            La configuración de Akismet se realiza mediante variables de entorno:<br>
            • <code>AKISMET_API_KEY</code> - Tu API key de Akismet<br>
            • <code>AKISMET_SITE_URL</code> - URL de tu sitio web
          </p>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">
            <a href="https://akismet.com/signup/" target="_blank" style="color: var(--nexus-primary, #167bff); text-decoration: none;">
              Obtener API key de Akismet →
            </a>
          </p>
          ${NexusButton({
      label: "Verificar API Key",
      type: "outline",
      onClick: "verifyAkismet()",
      icon: html`
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            `
    })}
        `
  }) : NexusCard({
    header: html`<h3 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Akismet No Configurado</h3>`,
    children: html`
          <div class="alert-box warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div class="alert-content">
              <strong>Akismet No Disponible</strong>
              Para usar detección con servicios externos, configura Akismet mediante variables de entorno.
            </div>
          </div>
          <p style="font-size: 0.875rem; color: var(--nexus-base-content); opacity: 0.7; margin-bottom: 1rem;">
            Añade estas variables de entorno para habilitar Akismet:<br>
            • <code>AKISMET_API_KEY=tu-api-key</code><br>
            • <code>AKISMET_SITE_URL=https://tu-sitio.com</code>
          </p>
          <p style="font-size: 0.875rem; margin: 0;">
            <a href="https://akismet.com/signup/" target="_blank" style="color: var(--nexus-primary, #167bff); text-decoration: none;">
              Obtener API key de Akismet →
            </a>
          </p>
        `
  })}

      <!-- Form Actions -->
      ${NexusCard({
    children: html`
          <div class="form-actions">
            ${NexusButton({
      label: "Resetear Estadísticas",
      type: "outline",
      onClick: "resetStats()"
    })}
            ${NexusButton({
      label: "Guardar Configuración",
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
        `
  })}
    </form>

    ${raw(`<script>
      // Range slider updates (XSS safe)
      document.addEventListener('DOMContentLoaded', function() {
        // Threshold slider
        const thresholdSlider = document.getElementById('thresholdSlider');
        const thresholdDisplay = document.getElementById('thresholdDisplay');
        const thresholdValue = document.getElementById('thresholdValue');

        if (thresholdSlider && thresholdDisplay && thresholdValue) {
          thresholdSlider.addEventListener('input', function() {
            const value = this.value;
            thresholdDisplay.textContent = value; // XSS safe
            thresholdValue.textContent = value; // XSS safe
          });
        }

        // Auto-approve threshold slider
        const autoApproveSlider = document.getElementById('autoApproveSlider');
        const autoApproveDisplay = document.getElementById('autoApproveDisplay');
        const autoApproveValue = document.getElementById('autoApproveValue');
        const autoApproveToggle = document.getElementById('autoApproveToggle');
        const autoApproveField = document.getElementById('autoApproveThresholdField');

        if (autoApproveSlider && autoApproveDisplay && autoApproveValue) {
          autoApproveSlider.addEventListener('input', function() {
            const value = this.value;
            autoApproveDisplay.textContent = value; // XSS safe
            autoApproveValue.textContent = value; // XSS safe
          });
        }

        if (autoApproveToggle && autoApproveField) {
          autoApproveToggle.addEventListener('change', function() {
            autoApproveField.style.display = this.checked ? 'block' : 'none';
          });
        }

        // Auto-mark spam threshold slider
        const autoMarkSpamSlider = document.getElementById('autoMarkSpamSlider');
        const autoMarkSpamDisplay = document.getElementById('autoMarkSpamDisplay');
        const autoMarkSpamValue = document.getElementById('autoMarkSpamValue');
        const autoMarkSpamToggle = document.getElementById('autoMarkSpamToggle');
        const autoMarkSpamField = document.getElementById('autoMarkSpamThresholdField');

        if (autoMarkSpamSlider && autoMarkSpamDisplay && autoMarkSpamValue) {
          autoMarkSpamSlider.addEventListener('input', function() {
            const value = this.value;
            autoMarkSpamDisplay.textContent = value; // XSS safe
            autoMarkSpamValue.textContent = value; // XSS safe
          });
        }

        if (autoMarkSpamToggle && autoMarkSpamField) {
          autoMarkSpamToggle.addEventListener('change', function() {
            autoMarkSpamField.style.display = this.checked ? 'block' : 'none';
          });
        }

        // Learning toggle
        const learningToggle = document.getElementById('learningToggle');
        const sendFeedbackField = document.getElementById('sendFeedbackField');

        if (learningToggle && sendFeedbackField) {
          learningToggle.addEventListener('change', function() {
            sendFeedbackField.style.display = this.checked ? 'block' : 'none';
          });
        }
      });

      // Verify Akismet API key (XSS safe)
      async function verifyAkismet() {
        try {
          const response = await fetch('/admin/auto-moderation/verify-akismet', {
            method: 'POST',
          });

          const result = await response.json();

          if (result.verified) {
            alert('API key de Akismet verificada correctamente');
            window.location.reload();
          } else {
            alert('No se pudo verificar la API key de Akismet');
          }
        } catch (error) {
          alert('Error al verificar Akismet');
        }
      }

      // Reset statistics (XSS safe)
      async function resetStats() {
        if (!confirm('¿Estás seguro de que quieres resetear las estadísticas?')) {
          return;
        }

        try {
          const response = await fetch('/admin/auto-moderation/reset-stats', {
            method: 'POST',
          });

          if (response.ok) {
            alert('Estadísticas reseteadas correctamente');
            window.location.reload();
          } else {
            alert('Error al resetear estadísticas');
          }
        } catch (error) {
          alert('Error de conexión');
        }
      }
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Moderación Automática",
    children: content_html,
    activePage: "moderation.auto",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default AutoModerationNexusPage;
// @ts-nocheck
