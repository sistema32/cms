import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
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

export interface WidgetsPageProps {
  user: {
    name: string | null;
    email: string;
  };
  widgetAreas: WidgetArea[];
  availableWidgets: WidgetType[];
  activeTheme: string;
}

export const WidgetsPage = (props: WidgetsPageProps) => {
  const {
    user,
    widgetAreas,
    availableWidgets,
    activeTheme,
  } = props;

  const content = html`
    <style>
      .widgets-container {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 2rem;
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

      .widget-area-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        overflow: hidden;
      }

      .widget-area-header {
        padding: 1.25rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .widget-area-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.25rem;
      }

      .widget-area-description {
        font-size: 0.875rem;
        color: #64748b;
      }

      .widget-dropzone {
        min-height: 100px;
        padding: 1rem;
        transition: background-color 0.2s;
      }

      .widget-dropzone.drag-over {
        background-color: rgba(59, 130, 246, 0.05);
        border: 2px dashed #3b82f6;
      }

      .widget-dropzone.empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 150px;
      }

      .empty-state {
        text-align: center;
        color: #94a3b8;
        font-size: 0.875rem;
      }

      .empty-state-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }

      .widget-item {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
        cursor: move;
        transition: all 0.2s;
      }

      .widget-item:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
        font-weight: 500;
        color: #1e293b;
        font-size: 0.875rem;
      }

      .widget-actions {
        display: flex;
        gap: 0.5rem;
      }

      .widget-btn {
        padding: 0.25rem 0.5rem;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #64748b;
        border-radius: 0.25rem;
        transition: all 0.2s;
      }

      .widget-btn:hover {
        background: #f1f5f9;
        color: #1e293b;
      }

      .widget-btn.danger:hover {
        background: #fee2e2;
        color: #dc2626;
      }

      .widget-preview {
        font-size: 0.75rem;
        color: #64748b;
        padding: 0.5rem;
        background: #f8fafc;
        border-radius: 0.25rem;
      }

      .available-widgets-sidebar {
        position: sticky;
        top: 1rem;
      }

      .available-widgets-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        padding: 1.25rem;
      }

      .available-widgets-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 1rem;
      }

      .available-widget {
        padding: 0.875rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        margin-bottom: 0.75rem;
        cursor: grab;
        transition: all 0.2s;
        background: white;
      }

      .available-widget:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
      }

      .available-widget:active {
        cursor: grabbing;
      }

      .available-widget-name {
        font-weight: 500;
        color: #1e293b;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .available-widget-description {
        font-size: 0.75rem;
        color: #64748b;
      }

      .widget-icon {
        width: 1.5rem;
        height: 1.5rem;
        margin-bottom: 0.5rem;
        opacity: 0.7;
      }

      .theme-notice {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
        display: flex;
        gap: 0.75rem;
        align-items: start;
      }

      .theme-notice-icon {
        color: #3b82f6;
        flex-shrink: 0;
      }

      .theme-notice-content {
        font-size: 0.875rem;
        color: #1e40af;
      }
    </style>

    <div class="page-header">
      <h1 class="page-title">Widgets</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Arrastra widgets a las áreas de widgets de tu theme
      </p>
    </div>

    <div class="theme-notice">
      <svg class="widget-icon theme-notice-icon" fill="currentColor" viewBox="0 0 20 20">
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
      <div class="form-card">
        <div class="empty-state" style="padding: 3rem;">
          <div class="empty-state-icon">📦</div>
          <h3 class="text-lg font-semibold mb-2">No hay áreas de widgets disponibles</h3>
          <p class="text-gray-600">
            El theme activo no ha definido áreas de widgets. Para usar widgets,
            activa un theme que soporte widgets o define áreas en el theme.json del theme actual.
          </p>
        </div>
      </div>
    ` : html`
      <div class="widgets-container">
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
                ondrop="handleWidgetDrop(event)"
                ondragover="handleDragOver(event)"
                ondragleave="handleDragLeave(event)"
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
                    ondragstart="handleWidgetDragStart(event)"
                  >
                    <div class="widget-header">
                      <span class="widget-title">${widget.title || widget.type}</span>
                      <div class="widget-actions">
                        <button
                          class="widget-btn"
                          onclick="editWidget(${widget.id})"
                          title="Editar"
                        >
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                        </button>
                        <button
                          class="widget-btn danger"
                          onclick="removeWidget(${widget.id}, '${area.id}')"
                          title="Eliminar"
                        >
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

        <div class="available-widgets-sidebar">
          <div class="available-widgets-card">
            <h3 class="available-widgets-title">Widgets disponibles</h3>
            ${availableWidgets.map((widget) => html`
              <div
                class="available-widget"
                draggable="true"
                data-widget-type="${widget.type}"
                ondragstart="handleAvailableWidgetDragStart(event)"
              >
                ${widget.icon ? html`
                  <div class="widget-icon">${widget.icon}</div>
                ` : ""}
                <div class="available-widget-name">${widget.name}</div>
                <p class="available-widget-description">${widget.description}</p>
              </div>
            `)}
          </div>
        </div>
      </div>
    `}

    <script>
      let draggedWidget = null;
      let draggedWidgetType = null;

      function handleAvailableWidgetDragStart(e) {
        draggedWidgetType = e.target.dataset.widgetType;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', draggedWidgetType);
      }

      function handleWidgetDragStart(e) {
        draggedWidget = e.target.dataset.widgetId;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedWidget);
      }

      function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
      }

      function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
      }

      function handleWidgetDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const areaId = e.currentTarget.dataset.areaId;

        if (draggedWidgetType) {
          // Adding new widget from available widgets
          addWidget(areaId, draggedWidgetType);
          draggedWidgetType = null;
        } else if (draggedWidget) {
          // Moving existing widget
          moveWidget(draggedWidget, areaId);
          document.querySelector(\`[data-widget-id="\${draggedWidget}"]\`)?.classList.remove('dragging');
          draggedWidget = null;
        }
      }

      async function addWidget(areaId, widgetType) {
        try {
          const response = await fetch('${env.ADMIN_PATH}/api/admin/widgets', {
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
            location.reload();
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
          const response = await fetch(\`${env.ADMIN_PATH}/api/admin/widgets/\${widgetId}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ area_id: areaId })
          });

          if (response.ok) {
            location.reload();
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
          const response = await fetch(\`${env.ADMIN_PATH}/api/admin/widgets/\${widgetId}\`, {
            method: 'DELETE'
          });

          if (response.ok) {
            location.reload();
          } else {
            alert('Error al eliminar widget');
          }
        } catch (error) {
          console.error('Error removing widget:', error);
          alert('Error al eliminar widget');
        }
      }

      function editWidget(widgetId) {
        alert('Widget editor coming soon for widget ID: ' + widgetId);
      }
    </script>
  `;

  return AdminLayout({
    title: "Widgets",
    children: content,
    activePage: "appearance.widgets",
    user,
  });
};

export default WidgetsPage;
