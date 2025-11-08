import { html } from "hono/html";

/**
 * Notification Panel Component
 * Displays user notifications in a dropdown panel
 */

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationPanelProps {
  adminPath: string;
  notifications?: NotificationItem[];
  unreadCount?: number;
}

export const NotificationPanel = (props: NotificationPanelProps) => {
  const { adminPath, notifications = [], unreadCount = 0 } = props;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return `<path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"/>`;
      case "user":
        return `<path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>`;
      case "content":
        return `<path d="M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M19,9V11H17V9H19M15,9V11H13V9H15M11,9V11H9V9H11M7,9V11H5V9H7M19,13V15H17V13H19M15,13V15H13V13H15M11,13V15H9V13H11M7,13V15H5V13H7M19,17V19H17V17H19M15,17V19H13V17H15M11,17V19H9V17H11M7,17V19H5V17H7Z"/>`;
      case "system":
        return `<path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>`;
      default:
        return `<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>`;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "comment":
        return "text-blue-600 dark:text-blue-400";
      case "user":
        return "text-green-600 dark:text-green-400";
      case "content":
        return "text-purple-600 dark:text-purple-400";
      case "system":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    // This will be handled by JavaScript client-side
    return dateString;
  };

  return html`
    <div class="relative">
      <button
        id="notificationBtn"
        class="notifications-btn"
        onclick="toggleNotificationPanel()"
        aria-label="Notifications"
        aria-expanded="false"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
          ></path>
        </svg>
        ${unreadCount > 0
          ? html`<span
              id="notificationBadge"
              class="notification-badge"
              data-count="${unreadCount}"
            ></span>`
          : ""}
      </button>

      <!-- Notification Panel -->
      <div
        id="notificationPanel"
        class="hidden absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      >
        <!-- Panel Header -->
        <div
          class="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Notificaciones</h3>
            ${unreadCount > 0
              ? html`<span
                  class="text-xs bg-white/20 px-2 py-1 rounded-full"
                  >${unreadCount} nuevas</span
                >`
              : ""}
          </div>
        </div>

        <!-- Notifications List -->
        <div
          class="max-h-96 overflow-y-auto"
          id="notificationsList"
          style="scrollbar-width: thin;"
        >
          ${notifications.length > 0
            ? notifications.map(
                (notification) => html`
                  <a
                    href="${notification.actionUrl || "#"}"
                    class="block px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notification.isRead
                      ? "bg-purple-50 dark:bg-purple-900/10"
                      : ""}"
                    onclick="markNotificationAsRead(${notification.id})"
                  >
                    <div class="flex items-start">
                      <div
                        class="flex-shrink-0 mt-1 ${getNotificationColor(
                          notification.type,
                        )}"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          ${getNotificationIcon(notification.type)}
                        </svg>
                      </div>
                      <div class="ml-3 flex-1">
                        <div class="flex items-start justify-between">
                          <p
                            class="text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            ${notification.title}
                          </p>
                          ${!notification.isRead
                            ? html`<span
                                class="ml-2 w-2 h-2 bg-purple-600 rounded-full flex-shrink-0"
                              ></span>`
                            : ""}
                        </div>
                        <p
                          class="mt-1 text-sm text-gray-600 dark:text-gray-400"
                        >
                          ${notification.message}
                        </p>
                        <p
                          class="mt-1 text-xs text-gray-500 dark:text-gray-500"
                          data-timestamp="${notification.createdAt}"
                        >
                          ${formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </a>
                `,
              )
            : html`
                <div class="px-4 py-8 text-center text-gray-500">
                  <svg
                    class="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
                    ></path>
                  </svg>
                  <p class="text-sm dark:text-gray-400">
                    No hay notificaciones
                  </p>
                </div>
              `}
        </div>

        <!-- Panel Footer -->
        <div
          class="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between text-xs">
            ${unreadCount > 0
              ? html`<button
                  onclick="markAllNotificationsAsRead()"
                  class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                >
                  Marcar todas como leídas
                </button>`
              : html`<span></span>`}
            <a
              href="${adminPath}/notifications"
              class="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
            >
              Ver todas →
            </a>
          </div>
        </div>
      </div>
    </div>

    <style>
      #notificationsList::-webkit-scrollbar {
        width: 6px;
      }
      #notificationsList::-webkit-scrollbar-track {
        background: transparent;
      }
      #notificationsList::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.3);
        border-radius: 3px;
      }
      #notificationsList::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5);
      }
      .dark #notificationsList::-webkit-scrollbar-thumb {
        background: rgba(75, 85, 99, 0.5);
      }
    </style>

    <script>
      function toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        const btn = document.getElementById('notificationBtn');
        if (panel && btn) {
          const isHidden = panel.classList.contains('hidden');
          panel.classList.toggle('hidden');
          btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        }
      }

      function markNotificationAsRead(notificationId) {
        // Send request to mark as read
        fetch('/api/notifications/' + notificationId + '/read', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Update UI
            updateNotificationBadge();
            if (window.toast) {
              window.toast.success('Notificación marcada como leída');
            }
          }
        })
        .catch(err => {
          console.error('Error marking notification as read:', err);
          if (window.toast) {
            window.toast.error('Error al marcar la notificación como leída');
          }
        });
      }

      function markAllNotificationsAsRead() {
        fetch('/api/notifications/read-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Reload notifications
            location.reload();
          }
        })
        .catch(err => {
          console.error('Error marking all notifications as read:', err);
          if (window.toast) {
            window.toast.error('Error al marcar todas las notificaciones como leídas');
          }
        });
      }

      function updateNotificationBadge() {
        fetch('/api/notifications/unread-count')
          .then(response => response.json())
          .then(data => {
            const badge = document.getElementById('notificationBadge');
            if (data.count > 0) {
              if (!badge) {
                // Create badge if it doesn't exist
                const btn = document.getElementById('notificationBtn');
                const newBadge = document.createElement('span');
                newBadge.id = 'notificationBadge';
                newBadge.className = 'notification-badge';
                newBadge.setAttribute('data-count', data.count);
                btn.appendChild(newBadge);
              } else {
                badge.setAttribute('data-count', data.count);
              }
            } else if (badge) {
              badge.remove();
            }
          })
          .catch(err => {
            console.error('Error updating notification badge:', err);
          });
      }

      // Format timestamps
      function updateTimestamps() {
        const elements = document.querySelectorAll('[data-timestamp]');
        elements.forEach(el => {
          const timestamp = el.getAttribute('data-timestamp');
          if (timestamp) {
            el.textContent = formatTimeAgo(new Date(timestamp));
          }
        });
      }

      function formatTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Hace un momento';
        if (seconds < 3600) return \`Hace \${Math.floor(seconds / 60)} min\`;
        if (seconds < 86400) return \`Hace \${Math.floor(seconds / 3600)} h\`;
        if (seconds < 604800) return \`Hace \${Math.floor(seconds / 86400)} días\`;
        if (seconds < 2592000) return \`Hace \${Math.floor(seconds / 604800)} semanas\`;
        return date.toLocaleDateString();
      }

      // Update timestamps on load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateTimestamps);
      } else {
        updateTimestamps();
      }

      // Update timestamps every minute
      setInterval(updateTimestamps, 60000);

      // Close panel when clicking outside
      document.addEventListener('click', function(event) {
        const panel = document.getElementById('notificationPanel');
        const btn = document.getElementById('notificationBtn');
        if (panel && btn && !panel.contains(event.target) && !btn.contains(event.target)) {
          panel.classList.add('hidden');
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      // Poll for new notifications every 30 seconds
      setInterval(() => {
        updateNotificationBadge();
      }, 30000);
    </script>
  `;
};

export default NotificationPanel;
