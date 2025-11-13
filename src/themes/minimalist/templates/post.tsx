import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Minimalist Post Template - Clean single article view
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
    <header class="site-header" style="border-bottom: 1px solid var(--border-color); padding: 40px 0;">
      <div class="container">
        <h1 style="font-size: 24px; font-weight: 400;">
          <a href="/" style="color: var(--primary-color); text-decoration: none;">${site.name}</a>
        </h1>
      </div>
    </header>

    <main class="site-main">
      <article class="post-single">
        <div class="container" style="max-width: 700px;">
          <header class="post-header" style="margin-bottom: 60px; padding-bottom: 40px; border-bottom: 1px solid var(--border-color);">
            <h1 style="font-size: 42px; font-weight: 400; margin-bottom: 24px; line-height: 1.2;">${post.title}</h1>

            <div class="post-meta" style="font-size: 15px; color: var(--text-light);">
              ${post.author ? html`<span>${post.author.name || "Anónimo"}</span> · ` : ""}
              <time datetime="${new Date(publishDate).toISOString()}">${formattedDate}</time>
            </div>
          </header>

          ${post.featureImage ? html`
            <figure class="post-featured-image" style="margin: 0 0 60px 0;">
              <img src="${post.featureImage}" alt="${post.title}" style="width: 100%; height: auto; display: block;" />
            </figure>
          ` : ""}

          <div class="post-content" style="font-size: 19px; line-height: 1.8; color: var(--text-color);">
            ${html([post.body] as any)}
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
    title: post.title,
    description: post.excerpt || undefined,
    bodyClass: "post-template",
    children: content,
  });
};

export default PostTemplate;
