import { html, raw } from "hono/html";
import { registeredSlots } from "../../../services/pluginRuntime.ts";

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
}

interface FocusSidebarProps {
    activePage: string;
    adminPath: string;
}

export const FocusSidebar = ({ activePage, adminPath }: FocusSidebarProps) => {
    const navItems: NavItem[] = [
        {
            id: "dashboard",
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
            label: "Overview",
            path: "/",
        },
        {
            id: "content",
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>',
            label: "Content",
            children: [
                { id: "content.posts", label: "Posts", path: "/posts" },
                { id: "content.media", label: "Media Library", path: "/media" },
            ]
        },
    ];

    // Plugin Slots
    if (registeredSlots.length > 0) {
        navItems.push({
            id: "apps",
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/>', // Cube icons
            label: "Apps",
            children: registeredSlots.map(slot => ({
                id: `plugin.${slot.plugin}`,
                label: slot.label,
                path: slot.url
            }))
        });
    }

    // Settings at bottom
    navItems.push({
        id: "settings",
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
        label: "Settings",
        path: "/settings"
    });

    const isItemActive = (itemId: string) => activePage === itemId || activePage.startsWith(itemId + ".");

    const renderNavItem = (item: NavItem) => {
        const active = isItemActive(item.id);
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
            return `
        <li>
          <details ${active ? 'open' : ''}>
            <summary class="${active ? 'active' : ''}">
              <svg fill="none" class="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">${item.icon}</svg>
              <span>${item.label}</span>
              <svg class="chevron-icon ml-auto w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <ul class="pl-4 mt-1 space-y-1">
              ${item.children!.map(child => {
                const href = child.path.startsWith("/") ? `${adminPath}${child.path}` : `${adminPath}/${child.path}`;
                return `<li><a href="${href}" class="block py-2 px-3 text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-colors ${activePage === child.id ? 'font-semibold text-black bg-gray-100' : ''}">${child.label}</a></li>`;
            }).join('')}
            </ul>
          </details>
        </li>
      `;
        }

        // Single Link
        const href = item.path ? (item.path.startsWith("/") ? `${adminPath}${item.path}` : `${adminPath}/${item.path}`) : "#";
        return `
      <li>
        <a href="${href}" class="${active ? 'active' : ''}">
          <svg fill="none" class="w-5 h-5 flex-shrink-0" stroke="currentColor" viewBox="0 0 24 24">${item.icon}</svg>
          <span>${item.label}</span>
        </a>
      </li>
    `;
    };

    return html`
    <aside class="nexus-sidebar focus-sidebar" id="sidebar">
      <div class="h-16 flex items-center px-6 mb-4">
        <a href="${adminPath}/" class="text-xl font-bold tracking-tight text-black flex items-center gap-2">
            <div class="w-8 h-8 bg-black text-white flex items-center justify-center">L</div>
            <span>LexCMS</span>
        </a>
      </div>

      <nav class="nexus-sidebar-nav px-4">
        <ul class="space-y-1">
          ${raw(navItems.map(renderNavItem).join(''))}
        </ul>
      </nav>

      <div class="p-4 border-t border-gray-100 mt-auto">
        <div class="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer transition-colors">
            <div class="w-8 h-8 bg-gradient-to-tr from-gray-200 to-gray-400"></div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-black truncate">Admin User</p>
                <p class="text-xs text-gray-400 truncate">admin@lexcms.com</p>
            </div>
        </div>
      </div>
    </aside>
  `;
};
