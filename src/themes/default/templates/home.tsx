import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Hero } from "../partials/Hero.tsx";
import { PostCard } from "../partials/PostCard.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData } from "../helpers/index.ts";

/**
 * Home Template - Homepage estática personalizable
 * Inspirado en front-page.php de WordPress y home.hbs de Ghost
 *
 * Esta es la página principal del sitio (diferente del blog)
 */

interface HomeProps {
  site: SiteData;
  custom: Record<string, any>;
  featuredPosts: PostData[];
  categories?: Array<{ id: number; name: string; slug: string; count?: number }>;
}

export const HomeTemplate = (props: HomeProps) => {
  const { site, custom, featuredPosts, categories = [] } = props;

  // Settings de la homepage
  const heroTitle = custom.homepage_hero_title || `Bienvenido a ${site.name}`;
  const heroSubtitle = custom.homepage_hero_subtitle || site.description || "Descubre contenido increíble";
  const heroCtaText = custom.homepage_hero_cta_text || "Ver Blog";
  const heroCtaUrl = custom.homepage_hero_cta_url || "/blog";
  const heroBackgroundImage = custom.homepage_hero_background;
  const heroStyle = custom.homepage_hero_style || "default";
  const showFeaturedPosts = custom.homepage_show_featured !== false;
  const showCategories = custom.homepage_show_categories !== false;
  const showNewsletter = custom.homepage_show_newsletter !== false;

  const content = html`
    <!-- Header -->
    ${Header({ site, custom })}

    <!-- Hero Section -->
    ${Hero({
      title: heroTitle,
      subtitle: heroSubtitle,
      ctaText: heroCtaText,
      ctaUrl: heroCtaUrl,
      backgroundImage: heroBackgroundImage,
      style: heroStyle,
    })}

    <!-- Main Content -->
    <main class="site-main homepage">
      <!-- Featured Posts Section -->
      ${showFeaturedPosts && featuredPosts.length > 0 ? html`
        <section class="homepage-section featured-posts-section">
          <div class="container">
            <div class="section-header">
              <h2 class="section-title">
                ${custom.homepage_featured_title || "Últimos Artículos"}
              </h2>
              <p class="section-description">
                ${custom.homepage_featured_subtitle || "Descubre nuestro contenido más reciente"}
              </p>
            </div>

            <div class="posts-grid grid-3">
              ${featuredPosts.map((post) => PostCard({
                post,
                showExcerpt: true,
                showAuthor: true,
                showDate: true,
                showCategories: true,
                showTags: false,
                showImage: true,
              }))}
            </div>

            <div class="section-footer">
              <a href="/blog" class="btn btn-secondary">
                Ver todos los artículos
                <svg class="icon" width="16" height="16" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        </section>
      ` : ''}

      <!-- About/Features Section (opcional) -->
      ${custom.homepage_about_text ? html`
        <section class="homepage-section about-section">
          <div class="container">
            <div class="about-content">
              <h2 class="section-title">
                ${custom.homepage_about_title || "¿Quiénes Somos?"}
              </h2>
              <div class="about-text">
                ${custom.homepage_about_text}
              </div>
            </div>
          </div>
        </section>
      ` : ''}

      <!-- Categories Section -->
      ${showCategories && categories.length > 0 ? html`
        <section class="homepage-section categories-section">
          <div class="container">
            <div class="section-header">
              <h2 class="section-title">
                ${custom.homepage_categories_title || "Explora por Categoría"}
              </h2>
            </div>

            <div class="categories-grid">
              ${categories.slice(0, 6).map((cat) => html`
                <a href="/category/${cat.slug}" class="category-card">
                  <div class="category-card-inner">
                    <h3 class="category-card-title">${cat.name}</h3>
                    ${cat.count ? html`
                      <span class="category-card-count">${cat.count} artículos</span>
                    ` : ''}
                  </div>
                </a>
              `)}
            </div>
          </div>
        </section>
      ` : ''}

      <!-- Newsletter / CTA Section -->
      ${showNewsletter ? html`
        <section class="homepage-section cta-section">
          <div class="container">
            <div class="cta-content">
              <div class="cta-text">
                <h2 class="cta-title">
                  ${custom.homepage_cta_title || "¡No te pierdas nada!"}
                </h2>
                <p class="cta-description">
                  ${custom.homepage_cta_text || "Suscríbete a nuestro newsletter para recibir las últimas actualizaciones."}
                </p>
              </div>

              <div class="cta-form">
                <form action="/subscribe" method="POST" class="newsletter-form">
                  <div class="form-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Tu email"
                      required
                      class="form-input"
                    />
                    <button type="submit" class="btn btn-primary">
                      Suscribirse
                    </button>
                  </div>
                  <p class="form-note">
                    No spam. Solo contenido de calidad en tu inbox.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      ` : ''}
    </main>

    <!-- Footer -->
    ${Footer({ site, custom })}
  `;

  return Layout({
    site,
    custom,
    bodyClass: "home front-page",
    children: content,
  });
};

export default HomeTemplate;
