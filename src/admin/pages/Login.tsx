import { html } from "hono/html";
import { buildAdminRoute, ROUTES, getAdminAsset } from "../config/routes.ts";
import { VALIDATION } from "../config/timing.ts";

/**
 * Admin Login Page
 * Supports regular login and 2FA verification
 */

interface LoginPageProps {
  error?: string;
  email?: string;
  requires2FA?: boolean;
}

export const LoginPage = (props: LoginPageProps) => {
  const { error, email, requires2FA } = props;

  const loginForm = html`
    <div class="flex items-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div class="flex-1 h-full max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div class="flex flex-col overflow-y-auto">
          <div class="flex items-center justify-center p-6 sm:p-12">
            <div class="w-full">
              <!-- Logo -->
              <div class="mb-8 text-center">
                <h1 class="text-3xl font-bold text-gray-700 dark:text-gray-200">
                  LexCMS Admin
                </h1>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Panel de Administración
                </p>
              </div>

              ${error ? html`
                <!-- Error Message -->
                <div class="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
                  ${error}
                </div>
              ` : ''}

              ${!requires2FA ? html`
                <!-- Login Form -->
                <form method="POST" action="${buildAdminRoute(ROUTES.LOGIN)}">
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value="${email || ''}"
                      required
                      class="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:border-purple-400 focus:outline-none focus:ring focus:ring-purple-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      class="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:border-purple-400 focus:outline-none focus:ring focus:ring-purple-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    class="w-full px-4 py-3 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring focus:ring-purple-300"
                  >
                    Iniciar Sesión
                  </button>
                </form>
              ` : html`
                <!-- 2FA Verification Form -->
                <form method="POST" action="${buildAdminRoute(ROUTES.LOGIN_2FA)}">
                  <input type="hidden" name="email" value="${email || ''}" />

                  <div class="mb-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Se requiere verificación en dos pasos. Ingresa el código de tu aplicación de autenticación.
                    </p>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                      Código 2FA
                    </label>
                    <input
                      type="text"
                      name="code"
                      required
                      maxlength="${VALIDATION.TWO_FA_CODE_LENGTH}"
                      pattern="[0-9]{${VALIDATION.TWO_FA_CODE_LENGTH}}"
                      class="w-full px-4 py-3 text-sm text-gray-900 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:border-purple-400 focus:outline-none focus:ring focus:ring-purple-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      placeholder="000000"
                      autocomplete="off"
                    />
                  </div>

                  <button
                    type="submit"
                    class="w-full px-4 py-3 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring focus:ring-purple-300"
                  >
                    Verificar
                  </button>

                  <a
                    href="${buildAdminRoute(ROUTES.LOGIN)}"
                    class="block w-full mt-4 px-4 py-3 text-sm font-medium text-center leading-5 text-gray-700 transition-colors duration-150 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Volver
                  </a>
                </form>
              `}

              <!-- Footer Link -->
              <div class="mt-6 text-center">
                <a
                  href="/"
                  class="text-sm text-purple-600 hover:underline dark:text-purple-400"
                >
                  ← Volver al sitio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Dark mode initialization
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    </script>
  `;

  return html`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - LexCMS Admin</title>
  <link rel="stylesheet" href="${getAdminAsset('css/admin-compiled.css')}">
</head>
<body>
  ${loginForm}
</body>
</html>`;
};

export default LoginPage;
