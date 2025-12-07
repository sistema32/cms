import { html } from "hono/html";
import { NotificationPanel, type NotificationItem } from "../NotificationPanel.tsx";

interface FocusHeaderProps {
  title: string;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
}

export const FocusHeader = ({ title, notifications, unreadNotificationCount }: FocusHeaderProps) => {
  return html`
    <header class="nexus-header focus-header">
      <button class="mobile-menu-btn" onclick="toggleSidebar()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <div class="flex items-center gap-4 flex-1">
         <h2 class="text-lg font-semibold text-gray-800">${title}</h2>
      </div>

      <div class="flex items-center gap-4">
        <div class="nexus-search focus-search hidden md:block w-64">
           <div class="relative">
              <input type="text" placeholder="Search..." class="w-full pl-10 pr-4 py-2 text-sm">
              <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           </div>
        </div>

        <button class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        </button>
      </div>
    </header>
  `;
};
