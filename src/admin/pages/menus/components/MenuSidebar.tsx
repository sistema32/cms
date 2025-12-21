import { html } from "hono/html";

interface MenuSidebarProps {
    availableItems: {
        pages: any[];
        posts: any[];
        categories: any[];
    };
}

export const MenuSidebar = ({ availableItems }: MenuSidebarProps) => {
    return html`
        <div class="menu-items-sidebar">
            <div class="sidebar-header">
                <p class="eyebrow">Biblioteca de enlaces</p>
                <h3>Arrastra o haz clic para añadir</h3>
                <p class="text-hint">Usa las tarjetas para construir el menú. Puedes soltar directamente sobre el lienzo.</p>
            </div>

            <div class="palette-group">
                <div class="palette-title">
                    <span>Páginas</span>
                    <span class="badge">${availableItems.pages.length}</span>
                </div>
                <div class="palette-list">
                    ${availableItems.pages.map(p => html`
                        <div class="palette-item" draggable="true"
                            data-type="page"
                            data-title="${p.title}"
                            data-url="/${p.slug}"
                            data-content-id="${p.id}"
                        >
                            <div class="palette-item__head">
                                <div>
                                    <p class="item-title">${p.title}</p>
                                    <p class="item-meta">/${p.slug}</p>
                                </div>
                                <button type="button" class="pill-btn add-item-btn"
                                    data-type="page"
                                    data-title="${p.title}"
                                    data-url="/${p.slug}"
                                    data-content-id="${p.id}"
                                >Añadir</button>
                            </div>
                        </div>
                    `)}
                </div>
            </div>

            <div class="palette-group">
                <div class="palette-title">
                    <span>Entradas</span>
                    <span class="badge">${availableItems.posts.length}</span>
                </div>
                <div class="palette-list">
                    ${availableItems.posts.map(p => html`
                        <div class="palette-item" draggable="true"
                            data-type="post"
                            data-title="${p.title}"
                            data-url="/post/${p.slug}"
                            data-content-id="${p.id}"
                        >
                            <div class="palette-item__head">
                                <div>
                                    <p class="item-title">${p.title}</p>
                                    <p class="item-meta">/post/${p.slug}</p>
                                </div>
                                <button type="button" class="pill-btn add-item-btn"
                                    data-type="post"
                                    data-title="${p.title}"
                                    data-url="/post/${p.slug}"
                                    data-content-id="${p.id}"
                                >Añadir</button>
                            </div>
                        </div>
                    `)}
                </div>
            </div>

            <div class="palette-group">
                <div class="palette-title">
                    <span>Categorías</span>
                    <span class="badge">${availableItems.categories.length}</span>
                </div>
                <div class="palette-list">
                    ${availableItems.categories.map(c => html`
                        <div class="palette-item" draggable="true"
                            data-type="category"
                            data-title="${c.name}"
                            data-url="/category/${c.slug}"
                            data-category-id="${c.id}"
                        >
                            <div class="palette-item__head">
                                <div>
                                    <p class="item-title">${c.name}</p>
                                    <p class="item-meta">/category/${c.slug}</p>
                                </div>
                                <button type="button" class="pill-btn add-item-btn"
                                    data-type="category"
                                    data-title="${c.name}"
                                    data-url="/category/${c.slug}"
                                    data-category-id="${c.id}"
                                >Añadir</button>
                            </div>
                        </div>
                    `)}
                </div>
            </div>

            <div class="palette-group">
                <div class="palette-title">
                    <span>Enlace personalizado</span>
                </div>
                <div class="palette-list">
                    <div class="palette-item palette-item--form">
                        <div class="form-group compact">
                            <label class="form-label">URL</label>
                            <input type="text" id="custom-url" class="form-input" placeholder="https://..." value="http://">
                        </div>
                        <div class="form-group compact">
                            <label class="form-label">Texto del enlace</label>
                            <input type="text" id="custom-label" class="form-input" placeholder="Mi enlace">
                        </div>
                        <button class="nexus-btn nexus-btn-primary w-full" id="btn-add-custom">Agregar enlace</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};
