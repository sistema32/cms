import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

export interface MenuSummary {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
}

export interface MenuItemNode {
  id: number;
  label: string;
  url?: string | null;
  type: "custom" | "content" | "category" | "tag";
  reference?: string;
  children?: MenuItemNode[];
}

interface AppearanceMenusNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  menus: MenuSummary[];
  selectedMenu?: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    isActive: boolean;
    items: MenuItemNode[];
  };
  categories: Array<{ id: number; name: string; slug: string }>;
  posts: Array<{ id: number; title: string; slug: string }>;
  pages: Array<{ id: number; title: string; slug: string }>;
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

// XSS safe - recursive rendering function
const renderMenuItems = (items: MenuItemNode[]) => {
  if (!items || items.length === 0) {
    return html``;
  }

  return html`
    <ul class="menu-children">
      ${items.map((item) => html`
        <li class="menu-node" data-item-id="${item.id}">
          <div class="menu-drop-zone" data-position="before" data-item-id="${item.id}"></div>
          <div class="menu-node-card" draggable="true">
            <span class="menu-drag-handle" title="Arrastrar para reordenar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path d="M7 4a1 1 0 102 0 1 1 0 00-2 0zM7 10a1 1 0 102 0 1 1 0 00-2 0zM7 16a1 1 0 102 0 1 1 0 00-2 0zM11 5a1 1 0 110-2 1 1 0 010 2zM11 11a1 1 0 110-2 1 1 0 010 2zM11 17a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </span>
            <div class="menu-node-info">
              <div class="menu-node-title">${item.label}</div>
              <div class="menu-node-meta">
                ${item.type === "custom"
                  ? "Enlace personalizado"
                  : item.type === "content"
                  ? "Contenido"
                  : item.type === "category"
                  ? "Categoría"
                  : "Tag"}
              </div>
            </div>
            <div class="menu-node-actions">
              <button type="button" data-action="edit-item" data-item-id="${item.id}" class="menu-node-btn" title="Editar">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
              </button>
              <button type="button" data-action="delete-item" data-item-id="${item.id}" class="menu-node-btn" title="Eliminar">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="menu-drop-zone menu-drop-zone--child" data-position="child" data-item-id="${item.id}">
            Soltar aquí para anidar
          </div>
          ${renderMenuItems(item.children ?? [])}
          <div class="menu-drop-zone" data-position="after" data-item-id="${item.id}"></div>
        </li>
      `)}
    </ul>
  `;
};

