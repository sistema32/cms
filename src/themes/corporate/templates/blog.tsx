import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData, PaginationData } from "../helpers/index.ts";

/**
 * Corporate Blog Template - Premium B2B blog listing
 * Glassmorphism design with aurora effects
 */

interface BlogProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  posts: PostData[];
  pagination: PaginationData;
  recentPosts?: PostData[];
  categories?: Array<{ id: number; name: string; slug: string; count?: number }>;
  tags?: Array<{ id: number; name: string; slug: string; count?: number }>;
  blogUrl?: string;
}

export const BlogTemplate = (props: BlogProps) => {
  const { site, custom, activeTheme, posts, pagination, blogUrl = "blog" } = props;

  const blogTitle = custom.blog_title || "Perspectivas y Conocimiento";
  const blogDescription = custom.blog_description || "Artículos, análisis y tendencias para líderes empresariales";

  const content = html`
    ${Header({ site, custom, blogUrl })}

    <!-- Hero Header -->
    <section class="relative overflow-hidden scroll-reveal">
      <div class="split-highlight absolute inset-y-0 right-0 hidden w-2/3 lg:block"></div>
      <div class="relative isolate px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="mx-auto max-w-6xl text-center">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-slate-300 shadow-aurora sm:text-xs sm:tracking-[0.35em]">
            <span class="h-1.5 w-1.5 rounded-full bg-primary-300"></span>
            Contenido Premium
          </div>
          <h1 class="mb-4 text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            ${blogTitle}
          </h1>
          <p class="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            ${blogDescription}
          </p>
        </div>
      </div>
    </section>

    <!-- Posts Grid -->
    <section class="scroll-reveal px-4 py-16 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl">
        ${posts.length > 0 ? html`
          <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            ${posts.map((post) => html`
              <article class="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-glass backdrop-blur-sm transition hover:border-primary-300/30 hover:shadow-aurora">
                ${post.featureImage ? html`
                  <div class="aspect-video overflow-hidden bg-slate-800/50">
                    <img
                      src="${post.featureImage}"
                      alt="${post.title}"
                      class="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  </div>
                ` : ''}

                <div class="flex flex-1 flex-col p-6">
                  <!-- Meta -->
                  <div class="mb-4 flex items-center gap-3 text-xs text-slate-400">
                    <time datetime="${post.createdAt.toISOString()}">
                      ${new Date(post.createdAt).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </time>
                    ${post.categories.length > 0 ? html`
                      <span>·</span>
                      <span class="rounded-full border border-primary-300/20 bg-primary-500/10 px-3 py-1 text-[10px] uppercase tracking-wider text-primary-200">
                        ${post.categories[0].name}
                      </span>
                    ` : ''}
                  </div>

                  <!-- Title -->
                  <h2 class="mb-3 text-xl font-semibold text-white transition group-hover:text-primary-200">
                    <a href="/${blogUrl}/${post.slug}">
                      ${post.title}
                    </a>
                  </h2>

                  <!-- Excerpt -->
                  ${post.excerpt ? html`
                    <p class="mb-4 flex-1 text-sm leading-relaxed text-slate-300">
                      ${post.excerpt}
                    </p>
                  ` : ''}

                  <!-- Read More -->
                  <a
                    href="/${blogUrl}/${post.slug}"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-primary-300 transition hover:gap-3 hover:text-primary-200"
                  >
                    Leer más
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </div>
              </article>
            `)}
          </div>

          <!-- Pagination -->
          ${pagination.totalPages > 1 ? html`
            <div class="mt-16 flex justify-center">
              <nav class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-2 shadow-glass backdrop-blur-sm">
                ${pagination.hasPrev ? html`
                  <a
                    href="${pagination.prevPage === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${pagination.prevPage}`}"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </a>
                ` : ''}

                ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => html`
                  <a
                    href="${page === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${page}`}"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                      page === pagination.currentPage
                        ? 'bg-primary-500 text-white shadow-aurora'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }"
                  >
                    ${page}
                  </a>
                `)}

                ${pagination.hasNext ? html`
                  <a
                    href="/${blogUrl}/page/${pagination.nextPage}"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ` : ''}
              </nav>
            </div>
          ` : ''}
        ` : html`
          <!-- Empty State -->
          <div class="scroll-reveal rounded-3xl border border-white/10 bg-white/5 px-6 py-20 text-center shadow-glass backdrop-blur-sm">
            <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <svg class="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-semibold text-white">Próximamente</h3>
            <p class="text-sm text-slate-300">Estamos preparando contenido de valor para usted.</p>
          </div>
        `}
      </div>
    </section>

    ${Footer({ site, custom, blogUrl })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    bodyClass: "blog corporate-theme",
    children: content,
  });
};

export default BlogTemplate;
