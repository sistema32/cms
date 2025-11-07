import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../../default/partials/Header.tsx";
import { Footer } from "../../default/partials/Footer.tsx";
import { PostCard } from "../partials/PostCard.tsx";
import type { SiteData, PostData } from "../helpers/index.ts";

/**
 * Minimalist Home Template - Homepage minimalista
 * Diseño limpio y centrado en el contenido
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

  const heroTitle = custom.homepage_hero_title || `${site.name}`;
  const heroSubtitle = custom.homepage_hero_subtitle || site.description || "Un espacio para reflexionar y compartir ideas";

  const content = html`
    <!-- Header -->
    ${Header({ site, custom })}

    <!-- Main Content -->
    <main class="site-main minimalist-home">
      <!-- Hero Section: Minimal -->
      <section class="minimalist-hero">
        <div class="container">
          <h1 class="hero-title">${heroTitle}</h1>
          <p class="hero-subtitle">${heroSubtitle}</p>
        </div>
      </section>

      <!-- Posts Section: Clean list -->
      ${featuredPosts.length > 0 ? html`
        <section class="minimalist-posts-section">
          <div class="container">
            <div class="posts-list">
              ${featuredPosts.map((post) => PostCard({
                post,
                showExcerpt: true,
                showAuthor: true,
                showDate: true,
                showCategories: false,
                showTags: false,
                showImage: true,
              }))}
            </div>

            <div class="posts-footer">
              <a href="${blogUrl || /blog}" class="link-subtle">Ver todos los artículos →</a>
            </div>
          </div>
        </section>
      ` : ''}
    </main>

    <!-- Footer -->
    ${Footer({ site, custom })}

    <style>
      /* Minimalist Home Styles */
      .minimalist-home {
        padding: 0;
      }

      /* Hero Section */
      .minimalist-hero {
        padding: 120px 0 80px;
        text-align: center;
        border-bottom: 1px solid var(--border-color);
      }

      .hero-title {
        font-size: 56px;
        font-weight: 400;
        margin-bottom: 20px;
        letter-spacing: -0.03em;
      }

      .hero-subtitle {
        font-size: 20px;
        color: var(--text-light);
        font-weight: 300;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
      }

      /* Posts Section */
      .minimalist-posts-section {
        padding: 80px 0;
      }

      .posts-list {
        display: flex;
        flex-direction: column;
        gap: 60px;
        margin-bottom: 60px;
      }

      .posts-footer {
        text-align: center;
        padding-top: 40px;
        border-top: 1px solid var(--border-color);
      }

      .link-subtle {
        color: var(--text-color);
        text-decoration: none;
        font-size: 15px;
        letter-spacing: 0.5px;
        transition: opacity 0.3s;
      }

      .link-subtle:hover {
        opacity: 0.6;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .minimalist-hero {
          padding: 80px 0 60px;
        }

        .hero-title {
          font-size: 36px;
        }

        .hero-subtitle {
          font-size: 18px;
        }

        .posts-list {
          gap: 40px;
        }
      }
    </style>
  `;

  return Layout({
    site,
    custom,
    activeTheme,
    bodyClass: "home front-page minimalist-theme",
    children: content,
  });
};

export default HomeTemplate;
