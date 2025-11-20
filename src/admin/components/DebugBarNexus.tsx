import { html } from "hono/html";
import { NexusBadge } from "./NexusComponents.tsx";
import { isProduction } from "../../../config/env.ts";

interface DebugBarNexusProps {
  request: Request;
  response: Response;
  startTime: number;
  memoryUsage: number;
}

export const DebugBarNexus = (props: DebugBarNexusProps) => {
  // No renderizar nada en producción
  if (isProduction) {
    return null;
  }

  const { request, response, startTime, memoryUsage } = props;

  const duration = (performance.now() - startTime).toFixed(2);
  const memory = (memoryUsage / 1024 / 1024).toFixed(2);
  const status = response.status;

  const getStatusType = (): "success" | "warning" | "error" | "info" | "default" => {
    if (status >= 500) return "error";
    if (status >= 400) return "warning";
    if (status >= 300) return "info";
    if (status >= 200) return "success";
    return "default";
  };

  return html`
    <style>
      #nexus-debug-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40px;
        background: var(--nexus-base-200, #eef0f2);
        border-top: 1px solid var(--nexus-base-300, #dcdee0);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1rem;
        font-family: "Inter", sans-serif;
        font-size: 0.8125rem;
        color: var(--nexus-base-content, #1e2328);
        z-index: 9999;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
      }

      [data-theme="dark"] #nexus-debug-bar {
        background: var(--nexus-base-200, #22262a);
        border-top-color: var(--nexus-base-300, #2c3034);
        color: var(--nexus-base-content, #f0f4f8);
      }

      .debug-bar-section {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .debug-bar-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .debug-bar-item svg {
        width: 16px;
        height: 16px;
        opacity: 0.6;
      }

      .debug-bar-item strong {
        font-weight: 600;
      }
    </style>

    <div id="nexus-debug-bar">
      <div class="debug-bar-section">
        <div class="debug-bar-item">
          ${NexusBadge({
            label: `${request.method} ${status}`,
            type: getStatusType(),
            size: "sm",
          })}
          <span>${new URL(request.url).pathname}</span>
        </div>
      </div>

      <div class="debug-bar-section">
        <div class="debug-bar-item" title="Tiempo de respuesta del servidor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <strong>${duration} ms</strong>
        </div>

        <div class="debug-bar-item" title="Uso de memoria del proceso">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <strong>${memory} MB</strong>
        </div>

        <div class="debug-bar-item">
          ${NexusBadge({
            label: "Hono v4",
            type: "info",
            soft: true,
            size: "sm",
          })}
        </div>
      </div>
    </div>
  `;
};

export default DebugBarNexus;