import { html } from "hono/html";

/**
 * Hero - Hero section para la homepage
 * Sección principal con título, descripción y CTA
 */

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundImage?: string;
  style?: "default" | "centered" | "large" | "minimal";
}

export const Hero = (props: HeroProps) => {
  const {
    title = "Bienvenido a Nuestro Blog",
    subtitle = "Descubre artículos increíbles sobre tecnología, diseño y más",
    ctaText = "Ver últimos posts",
    ctaUrl = "/blog",
    backgroundImage,
    style = "default",
  } = props;

  const heroClasses = `hero hero-${style}`;

  return html`
    <section
      class="${heroClasses}"
      ${backgroundImage ? `style="background-image: url('${backgroundImage}');"` : ''}
    >
      <div class="hero-overlay"></div>
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">${title}</h1>

          ${subtitle ? html`
            <p class="hero-subtitle">${subtitle}</p>
          ` : ''}

          ${ctaText && ctaUrl ? html`
            <div class="hero-cta">
              <a href="${ctaUrl}" class="btn btn-primary btn-lg">
                ${ctaText}
                <svg class="icon icon-arrow" width="20" height="20" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          ` : ''}

          <!-- Scroll indicator (opcional) -->
          ${style === "large" ? html`
            <div class="hero-scroll-indicator">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </div>
          ` : ''}
        </div>
      </div>
    </section>
  `;
};

export default Hero;
