import { html, raw } from "hono/html";
import { env } from "../../config/env.ts";
import { ToastContainer } from "./Toast.tsx";
import { NotificationPanel, type NotificationItem } from "./NotificationPanel.tsx";
import { CSS_VARIABLES } from "../config/colors.ts";
import { ROUTES, getAdminAsset } from "../config/routes.ts";

/**
 * Admin Layout Component - Mosaic Design System
 * Optimized and simplified version
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
  } = props;
  const adminPath = env.ADMIN_PATH;

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
      ],
    },
    {
      title: "Sistema",
      items: [
        { id: "system.backups", label: "Backups", path: "/backups" },
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
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          /* Mosaic color palette */
          :root {
            --violet-500: ${CSS_VARIABLES['--violet-500']};
            --violet-600: ${CSS_VARIABLES['--violet-600']};
          }
        </style>
      </head>
      <body class="antialiased bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">

        <div class="flex h-screen overflow-hidden">

          <!-- Sidebar -->
          <aside class="flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-auto no-scrollbar w-64 shrink-0 bg-white dark:bg-gray-800 rounded-r-2xl shadow-sm p-4 transition-all duration-200">

            <!-- Logo -->
            <div class="flex justify-between mb-10 pr-3 sm:px-2">
              <a href="${adminPath}/" class="block">
                <svg class="fill-violet-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                  <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                </svg>
              </a>
            </div>

            <!-- Navigation -->
            <div class="space-y-8">

              <!-- Dashboard -->
              <div>
                <h3 class="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3 mb-3">Principal</h3>
                <ul class="space-y-1">
                  <li>
                    <a href="${adminPath}/" class="block text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white truncate transition duration-150 ${activePage === 'dashboard' ? 'text-violet-500' : ''}">
                      <div class="flex items-center">
                        <svg class="shrink-0 fill-current ${activePage === 'dashboard' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                          <path d="M5.936.278A7.983 7.983 0 0 1 8 0a8 8 0 1 1-8 8c0-.722.104-1.413.278-2.064a1 1 0 1 1 1.932.516A5.99 5.99 0 0 0 2 8a6 6 0 1 0 6-6c-.53 0-1.045.076-1.548.21A1 1 0 1 1 5.936.278Z" />
                          <path d="M6.068 7.482A2.003 2.003 0 0 0 8 10a2 2 0 1 0-.518-3.932L3.707 2.293a1 1 0 0 0-1.414 1.414l3.775 3.775Z" />
                        </svg>
                        <span class="text-sm font-medium ml-4">Dashboard</span>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>

              <!-- Dynamic Sections -->
              ${raw(navSections.map(section => renderNavSection(section, activePage, adminPath)).join(''))}

            </div>
          </aside>

          <!-- Content Area -->
          <div class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

            <!-- Header -->
            <header class="sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md before:bg-white/90 dark:before:bg-gray-800/90 before:-z-10 z-30 border-b border-gray-200 dark:border-gray-700/60">
              <div class="px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                  <div class="flex"></div>
                  <div class="flex items-center space-x-3">

                    <!-- Theme Toggle -->
                    <button class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full" onclick="toggleDarkMode()">
                      <svg class="fill-current text-gray-500/80 dark:text-gray-400/80" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M7 0h2v2H7V0Zm5.88 1.637 1.414 1.415-1.415 1.413-1.414-1.414 1.415-1.414ZM14 7h2v2h-2V7Zm-1.05 7.433-1.415-1.414 1.414-1.414 1.415 1.413-1.414 1.415ZM7 14h2v2H7v-2Zm-4.02.363L1.566 12.95l1.415-1.414 1.414 1.415-1.415 1.413ZM0 7h2v2H0V7Zm3.05-5.293L4.465 3.12 3.05 4.535 1.636 3.121 3.05 1.707Z" />
                      </svg>
                    </button>

                    <!-- Notifications -->
                    ${NotificationPanel({ adminPath, notifications, unreadCount: unreadNotificationCount })}

                    <!-- Divider -->
                    <hr class="w-px h-6 bg-gray-200 dark:bg-gray-700/60 border-none" />

                    <!-- User Menu -->
                    <div class="relative inline-flex">
                      <button class="inline-flex justify-center items-center group">
                        <div class="flex items-center truncate">
                          <span class="truncate ml-2 text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200">${user?.name || user?.email}</span>
                          <svg class="w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500" viewBox="0 0 12 12">
                            <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                          </svg>
                        </div>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </header>

            <!-- Main Content -->
            <main class="grow">
              <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
                ${children}
              </div>
            </main>

          </div>

        </div>

        ${ToastContainer()}

        <script>
          // Dark mode toggle function
          function toggleDarkMode() {
            const html = document.documentElement;
            if (html.classList.contains('dark')) {
              html.classList.remove('dark');
              html.setAttribute('data-theme', 'light');
              localStorage.setItem('theme', 'light');
            } else {
              html.classList.add('dark');
              html.setAttribute('data-theme', 'dark');
              localStorage.setItem('theme', 'dark');
            }
          }
        </script>

      </body>
    </html>
  `;
};

// Render navigation section
function renderNavSection(section: NavSection, activePage: string, adminPath: string): string {
  return `
    <div>
      <h3 class="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3 mb-3">${section.title}</h3>
      <ul class="space-y-1">
        ${section.items.map(item => renderNavItem(item, activePage, adminPath)).join('')}
      </ul>
    </div>
  `;
}

// Render navigation item
function renderNavItem(item: NavItem, activePage: string, adminPath: string): string {
  const isActive = activePage === item.id;
  const fullPath = adminPath + item.path;
  const icon = ICON_MAP[item.label] || ICON_MAP.default;

  return `
    <li>
      <a href="${fullPath}" class="block transition duration-150 truncate ${isActive ? 'text-violet-500' : 'text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}">
        <div class="flex items-center">
          <svg class="shrink-0 fill-current ${isActive ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="${icon}"></path>
          </svg>
          <span class="text-sm font-medium ml-4">${item.label}</span>
          ${item.availableTag ? `<span class="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-700 rounded-full ml-auto">${item.availableTag}</span>` : ''}
        </div>
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
  'Medios': 'M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M12,7L17,12H14V16H10V12H7L12,7Z',
  'Usuarios': 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z',
  'Roles': 'M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.1 14.8,9.5V11C14.8,12.1 14.4,12.5 13.5,12.5H10.5C9.6,12.5 9.2,12.1 9.2,11V9.5C9.2,8.1 10.6,7 12,7M9,13H15V15H9V13Z',
  'Permisos': 'M12,1A9,9 0 0,0 3,10V17A9,9 0 0,0 12,26A9,9 0 0,0 21,17V10A9,9 0 0,0 12,1M12,3A7,7 0 0,1 19,10V17A7,7 0 0,1 12,24A7,7 0 0,1 5,17V10A7,7 0 0,1 12,3M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z',
  'Themes': 'M12,3C7.03,3 3,7.03 3,12C3,16.97 7.03,21 12,21C16.97,21 21,16.97 21,12C21,7.03 16.97,3 12,3M12,5C15.31,5 18,7.69 18,11C18,12.9 17.09,14.58 15.66,15.72L15.41,15.5L14,16.92L12.59,15.5L12.34,15.72C10.91,14.58 10,12.9 10,11C10,7.69 12.69,5 16,5V5Z',
  'Menús': 'M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z',
  'Todos los Plugins': 'M20.5,11H19V7C19,5.89 18.1,5 17,5H13V3.5A2.5,2.5 0 0,0 10.5,1A2.5,2.5 0 0,0 8,3.5V5H4A2,2 0 0,0 2,7V10.8H3.5C5,10.8 6.2,12 6.2,13.5C6.2,15 5,16.2 3.5,16.2H2V20A2,2 0 0,0 4,22H7.8V20.5C7.8,19 9,17.8 10.5,17.8C12,17.8 13.2,19 13.2,20.5V22H17A2,2 0 0,0 19,20V16H20.5A2.5,2.5 0 0,0 23,13.5A2.5,2.5 0 0,0 20.5,11Z',
  'Backups': 'M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M6.12,15.5L9.86,19.24L11.28,17.83L8.95,15.5L11.28,13.17L9.86,11.76L6.12,15.5M17.28,15.5L13.54,11.76L12.12,13.17L14.45,15.5L12.12,17.83L13.54,19.24L17.28,15.5Z',
  'General': 'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
  'Lectura': 'M18,2A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H18M18,4H13V12L10.5,9.75L8,12V4H6V20H18V4Z',
  'Escritura': 'M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M2,20.27L4.25,18H6.75L2,20.27Z',
  'Comentarios': 'M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z',
  'SEO': 'M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17Z',
  'Avanzado': 'M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,2L14.33,6.5L19,7.67L15.5,11L16.67,15.67L12,13.33L7.33,15.67L8.5,11L5,7.67L9.67,6.5L12,2Z',
  'default': 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z',
};

export default AdminLayout;
