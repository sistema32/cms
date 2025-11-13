import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Minimalist Page Template - Clean static page view
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
    <header class="site-header" style="border-bottom: 1px solid var(--border-color); padding: 40px 0;">
      <div class="container">
        <h1 style="font-size: 24px; font-weight: 400;">
          <a href="/" style="color: var(--primary-color); text-decoration: none;">${site.name}</a>
        </h1>
      </div>
    </header>

    <main class="site-main">
      <article class="page-single">
        <div class="container" style="max-width: 700px;">
          <header class="page-header" style="margin-bottom: 60px;">
            <h1 style="font-size: 42px; font-weight: 400; line-height: 1.2;">${page.title}</h1>
          </header>

          ${page.featureImage ? html`
            <figure class="page-featured-image" style="margin: 0 0 60px 0;">
              <img src="${page.featureImage}" alt="${page.title}" style="width: 100%; height: auto; display: block;" />
            </figure>
          ` : ""}

          <div class="page-content" style="font-size: 19px; line-height: 1.8; color: var(--text-color);">
            ${html([page.body] as any)}
          </div>
        </div>
      </article>
    </main>

    <footer class="site-footer" style="border-top: 1px solid var(--border-color); padding: 40px 0; margin-top: 100px;">
      <div class="container" style="text-align: center;">
        <p style="font-size: 14px; color: var(--text-light);">&copy; ${new Date().getFullYear()} ${site.name}</p>
      </div>
    </footer>
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
