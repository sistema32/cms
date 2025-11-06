import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData, PaginationData } from "../helpers/index.ts";

/**
 * Base Blog Template - Clean and simple blog listing
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
  const blogDescription = custom.blog_description || "Latest articles and updates";

  const content = html`
    ${Header({ site, custom, blogUrl })}

    <!-- Hero Header -->
    <section class="border-b border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            ${blogTitle}
          </h1>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            ${blogDescription}
          </p>
        </div>
      </div>
    </section>

    <!-- Posts Grid -->
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        ${posts.length > 0 ? html`
          <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            ${posts.map((post) => html`
              <article class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
                ${post.featureImage ? html`
                  <div class="aspect-video overflow-hidden bg-gray-100">
                    <img
                      src="${post.featureImage}"
                      alt="${post.title}"
                      class="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                ` : ''}

                <div class="flex flex-1 flex-col p-6">
                  <!-- Meta -->
                  <div class="mb-3 flex items-center gap-3 text-sm text-gray-500">
                    <time datetime="${post.createdAt.toISOString()}">
                      ${new Date(post.createdAt).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </time>
                    ${post.categories.length > 0 ? html`
                      <span>·</span>
                      <span class="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        ${post.categories[0].name}
                      </span>
                    ` : ''}
                  </div>

                  <!-- Title -->
                  <h2 class="mb-3 text-xl font-bold text-gray-900 hover:text-gray-700">
                    <a href="/${blogUrl}/${post.slug}">
                      ${post.title}
                    </a>
                  </h2>

                  <!-- Excerpt -->
                  ${post.excerpt ? html`
                    <p class="mb-4 flex-1 text-gray-600">
                      ${post.excerpt}
                    </p>
                  ` : ''}

                  <!-- Read More -->
                  <a
                    href="/${blogUrl}/${post.slug}"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:gap-3"
                  >
                    Read more
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </article>
            `)}
          </div>

          <!-- Pagination -->
          ${pagination.totalPages > 1 ? html`
            <div class="mt-12 flex justify-center">
              <nav class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white shadow-sm">
                ${pagination.hasPrev ? html`
                  <a
                    href="${pagination.prevPage === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${pagination.prevPage}`}"
                    class="inline-flex h-10 w-10 items-center justify-center border-r border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </a>
                ` : ''}

                ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => html`
                  <a
                    href="${page === 1 ? `/${blogUrl}` : `/${blogUrl}/page/${page}`}"
                    class="inline-flex h-10 w-10 items-center justify-center text-sm font-medium ${
                      page === pagination.currentPage
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    } ${page < pagination.totalPages ? 'border-r border-gray-300' : ''}"
                  >
                    ${page}
                  </a>
                `)}

                ${pagination.hasNext ? html`
                  <a
                    href="/${blogUrl}/page/${pagination.nextPage}"
                    class="inline-flex h-10 w-10 items-center justify-center text-gray-700 hover:bg-gray-50"
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
          <div class="rounded-lg border border-gray-200 bg-gray-50 px-6 py-20 text-center">
            <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-bold text-gray-900">No posts yet</h3>
            <p class="text-gray-600">Check back soon for new content!</p>
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
    bodyClass: "blog base-theme",
    children: content,
  });
};

export default BlogTemplate;
