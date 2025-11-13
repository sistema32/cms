import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Magazine Page Template - Static page view
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
    <header class="site-header" style="border-bottom: 1px solid var(--border-color); padding: 20px 0;">
      <div class="container">
        <div style="text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 8px;">
            <a href="/" style="color: inherit; text-decoration: none;">${site.name}</a>
          </h1>
          <p style="font-family: var(--font-sans); font-size: 14px; color: #666;">${site.description}</p>
        </div>
        <nav style="display: flex; justify-content: center; gap: 30px; margin-top: 20px; font-family: var(--font-sans); font-size: 14px; font-weight: 600; text-transform: uppercase;">
          <a href="/" style="color: var(--text-color); text-decoration: none;">Inicio</a>
          <a href="/blog" style="color: var(--text-color); text-decoration: none;">Blog</a>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <article class="page-single" style="padding: 60px 0;">
        <div class="container" style="max-width: 800px;">
          <header class="page-header" style="margin-bottom: 40px;">
            <h1 style="font-size: 48px; margin-bottom: 20px; line-height: 1.1;">${page.title}</h1>
          </header>

          ${page.featureImage ? html`
            <figure class="page-featured-image" style="margin: 0 0 40px 0;">
              <img src="${page.featureImage}" alt="${page.title}" style="width: 100%; height: auto; display: block;" />
            </figure>
          ` : ""}

          <div class="page-content" style="font-size: 18px; line-height: 1.8;">
            ${html([page.body] as any)}
          </div>
        </div>
      </article>
    </main>

    <footer class="site-footer" style="border-top: 3px solid var(--primary-color); background: var(--secondary-color); color: #fff; padding: 40px 0; font-family: var(--font-sans); font-size: 14px;">
      <div class="container" style="text-align: center;">
        <p>&copy; ${new Date().getFullYear()} ${site.name}. Todos los derechos reservados.</p>
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
