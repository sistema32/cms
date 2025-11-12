import { html } from "hono/html";

/**
 * Icon Sidebar Component - Xoya Style
 * Minimalist sidebar with icons only (60-70px)
 * Accordion expands on hover/click
 */

interface IconSidebarProps {
  activePage: string;
  adminPath: string;
}

interface NavItem {
  id: string;
  icon: string; // SVG path
  label: string;
  path?: string;
  children?: NavSubItem[];
}

interface NavSubItem {
  id: string;
  label: string;
  path: string;
  badge?: string;
}

export const IconSidebar = (props: IconSidebarProps) => {
  const { activePage, adminPath } = props;

  // Navigation structure
  const navItems: NavItem[] = [
    {
      id: "dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      label: "Dashboard",
      path: "/",
    },
    {
      id: "content",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      label: "Contenido",
      children: [
        { id: "content.posts", label: "Entradas", path: "/posts" },
        { id: "content.pages", label: "Páginas", path: "/pages" },
        { id: "content.categories", label: "Categorías", path: "/categories" },
        { id: "content.tags", label: "Tags", path: "/tags" },
        { id: "content.media", label: "Medios", path: "/media" },
      ],
    },
    {
      id: "access",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      label: "Acceso",
      children: [
        { id: "access.users", label: "Usuarios", path: "/users" },
        { id: "access.roles", label: "Roles", path: "/roles" },
        { id: "access.permissions", label: "Permisos", path: "/permissions" },
      ],
    },
    {
      id: "appearance",
      icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
      label: "Apariencia",
      children: [
        { id: "appearance.themes", label: "Themes", path: "/appearance/themes" },
        { id: "appearance.menus", label: "Menús", path: "/appearance/menus" },
      ],
    },
    {
      id: "plugins",
      icon: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
      label: "Plugins",
      path: "/plugins",
    },
    {
      id: "settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      label: "Configuración",
      children: [
        { id: "settings.general", label: "General", path: "/settings?category=general" },
        { id: "settings.reading", label: "Lectura", path: "/settings?category=reading" },
        { id: "settings.writing", label: "Escritura", path: "/settings?category=writing" },
        { id: "settings.seo", label: "SEO", path: "/settings?category=seo" },
      ],
    },
  ];

  const isItemActive = (itemId: string) => {
    return activePage === itemId || activePage.startsWith(itemId + ".");
  };

  const renderNavItem = (item: NavItem) => {
    const active = isItemActive(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return html`
      <div class="nav-item-wrapper" data-nav-id="${item.id}">
        ${hasChildren
          ? html`
              <!-- Item with Accordion -->
              <button
                class="sidebar-nav-btn group relative flex items-center justify-center w-full h-14 transition-all duration-200 ${active
                  ? "bg-coral-600"
                  : "hover:bg-coral-600/80"}"
                onclick="toggleAccordion('${item.id}')"
                aria-expanded="false"
                aria-label="${item.label}"
              >
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="${item.icon}"
                  />
                </svg>

                <!-- Tooltip -->
                <div class="sidebar-tooltip">
                  ${item.label}
                </div>
              </button>

              <!-- Accordion Panel -->
              <div
                id="accordion-${item.id}"
                class="accordion-panel hidden absolute left-[70px] top-0 min-w-[200px] bg-white dark:bg-gray-800 rounded-r-xl shadow-xl border-l-4 border-coral-500 z-50"
              >
                <div class="py-2">
                  <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      ${item.label}
                    </h3>
                  </div>
                  ${item.children!.map((child) => renderSubItem(child))}
                </div>
              </div>
            `
          : html`
              <!-- Simple Link -->
              <a
                href="${adminPath}${item.path}"
                class="sidebar-nav-btn group relative flex items-center justify-center w-full h-14 transition-all duration-200 ${active
                  ? "bg-coral-600"
                  : "hover:bg-coral-600/80"}"
                aria-label="${item.label}"
              >
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="${item.icon}"
                  />
                </svg>

                <!-- Tooltip -->
                <div class="sidebar-tooltip">
                  ${item.label}
                </div>
              </a>
            `}
      </div>
    `;
  };

  const renderSubItem = (item: NavSubItem) => {
    const active = activePage === item.id;
    return html`
      <a
        href="${adminPath}${item.path}"
        class="accordion-item flex items-center px-4 py-2.5 text-sm transition-colors ${active
          ? "text-coral-600 bg-coral-50 dark:bg-coral-900/20 font-semibold"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}"
      >
        <span class="flex-1">${item.label}</span>
        ${item.badge
          ? html`<span
              class="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              >${item.badge}</span
            >`
          : ""}
      </a>
    `;
  };

  return html`
    <aside
      class="icon-sidebar fixed left-0 top-0 h-screen w-[70px] bg-coral-500 flex flex-col z-40 rounded-r-2xl"
    >
      <!-- Logo/Brand -->
      <div class="flex items-center justify-center h-20 border-b border-coral-600/30">
        <a href="${adminPath}" class="text-white font-bold text-xl" aria-label="LexCMS Home">
          L
        </a>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 overflow-y-auto scrollbar-hide">
        ${navItems.map((item) => renderNavItem(item))}
      </nav>

      <!-- Bottom Actions (optional) -->
      <div class="border-t border-coral-600/30 p-2">
        <button
          class="sidebar-nav-btn group relative flex items-center justify-center w-full h-12 hover:bg-coral-600/80 transition-all duration-200 rounded-lg"
          onclick="document.getElementById('helpModal')?.classList.remove('hidden')"
          aria-label="Ayuda"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div class="sidebar-tooltip">Ayuda</div>
        </button>
      </div>
    </aside>
  `;
};

export default IconSidebar;
