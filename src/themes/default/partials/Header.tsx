import type { FC } from "hono/jsx";
import type { SiteData, MenuItem } from "../helpers/index.ts";

/**
 * Header - Header global del sitio
 * Incluye logo, menú de navegación
 */

interface HeaderProps {
  site: SiteData;
  menu?: MenuItem[];
  custom?: Record<string, any>;
  blogUrl?: string;
}

export const Header: FC<HeaderProps> = (props) => {
  const { site, menu = [], custom = {}, blogUrl = "/blog" } = props;

  return (
    <header class="site-header">
      <div class="container">
        <div class="header-inner">
          {/* Logo y Nombre del Sitio */}
          <div class="site-branding">
            <a href="/" class="site-logo-link">
              {custom.logo_image && (
                <img
                  src={custom.logo_image}
                  alt={site.name}
                  class="site-logo"
                />
              )}
              <span class="site-title">{site.name}</span>
            </a>
            {site.description && (
              <p class="site-description">{site.description}</p>
            )}
          </div>

          {/* Navegación Principal */}
          <nav class="site-nav" role="navigation" aria-label="Navegación principal">
            <button class="nav-toggle" aria-label="Abrir menú" aria-expanded="false">
              <span class="nav-toggle-bar"></span>
              <span class="nav-toggle-bar"></span>
              <span class="nav-toggle-bar"></span>
            </button>

            <ul class="nav-menu">
              {menu.length > 0 ? (
                menu.map((item) => (
                  <li
                    key={item.id}
                    class={`nav-item ${item.children && item.children.length > 0 ? 'has-children' : ''}`}
                  >
                    <a
                      href={item.url}
                      class={`nav-link ${item.cssClass || ''}`}
                      target={item.target || undefined}
                      title={item.title || undefined}
                    >
                      {item.icon && (
                        <span class="nav-icon">{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                    </a>

                    {/* Submenú si existe */}
                    {item.children && item.children.length > 0 && (
                      <ul class="nav-submenu">
                        {item.children.map((child) => (
                          <li key={child.id} class="nav-subitem">
                            <a
                              href={child.url}
                              class={`nav-sublink ${child.cssClass || ''}`}
                              target={child.target || undefined}
                              title={child.title || undefined}
                            >
                              {child.icon && (
                                <span class="nav-icon">{child.icon}</span>
                              )}
                              <span>{child.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))
              ) : (
                <>
                  <li class="nav-item">
                    <a href="/" class="nav-link">Inicio</a>
                  </li>
                  <li class="nav-item">
                    <a href={blogUrl} class="nav-link">Blog</a>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Búsqueda (opcional) */}
          <div class="header-search">
            <button class="search-toggle" aria-label="Abrir búsqueda">
              <svg class="icon icon-search" width="20" height="20" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
