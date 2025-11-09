import { html } from "hono/html";
import { env } from "../../config/env.ts";
import { ToastContainer } from "./Toast.tsx";
import { NotificationPanel, type NotificationItem } from "./NotificationPanel.tsx";

/**
 * Admin Layout Component
 * Based on Windmill Dashboard layout with Spike-inspired enhancements
 */

interface AdminLayoutProps {
  title: string;
  children: any;
  activePage?: string;
  user?: {
    name: string | null;
    email: string;
    avatar?: string;
  };
  settingsAvailability?: Record<string, boolean>;
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const AdminLayout = (props: AdminLayoutProps) => {
  const {
    title,
    children,
    activePage = "dashboard",
    user,
    settingsAvailability = {},
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  const contentMenuItems: NavSubItem[] = [
    { id: "content.posts", label: "Entradas", path: "/posts" },
    { id: "content.pages", label: "Páginas", path: "/pages" },
    { id: "content.categories", label: "Categorías", path: "/categories" },
    { id: "content.tags", label: "Tags", path: "/tags" },
    { id: "content.media", label: "Medios", path: "/media" },
  ];

  const accessMenuItems: NavSubItem[] = [
    { id: "access.users", label: "Usuarios", path: "/users" },
    { id: "access.roles", label: "Roles", path: "/roles" },
    { id: "access.permissions", label: "Permisos", path: "/permissions" },
  ];

  const appearanceMenuItems: NavSubItem[] = [
    { id: "appearance.themes", label: "Themes", path: "/appearance/themes" },
    { id: "appearance.menus", label: "Menús", path: "/appearance/menus" },
  ];

  const pluginMenuItems: NavSubItem[] = [
    { id: "plugins.all", label: "Todos los Plugins", path: "/plugins" },
  ];

  const baseSettingsMenuItems: NavSubItem[] = [
    {
      id: "settings.general",
      label: "General",
      path: "/settings?category=general",
    },
    {
      id: "settings.reading",
      label: "Lectura",
      path: "/settings?category=reading",
    },
    {
      id: "settings.writing",
      label: "Escritura",
      path: "/settings?category=writing",
    },
    {
      id: "settings.discussion",
      label: "Comentarios",
      path: "/settings?category=discussion",
    },
    { id: "settings.media", label: "Medios", path: "/settings?category=media" },
    {
      id: "settings.permalinks",
      label: "Enlaces permanentes",
      path: "/settings?category=permalinks",
    },
    {
      id: "settings.privacy",
      label: "Privacidad",
      path: "/settings?category=privacy",
    },
    { id: "settings.seo", label: "SEO", path: "/settings?category=seo" },
    {
      id: "settings.captcha",
      label: "Captcha",
      path: "/settings?category=captcha",
    },
    {
      id: "settings.advanced",
      label: "Avanzado",
      path: "/settings?category=advanced",
    },
  ];

  const settingsMenuItems = baseSettingsMenuItems.map((item) => {
    const isAvailable = settingsAvailability[item.id];
    return {
      ...item,
      availableTag: isAvailable === false ? "Sin datos" : undefined,
    };
  });

  return html`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - LexCMS Admin</title>
        <link rel="stylesheet" href="${adminPath}/assets/css/admin-compiled.css">
        <style>
        /* ========================================
           MOSAIC-INSPIRED ADMIN PANEL
           Modern, Clean, Professional Design
           Primary Color: Indigo
           ======================================== */

        /* === SIDEBAR === */
        .admin-sidebar {
          width: 16rem;
          background: #0f172a;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          padding: 0;
          border-right: 1px solid #1e293b;
          box-shadow: none;
          position: relative;
        }

        .dark .admin-sidebar {
          background: #0f172a;
          border-right-color: #1e293b;
        }

        .admin-sidebar-header {
          display: flex;
          align-items: center;
          padding: 2rem 1.5rem 1.5rem;
          border-bottom: 1px solid #1e293b;
        }

        .admin-logo {
          font-weight: 700;
          font-size: 1.5rem;
          letter-spacing: -0.025em;
          color: #f8fafc;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .admin-logo:hover {
          color: #6366f1;
        }

        /* === NAVIGATION === */
        .admin-nav {
          margin-top: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 0.75rem;
        }

        .admin-nav::-webkit-scrollbar {
          width: 4px;
        }

        .admin-nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .admin-nav::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 4px;
        }

        .admin-nav::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }

        /* Dashboard Link */
        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          border-radius: 0.5rem;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.875rem;
          position: relative;
          transition: all 0.2s ease;
          margin-bottom: 0.25rem;
        }

        .admin-nav-item:hover {
          background: #1e293b;
          color: #f8fafc;
        }

        .admin-nav-item.active {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
        }

        .admin-nav-item.active::before {
          content: '';
          position: absolute;
          left: -0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 1.25rem;
          background: #6366f1;
          border-radius: 0 2px 2px 0;
        }

        .admin-nav-text {
          flex: 1;
          font-size: 0.875rem;
        }

        /* === NAVIGATION GROUPS === */
        .admin-nav-group {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 1.5rem;
        }

        .admin-nav-group:last-child {
          margin-bottom: 0;
        }

        .admin-nav-group-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          padding: 0 0.75rem 0.5rem;
          font-weight: 700;
        }

        .admin-nav-group-header.active {
          color: #94a3b8;
        }

        /* === ICONS === */
        .admin-nav-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
        }

        .admin-nav-icon svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        /* === SUBITEMS === */
        .admin-nav-subitems {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding-left: 0;
          margin-top: 0.25rem;
        }

        .admin-nav-subitem {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem 0.5rem 1.5rem;
          border-radius: 0.5rem;
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 400;
          transition: all 0.2s ease;
        }

        .admin-nav-subitem:hover {
          background: #1e293b;
          color: #f8fafc;
        }

        .admin-nav-subitem.active {
          color: #f8fafc;
          background: #1e293b;
        }

        .admin-nav-subitem-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1rem;
          height: 1rem;
          flex-shrink: 0;
        }

        .admin-nav-subitem-icon svg {
          width: 1rem;
          height: 1rem;
        }

        .admin-nav-subitem-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #475569;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .admin-nav-subitem.active .admin-nav-subitem-indicator {
          background: #6366f1;
        }

        .admin-nav-subitem-text {
          flex: 1;
        }

        .admin-nav-subitem-tag {
          margin-left: auto;
          font-size: 0.6875rem;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          background: #1e293b;
          color: #94a3b8;
          font-weight: 500;
        }

        .admin-nav-subitem.active .admin-nav-subitem-tag {
          background: #334155;
          color: #cbd5e1;
        }

        /* ========================================
           HEADER & MAIN CONTENT
           ======================================== */

        /* === LAYOUT === */
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f9fafb;
        }

        .dark .admin-layout {
          background: #030712;
        }

        /* === MAIN CONTENT AREA === */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* === HEADER === */
        .admin-header {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 0;
          box-shadow: none;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .dark .admin-header {
          background: #0f172a;
          border-bottom-color: #1e293b;
        }

        .admin-header-content {
          display: flex;
          align-items: center;
          padding: 1rem 2rem;
          gap: 1rem;
        }

        /* === MOBILE MENU BUTTON === */
        .admin-mobile-menu-btn {
          display: none;
          padding: 0.5rem;
          border-radius: 0.5rem;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .admin-mobile-menu-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .dark .admin-mobile-menu-btn {
          color: #9ca3af;
        }

        .dark .admin-mobile-menu-btn:hover {
          background: #1e293b;
          color: #f9fafb;
        }

        .menu-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        @media (max-width: 768px) {
          .admin-mobile-menu-btn {
            display: block;
          }
        }

        /* === SEARCH === */
        .admin-search {
          flex: 1;
          max-width: 32rem;
        }

        .admin-search-input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #111827;
          background: #f9fafb;
          transition: all 0.2s ease;
        }

        .admin-search-input:focus {
          outline: none;
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .admin-search-input::placeholder {
          color: #9ca3af;
        }

        .dark .admin-search-input {
          background: #0f172a;
          border-color: #1e293b;
          color: #f9fafb;
        }

        .dark .admin-search-input:focus {
          background: #1e293b;
          border-color: #6366f1;
        }

        /* === HEADER ACTIONS === */
        .admin-header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: auto;
        }

        /* === THEME TOGGLE === */
        .theme-toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.5rem;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .theme-toggle-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .dark .theme-toggle-btn {
          color: #9ca3af;
        }

        .dark .theme-toggle-btn:hover {
          background: #1e293b;
          color: #f9fafb;
        }

        .dark-mode-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        /* === PROFILE MENU === */
        .profile-menu-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .profile-menu-btn:hover {
          background: #f3f4f6;
        }

        .dark .profile-menu-btn:hover {
          background: #1e293b;
        }

        .profile-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          border: 2px solid #e5e7eb;
        }

        .dark .profile-avatar {
          border-color: #374155;
        }

        .profile-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 0.5rem;
          min-width: 12rem;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          z-index: 50;
        }

        .dark .profile-dropdown {
          background: #1e293b;
          border-color: #334155;
        }

        /* === CONTENT AREA === */
        .admin-content {
          flex: 1;
          padding: 2rem;
          background: #f9fafb;
        }

        .dark .admin-content {
          background: #030712;
        }

        .admin-container {
          max-width: 90rem;
          margin: 0 auto;
        }

        /* ========================================
           MOSAIC COMPONENTS
           ======================================== */

        /* === PAGE HEADER === */
        .page-header {
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.025em;
        }

        .dark .page-title {
          color: #f9fafb;
        }

        /* === STATS CARDS === */
        .stats-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          transition: all 0.2s ease;
        }

        .stats-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .dark .stats-card {
          background: #0f172a;
          border-color: #1e293b;
        }

        .dark .stats-card:hover {
          border-color: #334155;
        }

        .stats-icon-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          border-radius: 0.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .stats-icon-container.green {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .stats-icon-container.blue {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .stats-icon-container.teal {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        }

        .stats-icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .stats-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .stats-label {
          color: #9ca3af;
        }

        .stats-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-top: 0.5rem;
          line-height: 1;
        }

        .dark .stats-value {
          color: #f9fafb;
        }

        /* === TABLE CARDS === */
        .table-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .dark .table-card {
          background: #0f172a;
          border-color: #1e293b;
        }

        .table-container {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table thead {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .dark .admin-table thead {
          background: #1e293b;
          border-bottom-color: #334155;
        }

        .admin-table th {
          padding: 0.75rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .admin-table th {
          color: #9ca3af;
        }

        .admin-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.875rem;
          color: #374151;
        }

        .dark .admin-table td {
          border-bottom-color: #1e293b;
          color: #d1d5db;
        }

        .admin-table tbody tr:last-child td {
          border-bottom: none;
        }

        .admin-table tbody tr:hover {
          background: #f9fafb;
        }

        .dark .admin-table tbody tr:hover {
          background: #1e293b;
        }

        /* === BADGES === */
        .badge-success {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          background: #d1fae5;
          color: #065f46;
        }

        .dark .badge-success {
          background: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }

        .badge-warning {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          background: #fef3c7;
          color: #92400e;
        }

        .dark .badge-warning {
          background: rgba(251, 191, 36, 0.2);
          color: #fcd34d;
        }

        .badge-neutral {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          background: #f3f4f6;
          color: #4b5563;
        }

        .dark .badge-neutral {
          background: #374155;
          color: #d1d5db;
        }

        /* === BUTTONS === */
        .btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 0.375rem;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .btn-icon:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .dark .btn-icon {
          color: #9ca3af;
        }

        .dark .btn-icon:hover {
          background: #1e293b;
          color: #f9fafb;
        }

        /* === CHART CONTAINER === */
        .chart-container {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .dark .chart-container {
          background: #0f172a;
          border-color: #1e293b;
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
        }

        .dark .chart-title {
          color: #f9fafb;
        }
        </style>
        <script>
        // Dark mode toggle
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        </script>
      </head>
      <body>
        <div class="admin-layout">
          <!-- Desktop Sidebar -->
          <aside class="admin-sidebar">
            <div class="admin-sidebar-header">
              <a class="admin-logo" href="${adminPath}">
                LexCMS Admin
              </a>
            </div>
            <nav class="admin-nav">
              ${renderNavItem(
                adminPath,
                "",
                "Dashboard",
                activePage === "dashboard",
                "dashboard",
              )} ${renderNavGroup(
                adminPath,
                "content",
                "Contenido",
                activePage,
                "content",
                contentMenuItems,
              )} ${renderNavGroup(
                adminPath,
                "access",
                "Gestión de Acceso",
                activePage,
                "access",
                accessMenuItems,
              )}
              ${renderNavGroup(
                adminPath,
                "appearance",
                "Apariencia",
                activePage,
                "appearance",
                appearanceMenuItems,
              )}
              ${renderNavGroup(
                adminPath,
                "plugins",
                "Plugins",
                activePage,
                "plugins",
                pluginMenuItems,
              )} ${renderNavGroup(
                adminPath,
                "settings",
                "Configuración",
                activePage,
                "settings",
                settingsMenuItems,
              )}
            </nav>
          </aside>

          <!-- Main Content -->
          <div class="admin-main">
            <!-- Header -->
            <header class="admin-header">
              <div class="admin-header-content">
                <!-- Mobile menu button -->
                <button
                  class="admin-mobile-menu-btn"
                  aria-label="Menu"
                  onclick="toggleMobileMenu()"
                >
                  <svg class="menu-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clip-rule="evenodd"
                    >
                    </path>
                  </svg>
                </button>

                <!-- Search -->
                <div class="admin-search">
                  <div class="relative w-full max-w-xl mr-6">
                    <input
                      class="admin-search-input"
                      type="text"
                      placeholder="Buscar..."
                    />
                  </div>
                </div>

                <!-- Header actions -->
                <div class="admin-header-actions">
                  <!-- Theme toggle -->
                  <button
                    class="theme-toggle-btn"
                    onclick="toggleTheme()"
                    aria-label="Toggle color mode"
                  >
                    <svg
                      class="dark-mode-icon"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                      >
                      </path>
                    </svg>
                  </button>

                  <!-- Notifications -->
                  ${NotificationPanel({ adminPath, notifications, unreadCount: unreadNotificationCount })}

                  <!-- Profile -->
                  <div class="relative">
                    <button
                      class="profile-menu-btn"
                      onclick="toggleProfileMenu()"
                      aria-label="Account"
                    >
                      <img class="profile-avatar" src="${user?.avatar ||
                        "https://ui-avatars.com/api/?name=" +
                          encodeURIComponent(
                            user?.name || "Admin",
                          )}" alt="Profile" />
                    </button>
                    <div id="profileMenu" class="hidden profile-dropdown">
                      <a
                        href="${adminPath}/profile"
                        class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                      >Perfil</a>
                      <a
                        href="${adminPath}/settings"
                        class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                      >Configuración</a>
                      <hr class="my-2 border-gray-200 dark:border-gray-600" />
                      <form method="POST" action="${adminPath}/logout">
                        <button
                          type="submit"
                          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Cerrar sesión
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <!-- Content -->
            <main class="admin-content">
              <div class="admin-container">
                ${children}
              </div>
            </main>
          </div>
        </div>

        <!-- Toast Notifications Container -->
        ${ToastContainer()}

        <script>
        function toggleTheme() {
          if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
          } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
          }
        }

        function toggleProfileMenu() {
          document.getElementById('profileMenu').classList.toggle('hidden');
        }

        function toggleMobileMenu() {
          // TODO: Implement mobile menu
          alert('Mobile menu - To be implemented');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
          const profileMenu = document.getElementById('profileMenu');
          const profileBtn = event.target.closest('.profile-menu-btn');
          if (!profileBtn && profileMenu && !profileMenu.contains(event.target)) {
            profileMenu.classList.add('hidden');
          }
        });
        </script>
      </body>
    </html>
  `;
};

function renderNavItem(
  basePath: string,
  path: string,
  label: string,
  active: boolean,
  icon: string,
) {
  const fullPath = basePath + path;
  const className = active ? "admin-nav-item active" : "admin-nav-item";

  // Import icons using dynamic import (these will be replaced with constants)
  const icons = {
    dashboard: "M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z",
    fallback: "M12 12C12 12 12 12 12 12M12 12C12 12 12 12 12 12Z",
  };
  
  // Map labels to appropriate SVG icon paths from @mdi/js
  let svgIcon = icons.fallback; // Default fallback
  switch(label.toLowerCase()) {
    case 'dashboard':
      svgIcon = icons.dashboard;
      break;
    default:
      svgIcon = icons.fallback; // fallback icon
  }

  return html`
    <a href="${fullPath}" class="${className}">
      <span class="admin-nav-icon">
        <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="${svgIcon}"></path>
        </svg>
      </span>
      <span class="admin-nav-text">${label}</span>
    </a>
  `;
}

interface NavSubItem {
  id: string;
  label: string;
  path: string;
  availableTag?: string;
}

function renderNavGroup(
  basePath: string,
  groupId: string,
  label: string,
  activePage: string,
  icon: string,
  items: NavSubItem[],
) {
  const isGroupActive = activePage.startsWith(`${groupId}.`) ||
    activePage === groupId;
    
  // Import icons using dynamic import (these will be replaced with constants)
  const icons = {
    content: "M3 5H21V19H3V5M17.5 11.5L14 8.5L12.5 10L10.5 8L7.5 11.5L9 13L10.5 11.5L12.5 13.5L15 10.5L16 11.5L17.5 11.5Z",
    access: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11.5C15.4,11.5 16,12.1 16,12.5V15.5C16,15.9 15.6,16.5 15,16.5H9C8.4,16.5 8,15.9 8,15.5V12.5C8,12.1 8.6,11.5 9.2,11.5V10.5C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10.5V11.5H13.5V10.5C13.5,8.7 12.8,8.2 12,8.2Z",
    appearance: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z",
    plugins: "M20.5,11H19V7C19,5.89 18.1,5 17,5H13V3.5A2.5,2.5 0 0,0 10.5,1A2.5,2.5 0 0,0 8,3.5V5H4A2,2 0 0,0 2,7V10.8H3.5C5,10.8 6.2,12 6.2,13.5C6.2,15 5,16.2 3.5,16.2H2V20A2,2 0 0,0 4,22H7.8V20.5C7.8,19 9,17.8 10.5,17.8C12,17.8 13.2,19 13.2,20.5V22H17A2,2 0 0,0 19,20V16H20.5A2.5,2.5 0 0,0 23,13.5A2.5,2.5 0 0,0 20.5,11Z",
    settings: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
    fallback: "M12 12C12 12 12 12 12 12M12 12C12 12 12 12 12 12Z",
  };

  // Map labels to appropriate SVG icon paths from @mdi/js
  let svgIcon = icons.fallback; // Default fallback
  switch(label.toLowerCase()) {
    case 'contenido':
    case 'content':
      svgIcon = icons.content;
      break;
    case 'gestión de acceso':
    case 'access management':
    case 'acceso':
    case 'access':
      svgIcon = icons.access;
      break;
    case 'apariencia':
    case 'appearance':
      svgIcon = icons.appearance;
      break;
    case 'plugins':
      svgIcon = icons.plugins;
      break;
    case 'configuración':
    case 'settings':
      svgIcon = icons.settings;
      break;
    default:
      svgIcon = icons.fallback; // fallback icon
  }

  return html`
    <div class="admin-nav-group">
      <div class="admin-nav-group-header ${isGroupActive ? "active" : ""}">
        <span class="admin-nav-icon">
          <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="${svgIcon}"></path>
          </svg>
        </span>
        <span class="admin-nav-text">${label}</span>
      </div>
      <div class="admin-nav-subitems">
        ${items.map((item) => renderNavSubItem(basePath, item, activePage))}
      </div>
    </div>
  `;
}

function renderNavSubItem(
  basePath: string,
  item: NavSubItem,
  activePage: string,
) {
  const fullPath = basePath + item.path;
  const isActive = activePage === item.id;
  const className = isActive ? "admin-nav-subitem active" : "admin-nav-subitem";
  
  // Import icons using dynamic import (these will be replaced with constants)
  const icons = {
    posts: "M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M19,9V11H17V9H19M15,9V11H13V9H15M11,9V11H9V9H11M7,9V11H5V9H7M19,13V15H17V13H19M15,13V15H13V13H15M11,13V15H9V13H11M7,13V15H5V13H7M19,17V19H17V17H19M15,17V19H13V17H15M11,17V19H9V17H11M7,17V19H5V17H7Z",
    pages: "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z",
    categories: "M4,12V20H20V12H4M3,11H21L19,9H5L3,11M5,3H19V8H5V3M10,7H14V5H10V7Z",
    tags: "M5,3H19L14,8L19,13H5M19,15H22V3H19V0H5A2,2 0 0,0 3,2V22A2,2 0 0,0 5,24H19A2,2 0 0,0 21,22V19H19V22H5V2H19V5H21V8H19V11H22V8H19V15Z",
    media: "M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M12,7L17,12H14V16H10V12H7L12,7Z",
    users: "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
    roles: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C10.6,7 9.33,7.47 8.29,8.28C8.95,9.18 9.36,10.28 9.42,11.45C10.25,11.17 11.12,11 12,11C12.88,11 13.75,11.17 14.58,11.45C14.64,10.28 15.05,9.18 15.71,8.28C14.67,7.47 13.4,7 12,7M15.5,17L14.67,15.34C16.23,14.25 17.25,12.5 17.25,10.5C17.25,6.91 14.54,4 11,4C7.46,4 4.75,6.91 4.75,10.5C4.75,12.5 5.77,14.25 7.33,15.34L6.5,17C4.89,15.67 4,13.46 4,11C4,6.58 7.58,3 12,3C16.42,3 20,6.58 20,11C20,13.46 19.11,15.67 17.5,17L15.5,17Z",
    permissions: "M12,1A9,9 0 0,0 3,10V17A9,9 0 0,0 12,26A9,9 0 0,0 21,17V10A9,9 0 0,0 12,1M12,3A7,7 0 0,1 19,10V17A7,7 0 0,1 12,24A7,7 0 0,1 5,17V10A7,7 0 0,1 12,3M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z",
    themes: "M12,3C7.03,3 3,7.03 3,12C3,16.97 7.03,21 12,21C16.97,21 21,16.97 21,12C21,7.03 16.97,3 12,3M12,5C15.31,5 18,7.69 18,11C18,12.9 17.09,14.58 15.66,15.72L15.41,15.5L14,16.92L12.59,15.5L12.34,15.72C10.91,14.58 10,12.9 10,11C10,7.69 12.69,5 16,5V5Z",
    menus: "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",
    allPlugins: "M20.5,11H19V7C19,5.89 18.1,5 17,5H13V3.5A2.5,2.5 0 0,0 10.5,1A2.5,2.5 0 0,0 8,3.5V5H4A2,2 0 0,0 2,7V10.8H3.5C5,10.8 6.2,12 6.2,13.5C6.2,15 5,16.2 3.5,16.2H2V20A2,2 0 0,0 4,22H7.8V20.5C7.8,19 9,17.8 10.5,17.8C12,17.8 13.2,19 13.2,20.5V22H17A2,2 0 0,0 19,20V16H20.5A2.5,2.5 0 0,0 23,13.5A2.5,2.5 0 0,0 20.5,11Z",
    general: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
    reading: "M18,2A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H18M18,4H13V12L10.5,9.75L8,12V4H6V20H18V4Z",
    writing: "M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M2,20.27L4.25,18H6.75L2,20.27Z",
    comments: "M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z",
    seo: "M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17Z",
    captcha: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C10.6,7 9.33,7.47 8.29,8.28C8.95,9.18 9.36,10.28 9.42,11.45C10.25,11.17 11.12,11 12,11C12.88,11 13.75,11.17 14.58,11.45C14.64,10.28 15.05,9.18 15.71,8.28C14.67,7.47 13.4,7 12,7M15.5,17L14.67,15.34C16.23,14.25 17.25,12.5 17.25,10.5C17.25,6.91 14.54,4 11,4C7.46,4 4.75,6.91 4.75,10.5C4.75,12.5 5.77,14.25 7.33,15.34L6.5,17C4.89,15.67 4,13.46 4,11C4,6.58 7.58,3 12,3C16.42,3 20,6.58 20,11C20,13.46 19.11,15.67 17.5,17L15.5,17Z",
    advanced: "M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,2L14.33,6.5L19,7.67L15.5,11L16.67,15.67L12,13.33L7.33,15.67L8.5,11L5,7.67L9.67,6.5L12,2Z",
    fallback: "M12 12C12 12 12 12 12 12M12 12C12 12 12 12 12 12Z",
  };

  // Map submenu labels to appropriate SVG icon paths from @mdi/js
  let svgIcon = icons.fallback; // Default fallback
  switch(item.label.toLowerCase()) {
    case 'entradas':
    case 'posts':
      svgIcon = icons.posts;
      break;
    case 'páginas':
    case 'pages':
      svgIcon = icons.pages;
      break;
    case 'categorías':
    case 'categories':
      svgIcon = icons.categories;
      break;
    case 'tags':
    case 'etiquetas':
      svgIcon = icons.tags;
      break;
    case 'medios':
    case 'media':
      svgIcon = icons.media;
      break;
    case 'usuarios':
    case 'users':
      svgIcon = icons.users;
      break;
    case 'roles':
      svgIcon = icons.roles;
      break;
    case 'permisos':
    case 'permissions':
      svgIcon = icons.permissions;
      break;
    case 'themes':
    case 'temas':
      svgIcon = icons.themes;
      break;
    case 'menús':
    case 'menus':
      svgIcon = icons.menus;
      break;
    case 'todos los plugins':
    case 'all plugins':
      svgIcon = icons.allPlugins;
      break;
    case 'general':
      svgIcon = icons.general;
      break;
    case 'lectura':
    case 'reading':
      svgIcon = icons.reading;
      break;
    case 'escritura':
    case 'writing':
      svgIcon = icons.writing;
      break;
    case 'comentarios':
    case 'comments':
      svgIcon = icons.comments;
      break;
    case 'seo':
      svgIcon = icons.seo;
      break;
    case 'captcha':
      svgIcon = icons.captcha;
      break;
    case 'avanzado':
    case 'advanced':
      svgIcon = icons.advanced;
      break;
    default:
      svgIcon = icons.fallback; // small circle icon as fallback
  }

  return html`
    <a href="${fullPath}" class="${className}">
      <span class="admin-nav-subitem-icon">
        <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="${svgIcon}"></path>
        </svg>
      </span>
      <span class="admin-nav-subitem-text">${item.label}</span>
      ${item.availableTag
        ? html`
          <span class="admin-nav-subitem-tag">${item.availableTag}</span>
        `
        : ""}
    </a>
  `;
}



export default AdminLayout;
