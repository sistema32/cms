import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Base Page Template - Static page view
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
    ${Header({ site, custom })}

    <main class="site-main">
      <article class="page-single">
        <div class="mx-auto max-w-4xl px-4 py-8">
          ${page.featureImage ? html`
            <figure class="page-featured-image mb-8">
              <img
                src="${page.featureImage}"
                alt="${page.title}"
                class="w-full h-auto rounded-lg"
              />
            </figure>
          ` : ""}

          <header class="page-header mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
              ${page.title}
            </h1>
          </header>

          <div class="page-content prose prose-lg max-w-none">
            ${html([page.body] as any)}
          </div>
        </div>
      </article>
    </main>

    ${Footer({ site, custom })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    title: page.title,
    description: "",
    bodyClass: "page-template",
    children: content,
  });
};

export default PageTemplate;
