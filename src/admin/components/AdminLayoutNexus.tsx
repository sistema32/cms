import { html, raw } from "hono/html";
import { env, isDevelopment } from "../../config/env.ts";
import { ToastContainer } from "./Toast.tsx";
import { NotificationPanel, type NotificationItem } from "./NotificationPanel.tsx";
import { DebugBarNexus } from "./nexus/DebugBarNexus.tsx"; // Esta ruta ahora será correcta

/**
 * Admin Layout Nexus - Exact copy of Nexus Dashboard 3
 * Full sidebar + modern header + professional design
 */

interface AdminLayoutNexusProps {
  title: string;
  children: any;
  activePage?: string;
  user?: {
    name: string | null;
    email: string;
    avatar?: string;
  };
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
  // Props para la barra de depuración
  request?: Request;
  response?: Response;
  startTime?: number;
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
}

export const AdminLayoutNexus = (props: AdminLayoutNexusProps) => {
  const {
    title,
    children,
    activePage = "dashboard",
    user,
    notifications = [],
    unreadNotificationCount = 0,
    request,
    response,
    startTime,
  } = props;
  const adminPath = env.ADMIN_PATH;

  // Condición para mostrar la barra de depuración
  const showDebugBar =
    isDevelopment && request && response && startTime;


  const userName = user?.name || user?.email?.split('@')[0] || 'Usuario';

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
        { id: "content.posts", label: "Entradas", path: "/posts" },
        { id: "content.pages", label: "Páginas", path: "/pages" },
        { id: "content.categories", label: "Categorías", path: "/categories" },
        { id: "content.tags", label: "Tags", path: "/tags" },
        { id: "content.media", label: "Medios", path: "/media" },
      ],
    },
    {
      id: "access",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>',
      label: "Acceso",
      children: [
        { id: "access.users", label: "Usuarios", path: "/users" },
        { id: "access.roles", label: "Roles", path: "/roles" },
        { id: "access.permissions", label: "Permisos", path: "/permissions" },
      ],
    },
    {
      id: "appearance",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>',
      label: "Apariencia",
      children: [
        { id: "appearance.themes", label: "Themes", path: "/appearance/themes" },
        { id: "appearance.menus", label: "Menús", path: "/appearance/menus" },
      ],
    },
    {
      id: "security",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
      label: "Seguridad",
      children: [
        { id: "security.dashboard", label: "Dashboard", path: "/security/dashboard" },
        { id: "security.logs", label: "Logs", path: "/security/logs" },
        { id: "security.ips.blacklist", label: "IP Blacklist", path: "/security/ips/blacklist" },
        { id: "security.ips.whitelist", label: "IP Whitelist", path: "/security/ips/whitelist" },
        { id: "security.ratelimit", label: "Rate Limiting", path: "/security/rate-limit" },
        { id: "security.rules", label: "Reglas", path: "/security/rules" },
        { id: "security.reports", label: "Reportes", path: "/security/reports" },
        { id: "security.settings", label: "Configuración", path: "/security/settings" },
      ],
    },
    {
      id: "settings",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
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
        <link rel="stylesheet" href="${adminPath}/assets/css/admin-compiled.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          /* Añade padding al body si la barra de depuración está visible */
          body {
            padding-bottom: ${showDebugBar ? "40px" : "0"};
          }

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
            object-fit: cover;
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

          .breadcrumbs {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
          }

          .breadcrumbs ul {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .breadcrumbs ul li {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .breadcrumbs ul li a {
            color: var(--nexus-base-content);
            opacity: 0.6;
            text-decoration: none;
            transition: all 0.15s;
            font-weight: 500;
          }

          .breadcrumbs ul li a:hover {
            color: var(--nexus-primary);
            opacity: 1;
          }

          .breadcrumbs ul li:last-child {
            color: var(--nexus-base-content);
            font-weight: 600;
          }

          .breadcrumbs ul li:not(:last-child)::after {
            content: "/";
            color: var(--nexus-base-content);
            opacity: 0.3;
          }

          .nexus-header-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .nexus-search {
            width: 320px;
            position: relative;
          }

          .nexus-search input {
            width: 100%;
            height: 40px;
            padding: 0 1rem 0 2.5rem;
            border: 1px solid var(--nexus-base-300);
            border-radius: var(--nexus-radius-md);
            font-size: 0.875rem;
            background: var(--nexus-base-100);
            color: var(--nexus-base-content);
            transition: all 0.2s;
          }

          .nexus-search input:focus {
            outline: none;
            border-color: var(--nexus-primary);
            box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
          }

          .nexus-search input::placeholder {
            color: var(--nexus-base-content);
            opacity: 0.4;
          }

          .nexus-search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            width: 1rem;
            height: 1rem;
            color: var(--nexus-base-content);
            opacity: 0.4;
            pointer-events: none;
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
            animation: fadeIn 0.2s;
          }

          .mobile-overlay.active {
            display: block;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
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

            .mobile-menu-btn {
              display: flex;
            }

            .sidebar-close-btn {
              display: flex;
            }

            .nexus-search {
              display: none;
            }

            .nexus-content {
              padding: 1.5rem 1rem;
            }

            .nexus-header {
              padding: 0 1rem;
            }
          }

          @media (max-width: 640px) {
            .nexus-content {
              padding: 1rem;
            }
          }
        </style>
        <script>
          // Theme initialization
          const theme = localStorage.getItem('theme') || 'light';
          document.documentElement.setAttribute('data-theme', theme);
        </script>
      </head>
      <body>
        <div class="nexus-layout">
          <!-- Mobile Overlay -->
          <div class="mobile-overlay" id="mobileOverlay" onclick="closeSidebar()"></div>

          <!-- Sidebar -->
          <aside class="nexus-sidebar" id="sidebar">
            <!-- Sidebar Header -->
            <div class="nexus-sidebar-header">
              <a href="${adminPath}" class="nexus-sidebar-brand">
                <div class="nexus-sidebar-logo">LexCMS</div>
              </a>
              <button class="sidebar-close-btn" onclick="closeSidebar()" aria-label="Close sidebar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Sidebar Navigation -->
            <nav class="nexus-sidebar-nav">
              <ul>
                ${raw(navItems.map((item) => renderNavItem(item)).join(''))}
              </ul>
            </nav>

            <!-- Sidebar Footer -->
            <div class="nexus-sidebar-footer">
              <div class="nexus-sidebar-user" onclick="toggleUserMenu()">
                <img
                  class="nexus-sidebar-user-avatar"
                  src="${user?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(userName)}"
                  alt="${userName}"
                />
                <div class="nexus-sidebar-user-info">
                  <div class="nexus-sidebar-user-name">${userName}</div>
                  <div class="nexus-sidebar-user-role">Administrador</div>
                </div>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </aside>

          <!-- Main Content Area -->
          <div class="nexus-main" id="mainContent">
            <!-- Header -->
            <header class="nexus-header">
              <!-- Mobile Menu Button -->
              <button class="mobile-menu-btn" onclick="toggleSidebar()" aria-label="Toggle menu">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>

              <!-- Breadcrumbs -->
              <div class="nexus-breadcrumbs">
                <div class="breadcrumbs">
                  <ul>
                    <li><a href="${adminPath}">Inicio</a></li>
                    <li>${title}</li>
                  </ul>
                </div>
              </div>

              <!-- Header Actions -->
              <div class="nexus-header-actions">
                <!-- Search -->
                <div class="nexus-search">
                  <svg class="nexus-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input type="text" placeholder="Buscar..." />
                </div>

                <!-- Theme Toggle -->
                <button class="nexus-icon-btn" onclick="toggleTheme()" aria-label="Toggle theme">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                </button>

                <!-- Notifications -->
                ${NotificationPanel({ adminPath, notifications, unreadCount: unreadNotificationCount })}
              </div>
            </header>

            <!-- Main Content -->
            <main class="nexus-content">
              ${children}
            </main>
          </div>
        </div>

        <!-- Toast Notifications -->
        ${ToastContainer()}

        <!-- Renderizado condicional de la Barra de Depuración -->
        ${showDebugBar
      ? DebugBarNexus({
        request,
        response,
        startTime,
        memoryUsage: Deno.memoryUsage().rss,
      })
      : ""}

        <script>
          // Theme toggle
          function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
          }

          // Sidebar toggle functions
          function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('mobileOverlay');
            sidebar?.classList.toggle('open');
            overlay?.classList.toggle('active');
          }

          function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('mobileOverlay');
            sidebar?.classList.remove('open');
            overlay?.classList.remove('active');
          }

          // User menu toggle
          function toggleUserMenu() {
            // TODO: Implement user menu dropdown
            console.log('User menu clicked');
          }

          // Close sidebar on window resize
          window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
              closeSidebar();
            }
          });

          // Close sidebar when clicking on a link (mobile)
          document.querySelectorAll('.nexus-sidebar-nav a').forEach(link => {
            link.addEventListener('click', () => {
              if (window.innerWidth < 1024) {
                closeSidebar();
              }
            });
          });
        </script>
      </body>
    </html>
  `;
};

export default AdminLayoutNexus;
