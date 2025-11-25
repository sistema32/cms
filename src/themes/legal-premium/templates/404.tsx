import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, CategoryData, MenuItem } from "../helpers/index.ts";

interface NotFoundProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    categories?: CategoryData[];
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
}

export const NotFoundTemplate: FC<NotFoundProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        categories = [],
        menu = [],
        footerMenu = [],
    } = props;

    const content = (
        <>
            <Header site={site} custom={custom} menu={menu} blogUrl="/blog" />

            <main class="py-5">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-6 mx-auto text-center py-5">
                            <div class="mb-4">
                                <h1 class="display-1 fw-bold text-primary">404</h1>
                            </div>

                            <h2 class="h3 fw-bold mb-3">Página no encontrada</h2>
                            <p class="lead text-muted mb-4">
                                Lo sentimos, la página que buscas no existe o ha sido movida.
                            </p>

                            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-5">
                                <a href="/" class="btn btn-premium btn-premium-primary">
                                    Ir al inicio
                                </a>
                                <a href="/blog" class="btn btn-premium btn-premium-outline">
                                    Ver el blog
                                </a>
                            </div>

                            {/* Search */}
                            <div class="card-premium p-4 text-start">
                                <h3 class="h5 fw-bold mb-3">¿Quieres buscar algo?</h3>
                                <form action="/search" method="GET">
                                    <div class="input-group">
                                        <input
                                            type="search"
                                            name="q"
                                            class="form-control"
                                            placeholder="Buscar artículos..."
                                            required
                                        />
                                        <button class="btn btn-primary" type="submit">
                                            Buscar
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Quick Links */}
                            {categories.length > 0 && (
                                <div class="mt-4">
                                    <h4 class="h6 fw-bold mb-3">O explora estas categorías:</h4>
                                    <div class="d-flex flex-wrap gap-2 justify-content-center">
                                        {categories.slice(0, 5).map((cat) => (
                                            <a
                                                href={`/category/${cat.slug}`}
                                                class="badge bg-primary bg-opacity-10 text-primary px-3 py-2"
                                                key={cat.id}
                                            >
                                                {cat.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer site={site} custom={custom} categories={categories} footerMenu={footerMenu} blogUrl="/blog" />
        </>
    );

    return (
        <Layout
            site={site}
            custom={custom}
            activeTheme={activeTheme}
            title="404 - Página no encontrada"
            bodyClass="error-404"
        >
            {content}
        </Layout>
    );
};

export default NotFoundTemplate;
