import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "../../components/AdminLayoutNexus.tsx";
import type { NotificationItem } from "../../components/NotificationPanel.tsx";

interface SecurityReportsProps {
    user?: {
        id: number;
        name: string;
        email: string;
    };
    notifications?: NotificationItem[];
    unreadNotificationCount?: number;
}

export const SecurityReportsPage = (props: SecurityReportsProps) => {
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

      .report-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .report-item {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        border: 1px solid var(--nexus-base-200);
        border-radius: var(--nexus-radius-md);
        transition: all 0.2s;
      }

      .report-item:hover {
        border-color: var(--nexus-primary);
        box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);
      }

      .report-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--nexus-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary);
        margin-bottom: 0.5rem;
      }

      .report-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--nexus-base-content);
      }

      .report-description {
        font-size: 0.875rem;
        color: var(--nexus-base-content);
        opacity: 0.65;
        flex-grow: 1;
      }

      .btn {
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: var(--nexus-radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .btn-primary {
        background: var(--nexus-primary);
        color: white;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-outline {
        background: transparent;
        border: 1px solid var(--nexus-base-300);
        color: var(--nexus-base-content);
      }

      .btn-outline:hover {
        border-color: var(--nexus-base-content);
      }

      @media print {
        .sidebar, .header, .no-print {
          display: none !important;
        }
        .main-content {
          margin: 0 !important;
          padding: 0 !important;
        }
        .content-card {
          box-shadow: none !important;
          border: none !important;
        }
      }
    </style>

    <div>
      <h1 class="dashboard-title">Reportes de Seguridad</h1>
      <p class="dashboard-subtitle">Genera y descarga reportes detallados de la actividad de seguridad</p>
    </div>

    <div class="report-grid">
      <!-- Daily Report -->
      <div class="content-card report-item">
        <div class="report-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h3 class="report-title">Reporte Diario</h3>
        <p class="report-description">Resumen de eventos de seguridad, IPs bloqueadas y violaciones de rate limit de las últimas 24 horas.</p>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="generateReport('daily', 'csv')" class="btn btn-primary" style="flex: 1;">Descargar CSV</button>
          <button onclick="generateReport('daily', 'json')" class="btn btn-outline" style="flex: 1;">JSON</button>
        </div>
      </div>

      <!-- Weekly Report -->
      <div class="content-card report-item">
        <div class="report-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="report-title">Reporte Semanal</h3>
        <p class="report-description">Análisis completo de la última semana, incluyendo tendencias y principales amenazas detectadas.</p>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="generateReport('weekly', 'csv')" class="btn btn-primary" style="flex: 1;">Descargar CSV</button>
          <button onclick="generateReport('weekly', 'json')" class="btn btn-outline" style="flex: 1;">JSON</button>
        </div>
      </div>

      <!-- Full Audit Log -->
      <div class="content-card report-item">
        <div class="report-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        </div>
        <h3 class="report-title">Auditoría Completa</h3>
        <p class="report-description">Exportación completa de todos los registros de seguridad almacenados en el sistema.</p>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="generateReport('full', 'csv')" class="btn btn-primary" style="flex: 1;">Descargar CSV</button>
          <button onclick="generateReport('full', 'json')" class="btn btn-outline" style="flex: 1;">JSON</button>
        </div>
      </div>
    </div>

    <script>
      async function generateReport(type, format) {
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = 'Generando...';
        btn.disabled = true;

        try {
          // Calculate dates based on type
          const endDate = new Date();
          let startDate = new Date();
          
          if (type === 'daily') {
            startDate.setDate(startDate.getDate() - 1);
          } else if (type === 'weekly') {
            startDate.setDate(startDate.getDate() - 7);
          } else {
            startDate = new Date(0); // Beginning of time
          }

          const queryParams = new URLSearchParams({
            format,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          });

          // Trigger download
          window.location.href = \`/api/admin/security/logs/export?\${queryParams.toString()}\`;
          
          setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
          }, 2000);

        } catch (error) {
          console.error('Failed to generate report:', error);
          alert('Error al generar el reporte');
          btn.innerText = originalText;
          btn.disabled = false;
        }
      }
    </script>
  `;

    return AdminLayoutNexus({
        title: "Reportes de Seguridad",
        children: content,
        activePage: "security.reports",
        user,
        notifications,
        unreadNotificationCount,
    });
};

export default SecurityReportsPage;
