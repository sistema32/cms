import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData } from "../helpers/index.ts";

/**
 * Corporate Post Template - Premium glassmorphism blog post view
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
  status: string;
  author?: PostAuthor;
  createdAt: Date | string;
  updatedAt: Date | string;
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

    <main class="site-main relative z-10 py-8 sm:py-12 lg:py-16">
      <article class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <!-- Post Header -->
        <div class="glass-panel mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-12">
          <header class="post-header">
            ${post.featureImage ? html`
              <figure class="post-featured-image -mx-6 -mt-6 mb-8 sm:-mx-8 sm:-mt-8 lg:-mx-12 lg:-mt-12">
                <img
                  src="${post.featureImage}"
                  alt="${post.title}"
                  class="aspect-video w-full object-cover"
                  loading="lazy"
                />
              </figure>
            ` : ""}

            <h1 class="mb-6 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              ${post.title}
            </h1>

            <div class="flex flex-wrap items-center gap-4 border-b border-white/10 pb-6 text-sm text-slate-300">
              ${post.author ? html`
                <div class="flex items-center gap-3">
                  ${post.author.avatar ? html`
                    <img
                      src="${post.author.avatar}"
                      alt="${post.author.name}"
                      class="h-10 w-10 rounded-full border border-white/10"
                    />
                  ` : html`
                    <div class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 font-semibold text-primary-200">
                      ${(post.author.name || "A").substring(0, 1).toUpperCase()}
                    </div>
                  `}
                  <div class="flex flex-col">
                    <span class="font-medium text-white">${post.author.name || "Anónimo"}</span>
                    <time datetime="${new Date(publishDate).toISOString()}" class="text-xs text-slate-400">
                      ${formattedDate}
                    </time>
                  </div>
                </div>
              ` : html`
                <time datetime="${new Date(publishDate).toISOString()}" class="text-slate-400">
                  ${formattedDate}
                </time>
              `}
            </div>
          </header>

          <!-- Post Content -->
          <div class="post-content prose prose-invert prose-lg mt-8 max-w-none">
            ${html([post.body] as any)}
          </div>
        </div>

        <!-- Share Section -->
        <div class="glass-panel mb-8 rounded-3xl p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">Compartir artículo</h3>
            <div class="flex gap-2">
              <a
                href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(site.url + "/" + post.slug)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                title="Compartir en Twitter"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(site.url + "/" + post.slug)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                title="Compartir en Facebook"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 3.667h-3.533v7.98H9.101z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(site.url + "/" + post.slug)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                title="Compartir en LinkedIn"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
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
    title: post.title,
    description: post.excerpt || undefined,
    bodyClass: "post-template",
    children: content,
  });
};

export default PostTemplate;
