import { html, raw } from "hono/html";
import { registeredSlots } from "@/services/plugins/pluginRuntime.ts";
import { env } from "../../../config/env.ts";

export interface NavSubItem {
  id: string;
  label: string;
  path: string;
}

export interface NavItem {
  id: string;
  icon: string;
  label: string;
  path?: string;
  children?: NavSubItem[];
  badge?: string;
}

interface NexusSidebarProps {
  activePage: string;
  adminPath: string;
}

export const NexusSidebar = ({ activePage, adminPath }: NexusSidebarProps) => {
  // Navigation structure - Nexus style
  const navItems: NavItem[] = [
    {
      id: "dashboard",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
      label: "Dashboard",
      path: "/",
    },
    {
      id: "plugins",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>',
      label: "Plugins",
      path: "/plugins/db",
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

  // Inject Plugin Slots
  if (registeredSlots.length > 0) {
    const pluginChildren = registeredSlots.map(slot => ({
      id: `plugin.${slot.plugin}`,
      label: slot.label,
      path: slot.url
    }));

    navItems.splice(2, 0, {
      id: "plugins-runtime",
      icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>',
      label: "Plugins (Apps)",
      children: pluginChildren
    });
  }

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
              ${item.children!.map((child) => {
        const isExternal = child.path.startsWith("/plugins-runtime");
        const isRelative = !child.path.startsWith("/");
        let href = child.path;

        if (!isExternal) {
          href = isRelative ? `${adminPath}/${child.path}` : `${adminPath}${child.path}`;
        }

        return `
                <li>
                  <a
                    href="${href}"
                    class="${activePage === child.id ? 'active' : ''}"
                  >
                    ${child.label}
                  </a>
                </li>
              `}).join('')}
            </ul>
          </details>
        </li>
      `;
    } else {
      // Simple link
      const isExternal = item.path?.startsWith("/plugins-runtime");
      const isRelative = !item.path?.startsWith("/");
      let href = item.path || "#";

      if (item.path && !isExternal) {
        href = isRelative ? `${adminPath}/${item.path}` : `${adminPath}${item.path}`;
      }
      return `
        <li>
          <a href="${href}" class="${active ? 'active' : ''}">
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
    <aside class="nexus-sidebar" id="sidebar">
      <div class="nexus-sidebar-header">
        <a href="${adminPath}/" class="nexus-sidebar-brand">
          <div class="nexus-sidebar-logo">LexCMS</div>
        </a>
        <button class="sidebar-close-btn" data-action="toggleSidebar()">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <nav class="nexus-sidebar-nav">
        <ul>
          ${raw(navItems.map(renderNavItem).join(''))}
        </ul>
      </nav>

      <div class="nexus-sidebar-footer">
        <div class="nexus-sidebar-user">
          <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="User" class="nexus-sidebar-user-avatar">
          <div class="nexus-sidebar-user-info">
            <div class="nexus-sidebar-user-name">Administrador</div>
            <div class="nexus-sidebar-user-role">Super Admin</div>
          </div>
          <svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
    </aside>
  `;
};
