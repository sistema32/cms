import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { Layout } from "../Layout.tsx";
import { Header } from "../../partials/Header.tsx";
import { Footer } from "../../partials/Footer.tsx";
import type { SiteData } from "../../helpers/index.ts";

/**
 * Template personalizado para página de Inicio
 * Diseño especial con hero section y secciones destacadas
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

export const PageTemplate: FC<PageProps> = (props) => {
  const { site, custom, activeTheme, page } = props;

  const content = (
    <>
      <Header site={site} custom={custom} blogUrl="/blog" />

      <main class="site-main">
        {/* Hero Section */}
        <section class="hero-section bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
          <div class="container max-w-6xl mx-auto px-4 text-center">
            <h1 class="text-5xl md:text-6xl font-bold mb-6">{page.title}</h1>
            {page.featureImage && (
              <div class="mb-8 rounded-lg overflow-hidden shadow-2xl max-w-4xl mx-auto">
                <img
                  src={page.featureImage}
                  alt={page.title}
                  class="w-full h-auto"
                />
              </div>
            )}
          </div>
        </section>

        {/* Content Section */}
        <section class="content-section py-16 bg-white">
          <div class="container max-w-4xl mx-auto px-4">
            <div class="prose prose-lg max-w-none">
              {raw(page.body)}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section class="features-section py-16 bg-gray-50">
          <div class="container max-w-6xl mx-auto px-4">
            <div class="grid md:grid-cols-3 gap-8">
              <div class="feature-card text-center p-6 bg-white rounded-lg shadow-md">
                <div class="text-4xl mb-4">🚀</div>
                <h3 class="text-xl font-bold mb-2">Rápido</h3>
                <p class="text-gray-600">Rendimiento optimizado para la mejor experiencia</p>
              </div>
              <div class="feature-card text-center p-6 bg-white rounded-lg shadow-md">
                <div class="text-4xl mb-4">🎨</div>
                <h3 class="text-xl font-bold mb-2">Personalizable</h3>
                <p class="text-gray-600">Diseño adaptable a tus necesidades</p>
              </div>
              <div class="feature-card text-center p-6 bg-white rounded-lg shadow-md">
                <div class="text-4xl mb-4">🔒</div>
                <h3 class="text-xl font-bold mb-2">Seguro</h3>
                <p class="text-gray-600">Protección y privacidad garantizadas</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer site={site} custom={custom} blogUrl="/blog" />
    </>
  );

  return (
    <Layout
      site={site}
      custom={custom}
      activeTheme={activeTheme}
      title={page.title}
      description=""
      bodyClass="page-template page-inicio-template"
    >
      {content}
    </Layout>
  );
};

export default PageTemplate;
