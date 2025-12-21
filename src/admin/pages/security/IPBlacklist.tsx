import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "@/admin/components/layout/AdminLayoutNexus.tsx";
import type { NotificationItem } from "@/admin/components/ui/NotificationPanel.tsx";

interface IPBlacklistProps {
  user?: {
    id: number;
    name: string;
    email: string;
  };
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const IPBlacklistPage = (props: IPBlacklistProps) => {
  const { user, notifications = [], unreadNotificationCount = 0 } = props;

  const content = html`
    <style>
      .modal-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s;
      }

      .modal-overlay.active {
        display: flex;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal-content {
        background: var(--nexus-base-100);
        padding: 2rem;
        border-radius: var(--nexus-radius-lg);
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        animation: slideUp 0.3s;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--nexus-base-content);
      }

      .form-input {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-md);
        font-size: 0.875rem;
        background: var(--nexus-base-100);
        color: var(--nexus-base-content);
        transition: all 0.2s;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--nexus-primary);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .btn-group {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
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

      .btn-secondary {
        background: var(--nexus-base-200);
        color: var(--nexus-base-content);
      }

      .btn-secondary:hover {
        background: var(--nexus-base-300);
      }

      .btn-danger {
        background: var(--nexus-error);
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.8125rem;
      }

      .btn-danger:hover {
        opacity: 0.9;
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
        padding: 1rem;
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

    <div>
      <div class="u-flex-between u-mb-xl">
        <div>
          <h1 class="dashboard-title">Lista Negra de IPs</h1>
          <p class="dashboard-subtitle">Gestiona las direcciones IP bloqueadas</p>
        </div>
        <button onclick="window.openModal()" class="btn btn-primary">+ Bloquear IP</button>
      </div>
    </div>

    <div id="loading" class="text-center p-12">
      <div class="loading-spinner"></div>
      <p class="mt-4 opacity-60">Cargando...</p>
    </div>

    <div class="content-card u-hidden p-0 overflow-hidden" id="table-container">
      <table id="ip-table">
        <thead>
          <tr>
            <th>Dirección IP</th>
            <th>Razón</th>
            <th>Expira</th>
            <th>Agregada</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody id="ip-tbody">
        </tbody>
      </table>
    </div>

    <!-- Add IP Modal -->
    <div id="add-modal" class="modal-overlay">
      <div class="modal-content">
        <h2 class="text-xl font-bold mb-6">Bloquear Dirección IP</h2>
        <form id="add-form" onsubmit="window.handleSubmit(event)">
          <div class="form-group">
            <label class="form-label">Dirección IP <span class="text-error">*</span></label>
            <input type="text" class="form-input" id="ip-input" required placeholder="192.168.1.1">
          </div>
          <div class="form-group">
            <label class="form-label">Razón <span class="text-error">*</span></label>
            <input type="text" class="form-input" id="reason-input" required placeholder="Actividad sospechosa">
          </div>
          <div class="form-group">
            <label class="form-label">Expira el (Opcional)</label>
            <input type="datetime-local" class="form-input" id="expires-input">
          </div>
          <div class="btn-group">
            <button type="button" class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Bloquear IP</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      let rules = [];

      async function loadBlacklist() {
        try {
          const response = await fetch('/api/admin/security/ips/blacklist', {
            credentials: 'include'
          });
          const result = await response.json();
          rules = result.data || [];
          renderTable();
        } catch (error) {
          console.error('Failed to load blacklist:', error);
          document.getElementById('loading').innerHTML = '<p style="color: var(--nexus-error);">Error al cargar la lista</p>';
        }
      }

      function renderTable() {
        const tbody = document.getElementById('ip-tbody');
        const loading = document.getElementById('loading');
        const container = document.getElementById('table-container');

        loading.style.display = 'none';
        container.style.display = 'block';

        if (rules.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center p-12 opacity-60">No hay IPs bloqueadas</td></tr>';
          return;
        }

        tbody.innerHTML = rules.map(rule => \`
          <tr>
            <td><code>\${rule.ip}</code></td>
            <td>\${rule.reason}</td>
            <td>\${rule.expiresAt ? new Date(rule.expiresAt).toLocaleDateString('es-ES') : 'Nunca'}</td>
            <td>\${new Date(rule.createdAt).toLocaleDateString('es-ES')}</td>
            <td class="text-right">
              <button class="btn btn-danger" onclick="removeIP(\${rule.id})">Eliminar</button>
            </td>
          </tr>
        \`).join('');
      }

      async function removeIP(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta IP de la lista negra?')) return;

        try {
          await fetch(\`/api/admin/security/ips/\${id}\`, {
            method: 'DELETE',
            credentials: 'include'
          });
          loadBlacklist();
        } catch (error) {
          console.error('Failed to remove IP:', error);
          alert('Error al eliminar la IP');
        }
      }

      window.openModal = function() {
        document.getElementById('add-modal').classList.add('active');
      }

      window.closeModal = function() {
        document.getElementById('add-modal').classList.remove('active');
        document.getElementById('add-form').reset();
      }

      window.handleSubmit = async function(event) {
        event.preventDefault();
        
        const ip = document.getElementById('ip-input').value;
        const reason = document.getElementById('reason-input').value;
        const expiresAt = document.getElementById('expires-input').value || null;

        try {
          const response = await fetch('/api/admin/security/ips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              ip,
              type: 'block',
              reason,
              expiresAt
            })
          });

          if (response.ok) {
            window.closeModal();
            loadBlacklist();
          } else {
            alert('Error al bloquear la IP');
          }
        } catch (error) {
          console.error('Failed to add IP:', error);
          alert('Error al bloquear la IP');
        }
      }

      // Close modal when clicking outside
      document.getElementById('add-modal').addEventListener('click', function(e) {
        if (e.target === this) {
          window.closeModal();
        }
      });

      loadBlacklist();
    </script>
  `;

  return AdminLayoutNexus({
    title: "Lista Negra de IPs",
    children: content,
    activePage: "security.ips",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default IPBlacklistPage;
