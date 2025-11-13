import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Modern Page Template - Contemporary static page view
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

    <main class="container mx-auto max-w-4xl px-4 py-12">
      <article class="animate-fade-in">
        ${page.featureImage ? html`
          <figure class="mb-8 -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden">
            <img
              src="${page.featureImage}"
              alt="${page.title}"
              class="w-full h-auto object-cover"
            />
          </figure>
        ` : ""}

        <header class="mb-8">
          <h1 class="text-4xl sm:text-5xl font-display font-bold gradient-text">
            ${page.title}
          </h1>
        </header>

        <div class="prose prose-lg max-w-none">
          ${html([page.body] as any)}
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
