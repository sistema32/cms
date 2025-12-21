import { html, raw } from "hono/html";

export interface MinimalSectionProps {
  id: string;
  title: string;
  children: any;
  defaultOpen?: boolean;
}

export const MinimalSection = (props: MinimalSectionProps) => {
  const { id, title, children, defaultOpen = false } = props;

  const sectionId = `minimal-${id}`;
  const storageKey = `minimal-state-${id}`;

  return html`
    <div class="minimal-section" data-minimal-id="${id}" data-block-id="${id}">
      <div class="minimal-section-header" onclick="toggleMinimal('${id}')">
        <span class="minimal-section-title">${title}</span>
        <span class="minimal-section-toggle">${defaultOpen ? '−' : '+'}</span>
      </div>
      <div
        id="${sectionId}"
        class="minimal-section-content ${defaultOpen ? 'open' : ''}"
        style="display: ${defaultOpen ? 'block' : 'none'};"
      >
        ${children}
      </div>
    </div>

    <style>
      .minimal-section {
        border-bottom: 1px solid #eef0f2;
        padding: 1.5rem 0;
      }

      .minimal-section:last-child {
        border-bottom: none;
      }

      .minimal-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding-bottom: 0;
        transition: all 0.2s ease;
      }

      .minimal-section-header:hover .minimal-section-title {
        color: #167bff;
      }

      .minimal-section-title {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #1e2328;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: color 0.2s ease;
      }

      .minimal-section-toggle {
        font-size: 1.25rem;
        font-weight: 300;
        color: #167bff;
        transition: transform 0.2s ease;
        line-height: 1;
        user-select: none;
      }

      .minimal-section-content {
        padding-top: 1.25rem;
        transition: all 0.2s ease;
      }

      .minimal-section-content.open {
        display: block;
      }

      /* Clean form elements */
      .minimal-section .form-field {
        margin-bottom: 1.25rem;
      }

      .minimal-section .form-field:last-child {
        margin-bottom: 0;
      }

      .minimal-section .form-label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 400;
        color: #666;
        margin-bottom: 0.5rem;
      }

      .minimal-section .form-input,
      .minimal-section .form-select,
      .minimal-section textarea {
        width: 100%;
        border: none;
        border-bottom: 1px solid #eef0f2;
        border-radius: 0;
        padding: 0.625rem 0;
        background: transparent;
        font-size: 0.9375rem;
        color: #1e2328;
        transition: border-color 0.2s ease;
      }

      .minimal-section .form-input:focus,
      .minimal-section .form-select:focus,
      .minimal-section textarea:focus {
        outline: none;
        border-bottom-color: #167bff;
        box-shadow: none;
      }

      .minimal-section .form-input::placeholder,
      .minimal-section textarea::placeholder {
        color: #999;
      }

      .minimal-section .form-hint {
        font-size: 0.75rem;
        color: #999;
        margin-top: 0.25rem;
      }

      .minimal-section .toggle-wrapper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0;
      }

      .minimal-section .toggle-label {
        font-size: 0.9375rem;
        color: #1e2328;
      }
    </style>

    ${raw(`
      <script>
        (function() {
          window.toggleMinimal = function(id) {
            const section = document.querySelector('[data-minimal-id="' + id + '"]');
            if (!section) return;

            const content = section.querySelector('.minimal-section-content');
            const toggle = section.querySelector('.minimal-section-toggle');
            const isOpen = content.classList.contains('open');

            if (isOpen) {
              content.classList.remove('open');
              content.style.display = 'none';
              toggle.textContent = '+';
            } else {
              content.classList.add('open');
              content.style.display = 'block';
              toggle.textContent = '−';
            }

            // Save to localStorage
            const storageKey = 'minimal-state-' + id;
            localStorage.setItem(storageKey, !isOpen);
          };

          // Initialize from localStorage
          document.addEventListener('DOMContentLoaded', function() {
            const sections = document.querySelectorAll('[data-minimal-id]');
            sections.forEach(function(section) {
              const id = section.getAttribute('data-minimal-id');
              const storageKey = 'minimal-state-' + id;
              const savedState = localStorage.getItem(storageKey);

              if (savedState !== null) {
                const isOpen = savedState === 'true';
                const content = section.querySelector('.minimal-section-content');
                const toggle = section.querySelector('.minimal-section-toggle');

                if (isOpen) {
                  content.classList.add('open');
                  content.style.display = 'block';
                  toggle.textContent = '−';
                } else {
                  content.classList.remove('open');
                  content.style.display = 'none';
                  toggle.textContent = '+';
                }
              }
            });
          });
        })();
      </script>
    `)}
  `;
};
