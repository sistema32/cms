import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData, PaginationData } from "../helpers/index.ts";

/**
 * Modern Blog Template - Contemporary blog listing
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

  const blogTitle = custom.blog_title || "Blog";
  const blogDescription = custom.blog_description || "Latest articles and insights";

  const content = html`
    ${Header({ site, custom, blogUrl })}

    <!-- Hero Header -->
    <section class="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-16 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <div class="text-center">
          <h1 class="mb-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            ${blogTitle}
          </h1>
          <p class="mx-auto max-w-2xl text-lg text-slate-600">
            ${blogDescription}
          </p>
        </div>
      </div>
    </section>

    <!-- Posts Grid -->
    <section class="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        ${posts.length > 0 ? html`
          <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            ${posts.map((post) => html`
              <article class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl">
                ${post.featureImage ? html`
                  <div class="aspect-video overflow-hidden bg-slate-100">
                    <img
                      src="${post.featureImage}"
                      alt="${post.title}"
                      class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                ` : ''}

                <div class="flex flex-1 flex-col p-6">
                  <!-- Meta -->
                  <div class="mb-3 flex items-center gap-3 text-sm text-slate-600">
                    <time datetime="${post.createdAt.toISOString()}">
                      ${new Date(post.createdAt).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </time>
                    ${post.categories.length > 0 ? html`
                      <span>·</span>
                      <span class="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                        ${post.categories[0].name}
                      </span>
                    ` : ''}
                  </div>

                  <!-- Title -->
                  <h2 class="mb-3 text-xl font-bold text-slate-900 group-hover:text-purple-600">
                    <a href="/${blogUrl}/${post.slug}" class="transition">
                      ${post.title}
                    </a>
                  </h2>

                  <!-- Excerpt -->
                  ${post.excerpt ? html`
                    <p class="mb-4 flex-1 text-slate-600">
                      ${post.excerpt}
                    </p>
                  ` : ''}

                  <!-- Read More -->
                  <a
                    href="/${blogUrl}/${post.slug}"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 transition hover:gap-3"
                  >
                    Read more
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </article>
            `)}
          </div>

          <!-- Pagination -->
          ${pagination.totalPages > 1 ? html`
            <div class="mt-12 flex justify-center">
              <nav class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                ${pagination.hasPrev ? html`
                  <a
                    href="${pagination.prevPage === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${pagination.prevPage}`}"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </a>
                ` : ''}

                ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => html`
                  <a
                    href="${page === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${page}`}"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition ${
                      page === pagination.currentPage
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-slate-600 hover:bg-slate-100'
                    }"
                  >
                    ${page}
                  </a>
                `)}

                ${pagination.hasNext ? html`
                  <a
                    href="/${blogUrl}/page/${pagination.nextPage}"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ` : ''}
              </nav>
            </div>
          ` : ''}
        ` : html`
          <!-- Empty State -->
          <div class="py-20 text-center">
            <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg class="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-bold text-slate-900">No posts yet</h3>
            <p class="text-slate-600">Check back soon for new content!</p>
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
    bodyClass: "blog modern-theme",
    children: content,
  });
};

export default BlogTemplate;
