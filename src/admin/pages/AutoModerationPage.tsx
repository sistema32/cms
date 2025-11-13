import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";

interface AutoModerationStats {
  totalChecked: number;
  spamDetected: number;
  hamDetected: number;
  falsePositives: number;
  falseNegatives: number;
}

interface AutoModerationPageProps {
  user: {
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
}

export const AutoModerationPage = (props: AutoModerationPageProps) => {
  const { user, config, stats } = props;

  const spamRate = stats.totalChecked > 0
    ? ((stats.spamDetected / stats.totalChecked) * 100).toFixed(1)
    : '0.0';

  const accuracy = (stats.falsePositives + stats.falseNegatives) > 0
    ? (100 - ((stats.falsePositives + stats.falseNegatives) / stats.totalChecked * 100)).toFixed(1)
    : '100.0';

  const content = html`
    <style>
      .auto-mod-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: var(--fallback-b1, oklch(var(--b1)));
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
      }

      .stat-label {
        font-size: 0.875rem;
        opacity: 0.7;
      }

      .config-section {
        background: var(--fallback-b1, oklch(var(--b1)));
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .config-section h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.25rem;
      }

      .form-field {
        margin-bottom: 1.5rem;
      }

      .form-field label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      .form-field .description {
        display: block;
        font-size: 0.875rem;
        opacity: 0.7;
        margin-top: 0.25rem;
      }

      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .status-badge.success {
        background: #d1fae5;
        color: #065f46;
      }

      .status-badge.warning {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge.error {
        background: #fee2e2;
        color: #991b1b;
      }

      .alert-box {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .alert-box.info {
        background: #dbeafe;
        border-left: 4px solid #3b82f6;
        color: #1e40af;
      }

      .alert-box.warning {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        color: #92400e;
      }

      .button-group {
        display: flex;
        gap: 0.5rem;
        margin-top: 1.5rem;
      }
    </style>

    <div class="auto-mod-container">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Moderación Automática</h1>
        <span class="status-badge ${config.enabled ? 'success' : 'warning'}">
          ${config.enabled ? '✓ Activo' : '⚠ Inactivo'}
        </span>
      </div>

      ${!config.enabled ? html`
        <div class="alert-box warning">
          <strong>⚠ Plugin Deshabilitado</strong><br>
          La moderación automática está deshabilitada. Los comentarios usarán las reglas básicas de moderación.
        </div>
      ` : ''}

      ${config.strategy === 'service-only' && !config.hasAkismet ? html`
        <div class="alert-box warning">
          <strong>⚠ Configuración Incompleta</strong><br>
          La estrategia "service-only" requiere Akismet configurado. Configure AKISMET_API_KEY y AKISMET_SITE_URL en las variables de entorno.
        </div>
      ` : ''}

      ${config.hasAkismet && config.akismetVerified === false ? html`
        <div class="alert-box error">
          <strong>❌ API Key de Akismet Inválida</strong><br>
          La API key de Akismet no pudo ser verificada. Por favor, revise su configuración.
        </div>
      ` : ''}

      <!-- Estadísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalChecked}</div>
          <div class="stat-label">Comentarios Analizados</div>
        </div>

        <div class="stat-card">
          <div class="stat-value" style="color: #ef4444;">${stats.spamDetected}</div>
          <div class="stat-label">Spam Detectado</div>
        </div>

        <div class="stat-card">
          <div class="stat-value" style="color: #10b981;">${stats.hamDetected}</div>
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
          <div class="stat-value" style="color: #f59e0b;">${stats.falsePositives + stats.falseNegatives}</div>
          <div class="stat-label">Errores (FP + FN)</div>
        </div>
      </div>

      <!-- Configuración General -->
      <form method="POST" action="/admin/auto-moderation/update">
        <div class="config-section">
          <h3>⚙️ Configuración General</h3>

          <div class="form-field">
            <label class="cursor-pointer label">
              <span class="label-text">
                <strong>Habilitar Plugin</strong>
                <span class="description">Activa o desactiva la moderación automática</span>
              </span>
              <input
                type="checkbox"
                name="enabled"
                class="checkbox checkbox-primary"
                ${config.enabled ? 'checked' : ''}
              />
            </label>
          </div>

          <div class="form-field">
            <label>
              <strong>Estrategia de Detección</strong>
              <span class="description">Método para detectar spam</span>
            </label>
            <select name="strategy" class="select select-bordered w-full">
              <option value="local-only" ${config.strategy === 'local-only' ? 'selected' : ''}>
                🏠 Solo Local (rápido, sin API externa)
              </option>
              <option value="service-only" ${config.strategy === 'service-only' ? 'selected' : ''}
                ${!config.hasAkismet ? 'disabled' : ''}>
                ☁️ Solo Servicio (Akismet) ${!config.hasAkismet ? '- Requiere configuración' : ''}
              </option>
              <option value="hybrid" ${config.strategy === 'hybrid' ? 'selected' : ''}
                ${!config.hasAkismet ? 'disabled' : ''}>
                🔀 Híbrido (local + servicio) ${!config.hasAkismet ? '- Requiere Akismet' : ''}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label>
              <strong>Umbral de Spam</strong>
              <span class="description">Score mínimo (0-100) para considerar un comentario como spam (actual: ${config.threshold})</span>
            </label>
            <input
              type="range"
              name="threshold"
              min="0"
              max="100"
              value="${config.threshold}"
              class="range range-primary"
              oninput="this.nextElementSibling.textContent = this.value"
            />
            <output class="label-text">${config.threshold}</output>
          </div>
        </div>

        <!-- Acciones Automáticas -->
        <div class="config-section">
          <h3>🤖 Acciones Automáticas</h3>

          <div class="alert-box info">
            <strong>ℹ️ Sobre las Acciones Automáticas</strong><br>
            Configure qué hacer automáticamente con los comentarios según su score de spam.
          </div>

          <div class="form-field">
            <label class="cursor-pointer label">
              <span class="label-text">
                <strong>Auto-aprobar comentarios seguros</strong>
                <span class="description">Aprueba automáticamente comentarios con score muy bajo</span>
              </span>
              <input
                type="checkbox"
                name="autoApprove"
                class="checkbox checkbox-primary"
                ${config.autoApprove ? 'checked' : ''}
              />
            </label>
          </div>

          ${config.autoApprove ? html`
            <div class="form-field">
              <label>
                <strong>Umbral de Auto-aprobación</strong>
                <span class="description">Score máximo para auto-aprobar (actual: ${config.autoApproveThreshold})</span>
              </label>
              <input
                type="range"
                name="autoApproveThreshold"
                min="0"
                max="50"
                value="${config.autoApproveThreshold}"
                class="range range-success"
                oninput="this.nextElementSibling.textContent = this.value"
              />
              <output class="label-text">${config.autoApproveThreshold}</output>
            </div>
          ` : ''}

          <div class="form-field">
            <label class="cursor-pointer label">
              <span class="label-text">
                <strong>Auto-marcar spam obvio</strong>
                <span class="description">Marca automáticamente como spam comentarios con score muy alto</span>
              </span>
              <input
                type="checkbox"
                name="autoMarkSpam"
                class="checkbox checkbox-primary"
                ${config.autoMarkSpam ? 'checked' : ''}
              />
            </label>
          </div>

          ${config.autoMarkSpam ? html`
            <div class="form-field">
              <label>
                <strong>Umbral de Auto-spam</strong>
                <span class="description">Score mínimo para auto-marcar spam (actual: ${config.autoMarkSpamThreshold})</span>
              </label>
              <input
                type="range"
                name="autoMarkSpamThreshold"
                min="50"
                max="100"
                value="${config.autoMarkSpamThreshold}"
                class="range range-error"
                oninput="this.nextElementSibling.textContent = this.value"
              />
              <output class="label-text">${config.autoMarkSpamThreshold}</output>
            </div>
          ` : ''}
        </div>

        <!-- Sistema de Aprendizaje -->
        <div class="config-section">
          <h3>🧠 Sistema de Aprendizaje</h3>

          <div class="alert-box info">
            <strong>ℹ️ Feedback Loop</strong><br>
            El sistema puede aprender de tus decisiones de moderación y enviar feedback a Akismet para mejorar la detección.
          </div>

          <div class="form-field">
            <label class="cursor-pointer label">
              <span class="label-text">
                <strong>Habilitar Aprendizaje</strong>
                <span class="description">Permite que el sistema aprenda de falsos positivos/negativos</span>
              </span>
              <input
                type="checkbox"
                name="learningEnabled"
                class="checkbox checkbox-primary"
                ${config.learningEnabled ? 'checked' : ''}
              />
            </label>
          </div>

          ${config.learningEnabled ? html`
            <div class="form-field">
              <label class="cursor-pointer label">
                <span class="label-text">
                  <strong>Enviar Feedback a Akismet</strong>
                  <span class="description">Reporta falsos positivos/negativos a Akismet ${!config.hasAkismet ? '(requiere Akismet)' : ''}</span>
                </span>
                <input
                  type="checkbox"
                  name="sendFeedback"
                  class="checkbox checkbox-primary"
                  ${config.sendFeedback ? 'checked' : ''}
                  ${!config.hasAkismet ? 'disabled' : ''}
                />
              </label>
            </div>
          ` : ''}
        </div>

        <!-- Configuración de Akismet -->
        ${config.hasAkismet ? html`
          <div class="config-section">
            <h3>☁️ Configuración de Akismet</h3>

            <div class="alert-box ${config.akismetVerified ? 'info' : 'warning'}">
              <strong>${config.akismetVerified ? '✓' : '⚠'} Estado de Akismet</strong><br>
              ${config.akismetVerified
                ? 'Tu API key de Akismet está verificada y funcionando correctamente.'
                : 'No se pudo verificar la API key de Akismet. El servicio podría no estar disponible.'}
            </div>

            <p class="text-sm opacity-70 mb-4">
              La configuración de Akismet se realiza mediante variables de entorno:<br>
              • <code>AKISMET_API_KEY</code> - Tu API key de Akismet<br>
              • <code>AKISMET_SITE_URL</code> - URL de tu sitio web<br>
              <br>
              <a href="https://akismet.com/signup/" target="_blank" class="link">
                Obtener API key de Akismet →
              </a>
            </p>

            <button type="button" class="btn btn-outline btn-sm" onclick="verifyAkismet()">
              🔄 Verificar API Key
            </button>
          </div>
        ` : html`
          <div class="config-section">
            <h3>☁️ Akismet No Configurado</h3>

            <div class="alert-box warning">
              <strong>⚠ Akismet No Disponible</strong><br>
              Para usar detección con servicios externos, configura Akismet mediante variables de entorno.
            </div>

            <p class="text-sm opacity-70 mb-4">
              Añade estas variables de entorno para habilitar Akismet:<br>
              • <code>AKISMET_API_KEY=tu-api-key</code><br>
              • <code>AKISMET_SITE_URL=https://tu-sitio.com</code><br>
              <br>
              <a href="https://akismet.com/signup/" target="_blank" class="link">
                Obtener API key de Akismet →
              </a>
            </p>
          </div>
        `}

        <div class="button-group">
          <button type="submit" class="btn btn-primary">
            💾 Guardar Configuración
          </button>
          <button type="button" class="btn btn-outline" onclick="resetStats()">
            🔄 Resetear Estadísticas
          </button>
        </div>
      </form>
    </div>

    <script>
      async function verifyAkismet() {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ Verificando...';

        try {
          const response = await fetch('/admin/auto-moderation/verify-akismet', {
            method: 'POST',
          });

          const result = await response.json();

          if (result.verified) {
            alert('✓ API key de Akismet verificada correctamente');
            location.reload();
          } else {
            alert('✗ No se pudo verificar la API key de Akismet');
          }
        } catch (error) {
          alert('Error al verificar Akismet: ' + error.message);
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      }

      async function resetStats() {
        if (!confirm('¿Estás seguro de que quieres resetear las estadísticas?')) {
          return;
        }

        try {
          const response = await fetch('/admin/auto-moderation/reset-stats', {
            method: 'POST',
          });

          if (response.ok) {
            alert('✓ Estadísticas reseteadas correctamente');
            location.reload();
          } else {
            alert('✗ Error al resetear estadísticas');
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }
    </script>
  `;

  return AdminLayout({
    title: "Moderación Automática",
    user,
    content,
  });
};
