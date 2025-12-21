import { html } from "hono/html";
import { AdminLayout } from "@/admin/components/layout/AdminLayout.tsx";
import { env } from "@/config/env.ts";

interface FormsListPageProps {
  user: {
    name: string | null;
    email: string;
  };
  forms: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
    status: string;
    createdAt: string;
  }>;
}

export const FormsListPage = (props: FormsListPageProps) => {
  const { user, forms } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <style>
      .page-header-nexus {
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0;
      }

      .nexus-card {
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: 0;
        overflow: hidden;
      }

      .nexus-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
        cursor: pointer;
        border: none;
      }

      .nexus-btn-primary {
        background: var(--nexus-primary, #167bff);
        color: #ffffff;
      }

      .nexus-btn-primary:hover {
        background: var(--nexus-primary-focus, #0d5fd9);
      }

      .forms-table {
        width: 100%;
        border-collapse: collapse;
      }

      .forms-table th,
      .forms-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .forms-table th {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
      }

      .forms-table td {
        font-size: 0.875rem;
      }

      .forms-table tr:hover {
        background: var(--nexus-base-50, #f9fafb);
      }

      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-full, 9999px);
      }

      .badge-success {
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
      }

      .badge-secondary {
        background: var(--nexus-base-200, #eef0f2);
        color: var(--nexus-base-content, #1e2328);
      }

      .badge-warning {
        background: rgba(234, 179, 8, 0.1);
        color: #ca8a04;
      }

      .icon-btn {
        padding: 0.5rem;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        transition: opacity 0.2s;
      }

      .icon-btn:hover {
        opacity: 1;
      }

      .icon-btn.danger {
        color: #dc2626;
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
      }

      .empty-state-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        opacity: 0.3;
      }

      .empty-state-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .empty-state-description {
        font-size: 0.875rem;
        opacity: 0.6;
        margin-bottom: 1.5rem;
      }
    </style>

    <div class="page-header-nexus">
      <h1 class="page-title-nexus">Formularios</h1>
      <button
        onclick="window.location.href='${adminPath}/forms/new'"
        class="nexus-btn nexus-btn-primary"
      >
        Nuevo Formulario
      </button>
    </div>

    ${forms.length === 0 ? html`
      <div class="nexus-card">
        <div class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 class="empty-state-title">No hay formularios</h3>
          <p class="empty-state-description">Comienza creando tu primer formulario personalizado</p>
          <button onclick="window.location.href='${adminPath}/forms/new'" class="nexus-btn nexus-btn-primary">
            Crear Formulario
          </button>
        </div>
      </div>
    ` : html`
      <div class="nexus-card">
        <table class="forms-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${forms.map(form => html`
              <tr>
                <td>
                  <div style="font-weight: 500;">${form.name}</div>
                  ${form.description ? html`
                    <div style="font-size: 0.8125rem; opacity: 0.6; margin-top: 0.25rem;">${form.description}</div>
                  ` : ''}
                </td>
                <td style="opacity: 0.6;">
                  /${form.slug}
                </td>
                <td>
                  <span class="badge badge-${form.status === 'active' ? 'success' : form.status === 'inactive' ? 'secondary' : 'warning'}">
                    ${form.status}
                  </span>
                </td>
                <td style="opacity: 0.6;">
                  ${new Date(form.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td>
                  <div style="display: flex; gap: 0.5rem;">
                    <button
                      onclick="window.location.href='${adminPath}/forms/${form.id}/edit'"
                      class="icon-btn"
                      title="Editar"
                    >
                      <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                      </svg>
                    </button>
                    <button
                      onclick="window.location.href='${adminPath}/forms/${form.id}/submissions'"
                      class="icon-btn"
                      title="Ver Envíos"
                    >
                      <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                    <button
                      onclick="deleteForm(${form.id}, '${form.name.replace(/'/g, "\\'")}')"
                      class="icon-btn danger"
                      title="Eliminar"
                    >
                      <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `}

    <script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};
      
      async function deleteForm(id, name) {
        if (!confirm(\`¿Estás seguro de eliminar el formulario "\${name}"?\`)) return;
        
        try {
          const response = await fetch(\`/api/forms/\${id}\`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (response.ok) {
            window.location.reload();
          } else {
            alert('Error al eliminar el formulario');
          }
        } catch (error) {
          alert('Error al eliminar el formulario');
        }
      }
    </script>
  `;

  return AdminLayout({
    title: "Formularios",
    children: content,
    activePage: "forms.all",
    user,
  });
};

export default FormsListPage;
