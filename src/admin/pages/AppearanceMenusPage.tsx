import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
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

interface AppearanceMenusPageProps {
  user: {
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
}

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4"
              >
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
                ✏️
              </button>
              <button type="button" data-action="delete-item" data-item-id="${item.id}" class="menu-node-btn" title="Eliminar">
                🗑️
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

export const AppearanceMenusPage = (props: AppearanceMenusPageProps) => {
  const { user, menus, selectedMenu, categories, posts, pages } = props;
  const adminPath = env.ADMIN_PATH;

  const content = html`
    <style>
      .appearance-grid {
        display: grid;
        gap: 1.5rem;
      }
      @media (min-width: 1024px) {
        .appearance-grid {
          grid-template-columns: 320px minmax(0, 1fr);
        }
      }
      .side-card {
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 20px 45px -30px rgba(79, 70, 229, 0.4);
        padding: 1.25rem;
      }
      .dark .side-card {
        background: rgba(30, 41, 59, 0.78);
        border-color: rgba(148, 163, 184, 0.2);
      }
      .menu-builder-card {
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 1.25rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 30px 60px -45px rgba(124, 58, 237, 0.45);
      }
      .dark .menu-builder-card {
        background: rgba(15, 23, 42, 0.86);
        border-color: rgba(148, 163, 184, 0.18);
      }
      .menu-node {
        list-style: none;
      }
      .menu-node-card {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.75rem 0.9rem;
        border-radius: 0.9rem;
        border: 1px solid rgba(148, 163, 184, 0.25);
        background: rgba(255, 255, 255, 0.82);
        cursor: grab;
        transition: transform 0.1s ease, box-shadow 0.1s ease;
      }
      .dark .menu-node-card {
        background: rgba(30, 41, 59, 0.78);
        border-color: rgba(148, 163, 184, 0.2);
      }
      .menu-node-card:active {
        cursor: grabbing;
        transform: scale(0.99);
        box-shadow: 0 15px 30px -24px rgba(79, 70, 229, 0.45);
      }
      .menu-drag-handle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 999px;
        background: rgba(124, 58, 237, 0.12);
        color: rgba(88, 28, 135, 0.9);
      }
      .dark .menu-drag-handle {
        background: rgba(124, 58, 237, 0.25);
        color: rgba(233, 213, 255, 0.92);
      }
      .menu-node-info {
        flex: 1;
        min-width: 0;
      }
      .menu-node-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: rgba(30, 41, 59, 0.92);
      }
      .dark .menu-node-title {
        color: rgba(226, 232, 240, 0.9);
      }
      .menu-node-meta {
        font-size: 0.72rem;
        color: rgba(100, 116, 139, 0.78);
      }
      .dark .menu-node-meta {
        color: rgba(148, 163, 184, 0.72);
      }
      .menu-node-actions {
        display: flex;
        gap: 0.35rem;
      }
      .menu-node-btn {
        width: 1.9rem;
        height: 1.9rem;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        background: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
        line-height: 1;
        cursor: pointer;
      }
      .menu-node-btn:hover {
        border-color: rgba(124, 58, 237, 0.3);
        background: rgba(124, 58, 237, 0.12);
      }
      .dark .menu-node-btn {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(148, 163, 184, 0.2);
      }
      .menu-children {
        list-style: none;
        margin: 0;
        padding-left: 1.5rem;
        display: grid;
        gap: 0.7rem;
      }
      .menu-drop-zone {
        border: 1px dashed transparent;
        border-radius: 0.85rem;
        padding: 0.45rem;
        font-size: 0.7rem;
        text-align: center;
        color: rgba(148, 163, 184, 0.65);
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      .menu-drop-zone--child {
        margin: 0.35rem 0 0.6rem;
      }
      .menu-drop-zone.drop-target {
        border-color: rgba(124, 58, 237, 0.45);
        background: rgba(124, 58, 237, 0.14);
        color: rgba(88, 28, 135, 0.9);
      }
      .custom-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scroll::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.35);
        border-radius: 999px;
      }
      .dark .custom-scroll::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.25);
      }
      .menu-help {
        display: grid;
        gap: 0.4rem;
        font-size: 0.78rem;
        color: rgba(100, 116, 139, 0.85);
      }
      .dark .menu-help {
        color: rgba(148, 163, 184, 0.75);
      }
      details.menu-accordion summary {
        cursor: pointer;
        padding: 0.7rem 0.9rem;
        border-radius: 0.8rem;
        background: rgba(248, 250, 252, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.2);
        font-weight: 600;
        color: rgba(30, 41, 59, 0.85);
      }
      .dark details.menu-accordion summary {
        background: rgba(30, 41, 59, 0.78);
        color: rgba(226, 232, 240, 0.85);
        border-color: rgba(148, 163, 184, 0.2);
      }
      details.menu-accordion[open] summary {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
      details.menu-accordion > div {
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-top: none;
        padding: 0.9rem;
        border-radius: 0 0 0.8rem 0.8rem;
        background: rgba(255, 255, 255, 0.9);
      }
      .dark details.menu-accordion > div {
        background: rgba(15, 23, 42, 0.85);
        border-color: rgba(148, 163, 184, 0.2);
      }
      .menu-empty {
        text-align: center;
        padding: 2rem;
        border: 1px dashed rgba(148, 163, 184, 0.35);
        border-radius: 1rem;
        color: rgba(100, 116, 139, 0.85);
        font-size: 0.9rem;
      }
      .dark .menu-empty {
        color: rgba(148, 163, 184, 0.7);
        border-color: rgba(148, 163, 184, 0.25);
      }
      .menu-section-title {
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.75rem;
      }
    </style>

    <div class="page-header">
      <h1 class="page-title">Menús</h1>
      <div class="page-actions">
        <a href="${adminPath}/appearance/themes" class="btn-secondary">Volver a Themes</a>
      </div>
    </div>

    <div class="appearance-grid" id="menuManager" data-menu-id="${selectedMenu?.id ?? ""}">
      <aside class="side-card space-y-6">
        <section>
          <h2 class="menu-section-title">Gestionar menús</h2>
          <form method="POST" action="${adminPath}/appearance/menus/create" class="space-y-3">
            <div>
              <label class="form-label">Nombre</label>
              <input
                type="text"
                name="name"
                class="form-input"
                required
                placeholder="Nuevo menú"
              />
            </div>
            <div>
              <label class="form-label">Slug</label>
              <input
                type="text"
                name="slug"
                class="form-input"
                required
                placeholder="menu-principal"
              />
            </div>
            <div>
              <label class="form-label">Descripción</label>
              <textarea
                name="description"
                rows="2"
                class="form-input"
                placeholder="Opcional"
              ></textarea>
            </div>
            <button type="submit" class="btn-action w-full">Crear menú</button>
          </form>
        </section>

        <section>
          <h2 class="menu-section-title">Menús existentes</h2>
          <form method="GET" action="${adminPath}/appearance/menus" class="space-y-3">
            <select
              name="menuId"
              class="form-input"
              onchange="this.form.submit()"
            >
              ${menus.map((menu) =>
                html`
                  <option value="${menu.id}" ${selectedMenu?.id === menu.id ? "selected" : ""}>
                    ${menu.name}
                  </option>
                `
              )}
            </select>
          </form>
          ${selectedMenu
            ? html`
              <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/update" class="space-y-3">
                <div>
                  <label class="form-label">Nombre</label>
                  <input type="text" name="name" class="form-input" value="${selectedMenu.name}" required />
                </div>
                <div>
                  <label class="form-label">Slug</label>
                  <input type="text" name="slug" class="form-input" value="${selectedMenu.slug}" required />
                </div>
                <div>
                  <label class="form-label">Descripción</label>
                  <textarea name="description" rows="2" class="form-input">${selectedMenu.description || ""}</textarea>
                </div>
                <label class="inline-flex items-center gap-2 text-sm">
                  <input type="hidden" name="isActive" value="false" />
                  <input
                    type="checkbox"
                    name="isActive"
                    value="true"
                    class="form-checkbox"
                    ${selectedMenu.isActive ? "checked" : ""}
                  />
                  Menú activo
                </label>
                <div class="flex gap-2">
                  <button type="submit" class="btn-action flex-1">Actualizar</button>
                  <button
                    type="submit"
                    class="btn-secondary"
                    formaction="${adminPath}/appearance/menus/${selectedMenu.id}/delete"
                    formmethod="POST"
                    onclick="return confirm('¿Eliminar este menú?');"
                  >
                    Eliminar
                  </button>
                </div>
              </form>
            `
            : ""}
        </section>

        <section>
          <h2 class="menu-section-title">Ayuda rápida</h2>
          <div class="menu-help">
            <p>Selecciona elementos en las pestañas de abajo para agregarlos al menú.</p>
            <p>Arrastra cada elemento usando el asa lateral (⋮) para ordenar o crear submenús.</p>
            <p>Los cambios de orden se guardan automáticamente.</p>
          </div>
        </section>

        <section>
          <h2 class="menu-section-title">Agregar elementos</h2>
          ${selectedMenu
            ? html`
              <details class="menu-accordion" open>
                <summary>Categorías</summary>
                <div class="space-y-2">
                  <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/items/add" class="space-y-2">
                    <input type="hidden" name="type" value="category" />
                    <div class="max-h-36 overflow-y-auto space-y-1 custom-scroll">
                      ${categories.length === 0
                        ? html`<p class="text-xs text-gray-500">Aún no hay categorías creadas.</p>`
                        : categories.map((category) =>
                          html`
                            <label class="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                class="form-checkbox"
                                name="categoryIds[]"
                                value="${category.id}"
                              />
                              <span>${category.name}</span>
                            </label>
                          `
                        )}
                    </div>
                    <button type="submit" class="btn-secondary w-full">Agregar</button>
                  </form>
                </div>
              </details>

              <details class="menu-accordion">
                <summary>Páginas</summary>
                <div class="space-y-2">
                  <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/items/add" class="space-y-2">
                    <input type="hidden" name="type" value="page" />
                    <div class="max-h-36 overflow-y-auto space-y-1 custom-scroll">
                      ${pages.length === 0
                        ? html`<p class="text-xs text-gray-500">Aún no hay páginas publicadas.</p>`
                        : pages.map((page) =>
                          html`
                            <label class="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                class="form-checkbox"
                                name="contentIds[]"
                                value="${page.id}"
                              />
                              <span>${page.title}</span>
                            </label>
                          `
                        )}
                    </div>
                    <button type="submit" class="btn-secondary w-full">Agregar</button>
                  </form>
                </div>
              </details>

              <details class="menu-accordion">
                <summary>Entradas</summary>
                <div class="space-y-2">
                  <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/items/add" class="space-y-2">
                    <input type="hidden" name="type" value="post" />
                    <div class="max-h-36 overflow-y-auto space-y-1 custom-scroll">
                      ${posts.length === 0
                        ? html`<p class="text-xs text-gray-500">Aún no hay entradas publicadas.</p>`
                        : posts.map((post) =>
                          html`
                            <label class="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                class="form-checkbox"
                                name="contentIds[]"
                                value="${post.id}"
                              />
                              <span>${post.title}</span>
                            </label>
                          `
                        )}
                    </div>
                    <button type="submit" class="btn-secondary w-full">Agregar</button>
                  </form>
                </div>
              </details>

              <details class="menu-accordion">
                <summary>Enlace personalizado</summary>
                <div class="space-y-2">
                  <form method="POST" action="${adminPath}/appearance/menus/${selectedMenu.id}/items/add" class="space-y-3">
                    <input type="hidden" name="type" value="custom" />
                    <div>
                      <label class="form-label">Etiqueta</label>
                      <input type="text" name="label" class="form-input" required placeholder="Texto del enlace" />
                    </div>
                    <div>
                      <label class="form-label">URL</label>
                      <input type="url" name="url" class="form-input" required placeholder="https://tu-sitio.com" />
                    </div>
                    <button type="submit" class="btn-secondary w-full">Agregar</button>
                  </form>
                </div>
              </details>
            `
            : html`
              <div class="menu-empty">
                Selecciona o crea un menú para comenzar a añadir elementos.
              </div>
            `}
        </section>
      </aside>

      <section class="menu-builder-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold">Estructura del menú</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 max-w-xl">
              Arrastra los elementos para reordenarlos. Para crear submenús,
              arrastra un elemento hacia la zona “Soltar aquí para anidar”.
            </p>
          </div>
          ${selectedMenu
            ? html`<span class="theme-badge">Menú: ${selectedMenu.name}</span>`
            : ""}
        </div>

        ${selectedMenu
          ? html`
            <div class="menu-drop-zone" data-position="root">
              Soltar aquí para mover al nivel principal
            </div>
            <ul id="menuStructure" class="space-y-2">
              ${renderMenuItems(selectedMenu.items)}
            </ul>
            ${selectedMenu.items.length === 0
              ? html`
                <div class="menu-empty">
                  Este menú está vacío. Agrega elementos desde la columna lateral.
                </div>
              `
              : ""}
          `
          : html`
            <div class="menu-empty">
              Selecciona un menú a la izquierda para gestionar su estructura.
            </div>
          `}
      </section>
    </div>

    <script>
      (() => {
        const manager = document.getElementById("menuManager");
        if (!manager) return;
        const currentMenuId = manager.dataset.menuId
          ? Number(manager.dataset.menuId)
          : null;
        const structureRoot = document.getElementById("menuStructure");
        if (!structureRoot || !currentMenuId) return;

        const apiBase = "${adminPath}";
        let draggedItem = null;

        const dropZones = () => Array.from(manager.querySelectorAll(".menu-drop-zone"));
        const draggableCards = () => Array.from(manager.querySelectorAll(".menu-node-card"));

        function attachDragEvents() {
          draggableCards().forEach((card) => {
            card.addEventListener("dragstart", (event) => {
              card.classList.add("opacity-70");
              draggedItem = card.closest(".menu-node");
              event.dataTransfer?.setData("text/plain", draggedItem?.dataset.itemId || "");
              event.dataTransfer?.setDragImage(card, 24, 24);
            });
            card.addEventListener("dragend", () => {
              card.classList.remove("opacity-70");
              draggedItem = null;
            });
          });

          dropZones().forEach((zone) => {
            zone.addEventListener("dragover", (event) => {
              event.preventDefault();
              zone.classList.add("drop-target");
            });
            zone.addEventListener("dragleave", () => {
              zone.classList.remove("drop-target");
            });
            zone.addEventListener("drop", (event) => {
              event.preventDefault();
              zone.classList.remove("drop-target");
              if (!draggedItem) return;

              const position = zone.dataset.position;
              const targetId = zone.dataset.itemId;
              const targetNode = targetId
                ? manager.querySelector('[data-item-id="' + targetId + '"]')
                : null;

              if (targetNode && targetNode.contains(draggedItem)) {
                return;
              }

              if (position === "before" && targetNode) {
                targetNode.parentElement?.insertBefore(draggedItem, targetNode);
              } else if (position === "after" && targetNode) {
                targetNode.parentElement?.insertBefore(
                  draggedItem,
                  targetNode.nextElementSibling,
                );
              } else if (position === "child" && targetNode) {
                let childList = targetNode.querySelector(":scope > ul.menu-children");
                if (!childList) {
                  childList = document.createElement("ul");
                  childList.className = "menu-children";
                  targetNode.appendChild(childList);
                }
                childList.appendChild(draggedItem);
              } else if (position === "root") {
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
              if (!node.classList.contains("menu-node")) return;
              const itemId = Number(node.dataset.itemId);
              structure.push({ id: itemId, parentId: parentId ?? null, order: index });
              const childList = node.querySelector(":scope > ul.menu-children");
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
            await fetch(apiBase + "/appearance/menus/items/reorder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ menuId: currentMenuId, items }),
            });
          } catch (error) {
            console.error("No se pudo guardar el nuevo orden del menú", error);
            alert("No se pudo guardar el nuevo orden del menú");
          }
        }

        manager.addEventListener("click", async (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const button = target.closest("[data-action]");
          if (!button) return;

          const action = button.getAttribute("data-action");
          const itemId = Number(button.getAttribute("data-item-id"));
          if (!action || !itemId) return;

          if (action === "delete-item") {
            if (!confirm("¿Eliminar este elemento del menú?")) return;
            try {
              const response = await fetch(apiBase + "/appearance/menus/items/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId }),
              });
              if (response.ok) {
                const node = manager.querySelector('[data-item-id="' + itemId + '"]');
                node?.remove();
                persistStructure();
              } else {
                alert("No se pudo eliminar el elemento del menú");
              }
            } catch (error) {
              console.error(error);
              alert("No se pudo eliminar el elemento del menú");
            }
          }

          if (action === "edit-item") {
            const node = manager.querySelector('[data-item-id="' + itemId + '"]');
            if (!node) return;
            const titleNode = node.querySelector(".menu-node-title");
            const currentLabel = titleNode?.textContent || "";
            const newLabel = prompt("Nuevo texto para el elemento", currentLabel);
            if (!newLabel) return;

            try {
              const response = await fetch(apiBase + "/appearance/menus/items/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, label: newLabel }),
              });
              if (response.ok && titleNode) {
                titleNode.textContent = newLabel;
              } else {
                alert("No se pudieron guardar los cambios");
              }
            } catch (error) {
              console.error(error);
              alert("No se pudieron guardar los cambios");
            }
          }
        });

        attachDragEvents();
      })();
    </script>
  `;

  return AdminLayout({
    title: "Menús",
    children: content,
    activePage: "appearance.menus",
    user,
  });
};

export default AppearanceMenusPage;
