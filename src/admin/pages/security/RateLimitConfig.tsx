import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "@/admin/components/layout/AdminLayoutNexus.tsx";
import type { NotificationItem } from "@/admin/components/ui/NotificationPanel.tsx";

interface RateLimitConfigProps {
  user?: {
    id: number;
    name: string;
    email: string;
  };
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const RateLimitConfigPage = (props: RateLimitConfigProps) => {
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

      .form-input, .form-select {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-md);
        font-size: 0.875rem;
        background: var(--nexus-base-100);
        color: var(--nexus-base-content);
        transition: all 0.2s;
      }

      .form-input:focus, .form-select:focus {
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
        display: flex;
        justify-content: space-between;
        align-items: center;
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
    </style>

    <div>
      <h1 class="dashboard-title">Configuración de Rate Limiting</h1>
      <p class="dashboard-subtitle">Gestiona las reglas de limitación de tasa por endpoint</p>
    </div>

    <!-- Add New Rule Form -->
    <div class="content-card">
      <h2 class="content-card-title u-mb-lg">Nueva Regla</h2>
      <form id="add-rule-form" onsubmit="handleAddRule(event)">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-input" id="name" required placeholder="API Login">
          </div>
          <div class="form-group">
            <label class="form-label">Ruta</label>
            <input type="text" class="form-input" id="path" required placeholder="/api/auth/login">
          </div>
          <div class="form-group">
            <label class="form-label">Método HTTP</label>
            <select class="form-select" id="method">
              <option value="">Todos</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Máximo de Requests</label>
            <input type="number" class="form-input" id="maxRequests" required value="10">
          </div>
          <div class="form-group">
            <label class="form-label">Ventana (segundos)</label>
            <input type="number" class="form-input" id="windowSeconds" required value="60">
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Agregar Regla</button>
      </form>
    </div>

    <!-- Existing Rules -->
    <div class="content-card">
      <h2 class="content-card-title u-mb-lg">Reglas Activas</h2>
      <div id="rules-container">
        <p class="p-8 text-center opacity-60">Cargando reglas...</p>
      </div>
    </div>

    <script>
      let rules = [];

      async function loadRules() {
        try {
          const response = await fetch('/api/admin/security/rate-limit', {
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
          container.innerHTML = '<p class="p-8 text-center opacity-60">No hay reglas configuradas</p>';
          return;
        }

        container.innerHTML = rules.map(rule => \`
          <div class="rule-item">
            <div class="rule-info">
              <h3>
                \${rule.name}
                <span class="badge badge-\${rule.enabled ? 'enabled' : 'disabled'}">
                  \${rule.enabled ? 'Activa' : 'Inactiva'}
                </span>
              </h3>
              <p>\${rule.path} \${rule.method ? '(' + rule.method + ')' : ''} - \${rule.maxRequests} requests / \${rule.windowSeconds}s</p>
            </div>
            <div class="u-flex-gap-sm">
              <button class="btn btn-primary" onclick="toggleRule(\${rule.id}, \${!rule.enabled})">
                \${rule.enabled ? 'Desactivar' : 'Activar'}
              </button>
              <button class="btn btn-danger" onclick="deleteRule(\${rule.id})">Eliminar</button>
            </div>
          </div>
        \`).join('');
      }

      async function handleAddRule(event) {
        event.preventDefault();
        
        const data = {
          name: document.getElementById('name').value,
          path: document.getElementById('path').value,
          method: document.getElementById('method').value || null,
          maxRequests: parseInt(document.getElementById('maxRequests').value),
          windowSeconds: parseInt(document.getElementById('windowSeconds').value),
          enabled: true
        };

        try {
          const response = await fetch('/api/admin/security/rate-limit', {
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
          await fetch(\`/api/admin/security/rate-limit/\${id}\`, {
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
          await fetch(\`/api/admin/security/rate-limit/\${id}\`, {
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
    title: "Configuración de Rate Limiting",
    children: content,
    activePage: "security.ratelimit",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default RateLimitConfigPage;
