import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";
import { PostCard } from "../partials/PostCard.tsx";
import { Pagination } from "../partials/Pagination.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type {
    CategoryData,
    MenuItem,
    PaginationData,
    PostData,
    SiteData,
} from "../helpers/index.ts";

/**
 * Search Template - Página de resultados de búsqueda
 */

interface SearchProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    query: string;
    posts: PostData[];
    pagination: PaginationData;
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
    categories?: CategoryData[];
}

export const SearchTemplate: FC<SearchProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        query,
        posts,
        pagination,
        menu = [],
        footerMenu = [],
        categories = [],
    } = props;

    const content = (
        <>
            <Header site={site} custom={custom} blogUrl="/blog" menu={menu} />

            <main class="site-main search-page">
                <div class="container">
                    <header class="page-header">
                        <h1 class="page-title">Resultados de búsqueda</h1>
                        <p class="search-query">
                            Buscando: <strong>"{query}"</strong>
                        </p>
                        {posts.length > 0 && (
                            <p class="search-count">
                                Se encontraron {pagination.totalPages * 10} resultados
                            </p>
                        )}
                    </header>

                    {/* Search Form */}
                    <div class="search-form-container">
                        <form action="/search" method="GET" class="search-form">
                            <input
                                type="search"
                                name="q"
                                placeholder="Buscar artículos..."
                                value={query}
                                required
                                class="search-input"
                            />
                            <button type="submit" class="btn btn-primary">
                                Buscar
                            </button>
                        </form>
                    </div>

                    {posts.length > 0 ? (
                        <>
                            <div class="posts-grid grid-2">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        showExcerpt={true}
                                        showAuthor={true}
                                        showDate={true}
                                        showCategories={true}
                                        showTags={true}
                                        showImage={true}
                                    />
                                ))}
                            </div>

                            {pagination.totalPages > 1 && (
                                <Pagination
                                    pagination={pagination}
                                    baseUrl={`/search?q=${encodeURIComponent(query)}&page`}
                                />
                            )}
                        </>
                    ) : (
                        <div class="no-results">
                            <svg class="no-results-icon" width="64" height="64" viewBox="0 0 24 24">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                            </svg>
                            <h2>No se encontraron resultados</h2>
                            <p>Intenta con otros términos de búsqueda</p>
                            <a href="/blog" class="btn btn-primary">Ver todos los posts</a>
                        </div>
                    )}
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
            title={`Búsqueda: ${query}`}
            description={`Resultados de búsqueda para "${query}"`}
            bodyClass="search-results"
        >
            {content}
        </Layout>
    );
};

export default SearchTemplate;
