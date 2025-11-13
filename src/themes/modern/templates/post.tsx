import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Modern Post Template - Contemporary blog post view
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
    ${Header({ site, custom, blogUrl: "/blog" })}

    <main class="container mx-auto max-w-4xl px-4 py-12">
      <article class="animate-fade-in">
        ${post.featureImage ? html`
          <figure class="mb-8 -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden">
            <img
              src="${post.featureImage}"
              alt="${post.title}"
              class="w-full h-auto object-cover"
            />
          </figure>
        ` : ""}

        <header class="mb-8">
          <h1 class="text-4xl sm:text-5xl font-display font-bold mb-4 gradient-text">
            ${post.title}
          </h1>

          <div class="flex items-center gap-4 text-sm text-gray-600">
            ${post.author ? html`
              <div class="flex items-center gap-2">
                ${post.author.avatar ? html`
                  <img
                    src="${post.author.avatar}"
                    alt="${post.author.name}"
                    class="w-10 h-10 rounded-full"
                  />
                ` : html`
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    ${(post.author.name || "A").substring(0, 1).toUpperCase()}
                  </div>
                `}
                <span class="font-medium text-gray-900">${post.author.name || "Anónimo"}</span>
              </div>
            ` : ""}
            <time datetime="${new Date(publishDate).toISOString()}" class="text-gray-500">
              ${formattedDate}
            </time>
          </div>
        </header>

        <div class="prose prose-lg max-w-none">
          ${html([post.body] as any)}
        </div>

        <footer class="mt-12 pt-8 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Compartir</h3>
            <div class="flex gap-3">
              <a
                href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(site.url + "/" + post.slug)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(site.url + "/" + post.slug)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 3.667h-3.533v7.98H9.101z"/>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </article>
    </main>

    ${Footer({ site, custom, blogUrl: "/blog" })}
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