export const AppearanceMenusNexusPage = (props: AppearanceMenusNexusPageProps) => {
  const {
    user,
    menus,
    selectedMenu,
    categories,
    posts,
    pages,
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
        margin: 0;
      }

      /* ========== LAYOUT ========== */
      .appearance-grid {
        display: grid;
        gap: 1.5rem;
      }

      @media (min-width: 1024px) {
        .appearance-grid {
          grid-template-columns: 320px minmax(0, 1fr);
        }
      }

      /* ========== SIDEBAR ========== */
      .menu-section {
        margin-bottom: 2rem;
      }

      .menu-section-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin: 0 0 0.75rem 0;
      }

      .form-field {
        margin-bottom: 1rem;
      }

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        margin-bottom: 0.5rem;
      }

      .form-input,
      .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        transition: all 0.2s;
      }

      .form-input:focus,
      .form-select:focus {
        outline: none;
        border-color: var(--nexus-primary, #167bff);
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .form-checkbox {
        width: 18px;
        height: 18px;
        border: 2px solid var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-sm, 0.25rem);
        cursor: pointer;
      }

      .form-checkbox:checked {
        background: var(--nexus-primary, #167bff);
        border-color: var(--nexus-primary, #167bff);
      }

      .checkbox-label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }

      /* ========== MENU NODES ========== */
      .menu-node {
        list-style: none;
      }

      .menu-node-card {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.75rem 0.9rem;
        border-radius: var(--nexus-radius-md, 0.5rem);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        background: var(--nexus-base-100, #fff);
        cursor: grab;
        transition: all 0.2s;
      }

      .menu-node-card:active {
        cursor: grabbing;
        transform: scale(0.99);
        box-shadow: 0 4px 12px rgba(22, 123, 255, 0.2);
      }

      .menu-drag-handle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 50%;
        background: rgba(22, 123, 255, 0.12);
        color: var(--nexus-primary, #167bff);
      }

      .menu-node-info {
        flex: 1;
        min-width: 0;
      }

      .menu-node-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
      }

      .menu-node-meta {
        font-size: 0.72rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
      }

      .menu-node-actions {
        display: flex;
        gap: 0.35rem;
      }

      .menu-node-btn {
        width: 1.9rem;
        height: 1.9rem;
        border-radius: 50%;
        border: 1px solid var(--nexus-base-300, #dcdee0);
        background: var(--nexus-base-100, #fff);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .menu-node-btn:hover {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.1);
        color: var(--nexus-primary, #167bff);
      }

      .menu-children {
        list-style: none;
        margin: 0.7rem 0 0 0;
        padding-left: 1.5rem;
        display: grid;
        gap: 0.7rem;
      }

      /* ========== DROP ZONES ========== */
      .menu-drop-zone {
        border: 1px dashed transparent;
        border-radius: var(--nexus-radius-md, 0.5rem);
        padding: 0.45rem;
        font-size: 0.7rem;
        text-align: center;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.4;
        transition: all 0.15s;
      }

      .menu-drop-zone--child {
        margin: 0.35rem 0 0.6rem;
      }

      .menu-drop-zone.drop-target {
        border-color: var(--nexus-primary, #167bff);
        background: rgba(22, 123, 255, 0.1);
        opacity: 1;
      }

      /* ========== MENU HELP ========== */
      .menu-help {
        display: grid;
        gap: 0.4rem;
        font-size: 0.78rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
      }

      /* ========== ACCORDION ========== */
      .menu-accordion summary {
        cursor: pointer;
        padding: 0.7rem 0.9rem;
        border-radius: var(--nexus-radius-md, 0.5rem);
        background: var(--nexus-base-200, #eef0f2);
        border: 1px solid var(--nexus-base-300, #dcdee0);
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
        list-style: none;
      }

      .menu-accordion[open] summary {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .menu-accordion > div {
        border: 1px solid var(--nexus-base-300, #dcdee0);
        border-top: none;
        padding: 0.9rem;
        border-radius: 0 0 var(--nexus-radius-md, 0.5rem) var(--nexus-radius-md, 0.5rem);
        background: var(--nexus-base-100, #fff);
      }

      /* ========== EMPTY STATE ========== */
      .menu-empty {
        text-align: center;
        padding: 2rem;
        border: 1px dashed var(--nexus-base-300, #dcdee0);
        border-radius: var(--nexus-radius-md, 0.5rem);
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        font-size: 0.9rem;
      }

      /* ========== SCROLL ========== */
      .custom-scroll::-webkit-scrollbar {
        width: 6px;
      }

      .custom-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .custom-scroll::-webkit-scrollbar-thumb {
        background: var(--nexus-base-300, #dcdee0);
        border-radius: 999px;
      }

      /* ========== UTILITIES ========== */
      .space-y-2 > * + * {
        margin-top: 0.5rem;
      }

      .space-y-3 > * + * {
        margin-top: 0.75rem;
      }

      .space-y-6 > * + * {
        margin-top: 1.5rem;
      }

      .mb-4 {
        margin-bottom: 1rem;
      }

      .w-full {
        width: 100%;
      }

      .flex {
        display: flex;
      }

      .flex-1 {
        flex: 1;
      }

      .gap-2 {
        gap: 0.5rem;
      }
    </style>

    <!-- Page Header -->
    <div class="page-header-nexus">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <h1 class="page-title-nexus">Menús</h1>
        ${NexusButton({
          label: "Volver a Themes",
          type: "outline",
          href: `${adminPath}/appearance/themes`
        })}
      </div>
    </div>

    <div class="appearance-grid" id="menuManager" data-menu-id="${selectedMenu?.id ?? ""}">
      <!-- Sidebar -->
      <aside>
        ${NexusCard({
          children: html`
            <div class="space-y-6">
              <!-- Create Menu -->
              <section class="menu-section">
                <h2 class="menu-section-title">Gestionar menús</h2>
                <form method="POST" action="${adminPath}/appearance/menus/create" class="space-y-3">
                  <div class="form-field">
                    <label class="form-label">Nombre</label>
                    <input type="text" name="name" class="form-input" required placeholder="Nuevo menú" />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Slug</label>
                    <input type="text" name="slug" class="form-input" required placeholder="menu-principal" />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Descripción</label>
                    <textarea name="description" rows="2" class="form-input" placeholder="Opcional"></textarea>
                  </div>
                  ${NexusButton({ label: "Crear menú", type: "primary", isSubmit: true, fullWidth: true })}
                </form>
              </section>

              <!-- Select Menu -->
              <section class="menu-section">
                <h2 class="menu-section-title">Menús existentes</h2>
                <form method="GET" action="${adminPath}/appearance/menus" class="space-y-3">
                  <select name="menuId" class="form-select" data-auto-submit>
                    ${menus.map((menu) => html`
                      <option value="${menu.id}" ${selectedMenu?.id === menu.id ? "selected" : ""}>
                        ${menu.name}
                      </option>
                    `)}
                  </select>
                </form>
                ${selectedMenu ? html`
                  <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/update" class="space-y-3" style="margin-top: 1rem;">
                    <div class="form-field">
                      <label class="form-label">Nombre</label>
                      <input type="text" name="name" class="form-input" value="${selectedMenu.name}" required />
                    </div>
                    <div class="form-field">
                      <label class="form-label">Slug</label>
                      <input type="text" name="slug" class="form-input" value="${selectedMenu.slug}" required />
                    </div>
                    <div class="form-field">
                      <label class="form-label">Descripción</label>
                      <textarea name="description" rows="2" class="form-input">${selectedMenu.description || ""}</textarea>
                    </div>
                    <label class="checkbox-label">
                      <input type="hidden" name="isActive" value="false" />
                      <input type="checkbox" name="isActive" value="true" class="form-checkbox" ${selectedMenu.isActive ? "checked" : ""} />
                      Menú activo
                    </label>
                    <div class="flex gap-2">
                      ${NexusButton({ label: "Actualizar", type: "primary", isSubmit: true, fullWidth: true })}
                      <button
                        type="submit"
                        class="btn-delete-menu"
                        data-menu-id="${selectedMenu.id}"
                        style="flex: 1; padding: 0.75rem; border: 1px solid var(--nexus-error); color: var(--nexus-error); background: transparent; border-radius: var(--nexus-radius-md); cursor: pointer;"
                      >
                        Eliminar
                      </button>
                    </div>
                  </form>
                ` : ""}
              </section>

              <!-- Help -->
              <section class="menu-section">
                <h2 class="menu-section-title">Ayuda rápida</h2>
                <div class="menu-help">
                  <p>Selecciona elementos en las pestañas de abajo para agregarlos al menú.</p>
                  <p>Arrastra cada elemento usando el asa lateral para ordenar o crear submenús.</p>
                  <p>Los cambios de orden se guardan automáticamente.</p>
                </div>
              </section>

              <!-- Add Items -->
              <section class="menu-section">
                <h2 class="menu-section-title">Agregar elementos</h2>
                ${selectedMenu ? html`
                  <div class="space-y-3">
                    <details class="menu-accordion" open>
                      <summary>Categorías</summary>
                      <div class="space-y-2">
                        <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/items/add" class="space-y-2">
                          <input type="hidden" name="type" value="category" />
                          <div style="max-height: 9rem; overflow-y: auto;" class="custom-scroll space-y-1">
                            ${categories.length === 0
                              ? html`<p style="font-size: 0.75rem; opacity: 0.6;">Aún no hay categorías creadas.</p>`
                              : categories.map((category) => html`
                                <label class="checkbox-label">
                                  <input type="checkbox" class="form-checkbox" name="categoryIds[]" value="${category.id}" />
                                  <span>${category.name}</span>
                                </label>
                              `)}
                          </div>
                          ${NexusButton({ label: "Agregar", type: "outline", size: "sm", isSubmit: true, fullWidth: true })}
                        </form>
                      </div>
                    </details>

                    <details class="menu-accordion">
                      <summary>Páginas</summary>
                      <div class="space-y-2">
                        <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/items/add" class="space-y-2">
                          <input type="hidden" name="type" value="page" />
                          <div style="max-height: 9rem; overflow-y: auto;" class="custom-scroll space-y-1">
                            ${pages.length === 0
                              ? html`<p style="font-size: 0.75rem; opacity: 0.6;">Aún no hay páginas publicadas.</p>`
                              : pages.map((page) => html`
                                <label class="checkbox-label">
                                  <input type="checkbox" class="form-checkbox" name="contentIds[]" value="${page.id}" />
                                  <span>${page.title}</span>
                                </label>
                              `)}
                          </div>
                          ${NexusButton({ label: "Agregar", type: "outline", size: "sm", isSubmit: true, fullWidth: true })}
                        </form>
                      </div>
                    </details>

                    <details class="menu-accordion">
                      <summary>Entradas</summary>
                      <div class="space-y-2">
                        <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/items/add" class="space-y-2">
                          <input type="hidden" name="type" value="post" />
                          <div style="max-height: 9rem; overflow-y: auto;" class="custom-scroll space-y-1">
                            ${posts.length === 0
                              ? html`<p style="font-size: 0.75rem; opacity: 0.6;">Aún no hay entradas publicadas.</p>`
                              : posts.map((post) => html`
                                <label class="checkbox-label">
                                  <input type="checkbox" class="form-checkbox" name="contentIds[]" value="${post.id}" />
                                  <span>${post.title}</span>
                                </label>
                              `)}
                          </div>
                          ${NexusButton({ label: "Agregar", type: "outline", size: "sm", isSubmit: true, fullWidth: true })}
                        </form>
                      </div>
                    </details>

                    <details class="menu-accordion">
                      <summary>Enlace personalizado</summary>
                      <div class="space-y-2">
                        <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/items/add" class="space-y-3">
                          <input type="hidden" name="type" value="custom" />
                          <div class="form-field">
                            <label class="form-label">Etiqueta</label>
                            <input type="text" name="label" class="form-input" required placeholder="Texto del enlace" />
                          </div>
                          <div class="form-field">
                            <label class="form-label">URL</label>
                            <input type="url" name="url" class="form-input" required placeholder="https://tu-sitio.com" />
                          </div>
                          ${NexusButton({ label: "Agregar", type: "outline", size: "sm", isSubmit: true, fullWidth: true })}
                        </form>
                      </div>
                    </details>
                  </div>
                ` : html`
                  <div class="menu-empty">
                    Selecciona o crea un menú para comenzar a añadir elementos.
                  </div>
                `}
              </section>
            </div>
          `
        })}
      </aside>

      <!-- Menu Structure -->
      <section>
        ${NexusCard({
          children: html`
            <div class="mb-4">
              <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem 0;">Estructura del menú</h2>
              <p style="font-size: 0.75rem; opacity: 0.6;">
                Arrastra los elementos para reordenarlos. Para crear submenús,
                arrastra un elemento hacia la zona "Soltar aquí para anidar".
              </p>
            </div>

            ${selectedMenu ? html`
              <div class="menu-drop-zone" data-position="root">
                Soltar aquí para mover al nivel principal
              </div>
              <ul id="menuStructure" class="space-y-2">
                ${renderMenuItems(selectedMenu.items)}
              </ul>
              ${selectedMenu.items.length === 0 ? html`
                <div class="menu-empty">
                  Este menú está vacío. Agrega elementos desde la columna lateral.
                </div>
              ` : ""}
            ` : html`
              <div class="menu-empty">
                Selecciona un menú a la izquierda para gestionar su estructura.
              </div>
            `}
          `
        })}
      </section>
    </div>

    ${raw(`<script>
      const ADMIN_BASE_PATH = ${JSON.stringify(adminPath)};

      // XSS safe - event handlers in addEventListener
      document.addEventListener('DOMContentLoaded', function() {
        const manager = document.getElementById('menuManager');
        if (!manager) return;

        const currentMenuId = manager.getAttribute('data-menu-id')
          ? Number(manager.getAttribute('data-menu-id'))
          : null;
        const structureRoot = document.getElementById('menuStructure');
        if (!structureRoot || !currentMenuId) return;

        let draggedItem = null;

        // Auto-submit select
        const autoSubmitSelect = document.querySelector('[data-auto-submit]');
        if (autoSubmitSelect) {
          autoSubmitSelect.addEventListener('change', function() {
            this.form.submit();
          });
        }

        // Delete menu button - XSS safe
        document.addEventListener('click', function(e) {
          const deleteBtn = e.target.closest('.btn-delete-menu');
          if (deleteBtn) {
            e.preventDefault();
            const menuId = deleteBtn.getAttribute('data-menu-id');
            if (!confirm('¿Eliminar este menú?')) return;

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = ADMIN_BASE_PATH + '/appearance/menus/' + menuId + '/delete';
            document.body.appendChild(form);
            form.submit();
          }
        });

        // Drag and drop
        function attachDragEvents() {
          const draggableCards = document.querySelectorAll('.menu-node-card');
          draggableCards.forEach(card => {
            card.addEventListener('dragstart', function(e) {
              card.classList.add('opacity-70');
              draggedItem = card.closest('.menu-node');
              if (e.dataTransfer && draggedItem) {
                e.dataTransfer.setData('text/plain', draggedItem.getAttribute('data-item-id') || '');
                e.dataTransfer.setDragImage(card, 24, 24);
              }
            });

            card.addEventListener('dragend', function() {
              card.classList.remove('opacity-70');
              draggedItem = null;
            });
          });

          const dropZones = document.querySelectorAll('.menu-drop-zone');
          dropZones.forEach(zone => {
            zone.addEventListener('dragover', function(e) {
              e.preventDefault();
              zone.classList.add('drop-target');
            });

            zone.addEventListener('dragleave', function() {
              zone.classList.remove('drop-target');
            });

            zone.addEventListener('drop', function(e) {
              e.preventDefault();
              zone.classList.remove('drop-target');
              if (!draggedItem) return;

              const position = zone.getAttribute('data-position');
              const targetId = zone.getAttribute('data-item-id');
              const targetNode = targetId
                ? manager.querySelector('[data-item-id="' + targetId + '"]')
                : null;

              if (targetNode && targetNode.contains(draggedItem)) {
                return;
              }

              if (position === 'before' && targetNode) {
                targetNode.parentElement.insertBefore(draggedItem, targetNode);
              } else if (position === 'after' && targetNode) {
                targetNode.parentElement.insertBefore(draggedItem, targetNode.nextElementSibling);
              } else if (position === 'child' && targetNode) {
                let childList = targetNode.querySelector(':scope > ul.menu-children');
                if (!childList) {
                  childList = document.createElement('ul');
                  childList.className = 'menu-children';
                  targetNode.appendChild(childList);
                }
                childList.appendChild(draggedItem);
              } else if (position === 'root') {
                structureRoot.appendChild(draggedItem);
              }

              persistStructure();
            });
          });
        }

        function collectStructure() {
          const structure = [];

          function traverse(list, parentId) {
            Array.from(list.children).forEach((node, index) => {
              if (!node.classList.contains('menu-node')) return;
              const itemId = Number(node.getAttribute('data-item-id'));
              structure.push({ id: itemId, parentId: parentId ?? null, order: index });
              const childList = node.querySelector(':scope > ul.menu-children');
              if (childList) {
                traverse(childList, itemId);
              }
            });
          }

          traverse(structureRoot, null);
          return structure;
        }

        async function persistStructure() {
          const items = collectStructure();
          try {
            await fetch(ADMIN_BASE_PATH + '/appearance/menus/items/reorder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ menuId: currentMenuId, items })
            });
          } catch (error) {
            console.error('No se pudo guardar el nuevo orden del menú', error);
            alert('No se pudo guardar el nuevo orden del menú');
          }
        }

        // Menu item actions - XSS safe
        manager.addEventListener('click', async function(e) {
          const target = e.target;
          if (!(target instanceof Element)) return;
          const button = target.closest('[data-action]');
          if (!button) return;

          const action = button.getAttribute('data-action');
          const itemId = Number(button.getAttribute('data-item-id'));
          if (!action || !itemId) return;

          if (action === 'delete-item') {
            if (!confirm('¿Eliminar este elemento del menú?')) return;
            try {
              const response = await fetch(ADMIN_BASE_PATH + '/appearance/menus/items/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId })
              });
              if (response.ok) {
                const node = manager.querySelector('[data-item-id="' + itemId + '"]');
                if (node) node.remove();
                persistStructure();
              } else {
                alert('No se pudo eliminar el elemento del menú');
              }
            } catch (error) {
              console.error(error);
              alert('No se pudo eliminar el elemento del menú');
            }
          }

          if (action === 'edit-item') {
            const node = manager.querySelector('[data-item-id="' + itemId + '"]');
            if (!node) return;
            const titleNode = node.querySelector('.menu-node-title');
            const currentLabel = titleNode ? titleNode.textContent || '' : '';
            const newLabel = prompt('Nuevo texto para el elemento', currentLabel);
            if (!newLabel) return;

            try {
              const response = await fetch(ADMIN_BASE_PATH + '/appearance/menus/items/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, label: newLabel })
              });
              if (response.ok && titleNode) {
                // XSS safe - using textContent
                titleNode.textContent = newLabel;
              } else {
                alert('No se pudieron guardar los cambios');
              }
            } catch (error) {
              console.error(error);
              alert('No se pudieron guardar los cambios');
            }
          }
        });

        attachDragEvents();
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: "Menús",
    children: content,
    activePage: "appearance.menus",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default AppearanceMenusNexusPage;
