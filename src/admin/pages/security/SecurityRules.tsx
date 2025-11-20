import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "../../components/AdminLayoutNexus.tsx";
import type { NotificationItem } from "../../components/NotificationPanel.tsx";

interface SecurityRulesProps {
    user?: {
        id: number;
        name: string;
        email: string;
    };
    notifications?: NotificationItem[];
    unreadNotificationCount?: number;
}

export const SecurityRulesPage = (props: SecurityRulesProps) => {
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

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nexus-base-content);
      }

      .form-input, .form-select, .form-textarea {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-md);
        font-size: 0.875rem;
        background: var(--nexus-base-100);
        color: var(--nexus-base-content);
        transition: all 0.2s;
      }

      .form-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .form-input:focus, .form-select:focus, .form-textarea:focus {
        outline: none;
        border-color: var(--nexus-primary);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
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

      .btn-danger {
        background: var(--nexus-error);
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.8125rem;
      }

      .rule-item {
        background: var(--nexus-base-100);
        border: 1px solid var(--nexus-base-200);
        border-radius: var(--nexus-radius-md);
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .rule-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 0.5rem;
      }

      .rule-info h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .rule-info p {
        font-size: 0.875rem;
        color: var(--nexus-base-content);
        opacity: 0.65;
        margin-bottom: 0.5rem;
      }

      .badge {
        display: inline-block;
        padding: 0.25rem 0.625rem;
        border-radius: var(--nexus-radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 0.5rem;
      }

      .badge-enabled {
        background: rgba(11, 191, 88, 0.1);
        color: #0bbf58;
      }

      .badge-disabled {
        background: rgba(243, 18, 96, 0.1);
        color: #f31260;
      }

      .badge-critical { background: rgba(243, 18, 96, 0.1); color: #f31260; }
      .badge-high { background: rgba(245, 165, 36, 0.1); color: #f5a524; }
      .badge-medium { background: rgba(22, 123, 255, 0.1); color: #167bff; }
      .badge-low { background: rgba(11, 191, 88, 0.1); color: #0bbf58; }

      code {
        font-family: 'Courier New', monospace;
        background: var(--nexus-base-200);
        padding: 0.25rem 0.5rem;
        border-radius: var(--nexus-radius-sm);
        font-size: 0.8125rem;
      }
    </style>

    <div>
      <h1 class="dashboard-title">Reglas de Seguridad</h1>
      <p class="dashboard-subtitle">Gestiona reglas personalizadas de detección de amenazas</p>
    </div>

    <!-- Add New Rule Form -->
    <div class="content-card">
      <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">Nueva Regla</h2>
      <form id="add-rule-form" onsubmit="handleAddRule(event)">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-input" id="name" required placeholder="Bloquear SQL Injection">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" id="type" required>
              <option value="regex">Regex</option>
              <option value="keyword">Palabra Clave</option>
              <option value="ip">IP</option>
              <option value="user_agent">User Agent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Acción</label>
            <select class="form-select" id="action" required>
              <option value="block">Bloquear</option>
              <option value="log">Solo Registrar</option>
              <option value="alert">Alertar</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Severidad</label>
            <select class="form-select" id="severity" required>
              <option value="critical">Crítico</option>
              <option value="high">Alto</option>
              <option value="medium" selected>Medio</option>
              <option value="low">Bajo</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Patrón</label>
          <input type="text" class="form-input" id="pattern" required placeholder="SELECT.*FROM|DROP.*TABLE">
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="description" placeholder="Detecta intentos de SQL injection"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Agregar Regla</button>
      </form>
    </div>

    <!-- Existing Rules -->
    <div class="content-card">
      <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">Reglas Activas</h2>
      <div id="rules-container">
        <p style="text-align: center; padding: 2rem; color: var(--nexus-base-content); opacity: 0.6;">Cargando reglas...</p>
      </div>
    </div>

    <script>
      let rules = [];

      async function loadRules() {
        try {
          const response = await fetch('/api/admin/security/rules', {
            credentials: 'include'
          });
          const result = await response.json();
          rules = result.data || [];
          renderRules();
        } catch (error) {
          console.error('Failed to load rules:', error);
        }
      }

      function renderRules() {
        const container = document.getElementById('rules-container');
        
        if (rules.length === 0) {
          container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--nexus-base-content); opacity: 0.6;">No hay reglas configuradas</p>';
          return;
        }

        container.innerHTML = rules.map(rule => \`
          <div class="rule-item">
            <div class="rule-header">
              <div class="rule-info">
                <h3>
                  \${rule.name}
                  <span class="badge badge-\${rule.enabled ? 'enabled' : 'disabled'}">
                    \${rule.enabled ? 'Activa' : 'Inactiva'}
                  </span>
                  <span class="badge badge-\${rule.severity}">\${rule.severity.toUpperCase()}</span>
                </h3>
                <p>\${rule.description || 'Sin descripción'}</p>
                <p><strong>Tipo:</strong> \${rule.type} | <strong>Acción:</strong> \${rule.action}</p>
                <p><code>\${rule.pattern}</code></p>
                <p style="font-size: 0.75rem; opacity: 0.5;">Activada \${rule.triggerCount} veces</p>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="toggleRule(\${rule.id}, \${!rule.enabled})">
                  \${rule.enabled ? 'Desactivar' : 'Activar'}
                </button>
                <button class="btn btn-danger" onclick="deleteRule(\${rule.id})">Eliminar</button>
              </div>
            </div>
          </div>
        \`).join('');
      }

      async function handleAddRule(event) {
        event.preventDefault();
        
        const data = {
          name: document.getElementById('name').value,
          type: document.getElementById('type').value,
          pattern: document.getElementById('pattern').value,
          action: document.getElementById('action').value,
          severity: document.getElementById('severity').value,
          description: document.getElementById('description').value,
          enabled: true
        };

        try {
          const response = await fetch('/api/admin/security/rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
          });

          if (response.ok) {
            document.getElementById('add-rule-form').reset();
            loadRules();
          } else {
            alert('Error al crear la regla');
          }
        } catch (error) {
          console.error('Failed to add rule:', error);
          alert('Error al crear la regla');
        }
      }

      async function toggleRule(id, enabled) {
        try {
          await fetch(\`/api/admin/security/rules/\${id}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ enabled })
          });
          loadRules();
        } catch (error) {
          console.error('Failed to toggle rule:', error);
        }
      }

      async function deleteRule(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta regla?')) return;

        try {
          await fetch(\`/api/admin/security/rules/\${id}\`, {
            method: 'DELETE',
            credentials: 'include'
          });
          loadRules();
        } catch (error) {
          console.error('Failed to delete rule:', error);
        }
      }

      loadRules();
    </script>
  `;

    return AdminLayoutNexus({
        title: "Reglas de Seguridad",
        children: content,
        activePage: "security.rules",
        user,
        notifications,
        unreadNotificationCount,
    });
};

export default SecurityRulesPage;
