import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "../../components/AdminLayoutNexus.tsx";
import type { NotificationItem } from "../../components/NotificationPanel.tsx";

interface SecuritySettingsProps {
    user?: {
        id: number;
        name: string;
        email: string;
    };
    notifications?: NotificationItem[];
    unreadNotificationCount?: number;
}

export const SecuritySettingsPage = (props: SecuritySettingsProps) => {
    const { user, notifications = [], unreadNotificationCount = 0 } = props;

    const content = html`
    <style>
      .dashboard-title {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
        letter-spacing: -0.025em;
      }

      .dashboard-subtitle {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        margin-bottom: 2rem;
        font-weight: 400;
      }

      .content-card {
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: var(--nexus-card-padding, 20px);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.03);
        margin-bottom: 1.5rem;
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid var(--nexus-base-200);
      }

      .setting-item:last-child {
        border-bottom: none;
      }

      .setting-info h3 {
        font-size: 0.9375rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .setting-info p {
        font-size: 0.8125rem;
        color: var(--nexus-base-content);
        opacity: 0.65;
      }

      .form-input, .form-select {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-md);
        font-size: 0.875rem;
        background: var(--nexus-base-100);
        color: var(--nexus-base-content);
        transition: all 0.2s;
        width: 200px;
      }

      .form-input:focus, .form-select:focus {
        outline: none;
        border-color: var(--nexus-primary);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 24px;
      }

      .toggle-switch input {
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
        background-color: var(--nexus-base-300);
        transition: 0.3s;
        border-radius: 24px;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      input:checked + .toggle-slider {
        background-color: var(--nexus-primary);
      }

      input:checked + .toggle-slider:before {
        transform: translateX(24px);
      }

      .btn {
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: var(--nexus-radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--nexus-primary);
        color: white;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }
    </style>

    <div>
      <h1 class="dashboard-title">Configuración de Seguridad</h1>
      <p class="dashboard-subtitle">Ajusta las configuraciones generales del sistema de seguridad</p>
    </div>

    <!-- General Settings -->
    <div class="content-card">
      <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">Configuración General</h2>
      <div id="settings-container">
        <p style="text-align: center; padding: 2rem; color: var(--nexus-base-content); opacity: 0.6;">Cargando configuración...</p>
      </div>
      <div style="margin-top: 1.5rem; text-align: right;">
        <button class="btn btn-primary" onclick="saveSettings()">Guardar Cambios</button>
      </div>
    </div>

    <script>
      let settings = {};

      async function loadSettings() {
        try {
          const response = await fetch('/api/admin/security/settings', {
            credentials: 'include'
          });
          const result = await response.json();
          settings = result.data || {};
          renderSettings();
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }

      function renderSettings() {
        const container = document.getElementById('settings-container');
        
        const settingsConfig = [
          {
            key: 'security.enabled',
            label: 'Sistema de Seguridad',
            description: 'Habilitar o deshabilitar el sistema de seguridad completo',
            type: 'boolean',
            default: true
          },
          {
            key: 'security.log_all_requests',
            label: 'Registrar Todas las Solicitudes',
            description: 'Registrar todas las solicitudes HTTP (puede afectar el rendimiento)',
            type: 'boolean',
            default: false
          },
          {
            key: 'security.block_suspicious_ips',
            label: 'Bloqueo Automático de IPs',
            description: 'Bloquear automáticamente IPs con actividad sospechosa',
            type: 'boolean',
            default: true
          },
          {
            key: 'security.max_login_attempts',
            label: 'Intentos Máximos de Login',
            description: 'Número máximo de intentos de login antes de bloquear',
            type: 'number',
            default: 5
          },
          {
            key: 'security.block_duration',
            label: 'Duración de Bloqueo (minutos)',
            description: 'Tiempo que una IP permanece bloqueada',
            type: 'number',
            default: 30
          },
          {
            key: 'security.email_notifications',
            label: 'Notificaciones por Email',
            description: 'Enviar alertas de seguridad por correo electrónico',
            type: 'boolean',
            default: true
          },
          {
            key: 'security.notification_threshold',
            label: 'Umbral de Notificación',
            description: 'Nivel mínimo de severidad para enviar notificaciones',
            type: 'select',
            options: ['low', 'medium', 'high', 'critical'],
            default: 'high'
          }
        ];

        container.innerHTML = settingsConfig.map(config => {
          const value = settings[config.key] !== undefined ? settings[config.key] : config.default;
          
          let input = '';
          if (config.type === 'boolean') {
            input = \`
              <label class="toggle-switch">
                <input type="checkbox" id="\${config.key}" \${value ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            \`;
          } else if (config.type === 'number') {
            input = \`<input type="number" class="form-input" id="\${config.key}" value="\${value}">\`;
          } else if (config.type === 'select') {
            input = \`
              <select class="form-select" id="\${config.key}">
                \${config.options.map(opt => \`<option value="\${opt}" \${value === opt ? 'selected' : ''}>\${opt.toUpperCase()}</option>\`).join('')}
              </select>
            \`;
          }

          return \`
            <div class="setting-item">
              <div class="setting-info">
                <h3>\${config.label}</h3>
                <p>\${config.description}</p>
              </div>
              <div>
                \${input}
              </div>
            </div>
          \`;
        }).join('');
      }

      async function saveSettings() {
        const settingsData = {};
        
        document.querySelectorAll('[id^="security."]').forEach(element => {
          const key = element.id;
          let value;
          
          if (element.type === 'checkbox') {
            value = element.checked;
          } else if (element.type === 'number') {
            value = parseInt(element.value);
          } else {
            value = element.value;
          }
          
          settingsData[key] = value;
        });

        try {
          const promises = Object.entries(settingsData).map(([key, value]) => 
            fetch('/api/admin/security/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ key, value })
            })
          );

          await Promise.all(promises);
          alert('Configuración guardada correctamente');
        } catch (error) {
          console.error('Failed to save settings:', error);
          alert('Error al guardar la configuración');
        }
      }

      loadSettings();
    </script>
  `;

    return AdminLayoutNexus({
        title: "Configuración de Seguridad",
        children: content,
        activePage: "security.settings",
        user,
        notifications,
        unreadNotificationCount,
    });
};

export default SecuritySettingsPage;
