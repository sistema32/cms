import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Corporate Page Template - Premium glassmorphism static page view
 */

interface PageData {
  id: number;
  title: string;
  slug: string;
  body: string;
  featureImage?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
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

    <main class="site-main relative z-10 py-8 sm:py-12 lg:py-16">
      <article class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="glass-panel overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-12">
          ${page.featureImage ? html`
            <figure class="page-featured-image -mx-6 -mt-6 mb-8 sm:-mx-8 sm:-mt-8 lg:-mx-12 lg:-mt-12">
              <img
                src="${page.featureImage}"
                alt="${page.title}"
                class="aspect-video w-full object-cover"
                loading="lazy"
              />
            </figure>
          ` : ""}

          <header class="page-header mb-8">
            <h1 class="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              ${page.title}
            </h1>
          </header>

          <div class="page-content prose prose-invert prose-lg max-w-none">
            ${html([page.body] as any)}
          </div>
        </div>
      </article>
    </main>

    ${Footer({ site, custom, blogUrl: "/blog" })}
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
