import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Default Page Template - Static page view
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
        <div class="container max-w-4xl mx-auto px-4 py-12">
          <article class="page-single">
            {page.featureImage && (
              <figure class="page-featured-image mb-8 rounded-lg overflow-hidden">
                <img
                  src={page.featureImage}
                  alt={page.title}
                  class="w-full h-auto"
                />
              </figure>
            )}

            <header class="page-header mb-8">
              <h1 class="text-4xl font-bold mb-4">{page.title}</h1>
            </header>

            <div class="page-content prose prose-lg max-w-none">
              {raw(page.body)}
            </div>
          </article>
        </div>
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
      bodyClass="page-template"
    >
      {content}
    </Layout>
  );
};

export default PageTemplate;
