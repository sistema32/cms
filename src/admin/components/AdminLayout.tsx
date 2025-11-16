import { html, raw } from "hono/html";
import { env } from "../../config/env.ts";
import { ToastContainer } from "./Toast.tsx";
import { NotificationPanel, type NotificationItem } from "./NotificationPanel.tsx";
import { ROUTES, getAdminAsset } from "../config/routes.ts";

/**
 * Admin Layout - Nexus Design System
 * Modern, clean interface with professional styling
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
  pluginPanels?: Array<{
    id: string;
    title: string;
    pluginName: string;
    path: string;
    icon?: string;
  }>;
}

interface NavItem {
  id: string;
  icon: string;
  label: string;
  path?: string;
  children?: NavSubItem[];
  badge?: string;
}

interface NavSubItem {
  id: string;
  label: string;
  path: string;
  availableTag?: string;
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
    pluginPanels = [],
  } = props;
  const adminPath = env.ADMIN_PATH;

  const userName = user?.name || user?.email?.split('@')[0] || 'Usuario';

  // Build plugin panel navigation items
  const pluginPanelChildren: NavSubItem[] = pluginPanels.map(panel => ({
    id: `plugin.${panel.pluginName}.${panel.id}`,
    label: panel.title,
    path: `/plugins/${panel.pluginName}/${panel.path}`,
  }));

  // Navigation structure - Nexus style
  const navItems: NavItem[] = [
    {
      id: "dashboard",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
      label: "Dashboard",
      path: "/",
    },
    {
      id: "content",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
      label: "Contenido",
      children: [
        { id: "content.posts", label: "Entradas", path: `/${ROUTES.POSTS}` },
        { id: "content.pages", label: "Páginas", path: `/${ROUTES.PAGES}` },
        { id: "content.categories", label: "Categorías", path: `/${ROUTES.CATEGORIES}` },
        { id: "content.tags", label: "Tags", path: `/${ROUTES.TAGS}` },
        { id: "content.comments", label: "Comentarios", path: `/${ROUTES.COMMENTS}` },
        { id: "content.media", label: "Medios", path: `/${ROUTES.MEDIA}` },
      ],
    },
    {
      id: "access",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>',
      label: "Control de Acceso",
      children: [
        { id: "access.users", label: "Usuarios", path: `/${ROUTES.USERS}` },
        { id: "access.roles", label: "Roles", path: `/${ROUTES.ROLES}` },
        { id: "access.permissions", label: "Permisos", path: `/${ROUTES.PERMISSIONS}` },
      ],
    },
    {
      id: "appearance",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>',
      label: "Apariencia",
      children: [
        { id: "appearance.themes", label: "Themes", path: `/${ROUTES.THEMES}` },
        { id: "appearance.menus", label: "Menús", path: `/${ROUTES.MENUS}` },
        { id: "appearance.widgets", label: "Widgets", path: "/appearance/widgets" },
      ],
    },
    {
      id: "plugins",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>',
      label: "Plugins",
      children: pluginPanelChildren.length > 0 ? [
        { id: "plugins.all", label: "Todos los Plugins", path: `/${ROUTES.PLUGINS}` },
        ...pluginPanelChildren,
      ] : undefined,
      path: pluginPanelChildren.length === 0 ? `/${ROUTES.PLUGINS}` : undefined,
    },
    {
      id: "system",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>',
      label: "Sistema",
      children: [
        { id: "system.backups", label: "Backups", path: "/backups" },
        { id: "system.updates", label: "Actualizaciones", path: "/system-updates" },
      ],
    },
    {
      id: "settings",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
      label: "Configuración",
      children: [
        { id: "settings.general", label: "General", path: `/${ROUTES.SETTINGS_GENERAL}`, availableTag: settingsAvailability["settings.general"] === false ? "Sin datos" : undefined },
        { id: "settings.reading", label: "Lectura", path: `/${ROUTES.SETTINGS_READING}`, availableTag: settingsAvailability["settings.reading"] === false ? "Sin datos" : undefined },
        { id: "settings.writing", label: "Escritura", path: `/${ROUTES.SETTINGS_WRITING}`, availableTag: settingsAvailability["settings.writing"] === false ? "Sin datos" : undefined },
        { id: "settings.discussion", label: "Comentarios", path: `/${ROUTES.SETTINGS_DISCUSSION}`, availableTag: settingsAvailability["settings.discussion"] === false ? "Sin datos" : undefined },
        { id: "settings.media", label: "Medios", path: `/${ROUTES.SETTINGS_MEDIA}`, availableTag: settingsAvailability["settings.media"] === false ? "Sin datos" : undefined },
        { id: "settings.seo", label: "SEO", path: `/${ROUTES.SETTINGS_SEO}`, availableTag: settingsAvailability["settings.seo"] === false ? "Sin datos" : undefined },
        { id: "settings.advanced", label: "Avanzado", path: `/${ROUTES.SETTINGS_ADVANCED}`, availableTag: settingsAvailability["settings.advanced"] === false ? "Sin datos" : undefined },
      ],
    },
  ];

  const isItemActive = (itemId: string) => {
    return activePage === itemId || activePage.startsWith(itemId + ".");
  };

  const renderNavItem = (item: NavItem) => {
    const active = isItemActive(item.id);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      // Dropdown menu item
      return `
        <li>
          <details ${active ? 'open' : ''}>
            <summary class="${active ? 'active' : ''}">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${item.icon}
              </svg>
              <span>${item.label}</span>
              <svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <ul>
              ${item.children!.map((child) => `
                <li>
                  <a
                    href="${adminPath}${child.path}"
                    class="${activePage === child.id ? 'active' : ''}"
                  >
                    ${child.label}
                    ${child.availableTag ? `<span class="nexus-badge-warning">${child.availableTag}</span>` : ''}
                  </a>
                </li>
              `).join('')}
            </ul>
          </details>
        </li>
      `;
    } else {
      // Simple link
      return `
        <li>
          <a href="${adminPath}${item.path}" class="${active ? 'active' : ''}">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              ${item.icon}
            </svg>
            <span>${item.label}</span>
          </a>
        </li>
      `;
    }
  };

  return html`
    <!DOCTYPE html>
    <html lang="es" data-theme="light">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - LexCMS Admin</title>
        <script>
          // Dark mode initialization - must run BEFORE page renders
          const savedTheme = localStorage.getItem('theme');
          const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

          if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.setAttribute('data-theme', 'light');
          }
        </script>
        <link rel="stylesheet" href="${getAdminAsset('css/admin-compiled.css')}">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          /* ========== NEXUS DESIGN SYSTEM VARIABLES ========== */
          :root {
            --sidebar-width: 280px;
            --header-height: 72px;

            /* Nexus Color System - Light Theme */
            --nexus-primary: #167bff;
            --nexus-primary-content: #fff;
            --nexus-secondary: #9c5de8;
            --nexus-accent: #00d3bb;
            --nexus-success: #0bbf58;
            --nexus-warning: #f5a524;
            --nexus-error: #f31260;
            --nexus-info: #14b4ff;

            /* Base Colors */
            --nexus-base-100: #fff;
            --nexus-base-200: #eef0f2;
            --nexus-base-300: #dcdee0;
            --nexus-base-content: #1e2328;

            /* Background Colors */
            --nexus-root-bg: #fafbfc;
            --nexus-sidebar-bg: #fff;
            --nexus-topbar-bg: #fff;

            /* Border Radius - Nexus uses smaller, more subtle radii */
            --nexus-radius-sm: 0.25rem;
            --nexus-radius-md: 0.5rem;
            --nexus-radius-lg: 0.75rem;

            /* Spacing */
            --nexus-card-padding: 20px;
          }

          [data-theme="dark"] {
            /* Nexus Color System - Dark Theme */
            --nexus-primary: #378dff;
            --nexus-primary-content: #fff;
            --nexus-secondary: #b071ff;
            --nexus-accent: #00d3bb;
            --nexus-success: #0bbf58;
            --nexus-warning: #f5a524;
            --nexus-error: #f31260;
            --nexus-info: #14b4ff;

            /* Base Colors */
            --nexus-base-100: #181c20;
            --nexus-base-200: #22262a;
            --nexus-base-300: #2c3034;
            --nexus-base-content: #f0f4f8;

            /* Background Colors */
            --nexus-root-bg: #121416;
            --nexus-sidebar-bg: #181c20;
            --nexus-topbar-bg: #181b1f;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background: var(--nexus-root-bg);
          }

          /* ========== LAYOUT ========== */
          .nexus-layout {
            display: flex;
            min-height: 100vh;
          }

          /* ========== SIDEBAR ========== */
          .nexus-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: var(--sidebar-width);
            height: 100vh;
            background: var(--nexus-sidebar-bg);
            border-right: 1px solid var(--nexus-base-300);
            display: flex;
            flex-direction: column;
            z-index: 50;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 0 1px rgba(0,0,0,0.03);
          }

          .nexus-sidebar.closed {
            transform: translateX(-100%);
          }

          /* Sidebar Header */
          .nexus-sidebar-header {
            height: var(--header-height);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            border-bottom: 1px solid var(--nexus-base-200);
          }

          .nexus-sidebar-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
          }

          .nexus-sidebar-logo {
            font-size: 1.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--nexus-primary) 0%, var(--nexus-secondary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.025em;
          }

          .sidebar-close-btn {
            display: none;
            width: 32px;
            height: 32px;
            align-items: center;
            justify-content: center;
            border-radius: var(--nexus-radius-sm);
            background: transparent;
            border: none;
            color: var(--nexus-base-content);
            opacity: 0.6;
            cursor: pointer;
            transition: all 0.2s;
          }

          .sidebar-close-btn:hover {
            background: var(--nexus-base-200);
            opacity: 1;
          }

          /* Sidebar Navigation */
          .nexus-sidebar-nav {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0.75rem 0.75rem;
          }

          .nexus-sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }

          .nexus-sidebar-nav::-webkit-scrollbar-track {
            background: transparent;
          }

          .nexus-sidebar-nav::-webkit-scrollbar-thumb {
            background: var(--nexus-base-300);
            border-radius: 3px;
          }

          .nexus-sidebar-nav::-webkit-scrollbar-thumb:hover {
            background: var(--nexus-primary);
            opacity: 0.5;
          }

          .nexus-sidebar-nav ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .nexus-sidebar-nav > ul > li {
            margin-bottom: 0.125rem;
          }

          /* Main menu items */
          .nexus-sidebar-nav > ul > li > a,
          .nexus-sidebar-nav > ul > li > details > summary {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: var(--nexus-radius-md);
            font-weight: 500;
            font-size: 0.875rem;
            line-height: 1.25;
            color: var(--nexus-base-content);
            opacity: 0.7;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            text-decoration: none;
            position: relative;
          }

          .nexus-sidebar-nav > ul > li > a > svg,
          .nexus-sidebar-nav > ul > li > details > summary > svg:first-child {
            flex-shrink: 0;
            width: 1.25rem;
            height: 1.25rem;
            stroke-width: 2;
            color: var(--nexus-base-content);
            opacity: 0.6;
            transition: all 0.2s;
          }

          .nexus-sidebar-nav > ul > li > a > span,
          .nexus-sidebar-nav > ul > li > details > summary > span {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* Chevron icon */
          .chevron-icon {
            flex-shrink: 0;
            width: 1rem;
            height: 1rem;
            margin-left: auto;
            stroke-width: 2.5;
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }

          details[open] > summary .chevron-icon {
            transform: rotate(180deg);
          }

          .nexus-sidebar-nav > ul > li > a:hover,
          .nexus-sidebar-nav > ul > li > details > summary:hover {
            background: rgba(22, 123, 255, 0.08);
            color: var(--nexus-primary);
            opacity: 1;
          }

          .nexus-sidebar-nav > ul > li > a:hover > svg,
          .nexus-sidebar-nav > ul > li > details > summary:hover > svg {
            color: var(--nexus-primary);
            opacity: 1;
          }

          .nexus-sidebar-nav > ul > li > a.active,
          .nexus-sidebar-nav > ul > li > details[open] > summary.active {
            background: rgba(22, 123, 255, 0.12);
            color: var(--nexus-primary);
            font-weight: 600;
            opacity: 1;
          }

          .nexus-sidebar-nav > ul > li > details[open] > summary {
            color: var(--nexus-base-content);
            opacity: 1;
          }

          .nexus-sidebar-nav > ul > li > a.active > svg,
          .nexus-sidebar-nav > ul > li > details[open] > summary > svg:first-child {
            color: var(--nexus-primary);
            opacity: 1;
          }

          /* Remove default details marker */
          .nexus-sidebar-nav details > summary {
            list-style: none;
          }

          .nexus-sidebar-nav details > summary::-webkit-details-marker {
            display: none;
          }

          /* Submenu container */
          .nexus-sidebar-nav details > ul {
            padding: 0.25rem 0 0.5rem 0;
            animation: slideDown 0.2s ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              max-height: 0;
            }
            to {
              opacity: 1;
              max-height: 500px;
            }
          }

          /* Submenu items */
          .nexus-sidebar-nav details > ul > li {
            margin: 0;
          }

          .nexus-sidebar-nav details > ul > li > a {
            display: flex;
            align-items: center;
            padding: 0.625rem 1rem 0.625rem 3rem;
            font-size: 0.8125rem;
            font-weight: 500;
            color: var(--nexus-base-content);
            opacity: 0.65;
            border-radius: var(--nexus-radius-sm);
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none;
            position: relative;
          }

          .nexus-sidebar-nav details > ul > li > a::before {
            content: "";
            position: absolute;
            left: 1.75rem;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--nexus-base-content);
            opacity: 0.25;
            transition: all 0.2s;
          }

          .nexus-sidebar-nav details > ul > li > a:hover {
            background: rgba(22, 123, 255, 0.08);
            color: var(--nexus-primary);
            opacity: 1;
            padding-left: 3.25rem;
          }

          .nexus-sidebar-nav details > ul > li > a:hover::before {
            background: var(--nexus-primary);
            opacity: 1;
            transform: scale(1.25);
          }

          .nexus-sidebar-nav details > ul > li > a.active {
            background: rgba(22, 123, 255, 0.15);
            color: var(--nexus-primary);
            font-weight: 600;
            opacity: 1;
            padding-left: 2.875rem;
            border-left: 3px solid var(--nexus-primary);
          }

          .nexus-sidebar-nav details > ul > li > a.active::before {
            display: none;
          }

          .nexus-badge-warning {
            display: inline-block;
            padding: 0.125rem 0.375rem;
            font-size: 0.625rem;
            font-weight: 600;
            border-radius: var(--nexus-radius-sm);
            background: var(--nexus-warning);
            color: #fff;
            margin-left: auto;
          }

          /* Sidebar Footer */
          .nexus-sidebar-footer {
            padding: 0.75rem;
            border-top: 1px solid var(--nexus-base-200);
          }

          .nexus-sidebar-user {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-radius: var(--nexus-radius-md);
            transition: all 0.15s;
            cursor: pointer;
          }

          .nexus-sidebar-user:hover {
            background: var(--nexus-base-200);
          }

          .nexus-sidebar-user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--nexus-primary) 0%, var(--nexus-secondary) 100%);
            color: white;
            font-weight: 600;
            font-size: 0.875rem;
            border: 2px solid rgba(22, 123, 255, 0.2);
          }

          .nexus-sidebar-user-info {
            flex: 1;
            min-width: 0;
          }

          .nexus-sidebar-user-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--nexus-base-content);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .nexus-sidebar-user-role {
            font-size: 0.75rem;
            color: var(--nexus-base-content);
            opacity: 0.5;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* ========== MAIN CONTENT ========== */
          .nexus-main {
            flex: 1;
            margin-left: var(--sidebar-width);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .nexus-main.expanded {
            margin-left: 0;
          }

          /* ========== HEADER ========== */
          .nexus-header {
            height: var(--header-height);
            background: var(--nexus-topbar-bg);
            border-bottom: 1px solid var(--nexus-base-200);
            display: flex;
            align-items: center;
            padding: 0 2rem;
            gap: 1.5rem;
            position: sticky;
            top: 0;
            z-index: 40;
            box-shadow: 0 1px 3px 0 rgba(0,0,0,0.02);
          }

          .mobile-menu-btn {
            display: none;
            width: 40px;
            height: 40px;
            align-items: center;
            justify-content: center;
            border-radius: var(--nexus-radius-md);
            background: transparent;
            border: none;
            color: var(--nexus-base-content);
            cursor: pointer;
            transition: all 0.2s;
          }

          .mobile-menu-btn:hover {
            background: var(--nexus-base-200);
          }

          .nexus-breadcrumbs {
            flex: 1;
          }

          .nexus-header-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .nexus-icon-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--nexus-radius-md);
            background: transparent;
            border: none;
            color: var(--nexus-base-content);
            opacity: 0.7;
            cursor: pointer;
            transition: all 0.2s;
          }

          .nexus-icon-btn:hover {
            background: var(--nexus-base-200);
            opacity: 1;
          }

          .theme-toggle {
            position: relative;
          }

          .theme-toggle input {
            position: absolute;
            opacity: 0;
          }

          .theme-toggle svg {
            width: 1.25rem;
            height: 1.25rem;
          }

          /* Notification Badge */
          .notification-badge {
            position: relative;
          }

          .notification-badge-count {
            position: absolute;
            top: -4px;
            right: -4px;
            background: var(--nexus-error);
            color: white;
            font-size: 0.625rem;
            font-weight: 700;
            padding: 0.125rem 0.375rem;
            border-radius: 9999px;
            min-width: 18px;
            text-align: center;
          }

          /* User Dropdown */
          .user-dropdown {
            position: relative;
          }

          .user-dropdown-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: var(--nexus-radius-md);
            cursor: pointer;
            transition: all 0.2s;
          }

          .user-dropdown-toggle:hover {
            background: var(--nexus-base-200);
          }

          .user-dropdown-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--nexus-primary) 0%, var(--nexus-secondary) 100%);
            color: white;
            font-weight: 600;
            font-size: 0.75rem;
          }

          .user-dropdown-info {
            display: none;
          }

          .user-dropdown-name {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--nexus-base-content);
          }

          .user-dropdown-chevron {
            width: 1rem;
            height: 1rem;
            opacity: 0.5;
          }

          .user-dropdown-menu {
            display: none;
            position: absolute;
            right: 0;
            top: calc(100% + 0.5rem);
            min-width: 200px;
            background: var(--nexus-base-100);
            border: 1px solid var(--nexus-base-300);
            border-radius: var(--nexus-radius-md);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            padding: 0.5rem;
            z-index: 50;
          }

          .user-dropdown-menu.show {
            display: block;
          }

          .user-dropdown-menu a {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.625rem 0.75rem;
            border-radius: var(--nexus-radius-sm);
            color: var(--nexus-base-content);
            text-decoration: none;
            font-size: 0.875rem;
            transition: all 0.15s;
          }

          .user-dropdown-menu a:hover {
            background: var(--nexus-base-200);
          }

          .user-dropdown-menu a.danger {
            color: var(--nexus-error);
          }

          .user-dropdown-menu a svg {
            width: 1rem;
            height: 1rem;
            opacity: 0.6;
          }

          .user-dropdown-divider {
            height: 1px;
            background: var(--nexus-base-200);
            margin: 0.5rem 0;
          }

          /* ========== CONTENT ========== */
          .nexus-content {
            flex: 1;
            padding: 2rem 2.5rem;
            max-width: 1600px;
            width: 100%;
            margin: 0 auto;
          }

          /* ========== MOBILE OVERLAY ========== */
          .mobile-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 45;
            backdrop-filter: blur(2px);
          }

          .mobile-overlay.show {
            display: block;
          }

          /* ========== RESPONSIVE ========== */
          @media (max-width: 1024px) {
            .nexus-sidebar {
              transform: translateX(-100%);
            }

            .nexus-sidebar.open {
              transform: translateX(0);
            }

            .nexus-main {
              margin-left: 0;
            }

            .mobile-menu-btn,
            .sidebar-close-btn {
              display: flex;
            }

            .user-dropdown-info {
              display: block;
            }
          }

          @media (max-width: 640px) {
            .nexus-header {
              padding: 0 1rem;
            }

            .nexus-content {
              padding: 1.5rem 1rem;
            }
          }
        </style>
      </head>
      <body>
        <!-- Mobile Overlay -->
        <div class="mobile-overlay" id="mobileOverlay"></div>

        <div class="nexus-layout">
          <!-- Sidebar -->
          <aside class="nexus-sidebar" id="sidebar">
            <!-- Sidebar Header -->
            <div class="nexus-sidebar-header">
              <a href="${adminPath}/" class="nexus-sidebar-brand">
                <span class="nexus-sidebar-logo">LexCMS</span>
              </a>
              <button class="sidebar-close-btn" id="sidebarCloseBtn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Sidebar Navigation -->
            <nav class="nexus-sidebar-nav">
              <ul>
                ${raw(navItems.map(renderNavItem).join(''))}
              </ul>
            </nav>

            <!-- Sidebar Footer - User Info -->
            <div class="nexus-sidebar-footer">
              <div class="nexus-sidebar-user">
                <div class="nexus-sidebar-user-avatar">
                  ${userName.substring(0, 2).toUpperCase()}
                </div>
                <div class="nexus-sidebar-user-info">
                  <div class="nexus-sidebar-user-name">${userName}</div>
                  <div class="nexus-sidebar-user-role">Administrador</div>
                </div>
              </div>
            </div>
          </aside>

          <!-- Main Content Area -->
          <div class="nexus-main" id="mainContent">
            <!-- Header / Top Bar -->
            <header class="nexus-header">
              <!-- Mobile Menu Button -->
              <button class="mobile-menu-btn" id="mobileMenuBtn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>

              <!-- Breadcrumbs -->
              <div class="nexus-breadcrumbs"></div>

              <!-- Header Actions -->
              <div class="nexus-header-actions">
                <!-- Theme Toggle -->
                <label class="nexus-icon-btn theme-toggle">
                  <input type="checkbox" class="theme-controller" />
                  <svg class="sun-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
                  </svg>
                  <svg class="moon-icon" fill="currentColor" viewBox="0 0 20 20" style="display: none;">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                  </svg>
                </label>

                <!-- Notifications -->
                <div class="notification-badge">
                  ${NotificationPanel({ adminPath, notifications, unreadCount: unreadNotificationCount })}
                </div>

                <!-- User Dropdown -->
                <div class="user-dropdown">
                  <div class="user-dropdown-toggle" id="userDropdownToggle">
                    <div class="user-dropdown-avatar">
                      ${userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div class="user-dropdown-info">
                      <div class="user-dropdown-name">${userName}</div>
                    </div>
                    <svg class="user-dropdown-chevron" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <div class="user-dropdown-menu" id="userDropdownMenu">
                    <a href="${adminPath}/profile">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                      </svg>
                      Mi Perfil
                    </a>
                    <a href="${adminPath}/settings">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
                      </svg>
                      Configuración
                    </a>
                    <div class="user-dropdown-divider"></div>
                    <a href="${adminPath}/logout" class="danger">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"></path>
                      </svg>
                      Cerrar Sesión
                    </a>
                  </div>
                </div>
              </div>
            </header>

            <!-- Page Content -->
            <main class="nexus-content">
              ${children}
            </main>
          </div>
        </div>

        ${ToastContainer()}

        <script>
          // Mobile menu toggle
          const sidebar = document.getElementById('sidebar');
          const mobileMenuBtn = document.getElementById('mobileMenuBtn');
          const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
          const mobileOverlay = document.getElementById('mobileOverlay');

          mobileMenuBtn?.addEventListener('click', () => {
            sidebar.classList.add('open');
            mobileOverlay.classList.add('show');
          });

          sidebarCloseBtn?.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('show');
          });

          mobileOverlay?.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('show');
          });

          // User dropdown toggle
          const userDropdownToggle = document.getElementById('userDropdownToggle');
          const userDropdownMenu = document.getElementById('userDropdownMenu');

          userDropdownToggle?.addEventListener('click', () => {
            userDropdownMenu.classList.toggle('show');
          });

          document.addEventListener('click', (e) => {
            if (!userDropdownToggle?.contains(e.target) && !userDropdownMenu?.contains(e.target)) {
              userDropdownMenu?.classList.remove('show');
            }
          });

          // Theme toggle
          const themeToggle = document.querySelector('.theme-controller');
          const sunIcon = document.querySelector('.sun-icon');
          const moonIcon = document.querySelector('.moon-icon');

          function updateThemeIcons() {
            const isDark = document.documentElement.classList.contains('dark');
            if (sunIcon && moonIcon) {
              sunIcon.style.display = isDark ? 'none' : 'block';
              moonIcon.style.display = isDark ? 'block' : 'none';
            }
            if (themeToggle) {
              themeToggle.checked = isDark;
            }
          }

          updateThemeIcons();

          themeToggle?.addEventListener('change', function() {
            const html = document.documentElement;
            if (this.checked) {
              html.classList.add('dark');
              html.setAttribute('data-theme', 'dark');
              localStorage.setItem('theme', 'dark');
            } else {
              html.classList.remove('dark');
              html.setAttribute('data-theme', 'light');
              localStorage.setItem('theme', 'light');
            }
            updateThemeIcons();
          });
        </script>
      </body>
    </html>
  `;
};

export default AdminLayout;
