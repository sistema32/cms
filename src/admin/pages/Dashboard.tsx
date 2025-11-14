import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import type { NotificationItem } from "../components/NotificationPanel.tsx";

/**
 * Escapes HTML entities to prevent XSS and display issues
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Admin Dashboard Page - DaisyUI Components
 * Shows statistics and recent activity using native DaisyUI components
 */

interface DashboardProps {
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

export const DashboardPage = (props: DashboardProps) => {
  const { user, stats, recentPosts = [], notifications = [], unreadNotificationCount = 0 } = props;

  const content = html`
    <!-- Dashboard Header -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold">Dashboard</h1>
    </div>

    <!-- Stats Cards (DaisyUI Stats) -->
    <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">

      <!-- Total Posts -->
      <div class="stat">
        <div class="stat-figure text-primary">
          <svg class="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M19,9V11H17V9H19M15,9V11H13V9H15M11,9V11H9V9H11M7,9V11H5V9H7M19,13V15H17V13H19M15,13V15H13V13H15M11,13V15H9V13H11M7,13V15H5V13H7M19,17V19H17V17H19M15,17V19H13V17H15M11,17V19H9V17H11M7,17V19H5V17H7Z"/>
          </svg>
        </div>
        <div class="stat-title">Total Posts</div>
        <div class="stat-value text-primary">${stats?.totalPosts || 0}</div>
        <div class="stat-desc">Entradas publicadas</div>
      </div>

      <!-- Total Users -->
      <div class="stat">
        <div class="stat-figure text-success">
          <svg class="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
          </svg>
        </div>
        <div class="stat-title">Total Usuarios</div>
        <div class="stat-value text-success">${stats?.totalUsers || 0}</div>
        <div class="stat-desc">Usuarios registrados</div>
      </div>

      <!-- Total Comments -->
      <div class="stat">
        <div class="stat-figure text-info">
          <svg class="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"/>
          </svg>
        </div>
        <div class="stat-title">Comentarios</div>
        <div class="stat-value text-info">${stats?.totalComments || 0}</div>
        <div class="stat-desc">Total de comentarios</div>
      </div>

      <!-- Total Views -->
      <div class="stat">
        <div class="stat-figure text-warning">
          <svg class="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
          </svg>
        </div>
        <div class="stat-title">Vistas</div>
        <div class="stat-value text-warning">${stats?.totalViews || 0}</div>
        <div class="stat-desc">Páginas vistas</div>
      </div>

    </div>

    <!-- Recent Posts Card with Table (DaisyUI Card + Table) -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Posts Recientes</h2>

        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${recentPosts.length > 0
                ? recentPosts.map((post) => {
                    const safeTitle = escapeHtml(post.title);
                    const safeAuthor = escapeHtml(post.author);
                    const safeStatus = escapeHtml(post.status);
                    return html`
                  <tr>
                    <td>
                      <div class="font-medium">${safeTitle}</div>
                    </td>
                    <td>
                      <div class="opacity-70">${safeAuthor}</div>
                    </td>
                    <td>
                      ${post.status === 'published'
                        ? html`<span class="badge badge-success badge-sm">Publicado</span>`
                        : post.status === 'draft'
                        ? html`<span class="badge badge-warning badge-sm">Borrador</span>`
                        : html`<span class="badge badge-neutral badge-sm">${safeStatus}</span>`
                      }
                    </td>
                    <td>
                      <div class="opacity-70">${new Date(post.createdAt).toLocaleDateString('es')}</div>
                    </td>
                    <td>
                      <div class="flex items-center justify-center gap-2">
                        <button class="btn btn-ghost btn-xs text-primary" aria-label="Edit">
                          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                          </svg>
                        </button>
                        <button class="btn btn-ghost btn-xs text-error" aria-label="Delete">
                          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
                  }).join('')
                : html`
                  <tr>
                    <td colspan="5">
                      <!-- Empty State -->
                      <div class="empty-state">
                        <svg class="empty-state-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M19,9V11H17V9H19M15,9V11H13V9H15M11,9V11H9V9H11M7,9V11H5V9H7M19,13V15H17V13H19M15,13V15H13V13H15M11,13V15H9V13H11M7,13V15H5V13H7M19,17V19H17V17H19M15,17V19H13V17H15M11,17V19H9V17H11M7,17V19H5V17H7Z"/>
                        </svg>
                        <h3 class="empty-state-title">No hay posts recientes</h3>
                        <p class="empty-state-description">Los posts aparecerán aquí cuando se creen</p>
                      </div>
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `;

  return AdminLayout({
    title: "Dashboard",
    children: content,
    activePage: "dashboard",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default DashboardPage;
