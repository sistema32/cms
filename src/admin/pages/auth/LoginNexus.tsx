import { html } from "hono/html";
import { env } from "@/config/env.ts";
const ROUTES = {
  dashboard: env.ADMIN_PATH,
  login: `${env.ADMIN_PATH}/login`,
  logout: `${env.ADMIN_PATH}/logout`,
  forgotPassword: `${env.ADMIN_PATH}/forgot-password`,
  login2fa: `${env.ADMIN_PATH}/login/verify-2fa`,
};

const buildAdminRoute = (route: keyof typeof ROUTES, params: Record<string, string> = {}) => {
  let path = ROUTES[route];
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, encodeURIComponent(value));
  });
  return path;
};

const getAdminAsset = (asset: string) => `/admincp/assets/${asset}`;
import { VALIDATION } from "../config/timing.ts";

/**
 * Admin Login Page - Nexus Style
 * Beautiful authentication page with Nexus DaisyUI design
 * Supports regular login and 2FA verification
 */

interface LoginNexusPageProps {
  error?: string;
  email?: string;
  requires2FA?: boolean;
}

export const LoginNexusPage = (props: LoginNexusPageProps) => {
  const { error, email, requires2FA } = props;

  const content = html`
    <!DOCTYPE html>
    <html lang="es" data-theme="light">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${requires2FA ? '2FA Verification' : 'Login'} - LexCMS Admin</title>
      <link rel="stylesheet" href="${getAdminAsset('css/admin-compiled.css')}">
      <style>
        /* ========== NEXUS AUTH PAGE STYLES ========== */
        :root {
          /* Nexus Colors */
          --nexus-primary: #167bff;
          --nexus-primary-content: #fff;
          --nexus-base-100: #fff;
          --nexus-base-200: #eef0f2;
          --nexus-base-300: #dcdee0;
          --nexus-base-content: #1e2328;
          --nexus-root-bg: #fafbfc;
          --nexus-error: #f31260;
          --nexus-success: #0bbf58;

          /* Border Radius */
          --nexus-radius-sm: 0.25rem;
          --nexus-radius-md: 0.5rem;
          --nexus-radius-lg: 0.75rem;
        }

        [data-theme="dark"] {
          --nexus-primary: #378dff;
          --nexus-base-100: #181c20;
          --nexus-base-200: #22262a;
          --nexus-base-300: #2c3034;
          --nexus-base-content: #f0f4f8;
          --nexus-root-bg: #121416;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: var(--nexus-root-bg);
          color: var(--nexus-base-content);
        }

        /* ========== AUTH LAYOUT ========== */
        .auth-layout {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100vh;
        }

        @media (min-width: 1024px) {
          .auth-layout {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Left Side - Hero */
        .auth-hero {
          position: relative;
          display: none;
          background: linear-gradient(135deg, var(--nexus-primary) 0%, #9c5de8 100%);
          padding: 3rem;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 1024px) {
          .auth-hero {
            display: flex;
          }
        }

        .auth-hero-image {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.1;
        }

        .auth-hero-image img {
          width: 100%;
          max-width: 600px;
          height: auto;
        }

        .auth-testimonial {
          position: relative;
          z-index: 10;
          background: rgba(255, 255, 255, 0.95);
          border-radius: var(--nexus-radius-lg);
          padding: 2rem;
          max-width: 500px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        [data-theme="dark"] .auth-testimonial {
          background: rgba(24, 28, 32, 0.95);
        }

        .auth-testimonial-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .auth-testimonial-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--nexus-primary);
        }

        .auth-testimonial-stars {
          display: flex;
          gap: 0.25rem;
          color: #fbbf24;
        }

        .auth-testimonial-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--nexus-base-content);
          text-align: center;
        }

        .auth-testimonial-role {
          font-size: 0.875rem;
          color: var(--nexus-base-content);
          opacity: 0.6;
          text-align: center;
        }

        .auth-testimonial-text {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--nexus-base-content);
          text-align: center;
        }

        /* Right Side - Form */
        .auth-form-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--nexus-base-100);
        }

        .auth-form-wrapper {
          width: 100%;
          max-width: 480px;
        }

        .auth-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .auth-logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--nexus-primary) 0%, #9c5de8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.025em;
        }

        .theme-toggle {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--nexus-radius-md);
          background: transparent;
          border: 1px solid var(--nexus-base-300);
          color: var(--nexus-base-content);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .theme-toggle:hover {
          background: var(--nexus-base-200);
        }

        .theme-icon {
          position: absolute;
          width: 1.25rem;
          height: 1.25rem;
        }

        .theme-icon-sun {
          display: block;
        }

        .theme-icon-moon {
          display: none;
        }

        [data-theme="dark"] .theme-icon-sun {
          display: none;
        }

        [data-theme="dark"] .theme-icon-moon {
          display: block;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--nexus-base-content);
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .auth-subtitle {
          font-size: 0.9375rem;
          color: var(--nexus-base-content);
          opacity: 0.65;
          margin-bottom: 2rem;
          line-height: 1.5;
        }

        /* Error Alert */
        .alert-error {
          padding: 1rem;
          background: rgba(243, 18, 96, 0.1);
          border: 1px solid rgba(243, 18, 96, 0.2);
          border-radius: var(--nexus-radius-md);
          color: var(--nexus-error);
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* Form Styles */
        .form-field {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--nexus-base-content);
          margin-bottom: 0.5rem;
        }

        .form-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          font-size: 0.875rem;
          color: var(--nexus-base-content);
          background: var(--nexus-base-100);
          border: 1px solid var(--nexus-base-300);
          border-radius: var(--nexus-radius-md);
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--nexus-primary);
          box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
        }

        .form-input::placeholder {
          color: var(--nexus-base-content);
          opacity: 0.4;
        }

        .form-input-icon {
          position: absolute;
          left: 0.875rem;
          width: 1.25rem;
          height: 1.25rem;
          color: var(--nexus-base-content);
          opacity: 0.4;
          pointer-events: none;
        }

        .form-input-2fa {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.5rem;
          padding-left: 1rem;
        }

        /* Checkbox */
        .form-checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .form-checkbox {
          width: 1.125rem;
          height: 1.125rem;
          border-radius: var(--nexus-radius-sm);
          border: 2px solid var(--nexus-base-300);
          cursor: pointer;
        }

        .form-checkbox:checked {
          background: var(--nexus-primary);
          border-color: var(--nexus-primary);
        }

        .form-checkbox-label {
          font-size: 0.875rem;
          color: var(--nexus-base-content);
          opacity: 0.8;
          cursor: pointer;
        }

        .form-link {
          color: var(--nexus-primary);
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .form-link:hover {
          opacity: 0.8;
        }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: var(--nexus-radius-md);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-primary {
          background: var(--nexus-primary);
          color: var(--nexus-primary-content);
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22, 123, 255, 0.3);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--nexus-base-300);
          color: var(--nexus-base-content);
        }

        .btn-outline:hover {
          background: var(--nexus-base-200);
        }

        .btn-wide {
          width: 100%;
        }

        .btn-icon {
          width: 1.125rem;
          height: 1.125rem;
        }

        /* Forgot Password Link */
        .forgot-link {
          text-align: right;
          margin-bottom: 1.5rem;
        }

        .forgot-link a {
          font-size: 0.875rem;
          color: var(--nexus-base-content);
          opacity: 0.6;
          text-decoration: none;
          transition: all 0.2s;
        }

        .forgot-link a:hover {
          color: var(--nexus-primary);
          opacity: 1;
        }

        /* Footer Text */
        .auth-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--nexus-base-content);
          opacity: 0.7;
        }

        /* Spacing utilities */
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
      </style>
    </head>
    <body>
      <div class="auth-layout">
        <!-- Left Side - Hero (Desktop Only) -->
        <div class="auth-hero">
          <div class="auth-hero-image">
            <svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="300" cy="300" r="250" fill="currentColor" opacity="0.1"/>
              <circle cx="300" cy="300" r="180" fill="currentColor" opacity="0.15"/>
              <circle cx="300" cy="300" r="110" fill="currentColor" opacity="0.2"/>
            </svg>
          </div>

          <div class="auth-testimonial">
            <div class="auth-testimonial-header">
              <div class="auth-testimonial-stars">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p class="auth-testimonial-name">Panel de Administración</p>
                <p class="auth-testimonial-role">LexCMS</p>
              </div>
            </div>
            <p class="auth-testimonial-text">
              Sistema de gestión de contenido moderno y potente. Administra tu sitio web de forma eficiente y profesional.
            </p>
          </div>
        </div>

        <!-- Right Side - Form -->
        <div class="auth-form-container">
          <div class="auth-form-wrapper">
            <!-- Header with Logo and Theme Toggle -->
            <div class="auth-header">
              <a href="/" class="auth-logo">
                <span class="auth-logo-text">LexCMS</span>
              </a>
              <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle Theme">
                <svg class="theme-icon theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <svg class="theme-icon theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </button>
            </div>

            <!-- Title -->
            <h1 class="auth-title">${requires2FA ? 'Verificación 2FA' : 'Iniciar Sesión'}</h1>
            <p class="auth-subtitle">
              ${requires2FA
      ? 'Ingresa el código de verificación de tu aplicación de autenticación.'
      : 'Accede al panel de administración de LexCMS.'}
            </p>

            <!-- Error Message -->
            ${error ? html`
              <div class="alert-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${error}</span>
              </div>
            ` : ''}

            <!-- Login Form -->
            ${!requires2FA ? html`
              <form method="POST" action="${buildAdminRoute("login")}">
                <div class="form-field">
                  <label class="form-label" for="email">Correo Electrónico</label>
                  <div class="form-input-wrapper">
                    <svg class="form-input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2"/>
                      <polyline points="3 7 12 13 21 7"/>
                    </svg>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value="${email || ''}"
                      required
                      class="form-input"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label" for="password">Contraseña</label>
                  <div class="form-input-wrapper">
                    <svg class="form-input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="16" r="1"/>
                      <rect x="3" y="10" width="18" height="12" rx="2"/>
                      <path d="M7 10V7a5 5 0 0 1 10 0v3"/>
                    </svg>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      required
                      class="form-input"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div class="forgot-link">
                  <a href="#" class="form-link">¿Olvidaste tu contraseña?</a>
                </div>

                <button type="submit" class="btn btn-primary btn-wide mb-4">
                  <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Iniciar Sesión
                </button>

                <div class="auth-footer">
                  <a href="/" class="form-link">← Volver al sitio</a>
                </div>
              </form>
            ` : html`
              <!-- 2FA Verification Form -->
              <form method="POST" action="${buildAdminRoute("login2fa")}">
                <input type="hidden" name="email" value="${email || ''}" />

                <div class="form-field">
                  <label class="form-label" for="code">Código de Verificación</label>
                  <div class="form-input-wrapper">
                    <input
                      id="code"
                      type="text"
                      name="code"
                      required
                      maxlength="${VALIDATION.TWO_FA_CODE_LENGTH}"
                      pattern="[0-9]{${VALIDATION.TWO_FA_CODE_LENGTH}}"
                      class="form-input form-input-2fa"
                      placeholder="000000"
                      autocomplete="off"
                    />
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-wide mb-4">
                  <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Verificar
                </button>

                <a href="${buildAdminRoute("login")}" class="btn btn-outline btn-wide">
                  <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Volver
                </a>
              </form>
            `}
          </div>
        </div>
      </div>

      <script>
        // Theme toggle functionality
        function toggleTheme() {
          const html = document.documentElement;
          const currentTheme = html.getAttribute('data-theme');
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          html.setAttribute('data-theme', newTheme);
          localStorage.setItem('theme', newTheme);
        }

        // Initialize theme from localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      </script>
    </body>
    </html>
  `;

  return content;
};

export default LoginNexusPage;
