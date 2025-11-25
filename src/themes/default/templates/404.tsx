import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, MenuItem, CategoryData } from "../helpers/index.ts";

/**
 * 404 Template - Página de error 404
 */

interface NotFoundProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
    categories?: CategoryData[];
}

export const NotFoundTemplate: FC<NotFoundProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        menu = [],
        footerMenu = [],
        categories = [],
    } = props;

    const content = (
        <>
            <Header site={site} custom={custom} blogUrl="/blog" menu={menu} />

            <main class="site-main error-404">
                <div class="container">
                    <div class="error-content">
                        <div class="error-code">404</div>
                        <h1 class="error-title">Página no encontrada</h1>
                        <p class="error-message">
                            Lo sentimos, la página que buscas no existe o ha sido movida.
                        </p>

                        {/* Search Form */}
                        <div class="error-search">
                            <p>¿Quieres buscar algo?</p>
                            <form action="/search" method="GET" class="search-form">
                                <input
                                    type="search"
                                    name="q"
                                    placeholder="Buscar artículos..."
                                    required
                                    class="search-input"
                                />
                                <button type="submit" class="btn btn-primary">
                                    Buscar
                                </button>
                            </form>
                        </div>

                        {/* Quick Links */}
                        <div class="error-links">
                            <h2>Enlaces útiles</h2>
                            <ul>
                                <li>
                                    <a href="/">Ir al inicio</a>
                                </li>
                                <li>
                                    <a href="/blog">Ver el blog</a>
                                </li>
                                {categories.slice(0, 5).map((cat) => (
                                    <li key={cat.id}>
                                        <a href={`/category/${cat.slug}`}>{cat.name}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Illustration */}
                        <div class="error-illustration">
                            <svg width="200" height="200" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                                    fill="currentColor"
                                    opacity="0.2"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </main>

            <Footer site={site} custom={custom} blogUrl="/blog" footerMenu={footerMenu} categories={categories} />
        </>
    );

    return (
        <Layout
            site={site}
            custom={custom}
            activeTheme={activeTheme}
            title="404 - Página no encontrada"
            description="La página que buscas no existe"
            bodyClass="error-404 not-found"
        >
            {content}
        </Layout>
    );
};

export default NotFoundTemplate;
