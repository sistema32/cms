import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "@/admin/components/layout/AdminLayoutNexus.tsx";
import type { NotificationItem } from "@/admin/components/ui/NotificationPanel.tsx";

interface SecurityDashboardProps {
  user?: {
    id: number;
    name: string;
    email: string;
  };
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const SecurityDashboardPage = (props: SecurityDashboardProps) => {
  const { user, notifications = [], unreadNotificationCount = 0 } = props;

  const content = html`
    <style>
      /* ========== NEXUS DASHBOARD STYLES ========== */
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

      /* ========== STAT CARDS (NEXUS STYLE) ========== */
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        padding: var(--nexus-card-padding, 20px);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.03);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .stat-card:hover {
        box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.06);
        transform: translateY(-2px);
        border-color: var(--nexus-base-300, #dcdee0);
      }

      .stat-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .stat-card-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--nexus-radius-md, 0.5rem);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-card-icon.primary {
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary, #167bff);
      }

      .stat-card-icon.success {
        background: rgba(11, 191, 88, 0.1);
        color: var(--nexus-success, #0bbf58);
      }

      .stat-card-icon.info {
        background: rgba(20, 180, 255, 0.1);
        color: var(--nexus-info, #14b4ff);
      }

      .stat-card-icon.warning {
        background: rgba(245, 165, 36, 0.1);
        color: var(--nexus-warning, #f5a524);
      }

      .stat-card-icon.error {
        background: rgba(243, 18, 96, 0.1);
        color: var(--nexus-error, #f31260);
      }

      .stat-card-value {
        font-size: 2.25rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        line-height: 1;
        margin-bottom: 0.5rem;
        letter-spacing: -0.025em;
      }

      .stat-card-label {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        font-weight: 500;
      }

      /* ========== CONTENT CARDS (NEXUS STYLE) ========== */
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

      /* ========== QUICK ACTIONS (NEXUS STYLE) ========== */
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
      }

      .quick-action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.5rem;
        background: var(--nexus-base-100, #fff);
        border: 2px dashed var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
      }

      .quick-action-btn:hover {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.05);
      }

      .quick-action-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--nexus-radius-md, 0.5rem);
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary, #167bff);
      }

      .quick-action-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
      }
    </style>

    <!-- Dashboard Header -->
    <div>
      <h1 class="dashboard-title">Panel de Seguridad</h1>
      <p class="dashboard-subtitle">Monitorea y gestiona la seguridad de tu sistema 🛡️</p>
    </div>

    <!-- Stats Grid -->
    <div class="stat-grid">
      <!-- Total Events -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon primary">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13,10V3L4,14H11V21L20,10H13Z"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-value" id="events-24h">0</div>
        <div class="stat-card-label">Eventos (24h)</div>
        <div class="stat-card-chart" style="height: 40px; margin-top: 1rem; opacity: 0.5;">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0,30 L20,25 L40,28 L60,20 L80,15 L100,18 L120,12 L140,8 L160,10 L180,5 L200,8"
                  fill="none" stroke="var(--nexus-primary, #167bff)" stroke-width="2"/>
          </svg>
        </div>
      </div>

      <!-- Blocked IPs -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon error">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-value" id="blocked-ips">0</div>
        <div class="stat-card-label">IPs Bloqueadas</div>
        <div class="stat-card-chart" style="height: 40px; margin-top: 1rem; opacity: 0.5;">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0,35 L20,35 L40,35 L60,30 L80,25 L100,25 L120,20 L140,20 L160,15 L180,10 L200,5"
                  fill="none" stroke="var(--nexus-error, #f31260)" stroke-width="2"/>
          </svg>
        </div>
      </div>

      <!-- Rate Limits -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon warning">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-value" id="rate-limits">0</div>
        <div class="stat-card-label">Rate Limit</div>
        <div class="stat-card-chart" style="height: 40px; margin-top: 1rem; opacity: 0.5;">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0,38 L20,38 L40,35 L60,30 L80,32 L100,25 L120,28 L140,20 L160,15 L180,18 L200,10"
                  fill="none" stroke="var(--nexus-warning, #f5a524)" stroke-width="2"/>
          </svg>
        </div>
      </div>

      <!-- Active Rules -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon success">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-value" id="active-rules">0</div>
        <div class="stat-card-label">Reglas Activas</div>
        <div class="stat-card-chart" style="height: 40px; margin-top: 1rem; opacity: 0.5;">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0,20 L200,20"
                  fill="none" stroke="var(--nexus-success, #0bbf58)" stroke-width="2" stroke-dasharray="5,5"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="content-card">
      <div class="content-card-header">
        <h2 class="content-card-title">Acciones Rápidas</h2>
      </div>
      <div class="quick-actions">
        <a href="/admincp/security/logs" class="quick-action-btn">
          <div class="quick-action-icon">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M19,9V11H17V9H19M15,9V11H13V9H15M11,9V11H9V9H11M7,9V11H5V9H7M19,13V15H17V13H19M15,13V15H13V13H15M11,13V15H9V13H11M7,13V15H5V13H7M19,17V19H17V17H19M15,17V19H13V17H15M11,17V19H9V17H11M7,17V19H5V17H7Z"/>
            </svg>
          </div>
          <span class="quick-action-label">Ver Logs</span>
        </a>

        <a href="/admincp/security/ips/blacklist" class="quick-action-btn">
          <div class="quick-action-icon">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
            </svg>
          </div>
          <span class="quick-action-label">Blacklist</span>
        </a>

        <a href="/api/admin/security/logs/export?format=csv" class="quick-action-btn">
          <div class="quick-action-icon">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z"/>
            </svg>
          </div>
          <span class="quick-action-label">Exportar</span>
        </a>
      </div>
    </div>

    <script>
      // Fetch dashboard data
      async function loadDashboard() {
        try {
          const response = await fetch('/api/admin/security/dashboard', {
            credentials: 'include'
          });
          const result = await response.json();
          
          if (result.data && result.data.metrics) {
            document.getElementById('events-24h').textContent = result.data.metrics.totalEvents24h || 0;
            document.getElementById('blocked-ips').textContent = result.data.metrics.blockedIPs || 0;
            document.getElementById('rate-limits').textContent = result.data.metrics.rateLimitViolations || 0;
            document.getElementById('active-rules').textContent = result.data.metrics.activeRules || 0;
          }
        } catch (error) {
          console.error('Failed to load dashboard:', error);
        }
      }

      // Load on page load
      loadDashboard();
      
      // Auto-refresh every 30 seconds
      setInterval(loadDashboard, 30000);
    </script>
  `;

  return AdminLayoutNexus({
    title: "Panel de Seguridad",
    children: content,
    activePage: "security.dashboard",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default SecurityDashboardPage;
