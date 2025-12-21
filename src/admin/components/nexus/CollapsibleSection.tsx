import { html, raw } from "hono/html";

export interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: string;
  children: unknown;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection = (props: CollapsibleSectionProps) => {
  const {
    id,
    title,
    icon,
    children,
    defaultOpen = false,
    className = "",
  } = props;

  const sectionId = `collapsible-${id}`;
  const storageKey = `collapsible-state-${id}`;

  return html`
    <div class="nexus-collapsible ${className}" data-collapsible-id="${id}">
      <button
        type="button"
        class="nexus-collapsible-header"
        data-collapsible-toggle="${id}"
        aria-expanded="${defaultOpen}"
        aria-controls="${sectionId}"
      >
        <div class="nexus-collapsible-title">
          ${icon ? html`<span class="nexus-collapsible-icon">${raw(icon)}</span>` : ''}
          <span>${title}</span>
        </div>
        <svg
          class="nexus-collapsible-chevron"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div
        id="${sectionId}"
        class="nexus-collapsible-content ${defaultOpen ? 'open' : ''}"
        style="display: ${defaultOpen ? 'block' : 'none'};"
      >
        <div class="nexus-collapsible-body">
          ${children}
        </div>
      </div>
    </div>

    <style>
      .nexus-collapsible {
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .nexus-collapsible-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .nexus-collapsible-header:hover {
        background: var(--nexus-base-100, #fafbfc);
      }

      .nexus-collapsible-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
      }

      .nexus-collapsible-icon {
        display: inline-flex;
        font-size: 1.25rem;
      }

      .nexus-collapsible-chevron {
        transition: transform 0.3s ease;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.5;
      }

      .nexus-collapsible-header[aria-expanded="true"] .nexus-collapsible-chevron {
        transform: rotate(180deg);
      }

      .nexus-collapsible-content {
        transition: all 0.3s ease-in-out;
        overflow: hidden;
      }

      .nexus-collapsible-content.open {
        display: block;
      }

      .nexus-collapsible-body {
        padding: 0 1.25rem 1.25rem 1.25rem;
      }
    </style>

    ${raw(`
      <script>
        (function() {
          // Initialize from localStorage
          function initCollapsible(id) {
            const storageKey = 'collapsible-state-' + id;
            const savedState = localStorage.getItem(storageKey);
            const section = document.querySelector('[data-collapsible-id="' + id + '"]');
            
            if (!section) return;
            
            const header = section.querySelector('.nexus-collapsible-header');
            const content = section.querySelector('.nexus-collapsible-content');
            
            if (savedState !== null) {
              const isOpen = savedState === 'true';
              header.setAttribute('aria-expanded', isOpen);
              content.style.display = isOpen ? 'block' : 'none';
              if (isOpen) {
                content.classList.add('open');
              } else {
                content.classList.remove('open');
              }
            }
          }

          // Toggle function
          window.toggleCollapsible = function(id) {
            const section = document.querySelector('[data-collapsible-id="' + id + '"]');
            if (!section) return;

            const header = section.querySelector('.nexus-collapsible-header');
            const content = section.querySelector('.nexus-collapsible-content');
            const isOpen = header.getAttribute('aria-expanded') === 'true';
            const newState = !isOpen;

            header.setAttribute('aria-expanded', newState);
            content.style.display = newState ? 'block' : 'none';
            
            if (newState) {
              content.classList.add('open');
            } else {
              content.classList.remove('open');
            }

            // Save to localStorage
            const storageKey = 'collapsible-state-' + id;
            localStorage.setItem(storageKey, newState);
          };

          // Initialize on load and add event delegation
          document.addEventListener('DOMContentLoaded', function() {
            const sections = document.querySelectorAll('[data-collapsible-id]');
            sections.forEach(function(section) {
              const id = section.getAttribute('data-collapsible-id');
              initCollapsible(id);
            });
          });

          // CSP-compliant: Use event delegation for collapsible toggles
          document.addEventListener('click', function(e) {
            const toggle = e.target.closest('[data-collapsible-toggle]');
            if (toggle) {
              const id = toggle.getAttribute('data-collapsible-toggle');
              if (id && window.toggleCollapsible) {
                window.toggleCollapsible(id);
              }
            }
          });
        })();
      </script>
    `)}
  `;
};
