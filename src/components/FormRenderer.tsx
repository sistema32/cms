import { html, raw } from "hono/html";
import type { CaptchaProvider } from "@/services/system/captchaService.ts";

interface FormField {
  id: number;
  type: string;
  label: string;
  name: string;
  placeholder?: string | null;
  helpText?: string | null;
  required: boolean;
  options?: string | null;
  validation?: any;
}

interface FormRendererProps {
  formId: number;
  formSlug: string;
  formName: string;
  formDescription?: string;
  fields: FormField[];
  captchaProvider?: CaptchaProvider;
  captchaSiteKey?: string;
  submitUrl?: string;
}

export const FormRenderer = (props: FormRendererProps) => {
  const {
    formId,
    formSlug,
    formName,
    formDescription,
    fields,
    captchaProvider,
    captchaSiteKey,
    submitUrl = `/api/forms/${formId}/submit`,
  } = props;

  // Generar scripts de CAPTCHA según el provider
  const captchaScripts = captchaProvider && captchaSiteKey ? (() => {
    switch (captchaProvider) {
      case "recaptcha":
        return html`<script src="https://www.google.com/recaptcha/api.js" async defer></script>`;
      case "hcaptcha":
        return html`<script src="https://js.hcaptcha.com/1/api.js" async defer></script>`;
      case "turnstile":
        return html`<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`;
      default:
        return '';
    }
  })() : '';

  return html`
    ${captchaScripts}
    
    <style>
      .form-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
      }

      .form-header {
        margin-bottom: 2rem;
      }

      .form-title {
        font-size: 1.875rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #1e293b;
      }

      .form-description {
        font-size: 1rem;
        color: #64748b;
        line-height: 1.6;
      }

      .form-field {
        margin-bottom: 1.5rem;
      }

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;
      }

      .form-label.required::after {
        content: " *";
        color: #ef4444;
      }

      .form-input,
      .form-textarea,
      .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.9375rem;
        color: #1e293b;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        transition: all 0.2s;
      }

      .form-input:focus,
      .form-textarea:focus,
      .form-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .form-textarea {
        min-height: 120px;
        resize: vertical;
        font-family: inherit;
      }

      .form-help-text {
        font-size: 0.8125rem;
        color: #64748b;
        margin-top: 0.5rem;
      }

      .form-error {
        font-size: 0.8125rem;
        color: #ef4444;
        margin-top: 0.5rem;
        display: none;
      }

      .form-field.error .form-input,
      .form-field.error .form-textarea,
      .form-field.error .form-select {
        border-color: #ef4444;
      }

      .form-field.error .form-error {
        display: block;
      }

      .radio-group,
      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .radio-option,
      .checkbox-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .radio-option input[type="radio"],
      .checkbox-option input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .radio-option label,
      .checkbox-option label {
        font-size: 0.9375rem;
        color: #334155;
        cursor: pointer;
      }

      .captcha-container {
        margin: 1.5rem 0;
      }

      .form-submit {
        width: 100%;
        padding: 0.875rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
        background: #3b82f6;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .form-submit:hover {
        background: #2563eb;
      }

      .form-submit:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

      .form-message {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
        display: none;
      }

      .form-message.success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
      }

      .form-message.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }

      .form-message.show {
        display: block;
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-right: 0.5rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>

    <div class="form-container">
      <div class="form-header">
        <h1 class="form-title">${formName}</h1>
        ${formDescription ? html`<p class="form-description">${formDescription}</p>` : ''}
      </div>

      <div id="formMessage" class="form-message"></div>

      <form id="dynamicForm" data-form-id="${formId}">
        ${fields.map(field => {
    const fieldId = `field-${field.name}`;
    const options = field.options ? JSON.parse(field.options) : [];

    switch (field.type) {
      case 'textarea':
        return html`
                <div class="form-field" data-field-name="${field.name}">
                  <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
                  <textarea
                    id="${fieldId}"
                    name="${field.name}"
                    class="form-textarea"
                    placeholder="${field.placeholder || ''}"
                    ${field.required ? 'required' : ''}
                  ></textarea>
                  ${field.helpText ? html`<p class="form-help-text">${field.helpText}</p>` : ''}
                  <p class="form-error">Este campo es requerido</p>
                </div>
              `;

      case 'select':
        return html`
                <div class="form-field" data-field-name="${field.name}">
                  <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
                  <select
                    id="${fieldId}"
                    name="${field.name}"
                    class="form-select"
                    ${field.required ? 'required' : ''}
                  >
                    <option value="">Selecciona una opción</option>
                    ${options.map((opt: string) => html`<option value="${opt}">${opt}</option>`)}
                  </select>
                  ${field.helpText ? html`<p class="form-help-text">${field.helpText}</p>` : ''}
                  <p class="form-error">Este campo es requerido</p>
                </div>
              `;

      case 'radio':
        return html`
                <div class="form-field" data-field-name="${field.name}">
                  <label class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
                  <div class="radio-group">
                    ${options.map((opt: string, idx: number) => html`
                      <div class="radio-option">
                        <input
                          type="radio"
                          id="${fieldId}-${idx}"
                          name="${field.name}"
                          value="${opt}"
                          ${field.required ? 'required' : ''}
                        />
                        <label for="${fieldId}-${idx}">${opt}</label>
                      </div>
                    `)}
                  </div>
                  ${field.helpText ? html`<p class="form-help-text">${field.helpText}</p>` : ''}
                  <p class="form-error">Este campo es requerido</p>
                </div>
              `;

      case 'checkbox':
        return html`
                <div class="form-field" data-field-name="${field.name}">
                  <label class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
                  <div class="checkbox-group">
                    ${options.map((opt: string, idx: number) => html`
                      <div class="checkbox-option">
                        <input
                          type="checkbox"
                          id="${fieldId}-${idx}"
                          name="${field.name}[]"
                          value="${opt}"
                        />
                        <label for="${fieldId}-${idx}">${opt}</label>
                      </div>
                    `)}
                  </div>
                  ${field.helpText ? html`<p class="form-help-text">${field.helpText}</p>` : ''}
                  <p class="form-error">Selecciona al menos una opción</p>
                </div>
              `;

      default: // text, email, tel, number, file, date
        return html`
                <div class="form-field" data-field-name="${field.name}">
                  <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${field.label}</label>
                  <input
                    type="${field.type}"
                    id="${fieldId}"
                    name="${field.name}"
                    class="form-input"
                    placeholder="${field.placeholder || ''}"
                    ${field.required ? 'required' : ''}
                  />
                  ${field.helpText ? html`<p class="form-help-text">${field.helpText}</p>` : ''}
                  <p class="form-error">Este campo es requerido</p>
                </div>
              `;
    }
  })}

        ${captchaProvider && captchaSiteKey ? html`
          <div class="captcha-container">
            ${captchaProvider === 'recaptcha' ? html`
              <div class="g-recaptcha" data-sitekey="${captchaSiteKey}"></div>
            ` : captchaProvider === 'hcaptcha' ? html`
              <div class="h-captcha" data-sitekey="${captchaSiteKey}"></div>
            ` : captchaProvider === 'turnstile' ? html`
              <div class="cf-turnstile" data-sitekey="${captchaSiteKey}"></div>
            ` : ''}
          </div>
        ` : ''}

        <button type="submit" class="form-submit" id="submitBtn">
          Enviar
        </button>
      </form>
    </div>

    ${raw(`
      <script>
        (function() {
          const form = document.getElementById('dynamicForm');
          const submitBtn = document.getElementById('submitBtn');
          const messageDiv = document.getElementById('formMessage');
          const captchaProvider = ${JSON.stringify(captchaProvider)};
          const submitUrl = ${JSON.stringify(submitUrl)};

          form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Clear previous errors
            document.querySelectorAll('.form-field').forEach(field => {
              field.classList.remove('error');
            });
            messageDiv.className = 'form-message';
            messageDiv.textContent = '';

            // Validate required fields
            let isValid = true;
            const formData = new FormData(form);
            
            document.querySelectorAll('[required]').forEach(input => {
              const fieldContainer = input.closest('.form-field');
              const fieldName = fieldContainer.dataset.fieldName;
              
              if (input.type === 'checkbox' || input.type === 'radio') {
                const checked = document.querySelector(\`[name="\${input.name}"]:checked\`);
                if (!checked) {
                  fieldContainer.classList.add('error');
                  isValid = false;
                }
              } else if (!input.value.trim()) {
                fieldContainer.classList.add('error');
                isValid = false;
              }
            });

            if (!isValid) {
              messageDiv.textContent = 'Por favor completa todos los campos requeridos';
              messageDiv.className = 'form-message error show';
              return;
            }

            // Get CAPTCHA token
            let captchaToken = null;
            if (captchaProvider) {
              try {
                if (captchaProvider === 'recaptcha') {
                  captchaToken = grecaptcha.getResponse();
                } else if (captchaProvider === 'hcaptcha') {
                  captchaToken = hcaptcha.getResponse();
                } else if (captchaProvider === 'turnstile') {
                  captchaToken = turnstile.getResponse();
                }

                if (!captchaToken) {
                  messageDiv.textContent = 'Por favor completa el CAPTCHA';
                  messageDiv.className = 'form-message error show';
                  return;
                }
              } catch (error) {
                console.error('Error getting CAPTCHA token:', error);
                messageDiv.textContent = 'Error al validar CAPTCHA';
                messageDiv.className = 'form-message error show';
                return;
              }
            }

            // Prepare submission data
            const data = {};
            for (const [key, value] of formData.entries()) {
              if (key.endsWith('[]')) {
                const cleanKey = key.replace('[]', '');
                if (!data[cleanKey]) data[cleanKey] = [];
                data[cleanKey].push(value);
              } else {
                data[key] = value;
              }
            }

            if (captchaToken) {
              data.captchaToken = captchaToken;
              data.captchaProvider = captchaProvider;
            }

            // Submit form
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span>Enviando...';

            try {
              const response = await fetch(submitUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              const result = await response.json();

              if (response.ok) {
                messageDiv.textContent = '¡Formulario enviado correctamente! Gracias por tu mensaje.';
                messageDiv.className = 'form-message success show';
                form.reset();
                if (captchaProvider === 'recaptcha') grecaptcha.reset();
                if (captchaProvider === 'hcaptcha') hcaptcha.reset();
                if (captchaProvider === 'turnstile') turnstile.reset();
              } else {
                messageDiv.textContent = result.message || 'Error al enviar el formulario';
                messageDiv.className = 'form-message error show';
              }
            } catch (error) {
              console.error('Error submitting form:', error);
              messageDiv.textContent = 'Error al enviar el formulario. Por favor intenta de nuevo.';
              messageDiv.className = 'form-message error show';
            } finally {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Enviar';
            }
          });
        })();
      </script>
    `)}
  `;
};

export default FormRenderer;
