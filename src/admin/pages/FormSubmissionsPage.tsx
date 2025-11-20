import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

interface FormSubmissionsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  form: {
    id: number;
    name: string;
    slug: string;
    fields: Array<{
      id: number;
      name: string;
      label: string;
      type: string;
    }>;
  };
  submissions: {
    submissions: Array<{
      id: number;
      data: string;
      status: string;
      submittedAt: string;
      ipAddress?: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  };
}

export const FormSubmissionsPage = (props: FormSubmissionsPageProps) => {
  const { user, form, submissions } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <style>
      .page-header-nexus {
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle-nexus {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
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

      .nexus-btn-secondary {
        background: var(--nexus-base-200, #eef0f2);
        color: var(--nexus-base-content, #1e2328);
      }

      .nexus-btn-secondary:hover {
        background: var(--nexus-base-300, #dcdee0);
      }

      .submissions-table {
        width: 100%;
        border-collapse: collapse;
      }

      .submissions-table th,
      .submissions-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .submissions-table th {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
      }

      .submissions-table td {
        font-size: 0.875rem;
      }

      .submissions-table tr:hover {
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

      .badge-info {
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
      }

      .badge-secondary {
        background: var(--nexus-base-200, #eef0f2);
        color: var(--nexus-base-content, #1e2328);
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

      .icon-btn.success {
        color: #16a34a;
      }

      .icon-btn.danger {
        color: #dc2626;
      }

      .modal-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 50;
        align-items: center;
        justify-content: center;
      }

      .modal-backdrop.show {
        display: flex;
      }

      .modal-content {
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: 2rem;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      }

      .field-wrapper {
        margin-bottom: 1.5rem;
      }

      .field-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .field-value {
        padding: 0.75rem 1rem;
        background: var(--nexus-base-50, #f9fafb);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        font-size: 0.875rem;
      }

      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
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
      }
    </style>

    <div class="page-header-nexus">
      <div>
        <h1 class="page-title-nexus">Envíos: ${form.name}</h1>
        <p class="page-subtitle-nexus">Total: ${submissions.total} envíos</p>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button onclick="exportToCSV()" class="nexus-btn nexus-btn-secondary">
          Exportar CSV
        </button>
        <button onclick="window.location.href='${adminPath}/forms/${form.id}/edit'" class="nexus-btn nexus-btn-secondary">
          Editar Formulario
        </button>
        <button onclick="window.location.href='${adminPath}/forms'" class="nexus-btn nexus-btn-secondary">
          Volver
        </button>
      </div>
    </div>

    ${submissions.submissions.length === 0 ? html`
      <div class="nexus-card">
        <div class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="empty-state-title">No hay envíos</h3>
          <p class="empty-state-description">Aún no se han recibido envíos para este formulario</p>
        </div>
      </div>
    ` : html`
      <div class="nexus-card">
        <table class="submissions-table">
          <thead>
            <tr>
              <th>ID</th>
              ${form.fields.slice(0, 3).map(field => html`
                <th>${field.label}</th>
              `)}
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${submissions.submissions.map(submission => {
    const data = JSON.parse(submission.data);
    return html`
                <tr>
                  <td style="font-family: monospace; font-size: 0.8125rem;">#${submission.id}</td>
                  ${form.fields.slice(0, 3).map(field => html`
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${data[field.name] || '-'}
                    </td>
                  `)}
                  <td style="opacity: 0.6;">
                    ${new Date(submission.submittedAt).toLocaleString('es-ES')}
                  </td>
                  <td>
                    <span class="badge badge-${submission.status === 'new' ? 'info' : submission.status === 'read' ? 'success' : 'secondary'}">
                      ${submission.status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.5rem;">
                      <button
                        onclick="viewSubmission(${submission.id}, ${JSON.stringify(data).replace(/"/g, '&quot;')})"
                        class="icon-btn"
                        title="Ver"
                      >
                        <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                        </svg>
                      </button>
                      ${submission.status === 'new' ? html`
                        <button
                          onclick="markAsRead(${submission.id})"
                          class="icon-btn success"
                          title="Marcar como leído"
                        >
                          <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                          </svg>
                        </button>
                      ` : ''}
                      <button
                        onclick="deleteSubmission(${submission.id})"
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
              `;
  })}
          </tbody>
        </table>

        ${submissions.totalPages > 1 ? html`
          <div class="pagination">
            ${submissions.page > 1 ? html`
              <button
                onclick="window.location.href='?page=${submissions.page - 1}'"
                class="nexus-btn nexus-btn-secondary"
              >
                Anterior
              </button>
            ` : ''}
            <span style="opacity: 0.6;">
              Página ${submissions.page} de ${submissions.totalPages}
            </span>
            ${submissions.page < submissions.totalPages ? html`
              <button
                onclick="window.location.href='?page=${submissions.page + 1}'"
                class="nexus-btn nexus-btn-secondary"
              >
                Siguiente
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `}

    <!-- View Submission Modal -->
    <div id="viewModal" class="modal-backdrop" onclick="if(event.target === this) closeViewModal()">
      <div class="modal-content">
        <h3 class="modal-header">Detalles del Envío</h3>
        <div id="submissionDetails">
          <!-- Content will be populated by JavaScript -->
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
          <button onclick="closeViewModal()" class="nexus-btn nexus-btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>

    <script>
      const FORM_ID = ${form.id};
      const FORM_FIELDS = ${JSON.stringify(form.fields)};

      function viewSubmission(id, data) {
        const detailsHtml = FORM_FIELDS.map(field => {
          const value = data[field.name] || '-';
          return \`
            <div class="field-wrapper">
              <label class="field-label">\${field.label}</label>
              <div class="field-value">\${value}</div>
            </div>
          \`;
        }).join('');
        
        document.getElementById('submissionDetails').innerHTML = detailsHtml;
        document.getElementById('viewModal').classList.add('show');
      }

      function closeViewModal() {
        document.getElementById('viewModal').classList.remove('show');
      }

      async function markAsRead(submissionId) {
        try {
          const response = await fetch(\`/api/forms/\${FORM_ID}/submissions/\${submissionId}/read\`, {
            method: 'PUT',
            credentials: 'include'
          });
          
          if (response.ok) {
            window.location.reload();
          } else {
            alert('Error al marcar como leído');
          }
        } catch (error) {
          alert('Error al marcar como leído');
        }
      }

      async function deleteSubmission(submissionId) {
        if (!confirm('¿Eliminar este envío?')) return;
        
        try {
          const response = await fetch(\`/api/forms/\${FORM_ID}/submissions/\${submissionId}\`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (response.ok) {
            window.location.reload();
          } else {
            alert('Error al eliminar');
          }
        } catch (error) {
          alert('Error al eliminar');
        }
      }

      async function exportToCSV() {
        try {
          const response = await fetch(\`/api/forms/\${FORM_ID}/export/csv\`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`form-\${FORM_ID}-submissions.csv\`;
            a.click();
          } else {
            alert('Error al exportar');
          }
        } catch (error) {
          alert('Error al exportar');
        }
      }
    </script>
  `;

  return AdminLayout({
    title: `Envíos: ${form.name}`,
    children: content,
    activePage: "forms",
    user,
  });
};

export default FormSubmissionsPage;
