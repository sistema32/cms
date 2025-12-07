import { html, raw } from "hono/html";

export interface AutoSaveIndicatorProps {
  className?: string;
}

export const AutoSaveIndicator = (props: AutoSaveIndicatorProps) => {
  const { className = "" } = props;

  return html`
    <div id="autoSaveIndicator" class="auto-save-indicator ${className}">
      <svg class="auto-save-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      <span id="autoSaveStatus" class="auto-save-status">Guardado</span>
    </div>

    <style>
      .auto-save-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        font-size: 0.875rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
        transition: all 0.3s ease;
      }

      .auto-save-indicator.saving {
        opacity: 1;
        border-color: var(--nexus-primary, #167bff);
        color: var(--nexus-primary, #167bff);
      }

      .auto-save-indicator.saved {
        opacity: 0.7;
        border-color: var(--nexus-success, #0bbf58);
        color: var(--nexus-success, #0bbf58);
      }

      .auto-save-indicator.error {
        opacity: 1;
        border-color: var(--nexus-error, #f31260);
        color: var(--nexus-error, #f31260);
      }

      .auto-save-icon {
        flex-shrink: 0;
      }

      .auto-save-indicator.saving .auto-save-icon {
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .auto-save-status {
        white-space: nowrap;
        font-weight: 500;
      }
    </style>
  `;
};

// Auto-save utility functions
export const AutoSaveScript = () => {
  return raw(`
    <script>
      (function() {
        let autoSaveTimeout;
        let lastSavedData = '';
        
        // XSS safe - Auto-save functionality
        window.initAutoSave = function(formId, saveEndpoint) {
          const form = document.getElementById(formId);
          const indicator = document.getElementById('autoSaveIndicator');
          const statusText = document.getElementById('autoSaveStatus');
          
          if (!form || !indicator) return;
          
          // Get initial form data
          lastSavedData = new FormData(form).toString();
          
          // Listen to form changes
          form.addEventListener('input', function() {
            clearTimeout(autoSaveTimeout);
            
            // Debounce auto-save (30 seconds)
            autoSaveTimeout = setTimeout(function() {
              performAutoSave(form, saveEndpoint, indicator, statusText);
            }, 30000);
          });
          
          // Save on blur for important fields
          const importantFields = form.querySelectorAll('[data-auto-save="true"]');
          importantFields.forEach(function(field) {
            field.addEventListener('blur', function() {
              clearTimeout(autoSaveTimeout);
              performAutoSave(form, saveEndpoint, indicator, statusText);
            });
          });
        };
        
        function performAutoSave(form, endpoint, indicator, statusText) {
          const currentData = new FormData(form);
          
          // Add Auto-save specfic fields to avoid revision spam
          // We convert to JSON for the API since FormData doesn't support booleans well in all backends without parsing
          const dataObj = Object.fromEntries(currentData.entries());
          
          // Explicitly tell backend NOT to create a revision for auto-saves
          dataObj.saveRevision = false; 
          dataObj.changesSummary = 'Autoguardado automático';
          
          const currentDataString = currentData.toString();
          
          // Don't save if nothing changed
          if (currentDataString === lastSavedData) return;
          
          // Update UI
          indicator.className = 'auto-save-indicator saving';
          statusText.textContent = 'Guardando...';
          
          // Perform save
          fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(dataObj), // Send as JSON to support boolean flag
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          })
          .then(function(response) {
            if (response.ok) {
              lastSavedData = currentDataString;
              indicator.className = 'auto-save-indicator saved';
              const now = new Date();
              const timeStr = now.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              statusText.textContent = 'Guardado a las ' + timeStr;
              
              // Reset to default after 3 seconds
              setTimeout(function() {
                indicator.className = 'auto-save-indicator';
                statusText.textContent = 'Guardado';
              }, 3000);
            } else {
              throw new Error('Error al guardar');
            }
          })
          .catch(function(error) {
            console.error('Auto-save error:', error);
            indicator.className = 'auto-save-indicator error';
            statusText.textContent = 'Error al guardar';
            
            setTimeout(function() {
              indicator.className = 'auto-save-indicator';
              statusText.textContent = 'Guardado';
            }, 5000);
          });
        }
      })();
    </script>
  `);
};
