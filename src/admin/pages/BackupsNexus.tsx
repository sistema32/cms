import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";

interface BackupItem {
  id: number;
  filename: string;
  type: string;
  size: number;
  status: string;
  storageProvider: string;
  compressed: boolean;
  includesMedia: boolean;
  includesDatabase: boolean;
  includesConfig: boolean;
  createdAt: Date;
  completedAt: Date | null;
  error: string | null;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup?: Date;
  nextScheduledBackup?: Date;
  successfulBackups: number;
  failedBackups: number;
}

interface BackupsNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  backups: BackupItem[];
  stats: BackupStats;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
}

export const BackupsNexusPage = (props: BackupsNexusPageProps) => {
  const {
    user,
    backups,
    stats,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return NexusBadge({ label: "Completado", type: "success", soft: true });
      case "failed":
        return NexusBadge({ label: "Fallido", type: "error", soft: true });
      case "in_progress":
        return NexusBadge({ label: "En progreso", type: "warning", soft: true });
      default:
        return NexusBadge({ label: "Desconocido", type: "default", soft: true });
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      full: "📦",
      database: "🗄️",
      media: "🖼️",
      config: "⚙️",
    };
    return icons[type] || "📄";
  };

  const content = html`
    <style>
      .page-header-nexus {
        margin-bottom: 2rem;
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

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .stat-card {
        padding: 1.5rem;
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .stat-label {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--nexus-primary, #167bff);
      }

      .backups-table {
        width: 100%;
        border-collapse: collapse;
      }

      .backups-table thead {
        background: var(--nexus-base-200, #eef0f2);
      }

      .backups-table th {
        padding: 0.875rem 1rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        text-align: left;
        font-size: 0.8125rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .backups-table tbody tr {
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
        transition: background 0.15s;
      }

      .backups-table tbody tr:hover {
        background: rgba(22, 123, 255, 0.03);
      }

      .backups-table td {
        padding: 1rem;
        color: var(--nexus-base-content, #1e2328);
        font-size: 0.875rem;
      }

      .backup-includes {
        display: flex;
        gap: 0.375rem;
        flex-wrap: wrap;
      }

      .include-badge {
        padding: 0.125rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary, #167bff);
      }

      .backup-actions {
        display: flex;
        gap: 0.5rem;
      }

      .backup-action-btn {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        background: var(--nexus-base-100, #fff);
        color: var(--nexus-base-content, #1e2328);
        cursor: pointer;
        transition: all 0.2s;
      }

      .backup-action-btn:hover {
        background: var(--nexus-base-200, #eef0f2);
      }

      .backup-action-btn.primary:hover {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
        color: #fff;
      }

      .backup-action-btn.danger:hover {
        background: var(--nexus-error, #f31260);
        border-color: var(--nexus-error, #f31260);
        color: #fff;
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .create-backup-form {
        display: none;
        margin-bottom: 1.5rem;
      }

      .create-backup-form.active {
        display: block;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .form-field label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .form-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        cursor: pointer;
      }

      .checkbox-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .form-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div>
        <h1 class="page-title-nexus">Gestión de Backups</h1>
        <p class="page-subtitle-nexus">Crea y administra copias de seguridad del sistema</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Backups</div>
        <div class="stat-value">${stats.totalBackups}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Espacio Usado</div>
        <div class="stat-value" style="font-size: 1.5rem;">${formatBytes(stats.totalSize)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Exitosos</div>
        <div class="stat-value" style="color: var(--nexus-success, #0bbf58);">${stats.successfulBackups}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Fallidos</div>
        <div class="stat-value" style="color: var(--nexus-error, #f31260);">${stats.failedBackups}</div>
      </div>
    </div>

    <!-- Create Backup Form -->
    <div id="createBackupForm" class="create-backup-form">
      ${NexusCard({
        title: "Crear Nuevo Backup",
        children: html`
          <form id="backupForm" data-form="create-backup">
            <div class="form-grid">
              <div class="form-field">
                <label>Tipo de Backup</label>
                <select class="form-select" name="type" id="backupType">
                  <option value="full">Completo (Base de datos + Medios + Configuración)</option>
                  <option value="database">Solo Base de Datos</option>
                  <option value="media">Solo Archivos de Medios</option>
                  <option value="config">Solo Configuración</option>
                </select>
              </div>
              <div class="form-field">
                <label>Opciones</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" name="includeDatabase" class="checkbox-input" checked />
                    <span>Incluir Base de Datos</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" name="includeMedia" class="checkbox-input" checked />
                    <span>Incluir Archivos de Medios</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" name="includeConfig" class="checkbox-input" checked />
                    <span>Incluir Configuración</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" name="compression" class="checkbox-input" checked />
                    <span>Comprimir backup</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="form-actions">
              ${NexusButton({
                label: "Cancelar",
                type: "outline",
                onClick: "toggleBackupForm()"
              })}
              ${NexusButton({
                label: "Crear Backup",
                type: "primary"
              })}
            </div>
          </form>
        `
      })}
    </div>

    <!-- Create Button -->
    <div style="margin-bottom: 1.5rem;">
      ${NexusButton({
        label: "Crear Backup",
        type: "primary",
        icon: html`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        `,
        onClick: "toggleBackupForm()"
      })}
    </div>

    <!-- Backups Table -->
    ${backups.length === 0 ? html`
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <h3 style="margin-top: 1rem; font-size: 1.125rem; font-weight: 600;">No hay backups disponibles</h3>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Crea tu primer backup para comenzar</p>
      </div>
    ` : html`
      ${NexusCard({
        noPadding: true,
        children: html`
          <table class="backups-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Archivo</th>
                <th>Estado</th>
                <th>Tamaño</th>
                <th>Incluye</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${backups.map(backup => html`
                <tr data-backup-id="${backup.id}">
                  <td>
                    <span style="font-size: 1.25rem; margin-right: 0.5rem;">${getTypeIcon(backup.type)}</span>
                    <span style="text-transform: capitalize;">${backup.type}</span>
                  </td>
                  <td>
                    <strong>${backup.filename}</strong>
                    ${backup.compressed ? html`<span style="margin-left: 0.5rem;">🗜️</span>` : ''}
                  </td>
                  <td>${getStatusBadge(backup.status)}</td>
                  <td>${formatBytes(backup.size)}</td>
                  <td>
                    <div class="backup-includes">
                      ${backup.includesDatabase ? html`<span class="include-badge">DB</span>` : ''}
                      ${backup.includesMedia ? html`<span class="include-badge">Media</span>` : ''}
                      ${backup.includesConfig ? html`<span class="include-badge">Config</span>` : ''}
                    </div>
                  </td>
                  <td style="font-size: 0.75rem;">${formatDate(backup.createdAt)}</td>
                  <td>
                    <div class="backup-actions">
                      ${backup.status === "completed" ? html`
                        <button
                          type="button"
                          class="backup-action-btn primary"
                          data-action="download"
                        >
                          Descargar
                        </button>
                      ` : ''}
                      <button
                        type="button"
                        class="backup-action-btn danger"
                        data-action="delete"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                ${backup.error ? html`
                  <tr>
                    <td colspan="7" style="background: rgba(243, 18, 96, 0.05); color: var(--nexus-error, #f31260); padding: 0.75rem 1rem; font-size: 0.8125rem;">
                      <strong>Error:</strong> ${backup.error}
                    </td>
                  </tr>
                ` : ''}
              `).join('')}
            </tbody>
          </table>
        `
      })}
    `}

    ${raw(`
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const backupsTable = document.querySelector('.backups-table');
          const backupForm = document.querySelector('[data-form="create-backup"]');

          // XSS safe - Toggle backup form
          window.toggleBackupForm = function() {
            const form = document.getElementById('createBackupForm');
            form?.classList.toggle('active');
          };

          // XSS safe - Handle backup type change
          const backupType = document.getElementById('backupType');
          if (backupType) {
            backupType.addEventListener('change', function(e) {
              const type = e.target.value;
              const checkboxes = {
                database: document.querySelector('[name="includeDatabase"]'),
                media: document.querySelector('[name="includeMedia"]'),
                config: document.querySelector('[name="includeConfig"]')
              };

              // Reset all
              Object.values(checkboxes).forEach(cb => cb && (cb.checked = false));

              // Set based on type
              if (type === 'full') {
                Object.values(checkboxes).forEach(cb => cb && (cb.checked = true));
              } else if (type === 'database') {
                checkboxes.database && (checkboxes.database.checked = true);
              } else if (type === 'media') {
                checkboxes.media && (checkboxes.media.checked = true);
              } else if (type === 'config') {
                checkboxes.config && (checkboxes.config.checked = true);
              }
            });
          }

          // XSS safe - Handle form submission
          if (backupForm) {
            backupForm.addEventListener('submit', function(e) {
              e.preventDefault();

              const formData = new FormData(e.target);
              const data = {
                type: formData.get('type'),
                includeDatabase: formData.get('includeDatabase') === 'on',
                includeMedia: formData.get('includeMedia') === 'on',
                includeConfig: formData.get('includeConfig') === 'on',
                compression: formData.get('compression') === 'on'
              };

              if (!data.includeDatabase && !data.includeMedia && !data.includeConfig) {
                alert('Debes seleccionar al menos una opción de contenido');
                return;
              }

              fetch('/api/backups', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify(data)
              })
              .then(response => {
                if (response.ok) {
                  alert('Backup creado exitosamente. El proceso puede tomar varios minutos.');
                  window.location.reload();
                } else {
                  alert('Error al crear backup');
                }
              })
              .catch(error => {
                console.error('Error:', error);
                alert('Error al crear backup');
              });
            });
          }

          // XSS safe - Handle table actions
          if (backupsTable) {
            backupsTable.addEventListener('click', function(e) {
              const actionBtn = e.target.closest('[data-action]');
              if (!actionBtn) return;

              const action = actionBtn.getAttribute('data-action');
              const row = actionBtn.closest('[data-backup-id]');
              const backupId = row?.getAttribute('data-backup-id');

              if (!backupId) return;

              if (action === 'download') {
                window.location.href = '/api/backups/' + backupId + '/download';
              } else if (action === 'delete') {
                if (confirm('¿Eliminar este backup? Esta acción no se puede deshacer.')) {
                  fetch('/api/backups/' + backupId, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                  })
                  .then(response => {
                    if (response.ok) {
                      window.location.reload();
                    } else {
                      alert('Error al eliminar backup');
                    }
                  })
                  .catch(error => {
                    console.error('Error:', error);
                    alert('Error al eliminar backup');
                  });
                }
              }
            });
          }
        });
      </script>
    `)}
  `;

  return AdminLayoutNexus({
    title: "Backups",
    children: content,
    activePage: "system.backups",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default BackupsNexusPage;
// @ts-nocheck
