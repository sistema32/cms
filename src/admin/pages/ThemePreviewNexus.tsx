import { html, raw } from "hono/html";
import AdminLayoutNexus from "../components/AdminLayoutNexus.tsx";
import { NexusCard, NexusButton, NexusBadge } from "../components/nexus/NexusComponents.tsx";
import { env } from "../../config/env.ts";

export interface ThemePreviewNexusPageProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  themeName: string;
  themeDisplayName: string;
  previewUrl: string;
  previewToken: string;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  unreadNotificationCount?: number;
}

export const ThemePreviewNexusPage = (props: ThemePreviewNexusPageProps) => {
  const {
    user,
    themeName,
    themeDisplayName,
    previewUrl,
    previewToken,
    notifications = [],
    unreadNotificationCount = 0,
  } = props;
  const adminPath = env.ADMIN_PATH;

  // XSS safe - escape URL parameters
  const fullPreviewUrl = `${previewUrl}?theme_preview=1&preview_token=${encodeURIComponent(previewToken)}`;

  const content = html`
    <style>
      /* ========== PAGE HEADER ========== */
      .page-header-nexus {
        margin-bottom: 2rem;
      }

      .page-title-nexus {
        font-size: 2rem;
        font-weight: 700;
        color: var(--nexus-base-content, #1e2328);
        letter-spacing: -0.025em;
        margin: 0;
      }

      /* ========== PREVIEW CONTAINER ========== */
      .preview-container {
        position: fixed;
        top: 144px;
        left: 280px;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        background: var(--nexus-base-200);
      }

      @media (max-width: 1024px) {
        .preview-container {
          left: 0;
          top: 132px;
        }
      }

      /* ========== PREVIEW HEADER ========== */
      .preview-header {
        background: var(--nexus-base-100);
        border-bottom: 1px solid var(--nexus-base-300);
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .preview-header__info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .preview-header__title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--nexus-base-content);
      }

      .preview-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      /* ========== DEVICE SELECTOR ========== */
      .device-selector {
        display: flex;
        gap: 0.25rem;
        background: var(--nexus-base-200);
        padding: 0.25rem;
        border-radius: var(--nexus-radius-md);
      }

      .device-btn {
        padding: 0.5rem 0.75rem;
        border: none;
        background: transparent;
        border-radius: var(--nexus-radius-sm);
        cursor: pointer;
        color: var(--nexus-base-content);
        opacity: 0.6;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .device-btn svg {
        width: 1.25rem;
        height: 1.25rem;
      }

      .device-btn.active {
        background: var(--nexus-base-100);
        color: var(--nexus-primary);
        opacity: 1;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .device-btn:hover {
        opacity: 1;
      }

      /* ========== PREVIEW IFRAME ========== */
      .preview-iframe-wrapper {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }

      .preview-iframe {
        border: 1px solid var(--nexus-base-300);
        border-radius: var(--nexus-radius-lg);
        background: var(--nexus-base-100);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
      }

      .preview-desktop {
        width: 100%;
        height: 100%;
      }

      .preview-tablet {
        width: 768px;
        height: 90%;
      }

      .preview-mobile {
        width: 375px;
        height: 85%;
      }

      /* ========== LOADING ========== */
      .preview-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 10;
      }

      .preview-loading.hidden {
        display: none;
      }

      .spinner {
        border: 3px solid var(--nexus-base-300);
        border-top: 3px solid var(--nexus-primary);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>

    <div class="page-header-nexus">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <h1 class="page-title-nexus">Vista previa: ${themeDisplayName}</h1>
      </div>
    </div>

    <div class="preview-container">
      <div class="preview-header">
        <div class="preview-header__info">
          <h2 class="preview-header__title">${themeDisplayName}</h2>
          ${NexusBadge({ label: "Modo preview", type: "info", soft: true })}
        </div>

        <div class="preview-actions">
          <div class="device-selector">
            <button
              class="device-btn active"
              data-device="desktop"
              data-btn-type="device-selector"
              aria-label="Vista desktop"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button
              class="device-btn"
              data-device="tablet"
              data-btn-type="device-selector"
              aria-label="Vista tablet"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z"/>
              </svg>
            </button>
            <button
              class="device-btn"
              data-device="mobile"
              data-btn-type="device-selector"
              aria-label="Vista mobile"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z"/>
              </svg>
            </button>
          </div>

          ${NexusButton({
            label: "Recargar",
            type: "outline",
            size: "sm",
            dataAttributes: { "data-action": "reload-preview" }
          })}

          <form method="POST" action="${adminPath}/appearance/themes/activate">
            <input type="hidden" name="theme" value="${themeName}" />
            ${NexusButton({
              label: "Activar theme",
              type: "primary",
              size: "sm",
              isSubmit: true
            })}
          </form>

          ${NexusButton({
            label: "Cerrar preview",
            type: "outline",
            size: "sm",
            href: `${adminPath}/appearance/themes`
          })}
        </div>
      </div>

      <div class="preview-iframe-wrapper">
        <div class="preview-loading" id="loading">
          <div class="spinner"></div>
          <p style="color: var(--nexus-base-content); opacity: 0.6;">Cargando preview...</p>
        </div>

        <iframe
          src="${fullPreviewUrl}"
          class="preview-iframe preview-desktop"
          id="preview-frame"
          title="Vista previa del tema"
        ></iframe>
      </div>
    </div>

    ${raw(`<script>
      // XSS safe - event handlers in addEventListener
      document.addEventListener('DOMContentLoaded', function() {
        const iframe = document.getElementById('preview-frame');
        const loading = document.getElementById('loading');

        // XSS safe - iframe load handler
        if (iframe) {
          iframe.addEventListener('load', function() {
            if (loading) {
              loading.classList.add('hidden');
            }
          });
        }

        // XSS safe - device selector buttons
        const deviceBtns = document.querySelectorAll('[data-btn-type="device-selector"]');
        deviceBtns.forEach(btn => {
          btn.addEventListener('click', function() {
            const device = this.getAttribute('data-device');
            if (!device || !iframe) return;

            // XSS safe - remove active class from all buttons
            deviceBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // XSS safe - update iframe class
            iframe.className = 'preview-iframe preview-' + device;
          });
        });

        // XSS safe - reload preview button
        const reloadBtn = document.querySelector('[data-action="reload-preview"]');
        if (reloadBtn) {
          reloadBtn.addEventListener('click', function() {
            if (loading && iframe) {
              loading.classList.remove('hidden');
              iframe.src = iframe.src;
            }
          });
        }

        // XSS safe - keyboard shortcut: Ctrl/Cmd + R to reload
        document.addEventListener('keydown', function(e) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (loading && iframe) {
              loading.classList.remove('hidden');
              iframe.src = iframe.src;
            }
          }
        });
      });
    </script>`)}
  `;

  return AdminLayoutNexus({
    title: `Preview: ${themeDisplayName}`,
    children: content,
    activePage: "appearance.themes",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default ThemePreviewNexusPage;
