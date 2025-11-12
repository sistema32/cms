import { html } from "hono/html";
import { TOAST_TIMING, ANIMATION_DURATION } from "../config/timing.ts";

/**
 * Toast Notification Component
 * Displays temporary notification messages (success, error, warning, info)
 */

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number; // ms, 0 = no auto-dismiss
}

export const ToastContainer = () => {
  return html`
    <div
      id="toast-container"
      class="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    ></div>
    <style>
      .admin-toast {
        pointer-events: auto;
        animation: slideInRight ${ANIMATION_DURATION.TOAST_SLIDE}ms ease-out;
        transition: all ${ANIMATION_DURATION.TOAST_SLIDE}ms ease;
      }
      .admin-toast.removing {
        animation: slideOutRight ${ANIMATION_DURATION.TOAST_SLIDE}ms ease-in;
        opacity: 0;
        transform: translateX(100%);
      }
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: currentColor;
        opacity: 0.3;
        transition: width linear;
      }
    </style>
    <script>
      (function() {
        let toastIdCounter = 0;

        // Timing constants injected from server
        const TOAST_TIMING = ${JSON.stringify(TOAST_TIMING)};
        const ANIMATION_DURATION = ${JSON.stringify(ANIMATION_DURATION)};

        // Toast manager
        window.toastManager = {
          show: function(options) {
            const id = options.id || 'toast-' + (++toastIdCounter);
            const type = options.type || 'info';
            const title = options.title || '';
            const message = options.message || '';
            const duration = options.duration !== undefined ? options.duration : TOAST_TIMING.DEFAULT_DURATION;

            this.remove(id); // Remove if exists

            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = this.createToast(id, type, title, message, duration);
            container.appendChild(toast);

            // Auto-dismiss
            if (duration > 0) {
              const progressBar = toast.querySelector('.toast-progress');
              if (progressBar) {
                progressBar.style.width = '100%';
                setTimeout(() => {
                  progressBar.style.width = '0%';
                  progressBar.style.transition = 'width ' + duration + 'ms linear';
                }, 10);
              }

              setTimeout(() => {
                this.remove(id);
              }, duration);
            }

            return id;
          },

          createToast: function(id, type, title, message, duration) {
            const toast = document.createElement('div');
            toast.id = id;
            toast.className = 'admin-toast relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden';
            toast.setAttribute('role', 'alert');

            const colors = {
              success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-l-4 border-green-500', icon: '✓', iconBg: 'bg-green-500' },
              error: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-4 border-red-500', icon: '✕', iconBg: 'bg-red-500' },
              warning: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-l-4 border-orange-500', icon: '⚠', iconBg: 'bg-orange-500' },
              info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-4 border-blue-500', icon: 'ℹ', iconBg: 'bg-blue-500' }
            };

            const color = colors[type] || colors.info;

            toast.innerHTML = \`
              <div class="flex items-start p-4 \${color.bg} \${color.border}">
                <div class="flex-shrink-0">
                  <div class="\${color.iconBg} rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                    \${color.icon}
                  </div>
                </div>
                <div class="ml-3 flex-1">
                  \${title ? \`<p class="text-sm font-semibold text-gray-900 dark:text-gray-100">\${title}</p>\` : ''}
                  <p class="text-sm text-gray-700 dark:text-gray-300 \${title ? 'mt-1' : ''}">\${message}</p>
                </div>
                <button
                  onclick="window.toastManager.remove('\${id}')"
                  class="ml-3 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  aria-label="Close"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
              \${duration > 0 ? \`<div class="toast-progress \${color.iconBg}" style="width: 100%;"></div>\` : ''}
            \`;

            return toast;
          },

          remove: function(id) {
            const toast = document.getElementById(id);
            if (!toast) return;

            toast.classList.add('removing');
            setTimeout(() => {
              if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
              }
            }, ANIMATION_DURATION.TOAST_SLIDE);
          },

          success: function(message, title, duration) {
            return this.show({ type: 'success', title, message, duration });
          },

          error: function(message, title, duration) {
            return this.show({ type: 'error', title, message, duration });
          },

          warning: function(message, title, duration) {
            return this.show({ type: 'warning', title, message, duration });
          },

          info: function(message, title, duration) {
            return this.show({ type: 'info', title, message, duration });
          }
        };

        // Alias for easier access
        window.toast = window.toastManager;

        console.log('Toast manager initialized');
      })();
    </script>
  `;
};

export default ToastContainer;
