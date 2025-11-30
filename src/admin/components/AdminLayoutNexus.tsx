import { html } from "hono/html";
import { env, isDevelopment } from "../../config/env.ts";
import { ToastContainer } from "./Toast.tsx";
import { type NotificationItem } from "./NotificationPanel.tsx";
import { NexusStyles } from "./nexus/NexusStyles.tsx";
import { NexusSidebar } from "./nexus/NexusSidebar.tsx";
import { NexusHeader } from "./nexus/NexusHeader.tsx";

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
}

export const AdminLayoutNexus = (props: AdminLayoutNexusProps) => {
  const {
    title,
    children,
    activePage = "dashboard",
    user,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

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
        ${NexusStyles()}
      </head>
      <body>
        <div class="nexus-layout">
          <!-- Mobile Overlay -->
          <div class="mobile-overlay" id="mobileOverlay" onclick="toggleSidebar()"></div>

          ${NexusSidebar({ activePage, adminPath })}

          <main class="nexus-main" id="mainContent">
            ${NexusHeader({ title, user, notifications, unreadNotificationCount })}

            <div class="nexus-content">
              ${children}
            </div>
          </main>
        </div>

        ${ToastContainer()}

        <script>
          function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            const mobileOverlay = document.getElementById('mobileOverlay');
            
            // Mobile behavior
            if (window.innerWidth <= 1024) {
              sidebar.classList.toggle('open');
              mobileOverlay.classList.toggle('open');
            } else {
              // Desktop behavior
              sidebar.classList.toggle('closed');
              mainContent.classList.toggle('expanded');
            }
          }

          // Close sidebar on mobile when clicking a link
          document.querySelectorAll('.nexus-sidebar-nav a').forEach(link => {
            link.addEventListener('click', () => {
              if (window.innerWidth <= 1024) {
                const sidebar = document.getElementById('sidebar');
                const mobileOverlay = document.getElementById('mobileOverlay');
                sidebar.classList.remove('open');
                mobileOverlay.classList.remove('open');
              }
            });
          });
        </script>
      </body>
    </html>
  `;
};

export default AdminLayoutNexus;
