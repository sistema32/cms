import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Magazine Post Template - Single article view
 */

interface PostAuthor {
  id: number;
  name: string | null;
  email: string;
  avatar?: string | null;
}

interface PostData {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  featureImage?: string | null;
  author?: PostAuthor;
  createdAt: Date | string;
  publishedAt?: Date | string | null;
}

interface PostProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  post: PostData;
}

export const PostTemplate = (props: PostProps) => {
  const { site, custom, activeTheme, post } = props;

  const publishDate = post.publishedAt || post.createdAt;
  const formattedDate = new Date(publishDate).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
      <article class="post-single" style="padding: 60px 0;">
        <div class="container" style="max-width: 800px;">
          <header class="post-header" style="margin-bottom: 40px;">
            <h1 style="font-size: 48px; margin-bottom: 20px; line-height: 1.1;">${post.title}</h1>

            <div class="post-meta" style="font-family: var(--font-sans); font-size: 14px; color: #666; display: flex; gap: 20px; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
              ${post.author ? html`<span>Por <strong style="color: var(--text-color);">${post.author.name || "Anónimo"}</strong></span>` : ""}
              <time datetime="${new Date(publishDate).toISOString()}">${formattedDate}</time>
            </div>
          </header>

          ${post.featureImage ? html`
            <figure class="post-featured-image" style="margin: 0 0 40px 0;">
              <img src="${post.featureImage}" alt="${post.title}" style="width: 100%; height: auto; display: block;" />
            </figure>
          ` : ""}

          <div class="post-content" style="font-size: 18px; line-height: 1.8;">
            ${html([post.body] as any)}
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
    title: post.title,
    description: post.excerpt || undefined,
    bodyClass: "post-template",
    children: content,
  });
};

export default PostTemplate;
