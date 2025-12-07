import { html, raw } from "hono/html";

export const ImmersiveModeStyles = () => {
  return html`
    <style>
      /* Immersive Mode Styles */
      body.immersive-mode {
        overflow: hidden;
      }

      body.immersive-mode .admin-nav,
      body.immersive-mode .page-header-nexus,
      body.immersive-mode .post-form-layout > div:last-child {
        display: none !important;
      }

      body.immersive-mode .post-form-layout {
        grid-template-columns: 1fr !important;
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
      }

      body.immersive-mode .post-form-layout > div:first-child {
        background: var(--nexus-base-100, #fff);
        padding: 3rem;
        border-radius: 1rem;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.1);
      }

      /* Immersive Mode Toggle Button */
      .immersive-toggle {
        position: fixed;
        top: 1.5rem;
        right: 1.5rem;
        z-index: 1000;
        padding: 0.75rem 1.25rem;
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-full, 2rem);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
      }

      .immersive-toggle:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      .immersive-toggle svg {
        width: 18px;
        height: 18px;
      }

      body.immersive-mode .immersive-toggle {
        background: var(--nexus-primary, #167bff);
        color: white;
        border-color: var(--nexus-primary, #167bff);
      }

      /* Keyboard Shortcut Hint */
      .keyboard-hint {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: var(--nexus-radius-md, 0.5rem);
        font-size: 0.75rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 999;
      }

      .keyboard-hint.show {
        opacity: 1;
      }

      /* Focus Mode Enhancements */
      body.immersive-mode .post-title-input {
        font-size: 2.5rem !important;
        border: none !important;
        padding: 0 0 1rem 0 !important;
        background: transparent !important;
      }

      body.immersive-mode .post-title-input:focus {
        outline: none !important;
        box-shadow: none !important;
      }

      body.immersive-mode .ck-editor__editable {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        min-height: 60vh !important;
      }
    </style>
  `;
};

export const ImmersiveModeScript = () => {
  return raw(`
    <script>
      (function() {
        let isImmersive = false;
        
        // XSS safe - Toggle immersive mode
        window.toggleImmersiveMode = function() {
          isImmersive = !isImmersive;
          document.body.classList.toggle('immersive-mode', isImmersive);
          
          const btn = document.getElementById('immersiveToggle');
          const btnText = document.getElementById('immersiveToggleText');
          
          if (btn && btnText) {
            btnText.textContent = isImmersive ? 'Salir del Modo Focus' : 'Modo Focus';
          }
          
          // Show keyboard hint
          showKeyboardHint('Modo Focus ' + (isImmersive ? 'Activado' : 'Desactivado'));
          
          // Save state
          localStorage.setItem('immersive-mode', isImmersive);
        };
        
        // Show keyboard hint
        function showKeyboardHint(message) {
          let hint = document.getElementById('keyboardHint');
          if (!hint) {
            hint = document.createElement('div');
            hint.id = 'keyboardHint';
            hint.className = 'keyboard-hint';
            document.body.appendChild(hint);
          }
          
          hint.textContent = message;
          hint.classList.add('show');
          
          setTimeout(function() {
            hint.classList.remove('show');
          }, 2000);
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
          // Ctrl/Cmd + Shift + F = Toggle Immersive Mode
          if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            window.toggleImmersiveMode();
          }
          
          // Ctrl/Cmd + S = Save (prevent default browser save)
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const form = document.querySelector('form[method="POST"]');
            if (form) {
              form.submit();
              showKeyboardHint('Guardando...');
            }
          }
          
          // Escape = Exit immersive mode
          if (e.key === 'Escape' && isImmersive) {
            window.toggleImmersiveMode();
          }
        });
        
        // Initialize from localStorage
        document.addEventListener('DOMContentLoaded', function() {
          const savedState = localStorage.getItem('immersive-mode');
          if (savedState === 'true') {
            window.toggleImmersiveMode();
          }
        });
      })();
    </script>
  `);
};

export const ImmersiveModeToggle = () => {
  return html`
    <button
      type="button"
      id="immersiveToggle"
      class="immersive-toggle"
      onclick="toggleImmersiveMode()"
      title="Activa el modo de escritura sin distracciones"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2"></rect>
        <path d="M8 21h8"></path>
        <path d="M12 17v4"></path>
      </svg>
      <span id="immersiveToggleText">Modo Focus</span>
    </button>
    
    <style>
      /* Override and enhance toggle button styles */
      .immersive-toggle {
        position: fixed !important;
        top: 5rem !important;
        right: 2rem !important;
        z-index: 9999 !important;
        padding: 0.875rem 1.5rem !important;
        background: linear-gradient(135deg, var(--nexus-primary, #167bff) 0%, #0d5ce6 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 2rem !important;
        box-shadow: 0 4px 20px rgba(22, 123, 255, 0.4) !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        align-items: center !important;
        gap: 0.625rem !important;
        font-size: 0.9375rem !important;
        font-weight: 600 !important;
      }

      .immersive-toggle:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 25px rgba(22, 123, 255, 0.5) !important;
      }

      .immersive-toggle svg {
        width: 20px !important;
        height: 20px !important;
        stroke: white !important;
      }

      body.immersive-mode .immersive-toggle {
        background: linear-gradient(135deg, var(--nexus-success, #0bbf58) 0%, #099647 100%) !important;
        box-shadow: 0 4px 20px rgba(11, 191, 88, 0.4) !important;
      }

      body.immersive-mode .immersive-toggle:hover {
        box-shadow: 0 6px 25px rgba(11, 191, 88, 0.5) !important;
      }
    </style>
  `;
};
