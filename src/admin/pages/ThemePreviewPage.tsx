import { html } from "hono/html";
import { AdminLayout } from "../components/AdminLayout.tsx";
import { env } from "../../config/env.ts";

export interface ThemePreviewPageProps {
  user: {
    name: string | null;
    email: string;
  };
  themeName: string;
  themeDisplayName: string;
  previewUrl: string;
  previewToken: string;
}

export const ThemePreviewPage = (props: ThemePreviewPageProps) => {
  const {
    user,
    themeName,
    themeDisplayName,
    previewUrl,
    previewToken,
  } = props;

  const fullPreviewUrl = `${previewUrl}?theme_preview=1&preview_token=${previewToken}`;

  const content = html`
    <style>
      .preview-container {
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
      }

      .preview-header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .preview-header__info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .preview-header__title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
      }

      .preview-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
      }

      .preview-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .preview-iframe-wrapper {
        flex: 1;
        position: relative;
        overflow: hidden;
      }

      .preview-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
      }

      .preview-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .spinner {
        border: 3px solid #e2e8f0;
        border-top: 3px solid #3b82f6;
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

      .device-selector {
        display: flex;
        gap: 0.5rem;
        background: #f1f5f9;
        padding: 0.25rem;
        border-radius: 0.5rem;
      }

      .device-btn {
        padding: 0.5rem 1rem;
        border: none;
        background: transparent;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: #64748b;
        transition: all 0.2s;
      }

      .device-btn.active {
        background: white;
        color: #1e293b;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }

      .device-btn:hover {
        color: #1e293b;
      }

      .preview-desktop { width: 100%; }
      .preview-tablet { width: 768px; margin: 0 auto; }
      .preview-mobile { width: 375px; margin: 0 auto; }
    </style>

    <div class="preview-container">
      <div class="preview-header">
        <div class="preview-header__info">
          <h1 class="preview-header__title">Vista previa: ${themeDisplayName}</h1>
          <span class="preview-badge">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
            Modo preview
          </span>
        </div>

        <div class="preview-actions">
          <div class="device-selector">
            <button class="device-btn active" onclick="setPreviewSize('desktop')" id="btn-desktop">
              <svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button class="device-btn" onclick="setPreviewSize('tablet')" id="btn-tablet">
              <svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z"/>
              </svg>
            </button>
            <button class="device-btn" onclick="setPreviewSize('mobile')" id="btn-mobile">
              <svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z"/>
              </svg>
            </button>
          </div>

          <button type="button" class="btn-secondary" onclick="reloadPreview()" title="Recargar vista previa">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Recargar
          </button>

          <form method="POST" action="${env.ADMIN_PATH}/appearance/themes/activate">
            <input type="hidden" name="theme" value="${themeName}" />
            <button type="submit" class="btn-action">
              Activar theme
            </button>
          </form>

          <a href="${env.ADMIN_PATH}/appearance/themes/browser" class="btn-secondary">
            Cerrar preview
          </a>
        </div>
      </div>

      <div class="preview-iframe-wrapper">
        <div class="preview-loading" id="loading">
          <div class="spinner"></div>
          <p class="text-gray-600">Cargando preview...</p>
        </div>

        <iframe
          src="${fullPreviewUrl}"
          class="preview-iframe preview-desktop"
          id="preview-frame"
          onload="document.getElementById('loading').style.display='none'"
        ></iframe>
      </div>
    </div>

    <script>
      function setPreviewSize(size) {
        const iframe = document.getElementById('preview-frame');
        const buttons = document.querySelectorAll('.device-btn');

        buttons.forEach(btn => btn.classList.remove('active'));

        if (size === 'desktop') {
          iframe.className = 'preview-iframe preview-desktop';
          document.getElementById('btn-desktop').classList.add('active');
        } else if (size === 'tablet') {
          iframe.className = 'preview-iframe preview-tablet';
          document.getElementById('btn-tablet').classList.add('active');
        } else if (size === 'mobile') {
          iframe.className = 'preview-iframe preview-mobile';
          document.getElementById('btn-mobile').classList.add('active');
        }
      }

      function reloadPreview() {
        const iframe = document.getElementById('preview-frame');
        const loading = document.getElementById('loading');
        loading.style.display = 'block';
        iframe.src = iframe.src;
      }

      // Keyboard shortcut: Ctrl/Cmd + R to reload
      document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
          e.preventDefault();
          reloadPreview();
        }
      });
    </script>
  `;

  return AdminLayout({
    title: `Preview: ${themeDisplayName}`,
    children: content,
    activePage: "appearance.themes",
    user,
  });
};

export default ThemePreviewPage;
