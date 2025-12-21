import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "@/admin/components/layout/AdminLayoutNexus.tsx";
import type { NotificationItem } from "@/admin/components/ui/NotificationPanel.tsx";

interface SecurityLogsProps {
  user?: {
    id: number;
    name: string;
    email: string;
  };
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const SecurityLogsPage = (props: SecurityLogsProps) => {
  const { user, notifications = [], unreadNotificationCount = 0 } = props;

  const content = html`
    <style>
      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .filter-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nexus-base-content);
      }

      .filter-select {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-md);
        font-size: 0.875rem;
        background: var(--nexus-base-100);
        color: var(--nexus-base-content);
        transition: all 0.2s;
      }

      .filter-select:focus {
        outline: none;
        border-color: var(--nexus-primary);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .badge {
        display: inline-block;
        padding: 0.25rem 0.625rem;
        border-radius: var(--nexus-radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .badge-critical { background: rgba(243, 18, 96, 0.1); color: #f31260; }
      .badge-high { background: rgba(245, 165, 36, 0.1); color: #f5a524; }
      .badge-medium { background: rgba(245, 165, 36, 0.1); color: #f5a524; }
      .badge-low { background: rgba(22, 123, 255, 0.1); color: #167bff; }
      .badge-blocked { background: rgba(243, 18, 96, 0.1); color: #f31260; }
      .badge-allowed { background: rgba(11, 191, 88, 0.1); color: #0bbf58; }

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

      .btn-secondary {
        background: var(--nexus-base-200);
        color: var(--nexus-base-content);
      }

      .btn-secondary:hover {
        background: var(--nexus-base-300);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: var(--nexus-base-200);
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content);
        border-bottom: 1px solid var(--nexus-base-300);
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--nexus-base-200);
        font-size: 0.875rem;
        color: var(--nexus-base-content);
      }

      tr:hover {
        background: rgba(22, 123, 255, 0.03);
      }

      code {
        font-family: 'Courier New', monospace;
        background: var(--nexus-base-200);
        padding: 0.25rem 0.5rem;
        border-radius: var(--nexus-radius-sm);
        font-size: 0.8125rem;
      }
    </style>

    <div>
      <div class="u-flex-between u-mb-xl">
        <div>
          <h1 class="dashboard-title">Logs de Seguridad</h1>
          <p class="dashboard-subtitle">Visualiza y analiza eventos de seguridad</p>
        </div>
        <div class="u-flex-gap-sm">
          <button onclick="exportLogs('csv')" class="btn btn-primary">📥 Exportar CSV</button>
          <button onclick="exportLogs('json')" class="btn btn-primary">📥 Exportar JSON</button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="content-card u-mb-lg">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">Tipo</label>
          <select class="filter-select" id="filter-type" onchange="loadLogs()">
            <option value="">Todos los Tipos</option>
            <option value="rate_limit_exceeded">Rate Limit</option>
            <option value="sql_injection">SQL Injection</option>
            <option value="xss_attempt">Intento XSS</option>
            <option value="path_traversal">Path Traversal</option>
            <option value="suspicious_activity">Sospechoso</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Severidad</label>
          <select class="filter-select" id="filter-severity" onchange="loadLogs()">
            <option value="">Todas las Severidades</option>
            <option value="critical">Crítico</option>
            <option value="high">Alto</option>
            <option value="medium">Medio</option>
            <option value="low">Bajo</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Dirección IP</label>
          <input type="text" class="filter-select" id="filter-ip" placeholder="192.168.1.1" onchange="loadLogs()">
        </div>

        <div class="filter-group">
          <label class="filter-label">Fecha Inicio</label>
          <input type="date" class="filter-select" id="filter-start" onchange="loadLogs()">
        </div>

        <div class="filter-group">
          <label class="filter-label">Fecha Fin</label>
          <input type="date" class="filter-select" id="filter-end" onchange="loadLogs()">
        </div>
      </div>
      <div class="u-mt-md">
        <button onclick="clearFilters()" class="btn btn-secondary">Limpiar Filtros</button>
      </div>
    </div>

    <div id="loading" class="text-center p-12">
      <div class="loading-spinner"></div>
      <p class="mt-4 opacity-60">Cargando logs...</p>
    </div>

    <div class="content-card u-hidden p-0 overflow-hidden" id="table-container">
      <table id="logs-table">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Tipo</th>
            <th>Dirección IP</th>
            <th>Ruta</th>
            <th>Severidad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody id="logs-tbody">
        </tbody>
      </table>
    </div>

    <style>
      .loading-spinner {
        display: inline-block; width: 40px; height: 40px; 
        border: 3px solid var(--nexus-base-300); 
        border-top-color: var(--nexus-primary); 
        border-radius: 50%; 
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>

    <script>
      async function loadLogs() {
        const type = document.getElementById('filter-type').value;
        const severity = document.getElementById('filter-severity').value;
        const ip = document.getElementById('filter-ip').value;
        const startDate = document.getElementById('filter-start').value;
        const endDate = document.getElementById('filter-end').value;

        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (severity) params.append('severity', severity);
        if (ip) params.append('ip', ip);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('limit', '50');

        try {
          const response = await fetch(\`/api/admin/security/logs?\${params}\`, {
            credentials: 'include'
          });
          const result = await response.json();
          renderLogs(result.data || []);
        } catch (error) {
          console.error('Failed to load logs:', error);
          document.getElementById('loading').innerHTML = '<p style="color: var(--nexus-error);">Error al cargar los logs</p>';
        }
      }

      function renderLogs(logs) {
        const tbody = document.getElementById('logs-tbody');
        const loading = document.getElementById('loading');
        const container = document.getElementById('table-container');

        loading.style.display = 'none';
        container.style.display = 'block';

        if (logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center p-12 opacity-60">No se encontraron logs</td></tr>';
          return;
        }

        tbody.innerHTML = logs.map(log => \`
          <tr>
            <td>\${new Date(log.createdAt).toLocaleString('es-ES')}</td>
            <td>\${log.type.replace(/_/g, ' ').toUpperCase()}</td>
            <td><code>\${log.ip}</code></td>
            <td>\${log.path || '-'}</td>
            <td><span class="badge badge-\${log.severity}">\${log.severity.toUpperCase()}</span></td>
            <td><span class="badge badge-\${log.blocked ? 'blocked' : 'allowed'}">\${log.blocked ? 'Bloqueado' : 'Permitido'}</span></td>
          </tr>
        \`).join('');
      }

      function clearFilters() {
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-severity').value = '';
        document.getElementById('filter-ip').value = '';
        document.getElementById('filter-start').value = '';
        document.getElementById('filter-end').value = '';
        loadLogs();
      }

      async function exportLogs(format) {
        const type = document.getElementById('filter-type').value;
        const severity = document.getElementById('filter-severity').value;
        const ip = document.getElementById('filter-ip').value;
        const startDate = document.getElementById('filter-start').value;
        const endDate = document.getElementById('filter-end').value;

        const params = new URLSearchParams({ format });
        if (type) params.append('type', type);
        if (severity) params.append('severity', severity);
        if (ip) params.append('ip', ip);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        window.location.href = \`/api/admin/security/logs/export?\${params}\`;
      }

      loadLogs();
    </script>
  `;

  return AdminLayoutNexus({
    title: "Logs de Seguridad",
    children: content,
    activePage: "security.logs",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default SecurityLogsPage;
