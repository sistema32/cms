import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData } from "../helpers/index.ts";

/**
 * Base Home Template - Clean and simple homepage
 */

interface HomeProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  featuredPosts: PostData[];
  categories?: Array<{ id: number; name: string; slug: string; count?: number }>;
}

export const HomeTemplate = (props: HomeProps) => {
  const { site, custom, activeTheme, featuredPosts } = props;

  const heroTitle = custom.homepage_hero_title || "Welcome to " + site.name;
  const heroSubtitle = custom.homepage_hero_subtitle || site.description || "A clean and simple blog";

  const content = html`
    ${Header({ site, custom })}

    <!-- Hero Section -->
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            ${heroTitle}
          </h1>
          <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            ${heroSubtitle}
          </p>
          <div class="mt-10 flex justify-center gap-4">
            <a
              href="/blog"
              class="rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
            >
              Read the blog
            </a>
            <a
              href="#contact"
              class="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Get in touch
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Posts -->
    ${featuredPosts.length > 0 ? html`
      <section class="bg-gray-50">
        <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-gray-900">Latest Posts</h2>
            <p class="mt-2 text-gray-600">Check out our most recent articles</p>
          </div>

          <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            ${featuredPosts.slice(0, 6).map((post) => html`
              <article class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                ${post.featureImage ? html`
                  <img
                    src="${post.featureImage}"
                    alt="${post.title}"
                    class="h-48 w-full object-cover"
                    loading="lazy"
                  />
                ` : ''}
                <div class="p-6">
                  <time class="text-xs text-gray-500">
                    ${new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <h3 class="mt-2 text-xl font-semibold text-gray-900">
                    <a href="/blog/${post.slug}" class="hover:text-gray-700">
                      ${post.title}
                    </a>
                  </h3>
                  ${post.excerpt ? html`
                    <p class="mt-3 text-sm text-gray-600">${post.excerpt}</p>
                  ` : ''}
                  <a
                    href="/blog/${post.slug}"
                    class="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700"
                  >
                    Read more
                    <svg class="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </article>
            `)}
          </div>

          <div class="mt-12 text-center">
            <a
              href="/blog"
              class="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              View all posts
            </a>
          </div>
        </div>
      </section>
    ` : ''}

    <!-- Contact CTA -->
    <section id="contact" class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center sm:p-12">
          <h2 class="text-3xl font-bold text-gray-900">Get in Touch</h2>
          <p class="mt-4 text-lg text-gray-600">
            Have a question or want to work together?
          </p>
          <div class="mt-8">
            <a
              href="mailto:hello@example.com"
              class="inline-flex items-center rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
            >
              Send us an email
            </a>
          </div>
        </div>
      </div>
    </section>

    ${Footer({ site, custom })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    bodyClass: "base-theme",
    children: content,
  });
};

export default HomeTemplate;
