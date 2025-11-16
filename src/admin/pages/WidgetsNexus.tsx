import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

export interface Widget {
  id: number;
  type: string;
  title: string;
  settings: Record<string, any>;
  order: number;
}

export interface WidgetArea {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
}

export interface WidgetType {
  type: string;
  name: string;
  description: string;
  icon?: string;
}

export interface WidgetsNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  widgetAreas: WidgetArea[];
  availableWidgets: WidgetType[];
  activeTheme: string;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
}

export const WidgetsNexusPage = (props: WidgetsNexusPageProps) => {
  const {
    user,
    widgetAreas,
    availableWidgets,
    activeTheme,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <style>
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        margin-bottom: 2rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0 0 0.5rem 0;
      }

      .page-description {
        font-size: 0.9375rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin: 0;
      }

      /* ========== THEME NOTICE ========== */
      .theme-notice {
        display: flex;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border-radius: var(--nexus-radius-lg, 0.75rem);
        background: rgba(22, 123, 255, 0.08);
        border: 1px solid rgba(22, 123, 255, 0.2);
        margin-bottom: 1.5rem;
      }

      .theme-notice-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        color: var(--nexus-primary, #167bff);
      }

      .theme-notice-content {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.8;
      }

      .theme-notice-content strong {
        font-weight: 600;
        opacity: 1;
      }

      /* ========== WIDGETS LAYOUT ========== */
      .widgets-container {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 1.5rem;
        align-items: start;
      }

      @media (max-width: 1024px) {
        .widgets-container {
          grid-template-columns: 1fr;
        }
      }

      .widget-areas {
        display: grid;
        gap: 1.5rem;
      }

      /* ========== WIDGET AREA CARD ========== */
      .widget-area-card {
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        overflow: hidden;
      }

      .widget-area-header {
        padding: 1.25rem;
        background: var(--nexus-base-200, #eef0f2);
        border-bottom: 1px solid var(--nexus-base-300, #dcdee0);
      }

      .widget-area-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 0.25rem 0;
      }

      .widget-area-description {
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        margin: 0;
      }

      /* ========== WIDGET DROPZONE ========== */
      .widget-dropzone {
        min-height: 100px;
        padding: 1rem;
        transition: background-color 0.2s, border-color 0.2s;
      }

      .widget-dropzone.drag-over {
        background-color: rgba(22, 123, 255, 0.05);
        border: 2px dashed var(--nexus-primary, #167bff);
      }

      .widget-dropzone.empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 150px;
      }

      /* ========== EMPTY STATE ========== */
      .empty-state {
        text-align: center;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
        font-size: 0.875rem;
      }

      .empty-state-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }

      .empty-message {
        padding: 3rem;
        text-align: center;
      }

      .empty-message h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .empty-message p {
        font-size: 0.9375rem;
        opacity: 0.6;
        margin: 0;
      }

      /* ========== WIDGET ITEM ========== */
      .widget-item {
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        padding: 1rem;
        margin-bottom: 0.75rem;
        cursor: move;
        transition: all 0.2s;
      }

      .widget-item:hover {
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 2px 8px rgba(22, 123, 255, 0.15);
      }

      .widget-item.dragging {
        opacity: 0.5;
      }

      .widget-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .widget-title {
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        font-size: 0.875rem;
      }

      .widget-actions {
        display: flex;
        gap: 0.5rem;
      }

      .widget-btn {
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--nexus-base-300, #dcdee0);
        background: transparent;
        cursor: pointer;
        color: var(--nexus-base-content, #1e2328);
        border-radius: var(--nexus-radius-sm, 0.25rem);
        transition: all 0.2s;
      }

      .widget-btn:hover {
        background: var(--nexus-base-200, #eef0f2);
        border-color: var(--nexus-primary, #167bff);
        color: var(--nexus-primary, #167bff);
      }

      .widget-btn.danger:hover {
        background: rgba(243, 18, 96, 0.1);
        border-color: var(--nexus-error, #f31260);
        color: var(--nexus-error, #f31260);
      }

      .widget-preview {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        padding: 0.5rem;
        background: var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-sm, 0.25rem);
      }

      /* ========== AVAILABLE WIDGETS SIDEBAR ========== */
      .available-widgets-sidebar {
        position: sticky;
        top: 1rem;
      }

      .available-widgets-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 1rem 0;
      }

      .available-widget {
        padding: 0.875rem;
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        margin-bottom: 0.75rem;
        cursor: grab;
        transition: all 0.2s;
        background: var(--nexus-base-100, #fff);
      }

      .available-widget:hover {
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 2px 8px rgba(22, 123, 255, 0.15);
      }

      .available-widget:active {
        cursor: grabbing;
      }

      .available-widget-name {
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .available-widget-description {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
      }

      .widget-icon {
        width: 1.5rem;
        height: 1.5rem;
        margin-bottom: 0.5rem;
        opacity: 0.7;
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <h1 class="page-title-nexus">Widgets</h1>
      <p class="page-description">Arrastra widgets a las áreas de widgets de tu theme</p>
    </div>

    <!-- Theme Notice -->
    <div class="theme-notice">
      <svg class="theme-notice-icon" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
      <div class="theme-notice-content">
        <strong>Theme activo:</strong> ${activeTheme}.
        ${widgetAreas.length > 0
          ? `Este theme soporta ${widgetAreas.length} área(s) de widgets.`
          : 'Este theme no ha definido áreas de widgets.'}
      </div>
    </div>

    ${widgetAreas.length === 0 ? html`
      ${NexusCard({
        children: html`
          <div class="empty-message">
            <div class="empty-state-icon">📦</div>
            <h3>No hay áreas de widgets disponibles</h3>
            <p>
              El theme activo no ha definido áreas de widgets. Para usar widgets,
              activa un theme que soporte widgets o define áreas en el theme.json del theme actual.
            </p>
          </div>
        `
      })}
    ` : html`
      <div class="widgets-container">
        <!-- Widget Areas -->
        <div class="widget-areas">
          ${widgetAreas.map((area) => html`
            <div class="widget-area-card">
              <div class="widget-area-header">
                <h2 class="widget-area-title">${area.name}</h2>
                ${area.description ? html`
                  <p class="widget-area-description">${area.description}</p>
                ` : ""}
              </div>

              <div
                class="widget-dropzone ${area.widgets.length === 0 ? 'empty' : ''}"
                data-area-id="${area.id}"
              >
                ${area.widgets.length === 0 ? html`
                  <div class="empty-state">
                    <div class="empty-state-icon">⬇️</div>
                    <p>Arrastra widgets aquí</p>
                  </div>
                ` : area.widgets.map((widget) => html`
                  <div
                    class="widget-item"
                    data-widget-id="${widget.id}"
                    draggable="true"
                  >
                    <div class="widget-header">
                      <span class="widget-title">${widget.title || widget.type}</span>
                      <div class="widget-actions">
                        <button
                          class="widget-btn btn-edit-widget"
                          data-widget-id="${widget.id}"
                          title="Editar"
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                        </button>
                        <button
                          class="widget-btn danger btn-remove-widget"
                          data-widget-id="${widget.id}"
                          data-area-id="${area.id}"
                          title="Eliminar"
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div class="widget-preview">
                      Widget tipo: ${widget.type}
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>

        <!-- Available Widgets Sidebar -->
        <div class="available-widgets-sidebar">
          ${NexusCard({
            children: html`
              <h3 class="available-widgets-title">Widgets disponibles</h3>
              ${availableWidgets.map((widget) => html`
                <div
                  class="available-widget"
                  draggable="true"
                  data-widget-type="${widget.type}"
                >
                  ${widget.icon ? html`
                    <div class="widget-icon">${widget.icon}</div>
                  ` : ""}
                  <div class="available-widget-name">${widget.name}</div>
                  <p class="available-widget-description">${widget.description}</p>
                </div>
              `)}
            `
          })}
        </div>
      </div>
    `}

    ${raw(`<script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      // XSS safe - event handlers in addEventListener
      document.addEventListener('DOMContentLoaded', function() {
        let draggedWidget = null;
        let draggedWidgetType = null;

        // Available widget drag start
        const availableWidgets = document.querySelectorAll('.available-widget');
        availableWidgets.forEach(widget => {
          widget.addEventListener('dragstart', function(e) {
            draggedWidgetType = this.getAttribute('data-widget-type');
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = 'copy';
              e.dataTransfer.setData('text/plain', draggedWidgetType || '');
            }
          });
        });

        // Widget item drag start
        const widgetItems = document.querySelectorAll('.widget-item');
        widgetItems.forEach(item => {
          item.addEventListener('dragstart', function(e) {
            draggedWidget = this.getAttribute('data-widget-id');
            this.classList.add('dragging');
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', draggedWidget || '');
            }
          });

          item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
          });
        });

        // Dropzone handlers
        const dropzones = document.querySelectorAll('.widget-dropzone');
        dropzones.forEach(zone => {
          zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
          });

          zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
          });

          zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            const areaId = this.getAttribute('data-area-id');
            if (!areaId) return;

            if (draggedWidgetType) {
              // Adding new widget from available widgets
              addWidget(areaId, draggedWidgetType);
              draggedWidgetType = null;
            } else if (draggedWidget) {
              // Moving existing widget
              moveWidget(draggedWidget, areaId);
              draggedWidget = null;
            }
          });
        });

        // Edit widget buttons - XSS safe
        document.addEventListener('click', function(e) {
          const editBtn = e.target.closest('.btn-edit-widget');
          if (editBtn) {
            const widgetId = editBtn.getAttribute('data-widget-id');
            editWidget(widgetId);
          }

          const removeBtn = e.target.closest('.btn-remove-widget');
          if (removeBtn) {
            const widgetId = removeBtn.getAttribute('data-widget-id');
            const areaId = removeBtn.getAttribute('data-area-id');
            removeWidget(widgetId, areaId);
          }
        });

        // API functions
        async function addWidget(areaId, widgetType) {
          try {
            const response = await fetch(ADMIN_BASE_PATH + '/api/admin/widgets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                area_id: areaId,
                widget_type: widgetType,
                title: widgetType,
                settings: {}
              })
            });

            if (response.ok) {
              window.location.reload();
            } else {
              alert('Error al agregar widget');
            }
          } catch (error) {
            console.error('Error adding widget:', error);
            alert('Error al agregar widget');
          }
        }

        async function moveWidget(widgetId, areaId) {
          try {
            const response = await fetch(ADMIN_BASE_PATH + '/api/admin/widgets/' + widgetId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ area_id: areaId })
            });

            if (response.ok) {
              window.location.reload();
            } else {
              alert('Error al mover widget');
            }
          } catch (error) {
            console.error('Error moving widget:', error);
            alert('Error al mover widget');
          }
        }

        async function removeWidget(widgetId, areaId) {
          if (!confirm('¿Eliminar este widget?')) return;

          try {
            const response = await fetch(ADMIN_BASE_PATH + '/api/admin/widgets/' + widgetId, {
              method: 'DELETE'
            });

            if (response.ok) {
              window.location.reload();
            } else {
              alert('Error al eliminar widget');
            }
          } catch (error) {
            console.error('Error removing widget:', error);
            alert('Error al eliminar widget');
          }
        }

        function editWidget(widgetId) {
          // XSS safe - using textContent instead of template literals
          const message = document.createElement('div');
          message.textContent = 'Widget editor coming soon for widget ID: ' + widgetId;
          alert(message.textContent);
        }
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Widgets",
    children: content,
    activePage: "appearance.widgets",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default WidgetsNexusPage;
