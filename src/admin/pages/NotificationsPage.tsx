import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import type { NotificationItem } from "../components/NotificationPanel.tsx";

/**
 * Notifications Page
 * Shows all user notifications
 */

interface NotificationsPageProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const NotificationsPage = (props: NotificationsPageProps) => {
  const { user, notifications = [], unreadNotificationCount = 0 } = props;

  const content = html`
    <div class="page-header">
      <h1 class="page-title">Notificaciones</h1>
      ${unreadNotificationCount > 0
        ? html`<span class="badge-success">${unreadNotificationCount} sin leer</span>`
        : html`<span class="badge-neutral">Todo al día</span>`
      }
    </div>

    <!-- Notifications List -->
    <div class="table-card">
      ${notifications.length > 0
        ? html`
          <div class="divide-y divide-gray-200">
            ${notifications.map((notification) => html`
              <div class="p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-indigo-50' : ''}">
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0">
                    ${notification.type === 'success'
                      ? html`
                        <div class="stats-icon-container green" style="width: 2.5rem; height: 2.5rem; margin: 0;">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                          </svg>
                        </div>
                      `
                      : notification.type === 'warning'
                      ? html`
                        <div class="stats-icon-container" style="width: 2.5rem; height: 2.5rem; margin: 0; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                          </svg>
                        </div>
                      `
                      : notification.type === 'error'
                      ? html`
                        <div class="stats-icon-container" style="width: 2.5rem; height: 2.5rem; margin: 0; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                          </svg>
                        </div>
                      `
                      : html`
                        <div class="stats-icon-container blue" style="width: 2.5rem; height: 2.5rem; margin: 0;">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                          </svg>
                        </div>
                      `
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">
                      ${notification.title}
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      ${notification.message}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      ${notification.timestamp}
                    </p>
                  </div>
                  ${!notification.read
                    ? html`
                      <div class="flex-shrink-0">
                        <button
                          class="btn-icon text-indigo-600 hover:text-indigo-700"
                          aria-label="Marcar como leída"
                          onclick="markAsRead(${notification.id})"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </button>
                      </div>
                    `
                    : ''
                  }
                </div>
              </div>
            `)}
          </div>
        `
        : html`
          <div class="p-8 text-center text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No hay notificaciones</h3>
            <p class="mt-1 text-sm text-gray-500">Cuando recibas notificaciones aparecerán aquí.</p>
          </div>
        `
      }
    </div>

    <script>
      async function markAsRead(id) {
        try {
          const response = await fetch(\`/api/notifications/\${id}/read\`, {
            method: 'PATCH',
            headers: {
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
          });

          if (response.ok) {
            window.location.reload();
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    </script>
  `;

  return AdminLayout({
    title: "Notificaciones",
    content,
    user: user || { name: "Usuario", email: "" },
    activePage: "notifications",
    notifications: notifications,
    unreadNotificationCount: unreadNotificationCount,
  });
};
