import { html } from "hono/html";
import AdminLayoutNexus from "@/admin/components/layout/AdminLayoutNexus.tsx";
import { env } from "@/config/env.ts";
import { MenuEditorStyles } from "./components/MenuEditorStyles.ts";
import { MenuSidebar } from "./components/MenuSidebar.tsx";
import { MenuStage } from "./components/MenuStage.tsx";
import { MenuSettings } from "./components/MenuSettings.tsx";

interface MenuEditorNexusProps {
    user: any;
    menu: any; // Menu model
    registeredLocations: string[];
    availableItems: {
        pages: any[];
        posts: any[];
        categories: any[];
    };
}

export const MenuEditorNexus = (props: MenuEditorNexusProps) => {
    const adminPath = env.ADMIN_PATH;
    const { user, menu, registeredLocations, availableItems } = props;

    const content = html`
    ${MenuEditorStyles}

    <!-- Dependencies for Drag and Drop -->
    <script src="${adminPath}/assets/js/vendor/jquery.min.js"></script>
    <script src="${adminPath}/assets/js/vendor/jquery.nestable.min.js"></script>
    <link rel="stylesheet" href="${adminPath}/assets/css/vendor/jquery.nestable.min.css" />

    <div class="page-head">
        <div class="page-head__titles">
            <p class="eyebrow">Navegación · Builder</p>
            <h1>${menu.name}</h1>
            <p class="text-hint">Organiza la estructura con drag & drop, añade enlaces del catálogo o personalizados y guarda los cambios.</p>
        </div>
        <div class="page-head__actions">
            <button type="button" class="pill-btn" id="collapseAllBtn">Colapsar</button>
            <button type="button" class="pill-btn" id="expandAllBtn">Expandir</button>
            <button type="button" class="pill-btn danger" id="clearMenuBtn">Vaciar</button>
            <button type="button" id="saveMenuBtn" class="pill-btn primary">Guardar</button>
        </div>
    </div>

    <div class="editor-grid">
        <!-- Sidebar: Items to Add -->
        ${MenuSidebar({ availableItems })}

        <!-- Main: Menu Structure and Settings -->
        <div>
             <!-- Nestable Area -->
            ${MenuStage()}

            <!-- Settings Form -->
            ${MenuSettings({ menu, registeredLocations, adminPath })}
        </div>
    </div>

    <!-- Init Data for JS -->
    <script>
        window.MENU_ID = ${menu.id};
        window.ADMIN_PATH = "${adminPath}";
        // Pre-load existing items
        window.INITIAL_MENU_ITEMS = ${JSON.stringify(menu.items || [])};
    </script>
    
    <script src="${adminPath}/assets/js/menu-editor.js?v=${Date.now()}"></script>
  `;

    return AdminLayoutNexus({
        title: "Editar Menú",
        children: content,
        activePage: "themes",
        user
    });
};

export default MenuEditorNexus;
