import { html, raw } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "@/admin/components/nexus/NexusComponents.tsx";
import { withAdminPageLogging } from "./withAdminPageLogging.tsx";

interface NotificationsNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
  // Props para la barra de depuración
  request?: Request;
  response?: Response;
  startTime?: number;
}

const PageComponent = (props: NotificationsNexusPageProps) => {
  const {
    user,
    notifications = [],
    unreadNotificationCount = 0,
    request,
    response,
    startTime,
  } = props;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return html`
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        `;
      case "warning":
        return html`
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        `;
      case "error":
        return html`
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        `;
      default:
        return html`
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        `;
    }
  };

  const getNotificationBadgeType = (type: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (type) {
      case "success": return "success";
      case "warning": return "warning";
      case "error": return "error";
      case "info": return "info";
      default: return "default";
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} días`;
    return new Date(date).toLocaleDateString("es-ES");
  };

  const content = html`
    <style>
      .page-header-nexus {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0;
      }

      .notifications-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .notification-item {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        background: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        transition: all 0.2s;
      }

      .notification-item.unread {
        background: rgba(22, 123, 255, 0.03);
        border-color: rgba(22, 123, 255, 0.2);
      }

      .notification-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .notification-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--nexus-radius-md, 0.5rem);
      }

      .notification-icon.success {
        background: rgba(11, 191, 88, 0.1);
        color: var(--nexus-success, #0bbf58);
      }

      .notification-icon.warning {
        background: rgba(245, 165, 36, 0.1);
        color: var(--nexus-warning, #f5a524);
      }

      .notification-icon.error {
        background: rgba(243, 18, 96, 0.1);
        color: var(--nexus-error, #f31260);
      }

      .notification-icon.info {
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary, #167bff);
      }

      .notification-content {
        flex: 1;
        min-width: 0;
      }

      .notification-header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .notification-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0;
      }

      .notification-message {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
        line-height: 1.5;
        margin: 0 0 0.75rem 0;
      }

      .notification-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .notification-time {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .notification-actions {
        display: flex;
        gap: 0.5rem;
      }

      .notification-action-btn {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: var(--nexus-radius-sm, 0.25rem);
        border: none;
        background: transparent;
        color: var(--nexus-primary, #167bff);
        cursor: pointer;
        transition: all 0.2s;
      }

      .notification-action-btn:hover {
        background: rgba(22, 123, 255, 0.1);
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      @media (max-width: 640px) {
        .notification-item {
          flex-direction: column;
        }

        .notification-footer {
          flex-direction: column;
          align-items: start;
        }
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div>
        <h1 class="page-title-nexus">Notificaciones</h1>
        ${unreadNotificationCount > 0 ? html`
          <div style="margin-top: 0.5rem;">
            ${NexusBadge({
    label: `${unreadNotificationCount} sin leer`,
    type: "primary",
    soft: true
  })}
          </div>
        ` : html`
          <div style="margin-top: 0.5rem;">
            ${NexusBadge({
    label: "Todo al día",
    type: "success",
    soft: true
  })}
          </div>
        `}
      </div>
      ${notifications.length > 0 ? html`
        ${NexusButton({
    label: "Marcar todas como leídas",
    type: "outline",
    size: "sm", // El onClick se manejará con un event listener
    attributes: { "data-action": "mark-all-read" }
  })}
      ` : ''}
    </div>

    <!-- Notifications List -->
    ${notifications.length === 0 ? html`
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <h3 style="margin-top: 1rem; font-size: 1.125rem; font-weight: 600;">No hay notificaciones</h3>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Cuando recibas notificaciones aparecerán aquí</p>
      </div>
    ` : html`
      <div class="notifications-list">
        ${notifications.map(notification => html`
          <div class="notification-item ${!notification.isRead ? 'unread' : ''}" data-notification-id="${notification.id}">
            <div class="notification-icon ${notification.type}">
              ${getNotificationIcon(notification.type)}
            </div>
            <div class="notification-content">
              <div class="notification-header">
                <h3 class="notification-title">${notification.title}</h3>
                ${NexusBadge({
    label: notification.type,
    type: getNotificationBadgeType(notification.type),
    soft: true,
    size: "sm"
  })}
              </div>
              <p class="notification-message">${notification.message}</p>
              <div class="notification-footer">
                <span class="notification-time">${formatTimestamp(notification.createdAt)}</span>
                ${!notification.isRead ? html`
                  <div class="notification-actions">
                    <button
                      type="button"
                      class="notification-action-btn"
                      data-action="mark-read"
                    >
                      Marcar como leída
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}

    ${raw(`
      <script type="module">
        // Este código podría vivir en un archivo separado, ej: /assets/js/notifications.js
        
        // 1. Cliente API centralizado (ejemplo)
        const apiClient = {
          _fetch: (url, options = {}) => {
            const headers = {
              'Authorization': 'Bearer ' + localStorage.getItem('token'),
              'Content-Type': 'application/json',
              ...options.headers,
            };
            return fetch(url, { ...options, headers });
          },
          markNotificationAsRead: (notificationId) => {
            return apiClient._fetch('/api/notifications/' + notificationId + '/read', { method: 'PATCH' });
          },
          markAllNotificationsAsRead: () => {
            return apiClient._fetch('/api/notifications/mark-all-read', { method: 'PATCH' });
          }
        };

        // 2. Lógica de UI desacoplada
        function updateUnreadCountBadge(newCount) {
          const badgeContainer = document.querySelector('.page-header-nexus .nexus-badge')?.parentElement;
          if (!badgeContainer) return;

          let newBadgeHTML;
          if (newCount > 0) {
            newBadgeHTML = \`<span class="nexus-badge nexus-badge-primary nexus-badge-soft">\${newCount} sin leer</span>\`;
          } else {
            newBadgeHTML = \`<span class="nexus-badge nexus-badge-success nexus-badge-soft">Todo al día</span>\`;
          }
          badgeContainer.innerHTML = newBadgeHTML;
        }

        function handleMarkAsRead(notificationItem) {
          notificationItem.classList.remove('unread');
          notificationItem.querySelector('[data-action="mark-read"]')?.closest('.notification-actions')?.remove();
          
          const currentCount = document.querySelectorAll('.notification-item.unread').length;
          updateUnreadCountBadge(currentCount);
        }

        // 3. Listeners de eventos
        document.addEventListener('click', async (e) => {
          const markReadBtn = e.target.closest('[data-action="mark-read"]');
          const markAllReadBtn = e.target.closest('[data-action="mark-all-read"]');

          if (markReadBtn) {
            const notificationItem = markReadBtn.closest('[data-notification-id]');
            const notificationId = notificationItem?.dataset.notificationId;
            if (!notificationId) return;

            try {
              const response = await apiClient.markNotificationAsRead(notificationId);
              if (response.ok) {
                handleMarkAsRead(notificationItem);
              } else {
                alert('Error al marcar la notificación.');
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error de red al marcar la notificación.');
            }
          }

          if (markAllReadBtn) {
            if (!confirm('¿Marcar todas las notificaciones como leídas?')) return;
            const response = await apiClient.markAllNotificationsAsRead();
            if (response.ok) {
              window.location.reload(); // Simple reload for now
            } else {
              alert('Error al marcar todas las notificaciones.');
            }
          }
        });
      </script>
    `)}
  `;

  return AdminLayoutNexus({
    title: "Notificaciones",
    children: content,
    activePage: "notifications",
    user,
    notifications,
    unreadNotificationCount,
    request,
    response,
    startTime,
  });
};

export const NotificationsNexusPage = withAdminPageLogging(PageComponent, import.meta.url);

export default NotificationsNexusPage;
