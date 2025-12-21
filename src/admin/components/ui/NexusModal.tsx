import { html, raw } from "hono/html";

export interface NexusModalProps {
    id: string;
    title: string;
    children: any;
    footer?: any;
    size?: "sm" | "md" | "lg" | "xl";
}

export const NexusModal = (props: NexusModalProps) => {
    const { id, title, children, footer, size = "md" } = props;

    return html`
    <dialog id="${id}" class="nexus-modal">
      <div class="nexus-modal-box nexus-modal-${size}">
        <div class="nexus-modal-header">
          <h3 class="nexus-modal-title">${title}</h3>
          <form method="dialog">
            <button class="nexus-modal-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </form>
        </div>
        
        <div class="nexus-modal-body">
          ${children}
        </div>

        ${footer ? html`
          <div class="nexus-modal-footer">
            ${footer}
          </div>
        ` : ''}
      </div>
      <form method="dialog" class="nexus-modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <style>
      .nexus-modal {
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
        position: fixed;
        inset: 0;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        max-width: none;
        max-height: none;
        background-color: transparent;
        color: inherit;
        transition: visibility 0s linear 0.1s, opacity 0.1s;
        z-index: 999;
        display: grid;
        place-items: center;
        border: none;
      }

      .nexus-modal[open] {
        pointer-events: auto;
        visibility: visible;
        opacity: 1;
        transition-delay: 0s;
        background-color: rgba(0, 0, 0, 0.4);
      }

      .nexus-modal-box {
        position: relative;
        background-color: var(--nexus-base-100, #fff);
        border-radius: var(--nexus-radius-lg, 0.75rem);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        width: 90%;
        max-height: 90vh;
      }

      .nexus-modal-sm { max-width: 400px; }
      .nexus-modal-md { max-width: 600px; }
      .nexus-modal-lg { max-width: 800px; }
      .nexus-modal-xl { max-width: 1140px; }

      .nexus-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--nexus-base-200, #eef0f2);
      }

      .nexus-modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
      }

      .nexus-modal-close {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
        transition: opacity 0.2s;
      }

      .nexus-modal-close:hover {
        opacity: 1;
        background-color: var(--nexus-base-200, #eef0f2);
      }

      .nexus-modal-body {
        padding: 1.5rem;
        overflow-y: auto;
      }

      .nexus-modal-footer {
        padding: 1.25rem 1.5rem;
        border-top: 1px solid var(--nexus-base-200, #eef0f2);
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        background-color: var(--nexus-base-100, #fafbfc);
        border-bottom-left-radius: var(--nexus-radius-lg, 0.75rem);
        border-bottom-right-radius: var(--nexus-radius-lg, 0.75rem);
      }

      .nexus-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: -1;
        grid-column-start: 1;
        grid-row-start: 1;
        display: grid;
        align-self: stretch;
        justify-self: stretch;
        color: transparent;
      }
      
      .nexus-modal-backdrop button {
        cursor: default;
      }
    </style>
  `;
};
