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
export const AutoSaveScript = (options?: { formId?: string; saveUrl?: string }) => {
  const formId = options?.formId || "contentForm";
  const saveUrl = options?.saveUrl || "";

  return raw(`
    <script>
      (function() {
        let autoSaveTimeout;
        let lastSavedData = '';
        let lastSaveTime = null;
        
        // XSS safe - Auto-save functionality
        window.initAutoSave = function(formId, saveEndpoint) {
          const form = document.getElementById(formId);
          const indicator = document.getElementById('autoSaveIndicator');
          const statusText = document.getElementById('autoSaveStatus');
          
          if (!form || !indicator) {
            console.warn('[AutoSave] Form or indicator not found:', formId);
            return;
          }
          
          console.log('[AutoSave] Initialized for form:', formId);
          
          // Get initial form data
          lastSavedData = getFormDataString(form);
          
          // Function to schedule autosave
          function scheduleAutoSave() {
            clearTimeout(autoSaveTimeout);
            
            // Show "Sin guardar" when there are changes
            const currentData = getFormDataString(form);
            if (currentData !== lastSavedData) {
              indicator.className = 'auto-save-indicator';
              statusText.textContent = 'Sin guardar';
            }
            
            // Debounce auto-save (10 seconds after last change)
            autoSaveTimeout = setTimeout(function() {
              performAutoSave(form, saveEndpoint, indicator, statusText);
            }, 10000);
          }
          
          // Listen to form input events (works for regular inputs)
          form.addEventListener('input', scheduleAutoSave);
          form.addEventListener('change', scheduleAutoSave);
          
          // Watch for hidden input value changes (editor body field)
          const bodyInput = form.querySelector('[name="body"]');
          if (bodyInput) {
            // Use MutationObserver to detect value attribute changes
            const observer = new MutationObserver(scheduleAutoSave);
            observer.observe(bodyInput, { attributes: true, attributeFilter: ['value'] });
            
            // Also check periodically since TipTap might update via JS
            let lastBodyValue = bodyInput.value;
            setInterval(function() {
              if (bodyInput.value !== lastBodyValue) {
                lastBodyValue = bodyInput.value;
                scheduleAutoSave();
              }
            }, 2000);
          }
          
          // Save on blur for title field
          const titleField = form.querySelector('[name="title"]');
          if (titleField) {
            titleField.addEventListener('blur', function() {
              if (titleField.value.trim()) {
                clearTimeout(autoSaveTimeout);
                performAutoSave(form, saveEndpoint, indicator, statusText);
              }
            });
          }
        };
        
        function getFormDataString(form) {
          const data = new FormData(form);
          const obj = {};
          for (const [key, value] of data.entries()) {
            obj[key] = value;
          }
          return JSON.stringify(obj);
        }
        
        function performAutoSave(form, endpoint, indicator, statusText) {
          const currentData = new FormData(form);
          const currentDataString = getFormDataString(form);
          
          // Don't save if nothing changed
          if (currentDataString === lastSavedData) {
            console.log('[AutoSave] No changes detected, skipping');
            return;
          }
          
          // Convert to JSON object
          const dataObj = Object.fromEntries(currentData.entries());
          
          // Explicitly tell backend NOT to create a revision for auto-saves
          dataObj.saveRevision = false; 
          dataObj.changesSummary = 'Autoguardado automático';
          
          // Update UI
          indicator.className = 'auto-save-indicator saving';
          statusText.textContent = 'Guardando...';
          
          console.log('[AutoSave] Saving to:', endpoint);
          
          // Perform save
          fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(dataObj),
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          })
          .then(function(response) {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Error al guardar');
          })
          .then(function(data) {
            lastSavedData = currentDataString;
            lastSaveTime = new Date();
            
            indicator.className = 'auto-save-indicator saved';
            const timeStr = lastSaveTime.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            statusText.textContent = 'Guardado ' + timeStr;
            
            // If this created a new post, add the ID to form
            if (data.id && !form.querySelector('[name="id"]')) {
              const hiddenId = document.createElement('input');
              hiddenId.type = 'hidden';
              hiddenId.name = 'id';
              hiddenId.value = data.id;
              form.appendChild(hiddenId);
              console.log('[AutoSave] Created new draft with ID:', data.id);
            }
            
            console.log('[AutoSave] Saved successfully at', timeStr);
          })
          .catch(function(error) {
            console.error('[AutoSave] Error:', error);
            indicator.className = 'auto-save-indicator error';
            statusText.textContent = 'Error al guardar';
            
            setTimeout(function() {
              if (lastSaveTime) {
                indicator.className = 'auto-save-indicator';
                const timeStr = lastSaveTime.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                statusText.textContent = 'Guardado ' + timeStr;
              } else {
                indicator.className = 'auto-save-indicator';
                statusText.textContent = 'Sin guardar';
              }
            }, 3000);
          });
        }

        // Auto-init if config provided
        const targetFormId = "${formId}";
        const targetEndpoint = "${saveUrl}";
        if (targetFormId && targetEndpoint) {
          window.addEventListener('DOMContentLoaded', function() {
            window.initAutoSave(targetFormId, targetEndpoint);
          });
        }
      })();
    </script>
  `);
};
