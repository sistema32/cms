import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "../components/AdminLayoutNexus.tsx";
import type { NotificationItem } from "../components/NotificationPanel.tsx";

/**
 * Nexus Dashboard - Inspired by Nexus Dashboard Gen-AI
 * Modern, clean, professional dashboard with statistics and charts
 */

interface DashboardNexusProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  stats?: {
    totalPosts: number;
    totalUsers: number;
    totalComments: number;
    totalViews: number;
  };
  recentPosts?: Array<{
    id: number;
    title: string;
    author: string;
    status: string;
    createdAt: Date;
  }>;
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const DashboardNexusPage = (props: DashboardNexusProps) => {
  const { user, stats, recentPosts = [], notifications = [], unreadNotificationCount = 0 } = props;

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

      .stat-card-trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: var(--nexus-radius-sm, 0.25rem);
      }

      .stat-card-trend.up {
        background: rgba(11, 191, 88, 0.1);
        color: var(--nexus-success, #0bbf58);
      }

      .stat-card-trend.down {
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

      .stat-card-chart {
        height: 40px;
        margin-top: 1rem;
        opacity: 0.5;
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

      .content-card-action {
        font-size: 0.875rem;
        color: var(--nexus-primary, #167bff);
        text-decoration: none;
        font-weight: 500;
        transition: opacity 0.2s;
      }

      .content-card-action:hover {
        opacity: 0.8;
      }

      /* ========== ACTIVITY LIST ========== */
      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .activity-item {
        display: flex;
        align-items: start;
        gap: 1rem;
        padding: 1rem;
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: background 0.2s;
      }

      .activity-item:hover {
        background: var(--nexus-base-200, #eef0f2);
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--nexus-radius-md, 0.5rem);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary, #167bff);
      }

      .activity-content {
        flex: 1;
        min-width: 0;
      }

      .activity-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.25rem;
        line-height: 1.4;
      }

      .activity-description {
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.65;
        line-height: 1.5;
      }

      .activity-time {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.55;
        white-space: nowrap;
        font-weight: 500;
      }

      /* ========== QUICK ACTIONS (NEXUS STYLE) ========== */
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
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

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .dashboard-title {
          font-size: 1.5rem;
        }

        .stat-grid {
          grid-template-columns: 1fr;
        }

        .stat-card-value {
          font-size: 1.75rem;
        }

        .quick-actions {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>

    <!-- Dashboard Header -->
    <div>
      <h1 class="dashboard-title">Dashboard</h1>
      <p class="dashboard-subtitle">Bienvenido de vuelta, ${user?.name || 'Usuario'} 👋</p>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <a href="/admin/posts/new" class="quick-action-btn">
        <div class="quick-action-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <span class="quick-action-label">Nueva Entrada</span>
      </a>

      <a href="/admin/pages/new" class="quick-action-btn">
        <div class="quick-action-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <span class="quick-action-label">Nueva Página</span>
      </a>

      <a href="/admin/media" class="quick-action-btn">
        <div class="quick-action-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <span class="quick-action-label">Subir Media</span>
      </a>

      <a href="/admin/users/new" class="quick-action-btn">
        <div class="quick-action-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
        </div>
        <span class="quick-action-label">Nuevo Usuario</span>
      </a>
    </div>

    <!-- Stats Grid -->
    <div class="stat-grid">
      <!-- Total Posts -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon primary">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M19,9V11H17V9H19M15,9V11H13V9H15M11,9V11H9V9H11M7,9V11H5V9H7M19,13V15H17V13H19M15,13V15H13V13H15M11,13V15H9V13H11M7,13V15H5V13H7M19,17V19H17V17H19M15,17V19H13V17H15M11,17V19H9V17H11M7,17V19H5V17H7Z"/>
            </svg>
          </div>
          <div class="stat-card-trend up">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            +12%
          </div>
        </div>
        <div class="stat-card-value">${stats?.totalPosts || 0}</div>
        <div class="stat-card-label">Total Posts</div>
        <div class="stat-card-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0,30 L20,25 L40,28 L60,20 L80,15 L100,18 L120,12 L140,8 L160,10 L180,5 L200,8"
                  fill="none" stroke="oklch(var(--p))" stroke-width="2" opacity="0.5"/>
          </svg>
        </div>
      </div>

      <!-- Total Users -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon success">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
            </svg>
          </div>
          <div class="stat-card-trend up">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            +8%
          </div>
        </div>
        <div class="stat-card-value">${stats?.totalUsers || 0}</div>
        <div class="stat-card-label">Usuarios Registrados</div>
        <div class="stat-card-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0,32 L20,30 L40,28 L60,25 L80,22 L100,20 L120,18 L140,15 L160,12 L180,10 L200,8"
                  fill="none" stroke="oklch(var(--su))" stroke-width="2" opacity="0.5"/>
          </svg>
        </div>
      </div>

      <!-- Total Comments -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon info">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"/>
            </svg>
          </div>
          <div class="stat-card-trend down">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            -3%
          </div>
        </div>
        <div class="stat-card-value">${stats?.totalComments || 0}</div>
        <div class="stat-card-label">Comentarios</div>
        <div class="stat-card-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0,15 L20,18 L40,20 L60,18 L80,22 L100,20 L120,25 L140,22 L160,28 L180,25 L200,30"
                  fill="none" stroke="oklch(var(--in))" stroke-width="2" opacity="0.5"/>
          </svg>
        </div>
      </div>

      <!-- Total Views -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon warning">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
            </svg>
          </div>
          <div class="stat-card-trend up">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            +24%
          </div>
        </div>
        <div class="stat-card-value">${stats?.totalViews || 0}</div>
        <div class="stat-card-label">Páginas Vistas</div>
        <div class="stat-card-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0,35 L20,32 L40,30 L60,28 L80,25 L100,20 L120,18 L140,15 L160,10 L180,8 L200,5"
                  fill="none" stroke="oklch(var(--wa))" stroke-width="2" opacity="0.5"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Activity (2/3 width) -->
      <div class="lg:col-span-2">
        <div class="content-card">
          <div class="content-card-header">
            <h2 class="content-card-title">Actividad Reciente</h2>
            <a href="/admin/activity" class="content-card-action">Ver todo →</a>
          </div>
          <div class="activity-list">
            ${recentPosts.length > 0
              ? raw(recentPosts.slice(0, 5).map((post) => `
                <div class="activity-item">
                  <div class="activity-icon">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7Z"/>
                    </svg>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">${post.title}</div>
                    <div class="activity-description">
                      Publicado por ${post.author} ·
                      ${post.status === 'published' ? 'Publicado' : 'Borrador'}
                    </div>
                  </div>
                  <div class="activity-time">${new Date(post.createdAt).toLocaleDateString('es')}</div>
                </div>
              `).join(''))
              : html`
                <div class="text-center py-8 text-base-content/60">
                  <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7Z"/>
                  </svg>
                  <p>No hay actividad reciente</p>
                </div>
              `
            }
          </div>
        </div>
      </div>

      <!-- Quick Stats (1/3 width) -->
      <div>
        <div class="content-card">
          <div class="content-card-header">
            <h2 class="content-card-title">Resumen Rápido</h2>
          </div>
          <div class="space-y-4">
            <!-- Stat Item -->
            <div class="flex items-center justify-between py-3 border-b border-base-content/10">
              <span class="text-sm text-base-content/60">Posts Publicados</span>
              <span class="font-semibold text-primary">${stats?.totalPosts || 0}</span>
            </div>
            <div class="flex items-center justify-between py-3 border-b border-base-content/10">
              <span class="text-sm text-base-content/60">Borradores</span>
              <span class="font-semibold">12</span>
            </div>
            <div class="flex items-center justify-between py-3 border-b border-base-content/10">
              <span class="text-sm text-base-content/60">Comentarios Pendientes</span>
              <span class="font-semibold text-warning">8</span>
            </div>
            <div class="flex items-center justify-between py-3 border-b border-base-content/10">
              <span class="text-sm text-base-content/60">Usuarios Activos</span>
              <span class="font-semibold text-success">${stats?.totalUsers || 0}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-base-content/60">Almacenamiento Usado</span>
              <span class="font-semibold">256 MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return AdminLayoutNexus({
    title: "Dashboard",
    children: content,
    activePage: "dashboard",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default DashboardNexusPage;
