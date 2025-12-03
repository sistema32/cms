import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";

export default function PluginsDbNexus(props: { user: any }) {
  const { user } = props;
  return AdminLayoutNexus({
    title: "Plugins",
    activePage: "plugins",
    user,
    children: html`
      <style>
        /* ========== NEXUS STYLES (Copied from Dashboard) ========== */
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
        }

        .content-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .content-card-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--nexus-base-content, #1e2328);
          letter-spacing: -0.0125em;
        }

        /* Plugin List Styles */
        .plugin-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .plugin-item {
          display: flex;
          flex-direction: column; /* Mobile first */
          gap: 1rem;
          padding: 1.25rem;
          border-radius: var(--nexus-radius-md, 0.5rem);
          border: 1px solid var(--nexus-base-200, #eef0f2);
          transition: all 0.2s;
          background: #fff;
        }

        @media (min-width: 768px) {
          .plugin-item {
            flex-direction: row;
            align-items: flex-start;
          }
        }

        .plugin-item:hover {
          border-color: var(--nexus-primary, #167bff);
          box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.05);
        }

        .plugin-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--nexus-radius-md, 0.5rem);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(22, 123, 255, 0.1);
          color: var(--nexus-primary, #167bff);
          font-size: 1.5rem;
          font-weight: bold;
        }

        .plugin-content {
          flex: 1;
          min-width: 0;
        }

        .plugin-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .plugin-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--nexus-base-content, #1e2328);
        }

        .plugin-version {
          font-size: 0.75rem;
          color: var(--nexus-base-content, #1e2328);
          opacity: 0.5;
          background: var(--nexus-base-200, #eef0f2);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .plugin-description {
          font-size: 0.875rem;
          color: var(--nexus-base-content, #1e2328);
          opacity: 0.7;
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }

        .plugin-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--nexus-base-content, #1e2328);
          opacity: 0.8;
          align-items: center;
        }

        .plugin-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
          align-self: flex-start;
        }

        /* Badges */
        .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
        .badge-success { background: rgba(11, 191, 88, 0.15); color: #0bbf58; }
        .badge-warn { background: rgba(245, 165, 36, 0.15); color: #b25900; }
        .badge-danger { background: rgba(243, 18, 96, 0.15); color: #f31260; }
        .badge-default { background: var(--nexus-base-200, #eef0f2); color: #666; }

        /* Buttons */
        .nexus-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nexus-btn-primary {
          background: var(--nexus-primary, #167bff);
          color: white;
        }
        .nexus-btn-primary:hover { background: #006fee; }

        .nexus-btn-outline {
          background: transparent;
          border-color: var(--nexus-base-300, #dcdee0);
          color: var(--nexus-base-content, #1e2328);
        }
        .nexus-btn-outline:hover {
          border-color: var(--nexus-primary, #167bff);
          color: var(--nexus-primary, #167bff);
        }

        .nexus-btn-ghost {
          background: transparent;
          color: var(--nexus-base-content, #1e2328);
          opacity: 0.7;
        }
        .nexus-btn-ghost:hover {
          background: var(--nexus-base-200, #eef0f2);
          opacity: 1;
        }

        .nexus-btn-sm { padding: 0.25rem 0.75rem; font-size: 0.75rem; }

        /* Modals & Toasts */
        .logs-modal { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter: blur(4px); }
        .logs-content { background:white; border-radius:12px; width:800px; max-height:80vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 20px 50px rgba(0,0,0,0.2); }
        .logs-header { padding: 1rem 1.5rem; border-bottom: 1px solid #eee; display:flex; justify-content:space-between; align-items:center; font-weight:bold; font-size: 1.1rem; }
        .logs-body { padding: 0; overflow-y: auto; flex: 1; background: #1e1e1e; color: #eee; font-family: monospace; font-size: 0.85rem; }
        .log-row { padding: 8px 16px; border-bottom: 1px solid #333; display: flex; gap: 10px; }
        .log-row:last-child { border-bottom: none; }
        .log-time { color: #888; white-space: nowrap; }
        .log-level { text-transform: uppercase; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; min-width: 60px; text-align: center; }
        .log-level.info { background: #2563eb; color: white; }
        .log-level.error { background: #dc2626; color: white; }
        .log-level.warning { background: #d97706; color: white; }
        .log-msg { white-space: pre-wrap; word-break: break-all; }

        #toast-container { position:fixed; right:20px; bottom:20px; display:flex; flex-direction:column; gap:10px; z-index:1200; }
        .toast { padding:12px 20px; border-radius:8px; background:#1e293b; color:white; box-shadow:0 10px 30px rgba(0,0,0,0.2); opacity:0; transform:translateY(20px); transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1); font-size: 0.9rem; display: flex; align-items: center; gap: 10px; }
        .toast.visible { opacity:1; transform:translateY(0); }
        .toast.error { background:#ef4444; }
        .toast.success { background:#22c55e; }

        .confirm-modal { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1100; backdrop-filter: blur(2px); }
        .confirm-content { background:white; padding:24px; border-radius:12px; width:400px; box-shadow:0 20px 50px rgba(0,0,0,0.2); display:grid; gap:20px; }
        .confirm-message { color:#111827; font-weight:600; font-size: 1.1rem; text-align: center; }
        .confirm-actions { display:flex; justify-content:center; gap:12px; }
      </style>

      <div>
        <h1 class="dashboard-title">Gestión de Plugins</h1>
        <p class="dashboard-subtitle">Administra los módulos y extensiones del sistema.</p>

        <!-- Pending Plugins Section -->
        <div class="content-card" id="pending-section" style="margin-bottom: 2rem; display: none;">
          <div class="content-card-header">
            <h2 class="content-card-title">
              🔔 Plugins Pendientes de Aprobación
            </h2>
            <span class="badge badge-warn" id="pending-count">0</span>
          </div>
          <div id="pendingContainer" class="plugin-list">
            <div class="text-center py-4 text-gray-500">No hay plugins pendientes</div>
          </div>
        </div>

        <div class="content-card">
          <div class="content-card-header">
            <h2 class="content-card-title">Plugins Instalados</h2>
            <div style="display: flex; gap: 0.5rem;">
              <button id="discoverBtn" class="nexus-btn nexus-btn-primary nexus-btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                Buscar Nuevos
              </button>
              <button id="refreshBtn" class="nexus-btn nexus-btn-outline nexus-btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refrescar
              </button>
            </div>
          </div>
          <div id="pluginsContainer" class="plugin-list">
            <div class="text-center py-12 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Cargando plugins...
            </div>
          </div>
        </div>
      </div>
      ${raw(`
      <script type="module">
      // ========== PENDING PLUGINS ==========
      async function loadPendingPlugins() {
        const container = document.getElementById('pendingContainer');
        const section = document.getElementById('pending-section');
        const badge = document.getElementById('pending-count');
        
        try {
          const res = await fetch('/api/plugins/pending/list');
          const data = await res.json();
          
          if (!data.success || !data.data.length) {
            section.style.display = 'none';
            return;
          }
          
          const pending = data.data;
          badge.textContent = pending.length;
          section.style.display = 'block';
          
          container.innerHTML = pending.map((p) => {
            const initials = (p.displayName || p.name).substring(0, 2).toUpperCase();
            const permCount = (p.permissions || []).length;
            
            return \`
              <div class="plugin-item" data-name="\${p.name}" style="border-left: 4px solid #f59e0b;">
                <div class="plugin-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">\${initials}</div>
                <div class="plugin-content">
                  <div class="plugin-header">
                    <div class="plugin-name">\${p.displayName || p.name}</div>
                    <div class="plugin-version">v\${p.version || '1.0.0'}</div>
                    <span class="badge badge-warn">Pendiente</span>
                  </div>
                  <div class="plugin-description">\${p.description || 'Sin descripción'}</div>
                  <div class="plugin-meta">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                      <span>Permisos: <strong>\${permCount}</strong></span>
                      <a href="#" class="link-perms text-blue-500 hover:underline ml-1" data-name="\${p.name}">Ver</a>
                    </div>
                  </div>
                </div>
                <div class="plugin-actions">
                  <button class="nexus-btn nexus-btn-sm nexus-btn-primary" data-action="approve">
                    Aprobar
                  </button>
                  <button class="nexus-btn nexus-btn-sm nexus-btn-outline" data-action="reject">
                    Rechazar
                  </button>
                </div>
              </div>
            \`;
          }).join('');
          
          attachPendingEventListeners(container);
          
        } catch (err) {
          console.error('Error loading pending plugins:', err);
          section.style.display = 'none';
        }
      }
      
      function attachPendingEventListeners(container) {
        // Approve/Reject buttons
        container.querySelectorAll('button[data-action]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const row = btn.closest('.plugin-item');
            const name = row?.dataset.name;
            const action = btn.dataset.action;
            if (!name || !action) return;
            
            if (action === 'approve') {
              // Get permissions and show approval modal
              const res = await fetch('/api/plugins/pending/list');
              const data = await res.json();
              const plugin = data.data.find(p => p.name === name);
              
              if (plugin && plugin.permissions.length > 0) {
                const selectedPerms = await showPermissionModal(plugin.displayName, plugin.permissions);
                if (selectedPerms && selectedPerms.length > 0) {
                  await approvePlugin(name);
                } else {
                  showToast('Aprobación cancelada', 'error');
                }
              } else {
                await approvePlugin(name);
              }
            } else if (action === 'reject') {
              const confirmed = await showConfirm('¿Estás seguro de rechazar este plugin?\\nNo se instalará.');
              if (confirmed) {
                await rejectPlugin(name);
              }
            }
          });
        });
        
        // View permissions link
        container.querySelectorAll('.link-perms').forEach(link => {
          link.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const name = link.getAttribute('data-name');
            if (!name) return;
            
            const res = await fetch('/api/plugins/pending/list');
            const data = await res.json();
            const plugin = data.data.find(p => p.name === name);
            
            if (plugin) {
              await showPermissionModal(plugin.displayName, plugin.permissions);
            }
          });
        });
      }
      
      async function approvePlugin(name) {
        try {
          const res = await fetch('/api/plugins/pending/' + name + '/approve', { method: 'POST' });
          const data = await res.json();
          
          if (data.success) {
            showToast('Plugin aprobado correctamente', 'success');
            await loadPendingPlugins();
            await loadPlugins();
          } else {
            showToast(data.error || 'Error al aprobar plugin', 'error');
          }
        } catch (err) {
          showToast('Error de red', 'error');
        }
      }
      
      async function rejectPlugin(name) {
        try {
          const res = await fetch('/api/plugins/pending/' + name + '/reject', { method: 'POST' });
          const data = await res.json();
          
          if (data.success) {
            showToast('Plugin rechazado', 'success');
            await loadPendingPlugins();
          } else {
            showToast(data.error || 'Error al rechazar plugin', 'error');
          }
        } catch (err) {
          showToast('Error de red', 'error');
        }
      }
      
      async function discoverNewPlugins() {
        const btn = document.getElementById('discoverBtn');
        if (!btn) return;
        
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Buscando...';
        
        try {
          const res = await fetch('/api/plugins/discover', { method: 'POST' });
          const data = await res.json();
          
          if (data.success) {
            showToast(data.message || 'Búsqueda completada', 'success');
            await loadPendingPlugins();
          } else {
            showToast(data.error || 'Error al buscar plugins', 'error');
          }
        } catch (err) {
          showToast('Error de red', 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }
      
      // ========== INSTALLED PLUGINS ==========
      async function loadPlugins() {
        const container = document.getElementById('pluginsContainer');
        try {
          const res = await fetch('/api/plugins');
          const data = await res.json();
          
          if (!data.success) {
            container.innerHTML = '<div class="p-8 text-center text-red-500">Error al cargar plugins: ' + (data.error || 'Desconocido') + '</div>';
            return;
          }
          const plugins = data.data || [];
          if (plugins.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-gray-500">No hay plugins registrados</div>';
            return;
          }
          
          container.innerHTML = plugins.map((p) => {
            const missing = p.missingPermissions || [];
            const requested = p.requestedPermissions || [];
            const granted = (p.grants || []).filter(g => g.granted !== false).map(g => g.permission);
            
            let statusBadgeClass = 'badge-default';
            if (p.status === 'active') statusBadgeClass = 'badge-success';
            if (p.status === 'error') statusBadgeClass = 'badge-danger';
            
            const healthBadge = p.lastHealthStatus === 'error'
              ? '<span class="badge badge-danger">Error</span>'
              : p.lastHealthStatus === 'degraded'
                ? '<span class="badge badge-warn">Degradado</span>'
                : '<span class="badge badge-success">Saludable</span>';

            const metrics = p.metrics
              ? '<span>Calls: <strong>' + (p.metrics.routeCalls || 0) + '</strong></span> <span>Err: <strong>' + (p.metrics.routeErrors || 0) + '</strong></span> <span>Lat: <strong>' + Math.round(p.metrics.avgLatencyMs || 0) + 'ms</strong></span>'
              : '<span class="opacity-50">Sin métricas</span>';

            const initials = (p.displayName || p.name).substring(0, 2).toUpperCase();

            return \`
              <div class="plugin-item" data-name="\${p.name}">
                <div class="plugin-icon">\${initials}</div>
                <div class="plugin-content">
                  <div class="plugin-header">
                    <div class="plugin-name">\${p.displayName || p.name}</div>
                    <div class="plugin-version">v\${p.version || '0.0.0'}</div>
                    <span class="badge \${statusBadgeClass}">\${p.status}</span>
                    \${healthBadge}
                    \${p.isSystem ? '<span class="badge badge-default">Sistema</span>' : ''}
                  </div>
                  <div class="plugin-description">\${p.description || 'Sin descripción'}</div>
                  
                  <div class="plugin-meta">
                    <div class="flex items-center gap-2" title="Métricas de Rutas">
                      <svg class="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                      \${metrics}
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                      <span>Permisos: <strong>\${granted.length}</strong> / \${requested.length}</span>
                      \${missing.length ? '<span class="badge badge-danger" title="' + missing.join(', ') + '">Faltan ' + missing.length + '</span>' : ''}
                      <a href="#" class="link-grants text-blue-500 hover:underline ml-1" data-name="\${p.name}">Editar</a>
                    </div>
                  </div>
                </div>
                
                <div class="plugin-actions">
                  \${p.status === 'active' && missing.length > 0
        ? \`<button class="nexus-btn nexus-btn-sm nexus-btn-primary" data-action="retry">Corregir</button>\`
        : \`<button class="nexus-btn nexus-btn-sm \${p.status === 'active' ? 'nexus-btn-outline' : 'nexus-btn-primary'}" data-action="\${p.status === 'active' ? 'deactivate' : 'activate'}">
                        \${p.status === 'active' ? 'Desactivar' : 'Activar'}
                       </button>\`
      }
                  <button class="nexus-btn nexus-btn-ghost nexus-btn-sm" data-action="logs" title="Ver Logs">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </button>
                </div>
              </div>
            \`;
  }).join('');

  attachEventListeners(container);

} catch (err) {
  console.error(err);
  container.innerHTML = '<div class="p-8 text-center text-red-500">Error de conexión</div>';
}
      }

function attachEventListeners(container) {
  container.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.plugin-item');
      const name = row?.dataset.name;
      const action = btn.dataset.action;
      if (!name || !action) return;

      if (action === 'logs') {
        showLogs(name);
        return;
      }

      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = '...';

      const targetAction = action === 'retry' ? 'activate' : action;
      try {
        const res = await fetch('/api/plugins/' + name + '/' + targetAction, { method: 'POST' });
        const rj = await res.json().catch(() => ({}));

        if (!res.ok || !rj.success) {
          if (Array.isArray(rj.missing) && rj.missing.length) {
            const selectedPerms = await showPermissionModal(row.querySelector('.plugin-name').textContent, rj.missing);
            if (selectedPerms && selectedPerms.length > 0) {
              const granted = await grantPermissions(name, selectedPerms);
              if (granted) {
                // Auto-retry activation
                const retryRes = await fetch('/api/plugins/' + name + '/activate', { method: 'POST' });
                const retryJson = await retryRes.json().catch(() => ({}));
                if (retryJson.success) {
                  showToast('Plugin activado correctamente', 'success');
                  loadPlugins();
                } else {
                  showToast(retryJson.error || 'Error al activar tras conceder permisos', 'error');
                }
              }
            } else {
              showToast('Activación cancelada - no se seleccionaron permisos', 'error');
            }
          } else {
            showToast(rj.error || 'Error en la operación', 'error');
          }
        } else {
          showToast('Operación exitosa', 'success');
          loadPlugins();
        }
      } catch (e) {
        showToast('Error de red', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  });

  container.querySelectorAll('.link-grants').forEach(link => {
    link.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const name = link.getAttribute('data-name');
      if (!name) return;
      await editPermissions(name);
    });
  });
}

async function grantPermissions(name, permissions) {
  try {
    // Get current
    const currentRes = await fetch('/api/plugins/' + name + '/grants');
    const currentJson = await currentRes.json().catch(() => ({ data: [] }));
    const grants = currentJson.data || [];

    const mergedMap = new Map();
    grants.forEach((g) => mergedMap.set(g.permission, { permission: g.permission, granted: g.granted !== false }));
    permissions.forEach((m) => mergedMap.set(m, { permission: m, granted: true }));

    const merged = Array.from(mergedMap.values());

    const putRes = await fetch('/api/plugins/' + name + '/grants', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grants: merged }),
    });
    const putJson = await putRes.json();

    if (putJson.success) {
      showToast('Permisos concedidos', 'success');
      return true;
    } else {
      showToast(putJson.error || 'Error al guardar permisos', 'error');
      return false;
    }
  } catch (e) {
    showToast('Error al procesar permisos', 'error');
    return false;
  }
}

async function editPermissions(name) {
  const currentRes = await fetch('/api/plugins/' + name + '/grants');
  const currentJson = await currentRes.json().catch(() => ({ data: [] }));
  const grants = currentJson.data || [];
  const current = grants.map(g => g.permission).join('\\n');

  const next = prompt('Permisos (uno por línea):', current);
  if (next === null) return;

  const newGrants = next.split('\\n').map(s => s.trim()).filter(Boolean).map(permission => ({ permission, granted: true }));

  const res = await fetch('/api/plugins/' + name + '/grants', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grants: newGrants }),
  });
  const rj = await res.json();

  if (rj.success) {
    showToast('Permisos actualizados', 'success');
    loadPlugins();
  } else {
    showToast(rj.error || 'Error al actualizar', 'error');
  }
}

async function showLogs(name) {
  const modal = document.createElement('div');
  modal.className = 'logs-modal';
  modal.innerHTML = '<div class="logs-content"><div class="logs-header"><strong>Logs: ' + name + '</strong><button class="close">×</button></div><div class="logs-body">Cargando...</div></div>';
  document.body.appendChild(modal);

  modal.querySelector('.close')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  try {
    const res = await fetch('/api/plugins/' + name + '/logs?limit=50');
    const json = await res.json();
    const body = modal.querySelector('.logs-body');

    if (!json.success) {
      body.innerHTML = '<div class="p-4 text-red-400">' + (json.error || 'Error al cargar logs') + '</div>';
    } else {
      const logs = (json.data?.logs) || [];
      if (!logs.length) {
        body.innerHTML = '<div class="p-4 text-gray-500">No hay logs disponibles</div>';
      } else {
        body.innerHTML = logs.map((l) => {
          const ts = l.created_at || l.createdAt;
          const date = ts ? new Date(typeof ts === 'number' ? ts * 1000 : ts) : new Date();
          const level = l.level || 'info';
          return '<div class="log-row"><div class="log-time">' + date.toLocaleTimeString() + '</div><div class="log-level ' + level + '">' + level + '</div><div class="log-msg">' + (l.description || l.details || l.action || '') + '</div></div>';
        }).join('');
      }
    }
  } catch (e) {
    modal.querySelector('.logs-body').innerHTML = '<div class="p-4 text-red-400">Error de conexión</div>';
  }
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showPermissionModal(pluginName, permissions) {
  return new Promise((resolve) => {
    // Categorize permissions
    const categorized = {
      db: permissions.filter(p => p.startsWith('db:')),
      fs: permissions.filter(p => p.startsWith('fs:')),
      route: permissions.filter(p => p.startsWith('route:')),
      hook: permissions.filter(p => p.startsWith('hook:')),
      ui: permissions.filter(p => p.startsWith('ui:')),
      cron: permissions.filter(p => p.startsWith('cron:')),
      other: permissions.filter(p => !p.match(/^(db|fs|route|hook|ui|cron):/))
    };

    // Track selected permissions
    const selectedPermissions = new Set(permissions); // All selected by default

    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = \`
      <div class="confirm-content" style="max-width: 700px; max-height: 85vh; display: flex; flex-direction: column;">
        <!-- Header -->
        <div style="padding: 1.5rem; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #1e2328;">
              🔐 Gestión de Permisos
            </h3>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: #666;">
              Plugin: <strong>\${pluginName}</strong>
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge badge-primary" style="font-size: 0.875rem;">
              <span id="selected-count">\${permissions.length}</span> / \${permissions.length} seleccionados
            </span>
          </div>
        </div>

        <!-- Select All / None Controls -->
        <div style="padding: 1rem 1.5rem; background: #f8f9fa; border-bottom: 1px solid #eee; display: flex; gap: 0.5rem;">
          <button id="select-all-btn" class="nexus-btn nexus-btn-outline nexus-btn-sm" style="flex: 1;">
            ✓ Seleccionar Todos
          </button>
          <button id="select-none-btn" class="nexus-btn nexus-btn-outline nexus-btn-sm" style="flex: 1;">
            ✗ Deseleccionar Todos
          </button>
        </div>

        <!-- Body with permissions -->
        <div style="flex: 1; overflow-y: auto; padding: 1.5rem;">
          \${renderPermissionCategory('Database', 'db', categorized.db, '#167bff', \`
            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
          \`, '#f8f9fa')}
          
          \${renderPermissionCategory('Filesystem', 'fs', categorized.fs, '#f59e0b', \`
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
          \`, '#fef3c7')}
          
          \${renderPermissionCategory('HTTP Routes', 'route', categorized.route, '#10b981', \`
            <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
          \`, '#d1fae5')}
          
          \${renderPermissionCategory('System Hooks', 'hook', categorized.hook, '#8b5cf6', \`
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
          \`, '#ede9fe')}
          
          \${renderPermissionCategory('UI Components', 'ui', categorized.ui, '#ec4899', \`
            <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
          \`, '#fce7f3')}
          
          \${renderPermissionCategory('Cron Jobs', 'cron', categorized.cron, '#06b6d4', \`
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          \`, '#cffafe')}
          
          \${renderPermissionCategory('Other', 'other', categorized.other, '#6b7280', \`
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
          \`, '#f3f4f6')}
        </div>

        <!-- Footer -->
        <div style="padding: 1rem 1.5rem; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa;">
          <div style="font-size: 0.875rem; color: #666;">
            <span id="permission-summary">Todos los permisos seleccionados</span>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button class="nexus-btn nexus-btn-outline permission-cancel">Cancelar</button>
            <button class="nexus-btn nexus-btn-primary permission-accept" id="accept-btn">
              Aceptar Seleccionados
            </button>
          </div>
        </div>
      </div>
    \`;
    
    // Helper function to render a permission category
    function renderPermissionCategory(title, category, perms, color, iconPath, bgColor) {
      if (perms.length === 0) return '';
      
      return \`
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
            <svg style="width: 20px; height: 20px; color: \${color};" fill="currentColor" viewBox="0 0 20 20">
              \${iconPath}
            </svg>
            <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: #1e2328;">\${title}</h4>
            <span class="badge badge-default" style="font-size: 0.75rem; margin-left: auto;">
              <span class="category-count" data-category="\${category}">\${perms.length}</span> permisos
            </span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; padding-left: 1.75rem;">
            \${perms.map(p => \`
              <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: \${bgColor}; border-radius: 6px; cursor: pointer; transition: all 0.2s; border: 2px solid transparent;" class="permission-item" data-permission="\${p}">
                <input type="checkbox" checked class="permission-checkbox" value="\${p}" style="width: 18px; height: 18px; cursor: pointer; accent-color: \${color};">
                <span style="flex: 1; font-family: monospace; font-size: 0.875rem; color: #374151; word-break: break-all;">\${p}</span>
                <svg style="width: 16px; height: 16px; color: \${color}; opacity: 0.7;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </label>
            \`).join('')}
          </div>
        </div>
      \`;
    }
    
    document.body.appendChild(modal);
    
    // Update count and summary
    function updatePermissionCount() {
      const count = selectedPermissions.size;
      document.getElementById('selected-count').textContent = count;
      document.getElementById('permission-summary').textContent = 
        count === 0 ? 'Ningún permiso seleccionado' :
        count === permissions.length ? 'Todos los permisos seleccionados' :
        \`\${count} de \${permissions.length} permisos seleccionados\`;
      
      // Update accept button
      const acceptBtn = document.getElementById('accept-btn');
      if (count === 0) {
        acceptBtn.disabled = true;
        acceptBtn.style.opacity = '0.5';
        acceptBtn.style.cursor = 'not-allowed';
      } else {
        acceptBtn.disabled = false;
        acceptBtn.style.opacity = '1';
        acceptBtn.style.cursor = 'pointer';
      }
    }
    
    // Checkbox change handlers
    modal.querySelectorAll('.permission-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const perm = e.target.value;
        const label = e.target.closest('.permission-item');
        
        if (e.target.checked) {
          selectedPermissions.add(perm);
          label.style.borderColor = 'transparent';
          label.style.opacity = '1';
        } else {
          selectedPermissions.delete(perm);
          label.style.borderColor = '#e5e7eb';
          label.style.opacity = '0.6';
        }
        updatePermissionCount();
      });
    });
    
    // Select All button
    document.getElementById('select-all-btn').addEventListener('click', () => {
      modal.querySelectorAll('.permission-checkbox').forEach(cb => {
        cb.checked = true;
        cb.closest('.permission-item').style.opacity = '1';
        cb.closest('.permission-item').style.borderColor = 'transparent';
        selectedPermissions.add(cb.value);
      });
      updatePermissionCount();
    });
    
    // Select None button
    document.getElementById('select-none-btn').addEventListener('click', () => {
      modal.querySelectorAll('.permission-checkbox').forEach(cb => {
        cb.checked = false;
        cb.closest('.permission-item').style.opacity = '0.6';
        cb.closest('.permission-item').style.borderColor = '#e5e7eb';
        selectedPermissions.delete(cb.value);
      });
      updatePermissionCount();
    });

    // Accept button
    modal.querySelector('.permission-accept')?.addEventListener('click', () => {
      if (selectedPermissions.size > 0) {
        modal.remove();
        resolve(Array.from(selectedPermissions));
      }
    });
    
    // Cancel button
    modal.querySelector('.permission-cancel')?.addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });
    
    // Click outside to cancel
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve(false);
      }
    });
    
    updatePermissionCount();
  });
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = '<div class="confirm-content"><div class="confirm-message">' + message.replace(/\\n/g, '<br>') + '</div><div class="confirm-actions"><button class="nexus-btn nexus-btn-primary confirm-yes">Sí, continuar</button><button class="nexus-btn nexus-btn-outline confirm-no">Cancelar</button></div></div>';
    document.body.appendChild(modal);

    modal.querySelector('.confirm-yes')?.addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });
    modal.querySelector('.confirm-no')?.addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });
  });
}

document.getElementById('refreshBtn').addEventListener('click', () => {
  loadPlugins();
  loadPendingPlugins();
});

document.getElementById('discoverBtn').addEventListener('click', discoverNewPlugins);

loadPlugins();
loadPendingPlugins();
      </script >
      `)}
  `,
  });
}
