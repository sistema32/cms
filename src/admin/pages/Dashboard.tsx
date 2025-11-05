import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";

/**
 * Admin Dashboard Page
 * Shows statistics and recent activity
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
}

export const DashboardPage = (props: DashboardProps) => {
  const { user, stats, recentPosts = [] } = props;

  const content = html`
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
      <!-- Total Posts -->
      <div class="stats-card">
        <div class="stats-icon-container">
          <svg class="stats-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="stats-content">
          <p class="stats-label">Total Posts</p>
          <p class="stats-value">${stats?.totalPosts || 0}</p>
        </div>
      </div>

      <!-- Total Users -->
      <div class="stats-card">
        <div class="stats-icon-container green">
          <svg class="stats-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
          </svg>
        </div>
        <div class="stats-content">
          <p class="stats-label">Total Usuarios</p>
          <p class="stats-value">${stats?.totalUsers || 0}</p>
        </div>
      </div>

      <!-- Total Comments -->
      <div class="stats-card">
        <div class="stats-icon-container blue">
          <svg class="stats-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="stats-content">
          <p class="stats-label">Comentarios</p>
          <p class="stats-value">${stats?.totalComments || 0}</p>
        </div>
      </div>

      <!-- Total Views -->
      <div class="stats-card">
        <div class="stats-icon-container teal">
          <svg class="stats-icon" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="stats-content">
          <p class="stats-label">Vistas</p>
          <p class="stats-value">${stats?.totalViews || 0}</p>
        </div>
      </div>
    </div>

    <!-- Recent Posts Table -->
    <div class="mb-8">
      <h2 class="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">Posts Recientes</h2>
      <div class="table-card">
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${recentPosts.length > 0
                ? recentPosts.map((post) => html`
                  <tr>
                    <td>
                      <div class="text-sm">
                        <p class="font-semibold">${post.title}</p>
                      </div>
                    </td>
                    <td>
                      <div class="text-sm">
                        <p>${post.author}</p>
                      </div>
                    </td>
                    <td>
                      ${post.status === 'published'
                        ? html`<span class="badge-success">Publicado</span>`
                        : post.status === 'draft'
                        ? html`<span class="badge-warning">Borrador</span>`
                        : html`<span class="badge-neutral">${post.status}</span>`
                      }
                    </td>
                    <td>
                      <span class="text-sm">${new Date(post.createdAt).toLocaleDateString('es')}</span>
                    </td>
                    <td>
                      <div class="flex items-center space-x-4 text-sm">
                        <button class="btn-icon" aria-label="Edit">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                          </svg>
                        </button>
                        <button class="btn-icon" aria-label="Delete">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')
                : html`
                  <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay posts recientes
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid gap-6 mb-8 md:grid-cols-2">
      <!-- Traffic Chart -->
      <div class="chart-container">
        <h4 class="chart-title">Tráfico</h4>
        <canvas id="trafficChart"></canvas>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Visitantes en los últimos 7 días
        </p>
      </div>

      <!-- Revenue Chart -->
      <div class="chart-container">
        <h4 class="chart-title">Contenido</h4>
        <canvas id="contentChart"></canvas>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Posts publicados por categoría
        </p>
      </div>
    </div>
  `;

  return AdminLayout({
    title: "Dashboard",
    children: content,
    activePage: "dashboard",
    user,
  });
};

export default DashboardPage;
