import { html } from "hono/html";
import { NotificationPanel, type NotificationItem } from "../NotificationPanel.tsx";

interface NexusHeaderProps {
    title: string;
    user?: {
        name: string | null;
        email: string;
        avatar?: string;
    };
    notifications: NotificationItem[];
    unreadNotificationCount: number;
}

export const NexusHeader = ({ title, user, notifications, unreadNotificationCount }: NexusHeaderProps) => {
    const userName = user?.name || user?.email?.split('@')[0] || 'Usuario';

    return html`
    <header class="nexus-header">
      <button class="mobile-menu-btn" onclick="toggleSidebar()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <div class="nexus-breadcrumbs">
        <nav class="breadcrumbs">
          <ul>
            <li><a href="/">Admin</a></li>
            <li>${title}</li>
          </ul>
        </nav>
      </div>

      <div class="nexus-header-actions">
        <div class="nexus-search">
          <svg class="nexus-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" placeholder="Buscar...">
        </div>

        ${NotificationPanel({ notifications, unreadCount: unreadNotificationCount })}

        <button class="nexus-icon-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>
    </header>
  `;
};
