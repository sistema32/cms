import { html } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";

export default function PluginsDbNexus(props: { user: any }) {
  const { user } = props;
  return AdminLayoutNexus({
    title: "Plugins (DB-first)",
    activePage: "plugins",
    user,
    children: html`
      <div class="card">
        <div class="card-header">
          <h2>Plugins (DB-first)</h2>
          <button id="refreshBtn" class="nexus-btn nexus-btn-outline nexus-btn-sm">Refrescar</button>
        </div>
        <div id="pluginsContainer">Cargando plugins...</div>
      </div>
      <script type="module">
        async function loadPlugins() {
          const res = await fetch('/api/plugins');
          const data = await res.json();
          const container = document.getElementById('pluginsContainer');
          if (!data.success) {
            container.textContent = data.error || 'Error al cargar plugins';
            return;
          }
          const plugins = data.data || [];
          if (plugins.length === 0) {
            container.textContent = 'No hay plugins registrados';
            return;
          }
          container.innerHTML = plugins.map(p => \`
            <div class="plugin-row" data-name="\${p.name}">
              <div>
                <strong>\${p.displayName || p.name}</strong> <span class="muted">v\${p.version || '0.0.0'}</span><br/>
                <small>\${p.description || ''}</small>
              </div>
              <div style="display:flex; gap:8px; align-items:center;">
                <span class="badge \${p.status === 'active' ? 'badge-success' : 'badge-default'}">\${p.status}</span>
                <button class="nexus-btn nexus-btn-sm" data-action="\${p.status === 'active' ? 'deactivate' : 'activate'}">\${p.status === 'active' ? 'Desactivar' : 'Activar'}</button>
              </div>
            </div>
          \`).join('');

          container.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
              const row = btn.closest('.plugin-row');
              const name = row?.dataset.name;
              const action = btn.dataset.action;
              if (!name || !action) return;
              btn.disabled = true;
              const res = await fetch(\`/api/plugins/\${name}/\${action}\`, { method: 'POST' });
              const rj = await res.json().catch(() => ({}));
              btn.disabled = false;
              if (!res.ok || !rj.success) {
                alert(rj.error || 'Error');
                return;
              }
              loadPlugins();
            });
          });
        }
        document.getElementById('refreshBtn').addEventListener('click', loadPlugins);
        loadPlugins();
      </script>
      <style>
        .card { background: white; padding: 16px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .plugin-row { display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid #eee; border-radius:8px; margin-bottom:8px; }
        .badge { padding:4px 8px; border-radius:12px; font-size:12px; text-transform:uppercase; }
        .badge-success { background:#e6f6ec; color:#1f7a3e; }
        .badge-default { background:#f1f1f5; color:#555; }
        .muted { color:#777; }
      </style>
    `,
  });
}
