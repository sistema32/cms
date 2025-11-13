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
 * Admin Dashboard Page - Mosaic Style
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
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const DashboardPage = (props: DashboardProps) => {
  const { user, stats, recentPosts = [], notifications = [], unreadNotificationCount = 0 } = props;

  const content = html`
    <!-- Dashboard Header -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Dashboard</h1>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-12 gap-6 mb-8">

      <!-- Total Posts Card -->
      <div class="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div class="px-5 pt-5">
          <div class="flex items-start">
            <div class="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 mr-3">
              <svg class="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                <path d="M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M19,9V11H17V9H19M15,9V11H13V9H15M11,9V11H9V9H11M7,9V11H5V9H7M19,13V15H17V13H19M15,13V15H13V13H15M11,13V15H9V13H11M7,13V15H5V13H7M19,17V19H17V17H19M15,17V19H13V17H15M11,17V19H9V17H11M7,17V19H5V17H7Z"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Total Posts</div>
              <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">${stats?.totalPosts || 0}</div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Entradas publicadas
          </div>
        </div>
      </div>

      <!-- Total Users Card -->
      <div class="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div class="px-5 pt-5">
          <div class="flex items-start">
            <div class="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 mr-3">
              <svg class="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Total Usuarios</div>
              <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">${stats?.totalUsers || 0}</div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Usuarios registrados
          </div>
        </div>
      </div>

      <!-- Total Comments Card -->
      <div class="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div class="px-5 pt-5">
          <div class="flex items-start">
            <div class="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 mr-3">
              <svg class="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Comentarios</div>
              <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">${stats?.totalComments || 0}</div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Total de comentarios
          </div>
        </div>
      </div>

      <!-- Total Views Card -->
      <div class="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div class="px-5 pt-5">
          <div class="flex items-start">
            <div class="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 mr-3">
              <svg class="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Vistas</div>
              <div class="text-3xl font-bold text-gray-800 dark:text-gray-100">${stats?.totalViews || 0}</div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Páginas vistas
          </div>
        </div>
      </div>

    </div>

    <!-- Recent Posts Table -->
    <div class="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header class="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 class="font-semibold text-gray-800 dark:text-gray-100">Posts Recientes</h2>
      </header>
      <div class="p-3">
        <div class="overflow-x-auto">
          <table class="table-auto w-full">
            <thead class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20">
              <tr>
                <th class="p-2 whitespace-nowrap">
                  <div class="font-semibold text-left">Título</div>
                </th>
                <th class="p-2 whitespace-nowrap">
                  <div class="font-semibold text-left">Autor</div>
                </th>
                <th class="p-2 whitespace-nowrap">
                  <div class="font-semibold text-left">Estado</div>
                </th>
                <th class="p-2 whitespace-nowrap">
                  <div class="font-semibold text-left">Fecha</div>
                </th>
                <th class="p-2 whitespace-nowrap">
                  <div class="font-semibold text-center">Acciones</div>
                </th>
              </tr>
            </thead>
            <tbody class="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              ${recentPosts.length > 0
                ? recentPosts.map((post) => {
                    const safeTitle = escapeHtml(post.title);
                    const safeAuthor = escapeHtml(post.author);
                    const safeStatus = escapeHtml(post.status);
                    return html`
                  <tr>
                    <td class="p-2 whitespace-nowrap">
                      <div class="font-medium text-gray-800 dark:text-gray-100">${safeTitle}</div>
                    </td>
                    <td class="p-2 whitespace-nowrap">
                      <div class="text-gray-500 dark:text-gray-400">${safeAuthor}</div>
                    </td>
                    <td class="p-2 whitespace-nowrap">
                      ${post.status === 'published'
                        ? html`<span class="inline-flex font-medium bg-green-500/20 text-green-700 rounded-full text-center px-2.5 py-0.5">Publicado</span>`
                        : post.status === 'draft'
                        ? html`<span class="inline-flex font-medium bg-yellow-500/20 text-yellow-700 rounded-full text-center px-2.5 py-0.5">Borrador</span>`
                        : html`<span class="inline-flex font-medium bg-gray-500/20 text-gray-700 rounded-full text-center px-2.5 py-0.5">${safeStatus}</span>`
                      }
                    </td>
                    <td class="p-2 whitespace-nowrap">
                      <div class="text-gray-500 dark:text-gray-400">${new Date(post.createdAt).toLocaleDateString('es')}</div>
                    </td>
                    <td class="p-2 whitespace-nowrap">
                      <div class="flex items-center justify-center space-x-2">
                        <button class="text-gray-400 hover:text-violet-500 dark:hover:text-violet-400 rounded-full" aria-label="Edit">
                          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                          </svg>
                        </button>
                        <button class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full" aria-label="Delete">
                          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
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
                    <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400">
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
