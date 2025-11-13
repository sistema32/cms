import { html, raw } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";

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

interface BackupsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  backups: BackupItem[];
  stats: BackupStats;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    completed: '<span class="status-badge status-success">✓ Completado</span>',
    failed: '<span class="status-badge status-error">✗ Fallido</span>',
    in_progress: '<span class="status-badge status-warning">⟳ En progreso</span>',
  };
  return badges[status] || '<span class="status-badge">Desconocido</span>';
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    full: "📦",
    database: "🗄️",
    media: "🖼️",
    config: "⚙️",
  };
  return icons[type] || "📄";
}

export const BackupsPage = (props: BackupsPageProps) => {
  const { user, backups, stats } = props;

  const content = html`
    <style>
      .backup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .backup-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .stat-card {
        padding: 1.5rem;
        border-radius: 0.75rem;
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
        border: 1px solid rgba(124, 58, 237, 0.2);
      }
      .dark .stat-card {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%);
        border-color: rgba(124, 58, 237, 0.3);
      }
      .stat-label {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 0.5rem;
      }
      .dark .stat-label {
        color: #94a3b8;
      }
      .stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: #7c3aed;
      }
      .dark .stat-value {
        color: #a78bfa;
      }
      .backup-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: white;
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .dark .backup-table {
        background: #1e293b;
      }
      .backup-table th {
        background: #f8fafc;
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
      }
      .dark .backup-table th {
        background: #0f172a;
        color: #cbd5e1;
        border-bottom-color: #334155;
      }
      .backup-table td {
        padding: 1rem;
        border-bottom: 1px solid #f1f5f9;
      }
      .dark .backup-table td {
        border-bottom-color: #334155;
      }
      .backup-table tr:last-child td {
        border-bottom: none;
      }
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 500;
      }
      .status-success {
        background: #dcfce7;
        color: #166534;
      }
      .dark .status-success {
        background: #14532d;
        color: #86efac;
      }
      .status-error {
        background: #fee2e2;
        color: #991b1b;
      }
      .dark .status-error {
        background: #7f1d1d;
        color: #fca5a5;
      }
      .status-warning {
        background: #fef3c7;
        color: #92400e;
      }
      .dark .status-warning {
        background: #78350f;
        color: #fcd34d;
      }
      .btn-group {
        display: flex;
        gap: 0.5rem;
      }
      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-primary {
        background: #7c3aed;
        color: white;
      }
      .btn-primary:hover {
        background: #6d28d9;
      }
      .btn-danger {
        background: #ef4444;
        color: white;
      }
      .btn-danger:hover {
        background: #dc2626;
      }
      .btn-success {
        background: #10b981;
        color: white;
      }
      .btn-success:hover {
        background: #059669;
      }
      .empty-state {
        text-align: center;
        padding: 3rem;
        color: #64748b;
      }
      .dark .empty-state {
        color: #94a3b8;
      }
      .backup-includes {
        display: flex;
        gap: 0.5rem;
        font-size: 0.875rem;
      }
      .include-badge {
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
        background: #e0e7ff;
        color: #4338ca;
      }
      .dark .include-badge {
        background: #312e81;
        color: #c7d2fe;
      }

      /* Modal Styles */
      .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0, 0, 0, 0.5);
      }
      .modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 0.75rem;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }
      .dark .modal-content {
        background-color: #1e293b;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .modal-header h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }
      .dark .modal-header h2 {
        color: #f3f4f6;
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
      }
      .dark .close-btn {
        color: #9ca3af;
      }
      .form-group {
        margin-bottom: 1.5rem;
      }
      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
      }
      .dark .form-label {
        color: #d1d5db;
      }
      .form-input,
      .form-select {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background: white;
        color: #1f2937;
      }
      .dark .form-input,
      .dark .form-select {
        background: #0f172a;
        border-color: #334155;
        color: #f3f4f6;
      }
      .form-checkbox {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .form-checkbox input {
        margin-right: 0.5rem;
      }
      .form-help {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.25rem;
      }
      .dark .form-help {
        color: #9ca3af;
      }
      .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-top: 2rem;
      }
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-cancel {
        background: #e5e7eb;
        color: #374151;
        border: none;
      }
      .btn-cancel:hover {
        background: #d1d5db;
      }
      .dark .btn-cancel {
        background: #374151;
        color: #d1d5db;
      }
      .dark .btn-cancel:hover {
        background: #4b5563;
      }
    </style>

    <div class="backup-header">
      <h1>Gestión de Backups</h1>
      <button
        class="btn-sm btn-success"
        onclick="toggleBackupForm()"
        id="toggleFormBtn"
      >
        ➕ Crear Backup
      </button>
    </div>

    <div class="backup-stats">
      <div class="stat-card">
        <div class="stat-label">Total Backups</div>
        <div class="stat-value">${stats.totalBackups}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Espacio Usado</div>
        <div class="stat-value">${formatBytes(stats.totalSize)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Exitosos</div>
        <div class="stat-value">${stats.successfulBackups}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Fallidos</div>
        <div class="stat-value">${stats.failedBackups}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Último Backup</div>
        <div class="stat-value" style="font-size: 1.25rem;">
          ${stats.lastBackup ? formatDate(stats.lastBackup) : "Nunca"}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Próximo Backup</div>
        <div class="stat-value" style="font-size: 1.25rem;">
          ${stats.nextScheduledBackup ? formatDate(stats.nextScheduledBackup) : "No programado"}
        </div>
      </div>
    </div>

    <!-- Formulario de Crear Backup (Colapsable) -->
    <div id="backupFormContainer" class="bg-white dark:bg-gray-800 rounded-lg shadow-xs mb-6" style="display: none;">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Crear Nuevo Backup</h3>

        <form id="backupForm" onsubmit="createBackup(event)" class="space-y-4">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Tipo de Backup</span>
            </label>
            <select id="backupType" class="select select-bordered w-full" onchange="updateBackupOptions()">
              <option value="full">Completo (Base de datos + Medios + Configuración)</option>
              <option value="database">Solo Base de Datos</option>
              <option value="media">Solo Archivos de Medios</option>
              <option value="config">Solo Configuración</option>
            </select>
            <label class="label">
              <span class="label-text-alt">Selecciona qué elementos incluir en el backup</span>
            </label>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Opciones de Contenido</span>
            </label>
            <div class="space-y-2">
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" id="includeDatabase" class="checkbox checkbox-primary" checked>
                <span class="ml-2">Incluir Base de Datos</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" id="includeMedia" class="checkbox checkbox-primary" checked>
                <span class="ml-2">Incluir Archivos de Medios</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" id="includeConfig" class="checkbox checkbox-primary" checked>
                <span class="ml-2">Incluir Archivos de Configuración</span>
              </label>
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Compresión</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" id="compression" class="checkbox checkbox-primary" checked>
              <span class="ml-2">Comprimir backup (recomendado)</span>
            </label>
            <label class="label">
              <span class="label-text-alt">La compresión reduce el tamaño del archivo</span>
            </label>
          </div>

          <div class="flex gap-2 pt-4">
            <button type="button" class="btn btn-ghost" onclick="toggleBackupForm()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Backup</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Configuración de Backups Automáticos -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs mb-6">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200">Backups Automáticos</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Configura backups periódicos programados</p>
          </div>
          <label class="flex items-center cursor-pointer">
            <input type="checkbox" id="autoBackupEnabled" class="toggle toggle-primary" onchange="toggleAutoBackupConfig()">
            <span class="ml-2 text-sm">Activar</span>
          </label>
        </div>

        <div id="autoBackupConfig" style="display: none;">
          <form id="autoBackupForm" onsubmit="saveAutoBackupConfig(event)" class="space-y-4">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Periodicidad -->
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text">Frecuencia</span>
                </label>
                <select id="autoBackupFrequency" class="select select-bordered w-full" onchange="updateFrequencyOptions()">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>

              <!-- Hora -->
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text">Hora</span>
                </label>
                <input type="time" id="autoBackupTime" class="input input-bordered w-full" value="02:00">
              </div>

              <!-- Día de la semana (solo para semanal) -->
              <div id="weekDayContainer" class="form-control w-full" style="display: none;">
                <label class="label">
                  <span class="label-text">Día de la semana</span>
                </label>
                <select id="autoBackupWeekDay" class="select select-bordered w-full">
                  <option value="0">Domingo</option>
                  <option value="1">Lunes</option>
                  <option value="2">Martes</option>
                  <option value="3">Miércoles</option>
                  <option value="4">Jueves</option>
                  <option value="5">Viernes</option>
                  <option value="6">Sábado</option>
                </select>
              </div>

              <!-- Día del mes (solo para mensual) -->
              <div id="monthDayContainer" class="form-control w-full" style="display: none;">
                <label class="label">
                  <span class="label-text">Día del mes</span>
                </label>
                <input type="number" id="autoBackupMonthDay" class="input input-bordered w-full" min="1" max="31" value="1">
              </div>

              <!-- Retención -->
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text">Backups a retener</span>
                </label>
                <input type="number" id="autoBackupRetention" class="input input-bordered w-full" min="1" max="100" value="7">
                <label class="label">
                  <span class="label-text-alt">Los backups más antiguos se eliminarán automáticamente</span>
                </label>
              </div>
            </div>

            <!-- Contenido a incluir -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">Contenido a incluir</span>
              </label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label class="flex items-center cursor-pointer">
                  <input type="checkbox" id="autoBackupDatabase" class="checkbox checkbox-primary" checked>
                  <span class="ml-2">Base de Datos</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input type="checkbox" id="autoBackupMedia" class="checkbox checkbox-primary" checked>
                  <span class="ml-2">Archivos de Medios</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input type="checkbox" id="autoBackupConfig" class="checkbox checkbox-primary" checked>
                  <span class="ml-2">Configuración</span>
                </label>
              </div>
            </div>

            <!-- Opciones adicionales -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text">Opciones adicionales</span>
              </label>
              <div class="space-y-2">
                <label class="flex items-center cursor-pointer">
                  <input type="checkbox" id="autoBackupCompress" class="checkbox checkbox-primary" checked>
                  <span class="ml-2">Comprimir backups</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input type="checkbox" id="autoBackupNotify" class="checkbox checkbox-primary" checked>
                  <span class="ml-2">Notificar por email al completar</span>
                </label>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Próxima ejecución -->
            <div class="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 class="font-semibold">Próxima ejecución programada:</h4>
                <p class="text-sm" id="nextExecutionText">
                  ${stats.nextScheduledBackup ? formatDate(stats.nextScheduledBackup) : "Configura los backups automáticos para ver la próxima ejecución"}
                </p>
              </div>
            </div>

            <div class="flex gap-2 pt-4">
              <button type="button" class="btn btn-ghost" onclick="resetAutoBackupForm()">Restablecer</button>
              <button type="submit" class="btn btn-primary">Guardar Configuración</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    ${backups.length === 0 ? html`
      <div class="empty-state">
        <h3>No hay backups disponibles</h3>
        <p>Crea tu primer backup para comenzar</p>
      </div>
    ` : html`
      <table class="backup-table">
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
          ${backups.map((backup) => html`
            <tr>
              <td>
                <span style="font-size: 1.5rem;">${getTypeIcon(backup.type)}</span>
                ${backup.type}
              </td>
              <td>
                <strong>${backup.filename}</strong>
                ${backup.compressed ? " 🗜️" : ""}
              </td>
              <td>${getStatusBadge(backup.status)}</td>
              <td>${formatBytes(backup.size)}</td>
              <td>
                <div class="backup-includes">
                  ${backup.includesDatabase ? '<span class="include-badge">DB</span>' : ""}
                  ${backup.includesMedia ? '<span class="include-badge">Media</span>' : ""}
                  ${backup.includesConfig ? '<span class="include-badge">Config</span>' : ""}
                </div>
              </td>
              <td>${formatDate(backup.createdAt)}</td>
              <td>
                <div class="btn-group">
                  ${backup.status === "completed" ? html`
                    <button
                      class="btn-sm btn-primary"
                      onclick="downloadBackup(${backup.id})"
                    >
                      ⬇️ Descargar
                    </button>
                  ` : ""}
                  <button
                    class="btn-sm btn-danger"
                    onclick="deleteBackup(${backup.id})"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </td>
            </tr>
            ${backup.error ? html`
              <tr>
                <td colspan="7" style="background: #fef2f2; color: #991b1b; padding: 0.5rem 1rem;">
                  <strong>Error:</strong> ${backup.error}
                </td>
              </tr>
            ` : ""}
          `)}
        </tbody>
      </table>
    `}

    ${raw(`<script>
      function toggleBackupForm() {
        const form = document.getElementById('backupFormContainer');
        const btn = document.getElementById('toggleFormBtn');

        if (form.style.display === 'none') {
          form.style.display = 'block';
          btn.textContent = '✖️ Cancelar';
        } else {
          form.style.display = 'none';
          btn.textContent = '➕ Crear Backup';
          // Reset form
          document.getElementById('backupForm').reset();
          document.getElementById('backupType').value = 'full';
          updateBackupOptions();
        }
      }

      function updateBackupOptions() {
        const type = document.getElementById('backupType').value;
        const includeDatabase = document.getElementById('includeDatabase');
        const includeMedia = document.getElementById('includeMedia');
        const includeConfig = document.getElementById('includeConfig');

        // Reset all
        includeDatabase.checked = false;
        includeMedia.checked = false;
        includeConfig.checked = false;

        // Set based on type
        switch(type) {
          case 'full':
            includeDatabase.checked = true;
            includeMedia.checked = true;
            includeConfig.checked = true;
            break;
          case 'database':
            includeDatabase.checked = true;
            break;
          case 'media':
            includeMedia.checked = true;
            break;
          case 'config':
            includeConfig.checked = true;
            break;
        }
      }

      async function createBackup(event) {
        event.preventDefault();

        const type = document.getElementById('backupType').value;
        const includeDatabase = document.getElementById('includeDatabase').checked;
        const includeMedia = document.getElementById('includeMedia').checked;
        const includeConfig = document.getElementById('includeConfig').checked;
        const compression = document.getElementById('compression').checked;

        if (!includeDatabase && !includeMedia && !includeConfig) {
          alert('Debes seleccionar al menos una opción de contenido');
          return;
        }

        try {
          const response = await fetch('/api/backups', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type,
              includeMedia,
              includeDatabase,
              includeConfig,
              compression,
            }),
          });

          if (response.ok) {
            alert('Backup creado exitosamente. El proceso puede tomar varios minutos.');
            toggleBackupForm();
            window.location.reload();
          } else {
            const error = await response.text();
            alert('Error al crear backup: ' + error);
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      async function downloadBackup(id) {
        window.location.href = '/api/backups/' + id + '/download';
      }

      async function deleteBackup(id) {
        if (!confirm('¿Estás seguro de eliminar este backup? Esta acción no se puede deshacer.')) {
          return;
        }

        try {
          const response = await fetch('/api/backups/' + id, {
            method: 'DELETE',
          });

          if (response.ok) {
            alert('Backup eliminado exitosamente');
            window.location.reload();
          } else {
            const error = await response.text();
            alert('Error al eliminar backup: ' + error);
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      // Auto Backup Configuration Functions
      function toggleAutoBackupConfig() {
        const enabled = document.getElementById('autoBackupEnabled').checked;
        const config = document.getElementById('autoBackupConfig');

        if (enabled) {
          config.style.display = 'block';
        } else {
          config.style.display = 'none';
        }
      }

      function updateFrequencyOptions() {
        const frequency = document.getElementById('autoBackupFrequency').value;
        const weekDayContainer = document.getElementById('weekDayContainer');
        const monthDayContainer = document.getElementById('monthDayContainer');

        // Hide all conditional fields
        weekDayContainer.style.display = 'none';
        monthDayContainer.style.display = 'none';

        // Show relevant field based on frequency
        if (frequency === 'weekly') {
          weekDayContainer.style.display = 'block';
        } else if (frequency === 'monthly') {
          monthDayContainer.style.display = 'block';
        }

        // Update next execution estimate
        updateNextExecutionEstimate();
      }

      function updateNextExecutionEstimate() {
        const frequency = document.getElementById('autoBackupFrequency').value;
        const time = document.getElementById('autoBackupTime').value;
        const weekDay = document.getElementById('autoBackupWeekDay').value;
        const monthDay = document.getElementById('autoBackupMonthDay').value;

        const now = new Date();
        let nextExecution = new Date();

        const [hours, minutes] = time.split(':');
        nextExecution.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (frequency === 'daily') {
          // If time has passed today, schedule for tomorrow
          if (nextExecution <= now) {
            nextExecution.setDate(nextExecution.getDate() + 1);
          }
        } else if (frequency === 'weekly') {
          const targetDay = parseInt(weekDay);
          const currentDay = now.getDay();
          let daysUntilTarget = targetDay - currentDay;

          if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextExecution <= now)) {
            daysUntilTarget += 7;
          }

          nextExecution.setDate(nextExecution.getDate() + daysUntilTarget);
        } else if (frequency === 'monthly') {
          const targetDay = parseInt(monthDay);
          nextExecution.setDate(targetDay);

          if (nextExecution <= now) {
            nextExecution.setMonth(nextExecution.getMonth() + 1);
          }
        }

        const nextText = document.getElementById('nextExecutionText');
        nextText.textContent = nextExecution.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      async function saveAutoBackupConfig(event) {
        event.preventDefault();

        const config = {
          enabled: document.getElementById('autoBackupEnabled').checked,
          frequency: document.getElementById('autoBackupFrequency').value,
          time: document.getElementById('autoBackupTime').value,
          weekDay: document.getElementById('autoBackupWeekDay').value,
          monthDay: document.getElementById('autoBackupMonthDay').value,
          retention: parseInt(document.getElementById('autoBackupRetention').value),
          includeDatabase: document.getElementById('autoBackupDatabase').checked,
          includeMedia: document.getElementById('autoBackupMedia').checked,
          includeConfig: document.getElementById('autoBackupConfig').checked,
          compress: document.getElementById('autoBackupCompress').checked,
          notify: document.getElementById('autoBackupNotify').checked,
        };

        // Validate at least one content type is selected
        if (!config.includeDatabase && !config.includeMedia && !config.includeConfig) {
          alert('Debes seleccionar al menos un tipo de contenido para incluir');
          return;
        }

        try {
          const response = await fetch('/admincp/api/backups/auto-config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
          });

          if (response.ok) {
            alert('Configuración guardada exitosamente');
            window.location.reload();
          } else {
            const error = await response.text();
            alert('Error al guardar configuración: ' + error);
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      function resetAutoBackupForm() {
        document.getElementById('autoBackupFrequency').value = 'daily';
        document.getElementById('autoBackupTime').value = '02:00';
        document.getElementById('autoBackupWeekDay').value = '0';
        document.getElementById('autoBackupMonthDay').value = '1';
        document.getElementById('autoBackupRetention').value = '7';
        document.getElementById('autoBackupDatabase').checked = true;
        document.getElementById('autoBackupMedia').checked = true;
        document.getElementById('autoBackupConfig').checked = true;
        document.getElementById('autoBackupCompress').checked = true;
        document.getElementById('autoBackupNotify').checked = true;
        updateFrequencyOptions();
      }

      // Load existing configuration on page load
      async function loadAutoBackupConfig() {
        try {
          const response = await fetch('/admincp/api/backups/auto-config');
          if (response.ok) {
            const config = await response.json();

            if (config) {
              document.getElementById('autoBackupEnabled').checked = config.enabled || false;
              document.getElementById('autoBackupFrequency').value = config.frequency || 'daily';
              document.getElementById('autoBackupTime').value = config.time || '02:00';
              document.getElementById('autoBackupWeekDay').value = config.weekDay || '0';
              document.getElementById('autoBackupMonthDay').value = config.monthDay || '1';
              document.getElementById('autoBackupRetention').value = config.retention || 7;
              document.getElementById('autoBackupDatabase').checked = config.includeDatabase !== false;
              document.getElementById('autoBackupMedia').checked = config.includeMedia !== false;
              document.getElementById('autoBackupConfig').checked = config.includeConfig !== false;
              document.getElementById('autoBackupCompress').checked = config.compress !== false;
              document.getElementById('autoBackupNotify').checked = config.notify !== false;

              toggleAutoBackupConfig();
              updateFrequencyOptions();
            }
          }
        } catch (error) {
          console.error('Error loading auto backup config:', error);
        }
      }

      // Initialize on page load
      document.addEventListener('DOMContentLoaded', function() {
        loadAutoBackupConfig();
      });
    </script>`)}
  `;

  return AdminLayout({
    user,
    title: "Backups",
    children: content,
    activePage: "system.backups",
  });
};
