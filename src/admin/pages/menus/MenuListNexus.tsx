
import { html } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusInput, NexusBadge, NexusTable, NexusPagination } from "@/admin/components/nexus/NexusComponents.tsx";
import { env } from "@/config/env.ts";

interface MenuListNexusProps {
  user: any;
  menus: Array<{
    id: number;
    name: string;
    slug: string;
    location: string | null;
    isActive: boolean;
    createdAt: Date;
  }>;
  registeredLocations: string[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export const MenuListNexus = (props: MenuListNexusProps) => {
  const adminPath = env.ADMIN_PATH;
  const { user, menus, registeredLocations, pagination } = props;

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(date));
  };

  const tableRows = menus.map((menu) => html`
    <tr>
      <td>
        <div class="content-title-cell">
          <span class="content-title">${menu.name}</span>
          <span class="content-slug">/${menu.slug}</span>
        </div>
      </td>
      <td>
        ${menu.location ? NexusBadge({ label: menu.location, type: 'info', soft: true }) : '-'}
      </td>
      <td>
        ${NexusBadge({
    label: menu.isActive ? "Activo" : "Inactivo",
    type: menu.isActive ? "success" : "default",
    soft: true
  })}
      </td>
      <td class="date-cell">${formatDate(menu.createdAt)}</td>
      <td>
        <div class="actions-cell">
          <a href="${adminPath}/appearance/menus/${menu.id}" class="action-btn" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </a>
          <button 
            data-delete-url="${adminPath}/appearance/menus/${menu.id}" 
            class="action-btn action-btn-danger btn-delete-menu"
            title="Eliminar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  const content = html`
    <style>
      .page-header-nexus {
        display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;
      }
      .page-title-nexus { font-size: 2rem; font-weight: 700; color: var(--nexus-base-content); margin: 0; }
      .content-title-cell { display: flex; flex-direction: column; gap: 0.25rem; }
      .content-title { font-weight: 600; color: var(--nexus-base-content); }
      .content-slug { font-size: 0.8125rem; opacity: 0.5; font-family: monospace; }
      .actions-cell { display: flex; gap: 0.5rem; }
      .action-btn { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 0.25rem; border: 1px solid var(--nexus-base-300); color: var(--nexus-base-content); cursor: pointer; }
      .action-btn:hover { background: var(--nexus-base-200); color: var(--nexus-primary); border-color: var(--nexus-primary); }
      .action-btn-danger:hover { border-color: var(--nexus-error); color: var(--nexus-error); background: rgba(243, 18, 96, 0.1); }
      
      /* New Menu Modal Styles (Simplified inline form for now, or use JS for modal) */
      .new-menu-card { margin-bottom: 2rem; background: var(--nexus-base-100); padding: 1.5rem; border-radius: 0.5rem; border: 1px solid var(--nexus-base-300); }
      .form-row { display: flex; gap: 1rem; align-items: flex-end; }
      .form-group { flex: 1; }
      .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; }
      .form-input { width: 100%; padding: 0.5rem; border: 1px solid var(--nexus-base-300); border-radius: 0.25rem; }
      .new-menu-title { margin: 0 0 1rem 0; }
    </style>

    <div class="page-header-nexus">
       <div>
         <h1 class="page-title-nexus">Menús</h1>
         <p>Gestiona la navegación de tu sitio</p>
       </div>
    </div>

    <!-- Create Menu Form -->
    <div class="new-menu-card">
        <h3 class="new-menu-title">Crear Nuevo Menú</h3>
        <form action="${adminPath}/appearance/menus" method="POST" class="form-row">
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" name="name" class="form-input" placeholder="Ej: Menú Principal" required>
            </div>
            <div class="form-group">
                <label class="form-label">Slug</label>
                <input type="text" name="slug" class="form-input" placeholder="Ej: main-menu" required>
            </div>
            <div class="form-group">
                <label class="form-label">Ubicación (Opcional)</label>
                <select name="location" class="form-input">
                    <option value="">-- Sin ubicación --</option>
                    ${registeredLocations.map(loc => html`<option value="${loc}">${loc}</option>`)}
                </select>
            </div>
            <button type="submit" class="nexus-btn nexus-btn-primary">Crear Menú</button>
        </form>
    </div>

    <!-- Menus Table -->
    ${NexusCard({
    children: html`
            ${NexusTable({
      columns: [
        { key: 'name', label: 'Nombre' },
        { key: 'location', label: 'Ubicación' },
        { key: 'isActive', label: 'Estado' },
        { key: 'createdAt', label: 'Creado' },
        { key: 'actions', label: 'Acciones', width: '100px' }
      ],
      rows: tableRows,
      emptyMessage: "No hay menús creados todavía."
    })}
             ${NexusPagination({
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      baseUrl: `${adminPath}/appearance/menus`
    })}
        `,
    noPadding: true
  })}

    <script>
      document.querySelectorAll('.btn-delete-menu').forEach(btn => {
        btn.addEventListener('click', function() {
          if (confirm('¿Estás seguro de eliminar este menú?')) {
            const url = this.getAttribute('data-delete-url');
            fetch(url, { method: 'DELETE' })
              .then(res => {
                  if(res.ok) window.location.reload();
                  else alert("Error al eliminar");
              });
          }
        });
      });
    </script>
  `;

  return AdminLayoutNexus({
    title: "Menús",
    children: content,
    activePage: "themes", // Highlight Themes or a new Menus section
    user
  });
};

export default MenuListNexus;
