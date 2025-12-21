import { html, raw } from "hono/html";

/**
 * Notification Panel Component - DaisyUI Native
 * Displays user notifications using DaisyUI Dropdown component
 */

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
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

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "comment":
        return "badge-info";
      case "user":
        return "badge-success";
      case "content":
        return "badge-primary";
      case "system":
        return "badge-warning";
      default:
        return "badge-neutral";
    }
  };

  return html`
    <!-- DaisyUI Dropdown with Indicator -->
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle" aria-label="Notifications">
        <div class="indicator">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
          </svg>
          ${unreadCount > 0
      ? html`<span class="badge badge-sm badge-primary indicator-item">${unreadCount}</span>`
      : ''}
        </div>
      </div>

      <!-- Dropdown Content (Card) -->
      <div tabindex="0" class="dropdown-content card card-compact w-80 mt-3 shadow-xl bg-base-100 border border-base-300 z-[1]">

        <!-- Card Header with Gradient -->
        <div class="card-body p-0">
          <div class="bg-gradient-to-r from-primary to-secondary text-primary-content px-4 py-3 rounded-t-2xl">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-sm">Notificaciones</h3>
              ${unreadCount > 0
      ? html`<span class="badge badge-sm bg-base-100/20 border-0">${unreadCount} nuevas</span>`
      : ''}
            </div>
          </div>

          <!-- Notifications List -->
          <div class="max-h-96 overflow-y-auto notification-scroll-container">
            ${notifications.length > 0
      ? notifications.map(notification => html`
                  <a
                    href="${notification.actionUrl || '#'}"
                    class="flex items-start gap-3 px-4 py-3 border-b border-base-300 hover:bg-base-200 transition-colors ${!notification.isRead ? 'bg-primary/5' : ''}"
                    onclick="markNotificationAsRead(${notification.id})"
                  >
                    <!-- Icon Badge -->
                    <div class="badge ${getBadgeColor(notification.type)} badge-lg gap-2 shrink-0">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        ${getNotificationIcon(notification.type)}
                      </svg>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2">
                        <p class="font-medium text-sm">${notification.title}</p>
                        ${!notification.isRead
          ? html`<span class="badge badge-primary badge-xs shrink-0"></span>`
          : ''}
                      </div>
                      <p class="text-sm opacity-70 mt-1">${notification.message}</p>
                      <p class="text-xs opacity-50 mt-1" data-timestamp="${notification.createdAt}">
                        ${notification.createdAt}
                      </p>
                    </div>
                  </a>
                `).join('')
      : html`
                  <!-- Empty State -->
                  <div class="flex flex-col items-center justify-center py-12 px-4">
                    <svg class="w-12 h-12 opacity-20 mb-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
                    </svg>
                    <p class="text-sm opacity-60">No hay notificaciones</p>
                  </div>
                `}
          </div>

          <!-- Card Footer -->
          <div class="bg-base-200 px-4 py-2 rounded-b-2xl border-t border-base-300">
            <div class="flex items-center justify-between text-xs">
              ${unreadCount > 0
      ? html`<button
                    data-action="markAllNotificationsAsRead()"
                    class="btn btn-ghost btn-xs text-primary"
                  >
                    Marcar todas como leídas
                  </button>`
      : html`<span></span>`}
              <a href="${adminPath}/notifications" class="btn btn-ghost btn-xs">
                Ver todas →
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>

    <style>
      .notification-scroll-container {
        scrollbar-width: thin;
      }
    </style>

    ${raw(`
    <script>
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
            const badge = document.querySelector('.indicator-item');
            if (data.count > 0) {
              if (badge) {
                badge.textContent = data.count;
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

      // Connect to SSE stream for real-time notifications
      let eventSource = null;
      let reconnectTimeout = null;
      let sseAttempts = 0;
      const MAX_SSE_RETRIES = 3;

      function connectSSE() {
        // DIAGNÓSTICO: Primero probar con fetch para ver si las cookies funcionan
        fetch('/api/notifications/stream', {
          method: 'HEAD',
          credentials: 'same-origin'
        })
        .then(response => {
          console.log('Diagnóstico fetch a SSE:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (response.status !== 200) {
            console.error('SSE endpoint no disponible. Status:', response.status);
            console.error('Posible problema de autenticación o servidor');
            return;
          }
          
          // Si fetch funciona, intentar EventSource
          try {
            const url = '/api/notifications/stream';
            console.log('Conectando a SSE:', url);
            
            eventSource = new EventSource(url, { withCredentials: true });

          eventSource.onmessage = (event) => {
            if (!event.data || event.data.trim() === '') return;
            try {
              const data = JSON.parse(event.data);
              console.log('Mensaje SSE recibido:', data);
              
              if (data.type === 'notification') {
                location.reload();
              }
            } catch (err) {
              // Ignore parse errors for keep-alive or non-JSON messages
              // console.error('Error al parsear mensaje SSE:', err);
            }
          };

          eventSource.onerror = (error) => {
            console.error('Error de conexión SSE:', error);
            console.error('ReadyState:', eventSource?.readyState);
            if (eventSource) {
              eventSource.close();
            }
            sseAttempts += 1;
            if (sseAttempts > MAX_SSE_RETRIES) {
              console.warn('SSE deshabilitado tras múltiples fallos; usando polling para notificaciones.');
              updateNotificationBadge();
              setInterval(updateNotificationBadge, 300000);
              return;
            }
            reconnectTimeout = setTimeout(connectSSE, 5000);
          };

          eventSource.onopen = () => {
            console.log('Conexión SSE establecida correctamente');
            sseAttempts = 0;
          };
        } catch (err) {
          console.error('Error al crear EventSource:', err);
          setInterval(() => {
            updateNotificationBadge();
          }, 300000);
        }
      })
      .catch(err => {
        console.error('Error en diagnóstico fetch SSE:', err);
        // Fallback a polling
        setInterval(() => {
          updateNotificationBadge();
        }, 300000);
      });
    }

      // Iniciar conexión SSE
      connectSSE();

      // Limpieza al descargar la página
      window.addEventListener('beforeunload', () => {
        if (eventSource) {
          eventSource.close();
        }
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
      });
    </script>
    `)}
  `;
};

export default NotificationPanel;
// @ts-nocheck
