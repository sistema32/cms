import { html } from "hono/html";
import { ANIMATION_DURATION } from "../config/timing.ts";

/**
 * Toast Notification Component
 * Displays temporary notification messages (success, error, warning, info)
 * NOTE: Toast manager logic is now in /public/admin/toast-manager.js
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
  `;
};

export default ToastContainer;
