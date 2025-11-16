import { html } from "hono/html";
import { Layout } from "../Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Template personalizado para página de Contacto
 * Diseño optimizado para formularios de contacto e información
 */

interface PageData {
  id: number;
  title: string;
  slug: string;
  body: string;
  featureImage?: string | null;
}

interface PageProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  page: PageData;
}

export const PageTemplate = (props: PageProps) => {
  const { site, custom, activeTheme, page } = props;

  const content = html`
    ${Header({ site, custom, blogUrl: "/blog" })}

    <main class="site-main bg-gray-50">
      <!-- Header Section -->
      <section class="page-header bg-white border-b">
        <div class="container max-w-4xl mx-auto px-4 py-12">
          <h1 class="text-4xl font-bold mb-4">${page.title}</h1>
          <p class="text-xl text-gray-600">Estamos aquí para ayudarte</p>
        </div>
      </section>

      <!-- Content Section with Sidebar -->
      <section class="py-12">
        <div class="container max-w-6xl mx-auto px-4">
          <div class="grid md:grid-cols-3 gap-8">
            <!-- Main Content -->
            <div class="md:col-span-2">
              <div class="bg-white rounded-lg shadow-md p-8">
                ${page.featureImage ? html`
                  <figure class="mb-6 rounded-lg overflow-hidden">
                    <img
                      src="${page.featureImage}"
                      alt="${page.title}"
                      class="w-full h-auto"
                    />
                  </figure>
                ` : ""}

                <div class="prose prose-lg max-w-none mb-8">
                  ${html([page.body] as any)}
                </div>

                <!-- Contact Form Placeholder -->
                <div class="border-t pt-8">
                  <h3 class="text-2xl font-bold mb-4">Envíanos un mensaje</h3>
                  <form class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium mb-2">Nombre</label>
                      <input type="text" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Tu nombre">
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">Email</label>
                      <input type="email" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="tu@email.com">
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">Mensaje</label>
                      <textarea rows="5" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Tu mensaje..."></textarea>
                    </div>
                    <button type="submit" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                      Enviar mensaje
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              <!-- Contact Info Card -->
              <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-bold mb-4">Información de contacto</h3>
                <div class="space-y-3">
                  <div class="flex items-start">
                    <span class="text-blue-600 mr-3">📧</span>
                    <div>
                      <p class="font-medium">Email</p>
                      <a href="mailto:${site.email || 'info@example.com'}" class="text-sm text-gray-600 hover:text-blue-600">
                        ${site.email || 'info@example.com'}
                      </a>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <span class="text-blue-600 mr-3">📍</span>
                    <div>
                      <p class="font-medium">Ubicación</p>
                      <p class="text-sm text-gray-600">
                        Dirección de ejemplo<br>
                        Ciudad, País
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <span class="text-blue-600 mr-3">⏰</span>
                    <div>
                      <p class="font-medium">Horario</p>
                      <p class="text-sm text-gray-600">
                        Lun - Vie: 9:00 - 18:00
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Social Media Card -->
              <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-bold mb-4">Síguenos</h3>
                <div class="flex gap-3">
                  <a href="#" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                    <span>f</span>
                  </a>
                  <a href="#" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                    <span>t</span>
                  </a>
                  <a href="#" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                    <span>in</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    ${Footer({ site, custom, blogUrl: "/blog" })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    title: page.title,
    description: "Contáctanos",
    bodyClass: "page-template page-contacto-template",
    children: content,
  });
};

export default PageTemplate;
