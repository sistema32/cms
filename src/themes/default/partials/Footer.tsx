import type { FC } from "hono/jsx";
import type { SiteData, MenuItem, CategoryData } from "../helpers/index.ts";

/**
 * Footer - Footer global del sitio
 */

interface FooterProps {
  site: SiteData;
  custom?: Record<string, any>;
  blogUrl?: string;
  footerMenu?: MenuItem[];
  categories?: CategoryData[];
}

export const Footer: FC<FooterProps> = (props) => {
  const { site, custom = {}, blogUrl = "/blog", footerMenu = [], categories = [] } = props;
  const currentYear = new Date().getFullYear();

  return (
    <footer class="site-footer">
      <div class="container">
        <div class="footer-content">
          {/* Columna 1: About */}
          <div class="footer-col">
            <h3 class="footer-title">Sobre {site.name}</h3>
            <p class="footer-description">
              {site.description || 'Un sitio web increíble'}
            </p>
          </div>

          {/* Columna 2: Links Rápidos (desde menú footer o default) */}
          <div class="footer-col">
            <h3 class="footer-title">Enlaces</h3>
            <ul class="footer-links">
              {footerMenu.length > 0 ? (
                footerMenu.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target={item.target || undefined}
                      title={item.title || undefined}
                    >
                      {item.icon && <span class="link-icon">{item.icon}</span>} {item.label}
                    </a>
                  </li>
                ))
              ) : (
                <>
                  <li><a href="/">Inicio</a></li>
                  <li><a href={blogUrl}>Blog</a></li>
                </>
              )}
            </ul>
          </div>

          {/* Columna 3: Categorías (dinámicas) */}
          {categories.length > 0 && (
            <div class="footer-col">
              <h3 class="footer-title">Categorías</h3>
              <ul class="footer-links">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <a href={`/category/${cat.slug}`}>
                      {cat.name}
                      {cat.count && <span class="count">({cat.count})</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Columna 4: Social / Newsletter */}
          <div class="footer-col">
            <h3 class="footer-title">Síguenos</h3>
            <div class="social-links">
              {custom.twitter_url && (
                <a href={custom.twitter_url} class="social-link" target="_blank" rel="noopener" aria-label="Twitter">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                </a>
              )}

              {custom.facebook_url && (
                <a href={custom.facebook_url} class="social-link" target="_blank" rel="noopener" aria-label="Facebook">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
              )}

              {custom.instagram_url && (
                <a href={custom.instagram_url} class="social-link" target="_blank" rel="noopener" aria-label="Instagram">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}

              {custom.github_url && (
                <a href={custom.github_url} class="social-link" target="_blank" rel="noopener" aria-label="GitHub">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div class="footer-bottom">
          <p class="copyright">
            © {currentYear} {site.name}. Todos los derechos reservados.
          </p>
          <p class="powered-by">
            Powered by <a href="https://github.com/yourusername/lexcms" target="_blank" rel="noopener">LexCMS</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
