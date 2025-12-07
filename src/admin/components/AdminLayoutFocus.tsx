import { html } from "hono/html";
import { env } from "../../config/env.ts";
import { ToastContainer } from "./Toast.tsx";
import { type NotificationItem } from "./NotificationPanel.tsx";
import { FocusStyles } from "./nexus/FocusStyles.tsx";
// import { NexusStyles } from "./nexus/NexusStyles.tsx"; // Removed to prevent style conflict
import { FocusSidebar } from "./nexus/FocusSidebar.tsx";
import { FocusHeader } from "./nexus/FocusHeader.tsx";

interface AdminLayoutFocusProps {
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

export const AdminLayoutFocus = (props: AdminLayoutFocusProps) => {
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
        <title>${title} - Focus Mode</title>
        <!-- Base Admin CSS (compiled Tailwind) -->
        <link rel="stylesheet" href="${adminPath}/assets/css/admin-compiled.css">
        <!-- Focus Mode Overrides -->
        <link rel="stylesheet" href="${adminPath}/assets/css/nexus-focus.css">
        
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        
        <!-- Chart.js for Demo -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

        <!-- NexusStyles removed -->
        ${FocusStyles()}
      </head>
      <body>
        <div class="nexus-layout">
          <!-- Mobile Overlay -->
          <div class="mobile-overlay" id="mobileOverlay" onclick="toggleSidebar()"></div>


          ${FocusSidebar({ activePage, adminPath })}


          <main class="nexus-main" id="mainContent">
            ${FocusHeader({ title, notifications: notifications || [], unreadNotificationCount })}

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
            
            if (window.innerWidth <= 1024) {
              sidebar.classList.toggle('open');
              mobileOverlay.classList.toggle('open');
            } else {
              sidebar.classList.toggle('closed');
              mainContent.classList.toggle('expanded');
            }
          }

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

export default AdminLayoutFocus;
