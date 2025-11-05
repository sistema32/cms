import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData } from "../helpers/index.ts";

/**
 * Modern Home Template - Contemporary design inspired by tiptap.dev and astro.build
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

  const heroTitle = custom.homepage_hero_title || "Build something amazing";
  const heroSubtitle = custom.homepage_hero_subtitle || "The modern platform for developers who want to ship fast";

  const content = html`
    ${Header({ site, custom })}

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      <div class="mx-auto max-w-7xl">
        <div class="text-center">
          <!-- Badge -->
          <div class="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
            </span>
            New features just landed
          </div>

          <!-- Title -->
          <h1 class="mb-6 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            ${heroTitle}
          </h1>

          <!-- Subtitle -->
          <p class="mx-auto mb-10 max-w-2xl text-lg text-slate-600 sm:text-xl">
            ${heroSubtitle}
          </p>

          <!-- CTAs -->
          <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/blog"
              class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-purple-500/70"
            >
              Get Started
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="#features"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              View Features
            </a>
          </div>

          <!-- Stats -->
          <div class="mt-16 grid grid-cols-2 gap-8 border-t border-slate-200 pt-10 sm:grid-cols-4">
            <div>
              <div class="text-3xl font-bold text-slate-900">50K+</div>
              <div class="mt-1 text-sm text-slate-600">Active Users</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-slate-900">99.9%</div>
              <div class="mt-1 text-sm text-slate-600">Uptime</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-slate-900">200+</div>
              <div class="mt-1 text-sm text-slate-600">Integrations</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-slate-900">24/7</div>
              <div class="mt-1 text-sm text-slate-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <div class="mb-16 text-center">
          <h2 class="mb-4 text-4xl font-bold text-slate-900">Everything you need</h2>
          <p class="mx-auto max-w-2xl text-lg text-slate-600">
            Powerful features to help you build and scale your projects
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- Feature 1 -->
          <div class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div class="mb-4 inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 p-3">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-semibold text-slate-900">Lightning Fast</h3>
            <p class="text-slate-600">Optimized for speed and performance. Load times under 100ms.</p>
          </div>

          <!-- Feature 2 -->
          <div class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div class="mb-4 inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 p-3">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-semibold text-slate-900">Secure by Default</h3>
            <p class="text-slate-600">Enterprise-grade security with end-to-end encryption.</p>
          </div>

          <!-- Feature 3 -->
          <div class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div class="mb-4 inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 p-3">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-semibold text-slate-900">Fully Customizable</h3>
            <p class="text-slate-600">Tailor everything to match your brand and workflow.</p>
          </div>

          <!-- Feature 4 -->
          <div class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div class="mb-4 inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 p-3">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-semibold text-slate-900">Team Collaboration</h3>
            <p class="text-slate-600">Work together seamlessly with real-time updates.</p>
          </div>

          <!-- Feature 5 -->
          <div class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div class="mb-4 inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 p-3">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-semibold text-slate-900">Analytics</h3>
            <p class="text-slate-600">Deep insights into your data with beautiful visualizations.</p>
          </div>

          <!-- Feature 6 -->
          <div class="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div class="mb-4 inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 p-3">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 class="mb-2 text-xl font-semibold text-slate-900">Integrations</h3>
            <p class="text-slate-600">Connect with all your favorite tools and services.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Posts -->
    ${featuredPosts.length > 0 ? html`
      <section class="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <div class="mb-16 flex items-end justify-between">
            <div>
              <h2 class="mb-4 text-4xl font-bold text-slate-900">Latest from our blog</h2>
              <p class="text-lg text-slate-600">Tips, guides, and news from our team</p>
            </div>
            <a
              href="/blog"
              class="hidden text-sm font-semibold text-purple-600 transition hover:text-purple-700 sm:block"
            >
              View all posts →
            </a>
          </div>

          <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            ${featuredPosts.slice(0, 3).map((post) => html`
              <article class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
                ${post.featureImage ? html`
                  <div class="overflow-hidden">
                    <img
                      src="${post.featureImage}"
                      alt="${post.title}"
                      class="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ` : ''}
                <div class="p-6">
                  <time class="text-sm text-slate-500">
                    ${new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <h3 class="mt-2 text-xl font-semibold text-slate-900 group-hover:text-purple-600">
                    <a href="/blog/${post.slug}">${post.title}</a>
                  </h3>
                  ${post.excerpt ? html`
                    <p class="mt-3 text-slate-600">${post.excerpt}</p>
                  ` : ''}
                  <div class="mt-4 flex items-center gap-2">
                    <span class="text-sm font-medium text-purple-600">Read more</span>
                    <svg class="h-4 w-4 text-purple-600 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </article>
            `)}
          </div>

          <div class="mt-12 text-center sm:hidden">
            <a
              href="/blog"
              class="text-sm font-semibold text-purple-600 transition hover:text-purple-700"
            >
              View all posts →
            </a>
          </div>
        </div>
      </section>
    ` : ''}

    <!-- CTA Section -->
    <section class="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-4xl text-center">
        <h2 class="mb-6 text-4xl font-bold text-white sm:text-5xl">
          Ready to get started?
        </h2>
        <p class="mb-10 text-xl text-purple-100">
          Join thousands of developers building amazing things
        </p>
        <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#contact"
            class="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-purple-600 shadow-lg transition hover:bg-purple-50"
          >
            Start for free
          </a>
          <a
            href="/blog"
            class="inline-flex items-center gap-2 rounded-lg border-2 border-white bg-transparent px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Learn more
          </a>
        </div>
      </div>
    </section>

    ${Footer({ site, custom })}
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    bodyClass: "modern-theme",
    children: content,
  });
};

export default HomeTemplate;
