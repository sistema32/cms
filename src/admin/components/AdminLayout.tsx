import { html, raw } from "hono/html";
import { env } from "../../config/env.ts";
import { ToastContainer } from "./Toast.tsx";
import { NotificationPanel, type NotificationItem } from "./NotificationPanel.tsx";
import { CSS_VARIABLES } from "../config/colors.ts";
import { ROUTES, getAdminAsset } from "../config/routes.ts";

/**
 * Admin Layout Component - Mosaic Design System
 * Updated to use 100% DaisyUI native components
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
  label: string;
  path: string;
  availableTag?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
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

  // Build plugin panel navigation items
  const pluginPanelItems: NavItem[] = pluginPanels.map(panel => ({
    id: `plugin.${panel.pluginName}.${panel.id}`,
    label: panel.title,
    path: `/plugins/${panel.pluginName}/${panel.path}`,
  }));

  // Consolidated navigation structure
  const navSections: NavSection[] = [
    {
      title: "Contenido",
      items: [
        { id: "content.posts", label: "Entradas", path: `/${ROUTES.POSTS}` },
        { id: "content.pages", label: "Páginas", path: `/${ROUTES.PAGES}` },
        { id: "content.categories", label: "Categorías", path: `/${ROUTES.CATEGORIES}` },
        { id: "content.tags", label: "Tags", path: `/${ROUTES.TAGS}` },
        { id: "content.comments", label: "Comentarios", path: `/${ROUTES.COMMENTS}` },
        { id: "content.media", label: "Medios", path: `/${ROUTES.MEDIA}` },
      ],
    },
    {
      title: "Control de Acceso",
      items: [
        { id: "access.users", label: "Usuarios", path: `/${ROUTES.USERS}` },
        { id: "access.roles", label: "Roles", path: `/${ROUTES.ROLES}` },
        { id: "access.permissions", label: "Permisos", path: `/${ROUTES.PERMISSIONS}` },
      ],
    },
    {
      title: "Apariencia",
      items: [
        { id: "appearance.themes", label: "Themes", path: `/${ROUTES.THEMES}` },
        { id: "appearance.menus", label: "Menús", path: `/${ROUTES.MENUS}` },
      ],
    },
    {
      title: "Plugins",
      items: [
        { id: "plugins.all", label: "Todos los Plugins", path: `/${ROUTES.PLUGINS}` },
        ...pluginPanelItems,
      ],
    },
    {
      title: "Sistema",
      items: [
        { id: "system.backups", label: "Backups", path: "/backups" },
        { id: "system.updates", label: "Actualizaciones", path: "/system-updates" },
      ],
    },
    {
      title: "Configuración",
      items: [
        { id: "settings.general", label: "General", path: `/${ROUTES.SETTINGS_GENERAL}` },
        { id: "settings.reading", label: "Lectura", path: `/${ROUTES.SETTINGS_READING}` },
        { id: "settings.writing", label: "Escritura", path: `/${ROUTES.SETTINGS_WRITING}` },
        { id: "settings.discussion", label: "Comentarios", path: `/${ROUTES.SETTINGS_DISCUSSION}` },
        { id: "settings.media", label: "Medios", path: `/${ROUTES.SETTINGS_MEDIA}` },
        { id: "settings.seo", label: "SEO", path: `/${ROUTES.SETTINGS_SEO}` },
        { id: "settings.advanced", label: "Avanzado", path: `/${ROUTES.SETTINGS_ADVANCED}` },
      ].map(item => ({
        ...item,
        availableTag: settingsAvailability[item.id] === false ? "Sin datos" : undefined,
      })),
    },
  ];

  return html`
    <!DOCTYPE html>
    <html lang="es" data-theme="light">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - LexCMS Admin</title>
        <script>
          // Dark mode initialization - must run BEFORE page renders to prevent flash
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }

          /* Mosaic color palette */
          :root {
            --violet-500: ${CSS_VARIABLES['--violet-500']};
            --violet-600: ${CSS_VARIABLES['--violet-600']};
          }

          /* Custom scrollbar for sidebar */
          .menu-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .menu-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .menu-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
          }
          .dark .menu-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
          }
        </style>
      </head>
      <body class="antialiased">

        <!-- DaisyUI Drawer Layout -->
        <div class="drawer lg:drawer-open">
          <input id="admin-drawer" type="checkbox" class="drawer-toggle" />

          <!-- Page Content -->
          <div class="drawer-content flex flex-col">

            <!-- Navbar (Header) -->
            <div class="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30 backdrop-blur-md bg-base-100/90">
              <div class="flex-none lg:hidden">
                <label for="admin-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </label>
              </div>

              <div class="flex-1"></div>

              <div class="flex-none gap-2">

                <!-- Theme Toggle (DaisyUI Swap) -->
                <label class="swap swap-rotate btn btn-ghost btn-circle">
                  <input type="checkbox" class="theme-controller" value="dark" />

                  <!-- Sun icon -->
                  <svg class="swap-off fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
                  </svg>

                  <!-- Moon icon -->
                  <svg class="swap-on fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
                  </svg>
                </label>

                <!-- Notifications Dropdown -->
                ${NotificationPanel({ adminPath, notifications, unreadCount: unreadNotificationCount })}

                <!-- Divider -->
                <div class="divider divider-horizontal mx-0"></div>

                <!-- User Menu Dropdown -->
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-ghost gap-2">
                    <div class="avatar placeholder">
                      <div class="bg-primary text-primary-content w-8 rounded-full">
                        <span class="text-xs">${(user?.name || user?.email || 'U').substring(0, 2).toUpperCase()}</span>
                      </div>
                    </div>
                    <span class="hidden sm:inline-block text-sm">${user?.name || user?.email}</span>
                    <svg class="w-3 h-3 fill-current opacity-60" viewBox="0 0 12 12">
                      <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                    </svg>
                  </div>
                  <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300">
                    <li>
                      <a href="${adminPath}/profile">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                        </svg>
                        Mi Perfil
                      </a>
                    </li>
                    <li>
                      <a href="${adminPath}/settings">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                        </svg>
                        Configuración
                      </a>
                    </li>
                    <div class="divider my-0"></div>
                    <li>
                      <a href="${adminPath}/logout" class="text-error">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
                        </svg>
                        Cerrar Sesión
                      </a>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            <!-- Main Content -->
            <main class="flex-1 p-4 sm:p-6 lg:p-8">
              ${children}
            </main>

          </div>

          <!-- Sidebar (Drawer Side) -->
          <div class="drawer-side z-40">
            <label for="admin-drawer" aria-label="close sidebar" class="drawer-overlay"></label>

            <aside class="bg-base-100 min-h-full w-64 flex flex-col">

              <!-- Logo -->
              <div class="p-4 mb-4">
                <a href="${adminPath}/" class="flex items-center justify-center">
                  <svg class="fill-primary" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                  </svg>
                </a>
              </div>

              <!-- Navigation Menu -->
              <div class="flex-1 overflow-y-auto menu-scrollbar">
                <ul class="menu menu-sm px-4 gap-1">

                  <!-- Dashboard -->
                  <li class="menu-title opacity-60">
                    <span>Principal</span>
                  </li>
                  <li>
                    <a href="${adminPath}/" class="${activePage === 'dashboard' ? 'active' : ''}">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.936.278A7.983 7.983 0 0 1 8 0a8 8 0 1 1-8 8c0-.722.104-1.413.278-2.064a1 1 0 1 1 1.932.516A5.99 5.99 0 0 0 2 8a6 6 0 1 0 6-6c-.53 0-1.045.076-1.548.21A1 1 0 1 1 5.936.278Z" />
                        <path d="M6.068 7.482A2.003 2.003 0 0 0 8 10a2 2 0 1 0-.518-3.932L3.707 2.293a1 1 0 0 0-1.414 1.414l3.775 3.775Z" />
                      </svg>
                      Dashboard
                    </a>
                  </li>

                  ${raw(navSections.map(section => renderNavSection(section, activePage, adminPath)).join(''))}

                </ul>
              </div>

            </aside>
          </div>

        </div>

        ${ToastContainer()}

        <script>
          // Sync theme toggle with current theme on load
          (function() {
            const isDark = document.documentElement.classList.contains('dark');
            const themeToggle = document.querySelector('.theme-controller');
            if (themeToggle) {
              themeToggle.checked = isDark;
            }
          })();

          // Theme toggle handler
          document.addEventListener('DOMContentLoaded', function() {
            const themeToggle = document.querySelector('.theme-controller');
            if (themeToggle) {
              themeToggle.addEventListener('change', function(e) {
                const html = document.documentElement;
                if (e.target.checked) {
                  html.classList.add('dark');
                  html.setAttribute('data-theme', 'dark');
                  localStorage.setItem('theme', 'dark');
                } else {
                  html.classList.remove('dark');
                  html.setAttribute('data-theme', 'light');
                  localStorage.setItem('theme', 'light');
                }
              });
            }
          });
        </script>

      </body>
    </html>
  `;
};

// Render navigation section with DaisyUI Menu
function renderNavSection(section: NavSection, activePage: string, adminPath: string): string {
  return `
    <li class="menu-title opacity-60 mt-4">
      <span>${section.title}</span>
    </li>
    ${section.items.map(item => renderNavItem(item, activePage, adminPath)).join('')}
  `;
}

// Render navigation item with DaisyUI Menu item
function renderNavItem(item: NavItem, activePage: string, adminPath: string): string {
  const isActive = activePage === item.id;
  const fullPath = adminPath + item.path;
  const icon = ICON_MAP[item.label] || ICON_MAP.default;

  return `
    <li>
      <a href="${fullPath}" class="${isActive ? 'active' : ''}">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="${icon}"></path>
        </svg>
        <span>${item.label}</span>
        ${item.availableTag ? `<span class="badge badge-warning badge-xs">${item.availableTag}</span>` : ''}
      </a>
    </li>
  `;
}

// Icon mapping (simplified)
const ICON_MAP: Record<string, string> = {
  'Entradas': 'M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M19,9V11H17V9H19M15,9V11H13V9H15M11,9V11H9V9H11M7,9V11H5V9H7M19,13V15H17V13H19M15,13V15H13V13H15M11,13V15H9V13H11M7,13V15H5V13H7M19,17V19H17V17H19M15,17V19H13V17H15M11,17V19H9V17H11M7,17V19H5V17H7Z',
  'Páginas': 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z',
  'Categorías': 'M4,12V20H20V12H4M3,11H21L19,9H5L3,11M5,3H19V8H5V3M10,7H14V5H10V7Z',
  'Tags': 'M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.77,14.05 22,13.55 22,13C22,12.45 21.77,11.95 21.41,11.58Z',
  'Comentarios': 'M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z',
  'Medios': 'M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M12,7L17,12H14V16H10V12H7L12,7Z',
  'Usuarios': 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z',
  'Roles': 'M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.1 14.8,9.5V11C14.8,12.1 14.4,12.5 13.5,12.5H10.5C9.6,12.5 9.2,12.1 9.2,11V9.5C9.2,8.1 10.6,7 12,7M9,13H15V15H9V13Z',
  'Permisos': 'M12,1A9,9 0 0,0 3,10V17A9,9 0 0,0 12,26A9,9 0 0,0 21,17V10A9,9 0 0,0 12,1M12,3A7,7 0 0,1 19,10V17A7,7 0 0,1 12,24A7,7 0 0,1 5,17V10A7,7 0 0,1 12,3M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z',
  'Themes': 'M12,3C7.03,3 3,7.03 3,12C3,16.97 7.03,21 12,21C16.97,21 21,16.97 21,12C21,7.03 16.97,3 12,3M12,5C15.31,5 18,7.69 18,11C18,12.9 17.09,14.58 15.66,15.72L15.41,15.5L14,16.92L12.59,15.5L12.34,15.72C10.91,14.58 10,12.9 10,11C10,7.69 12.69,5 16,5V5Z',
  'Menús': 'M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z',
  'Todos los Plugins': 'M20.5,11H19V7C19,5.89 18.1,5 17,5H13V3.5A2.5,2.5 0 0,0 10.5,1A2.5,2.5 0 0,0 8,3.5V5H4A2,2 0 0,0 2,7V10.8H3.5C5,10.8 6.2,12 6.2,13.5C6.2,15 5,16.2 3.5,16.2H2V20A2,2 0 0,0 4,22H7.8V20.5C7.8,19 9,17.8 10.5,17.8C12,17.8 13.2,19 13.2,20.5V22H17A2,2 0 0,0 19,20V16H20.5A2.5,2.5 0 0,0 23,13.5A2.5,2.5 0 0,0 20.5,11Z',
  'Backups': 'M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M6.12,15.5L9.86,19.24L11.28,17.83L8.95,15.5L11.28,13.17L9.86,11.76L6.12,15.5M17.28,15.5L13.54,11.76L12.12,13.17L14.45,15.5L12.12,17.83L13.54,19.24L17.28,15.5Z',
  'Actualizaciones': 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6Z',
  'General': 'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
  'Lectura': 'M18,2A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H18M18,4H13V12L10.5,9.75L8,12V4H6V20H18V4Z',
  'Escritura': 'M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M2,20.27L4.25,18H6.75L2,20.27Z',
  'SEO': 'M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17Z',
  'Avanzado': 'M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,2L14.33,6.5L19,7.67L15.5,11L16.67,15.67L12,13.33L7.33,15.67L8.5,11L5,7.67L9.67,6.5L12,2Z',
  'default': 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z',
};

export default AdminLayout;
