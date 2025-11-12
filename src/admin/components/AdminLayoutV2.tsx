import { html } from "hono/html";
import { env } from "../../config/env.ts";
import { ToastContainer } from "./Toast.tsx";
import { NotificationPanel, type NotificationItem } from "./NotificationPanel.tsx";
import { IconSidebar } from "./IconSidebar.tsx";

/**
 * Admin Layout V2 - Xoya Style
 * Minimalist coral sidebar + full-width content
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
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

export const AdminLayoutV2 = (props: AdminLayoutProps) => {
  const {
    title,
    children,
    activePage = "dashboard",
    user,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos Días";
    if (hour < 18) return "Buenas Tardes";
    return "Buenas Noches";
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'Usuario';

  return html`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - LexCMS Admin</title>
        <link rel="stylesheet" href="${adminPath}/assets/css/admin-compiled.css">
        <style>
          /* Xoya-inspired layout */
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          .xoya-layout {
            display: flex;
            min-height: 100vh;
            background: #FFF8F5;
          }

          .dark .xoya-layout {
            background: #0f172a;
          }

          .xoya-main {
            flex: 1;
            margin-left: 70px; /* Sidebar width */
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          .xoya-header {
            height: 80px;
            background: white;
            border-bottom: 1px solid #f3f4f6;
            display: flex;
            align-items: center;
            padding: 0 2rem;
            position: sticky;
            top: 0;
            z-index: 30;
          }

          .dark .xoya-header {
            background: #1e293b;
            border-bottom-color: #334155;
          }

          .xoya-greeting {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
          }

          .dark .xoya-greeting {
            color: #f3f4f6;
          }

          .xoya-greeting-name {
            color: #FF7F5C;
          }

          .xoya-header-actions {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .xoya-search {
            width: 400px;
            max-width: 40vw;
            margin: 0 auto;
          }

          .xoya-search input {
            width: 100%;
            padding: 0.625rem 1rem 0.625rem 2.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            font-size: 0.875rem;
            transition: all 0.2s;
            background: #f9fafb;
          }

          .xoya-search input:focus {
            outline: none;
            border-color: #FF7F5C;
            background: white;
            box-shadow: 0 0 0 3px rgba(255, 127, 92, 0.1);
          }

          .dark .xoya-search input {
            background: #0f172a;
            border-color: #334155;
            color: #f3f4f6;
          }

          .dark .xoya-search input:focus {
            background: #1e293b;
            border-color: #FF7F5C;
          }

          .xoya-content {
            flex: 1;
            padding: 2rem;
            max-width: 1600px;
            margin: 0 auto;
            width: 100%;
          }

          @media (max-width: 768px) {
            .xoya-content {
              padding: 1rem;
            }

            .xoya-header {
              padding: 0 1rem;
            }

            .xoya-search {
              display: none;
            }
          }

          /* Buttons */
          .btn-icon-circle {
            display: inline-flex;
            align-items: center;
            justify-center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: transparent;
            border: 2px solid #e5e7eb;
            color: #6b7280;
            transition: all 0.2s;
            cursor: pointer;
          }

          .btn-icon-circle:hover {
            border-color: #FF7F5C;
            color: #FF7F5C;
            background: rgba(255, 127, 92, 0.05);
          }

          .dark .btn-icon-circle {
            border-color: #374151;
            color: #9ca3af;
          }

          .dark .btn-icon-circle:hover {
            border-color: #FF7F5C;
            color: #FF7F5C;
          }

          /* Profile dropdown */
          .profile-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem;
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .profile-btn:hover {
            background: #f3f4f6;
          }

          .dark .profile-btn:hover {
            background: #374151;
          }

          .profile-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #FF7F5C;
          }

          .profile-dropdown {
            position: absolute;
            right: 0;
            top: 100%;
            margin-top: 0.5rem;
            min-width: 200px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 0.5rem;
            z-index: 50;
          }

          .dark .profile-dropdown {
            background: #1e293b;
            border: 1px solid #334155;
          }

          .profile-dropdown a,
          .profile-dropdown button {
            display: block;
            width: 100%;
            text-align: left;
            padding: 0.625rem 0.75rem;
            font-size: 0.875rem;
            color: #374151;
            border-radius: 8px;
            transition: background 0.2s;
            border: none;
            background: none;
            cursor: pointer;
          }

          .profile-dropdown a:hover,
          .profile-dropdown button:hover {
            background: #f3f4f6;
          }

          .dark .profile-dropdown a,
          .dark .profile-dropdown button {
            color: #e5e7eb;
          }

          .dark .profile-dropdown a:hover,
          .dark .profile-dropdown button:hover {
            background: #334155;
          }

          .profile-dropdown .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 0.5rem 0;
          }

          .dark .profile-dropdown .divider {
            background: #334155;
          }

          /* ===== SIDEBAR STYLES ===== */

          /* Coral color palette */
          .bg-coral-500 { background-color: #FF7F5C; }
          .bg-coral-600 { background-color: #FF6347; }
          .hover\\:bg-coral-600\\/80:hover { background-color: rgba(255, 99, 71, 0.8); }
          .text-coral-600 { color: #FF6347; }
          .bg-coral-50 { background-color: #FFF5F3; }
          .border-coral-500 { border-color: #FF7F5C; }
          .border-coral-600 { border-color: #FF6347; }
          .dark .bg-coral-900\\/20 { background-color: rgba(180, 50, 30, 0.2); }

          /* Sidebar styles */
          .icon-sidebar {
            box-shadow: 4px 0 24px rgba(255, 127, 92, 0.15);
          }

          /* Tooltip */
          .sidebar-tooltip {
            position: absolute;
            left: 80px;
            background: #1f2937;
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.2s ease;
            z-index: 100;
          }

          .sidebar-tooltip::before {
            content: '';
            position: absolute;
            left: -4px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-right: 6px solid #1f2937;
          }

          .sidebar-nav-btn:hover .sidebar-tooltip {
            opacity: 1;
            transform: translateX(0);
          }

          /* Accordion panel */
          .accordion-panel {
            animation: slideIn 0.2s ease;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .accordion-item {
            position: relative;
          }

          .accordion-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #FF7F5C;
            opacity: 0;
            transition: opacity 0.2s;
          }

          .accordion-item.text-coral-600::before {
            opacity: 1;
          }

          /* Hide scrollbar */
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          /* Active indicator */
          .bg-coral-600 {
            position: relative;
          }

          .bg-coral-600::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 60%;
            background: white;
            border-radius: 0 4px 4px 0;
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
        <div class="xoya-layout">
          <!-- Icon Sidebar -->
          ${IconSidebar({ activePage, adminPath })}

          <!-- Main Content Area -->
          <div class="xoya-main">
            <!-- Header -->
            <header class="xoya-header">
              <!-- Greeting -->
              <h1 class="xoya-greeting">
                ${getGreeting()} <span class="xoya-greeting-name">${userName}!</span>
              </h1>

              <!-- Search Bar (center) -->
              <div class="xoya-search">
                <div class="relative">
                  <svg
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    aria-label="Buscar"
                  />
                </div>
              </div>

              <!-- Header Actions -->
              <div class="xoya-header-actions">
                <!-- Theme Toggle -->
                <button
                  class="btn-icon-circle"
                  onclick="toggleTheme()"
                  aria-label="Toggle theme"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </button>

                <!-- Notifications -->
                ${NotificationPanel({ adminPath, notifications, unreadCount: unreadNotificationCount })}

                <!-- Profile -->
                <div class="relative">
                  <button
                    class="profile-btn"
                    onclick="toggleProfileMenu()"
                    aria-label="Profile menu"
                  >
                    <img
                      class="profile-avatar"
                      src="${user?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(userName)}"
                      alt="${userName}"
                    />
                  </button>

                  <div id="profileMenu" class="hidden profile-dropdown">
                    <a href="${adminPath}/profile">Mi Perfil</a>
                    <a href="${adminPath}/settings">Configuración</a>
                    <div class="divider"></div>
                    <form method="POST" action="${adminPath}/logout">
                      <button type="submit">Cerrar Sesión</button>
                    </form>
                  </div>
                </div>
              </div>
            </header>

            <!-- Main Content -->
            <main class="xoya-content">
              ${children}
            </main>
          </div>
        </div>

        <!-- Toast Notifications -->
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
            const menu = document.getElementById('profileMenu');
            menu?.classList.toggle('hidden');
          }

          // Close dropdowns when clicking outside
          document.addEventListener('click', function(event) {
            const profileMenu = document.getElementById('profileMenu');
            const profileBtn = event.target.closest('.profile-btn');

            if (!profileBtn && profileMenu && !profileMenu.contains(event.target)) {
              profileMenu.classList.add('hidden');
            }
          });

          // ===== ACCORDION FUNCTIONALITY =====

          // Accordion toggle functionality
          function toggleAccordion(itemId) {
            const panel = document.getElementById('accordion-' + itemId);
            const button = document.querySelector('[onclick="toggleAccordion(\\'' + itemId + '\\')"]');

            if (!panel) return;

            // Close all other accordions
            document.querySelectorAll('.accordion-panel').forEach(p => {
              if (p.id !== 'accordion-' + itemId) {
                p.classList.add('hidden');
                const otherButton = document.querySelector('[aria-controls="' + p.id + '"]');
                if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
              }
            });

            // Toggle current accordion
            const isHidden = panel.classList.contains('hidden');
            panel.classList.toggle('hidden');
            if (button) {
              button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
            }
          }

          // Close accordion when clicking outside
          document.addEventListener('click', function(e) {
            const sidebar = document.querySelector('.icon-sidebar');
            const accordions = document.querySelectorAll('.accordion-panel');

            if (!sidebar?.contains(e.target)) {
              accordions.forEach(panel => {
                panel.classList.add('hidden');
              });

              document.querySelectorAll('[aria-expanded="true"]').forEach(btn => {
                btn.setAttribute('aria-expanded', 'false');
              });
            }
          });

          // Close on ESC key
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              document.querySelectorAll('.accordion-panel').forEach(panel => {
                panel.classList.add('hidden');
              });
            }
          });
        </script>
      </body>
    </html>
  `;
};

export default AdminLayoutV2;
