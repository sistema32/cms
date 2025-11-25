import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type {
    SiteData,
    PostData,
    PaginationData,
    CategoryData,
    MenuItem,
} from "../helpers/index.ts";

interface BlogProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    posts: PostData[];
    pagination: PaginationData;
    categories?: CategoryData[];
    blogBase?: string;
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
}

export const BlogTemplate: FC<BlogProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        posts,
        pagination,
        categories = [],
        blogBase = "blog",
        menu = [],
        footerMenu = [],
    } = props;

    const content = (
        <>
            <Header site={site} custom={custom} menu={menu} blogUrl={`/${blogBase}`} />

            <main class="py-5">
                <div class="container">
                    {/* Page Header */}
                    <div class="section-header text-center mb-5">
                        <h1 class="section-title">Blog</h1>
                        <p class="section-subtitle mx-auto">
                            Ideas, insights y tendencias para líderes legales y empresariales
                        </p>
                    </div>

                    {/* Posts Grid */}
                    {posts.length > 0 ? (
                        <>
                            <div class="row g-4 mb-5">
                                {posts.map((post) => (
                                    <div class="col-md-6 col-lg-4" key={post.id}>
                                        <article class="card-premium h-100">
                                            {post.featureImage && (
                                                <img
                                                    src={post.featureImage}
                                                    alt={post.title}
                                                    class="card-img-top"
                                                    style="height: 200px; object-fit: cover;"
                                                    loading="lazy"
                                                />
                                            )}
                                            <div class="card-body">
                                                {post.categories.length > 0 && (
                                                    <div class="mb-2">
                                                        {post.categories.map((cat) => (
                                                            <a
                                                                href={`/category/${cat.slug}`}
                                                                class="badge bg-primary bg-opacity-10 text-primary me-1"
                                                                key={cat.id}
                                                            >
                                                                {cat.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                <h3 class="h5 fw-bold mb-3">
                                                    <a href={`/blog/${post.slug}`} class="text-decoration-none text-dark">
                                                        {post.title}
                                                    </a>
                                                </h3>
                                                {post.excerpt && (
                                                    <p class="text-muted small mb-3">{post.excerpt}</p>
                                                )}
                                                <div class="d-flex justify-content-between align-items-center small text-muted">
                                                    <span>{post.author.name}</span>
                                                    <span>{new Date(post.createdAt).toLocaleDateString("es")}</span>
                                                </div>
                                            </div>
                                        </article>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <nav aria-label="Blog pagination">
                                    <ul class="pagination justify-content-center">
                                        {pagination.hasPrev && (
                                            <li class="page-item">
                                                <a class="page-link" href={`/${blogBase}/page/${pagination.prevPage}`}>
                                                    Anterior
                                                </a>
                                            </li>
                                        )}
                                        <li class="page-item disabled">
                                            <span class="page-link">
                                                Página {pagination.currentPage} de {pagination.totalPages}
                                            </span>
                                        </li>
                                        {pagination.hasNext && (
                                            <li class="page-item">
                                                <a class="page-link" href={`/${blogBase}/page/${pagination.nextPage}`}>
                                                    Siguiente
                                                </a>
                                            </li>
                                        )}
                                    </ul>
                                </nav>
                            )}
                        </>
                    ) : (
                        <div class="text-center py-5">
                            <h3>No hay posts publicados</h3>
                            <p class="text-muted">Vuelve pronto para ver contenido nuevo.</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer site={site} custom={custom} categories={categories} footerMenu={footerMenu} blogUrl={`/${blogBase}`} />
        </>
    );

    return (
        <Layout
            site={site}
            custom={custom}
            activeTheme={activeTheme}
            title="Blog"
            bodyClass="blog-page"
        >
            {content}
        </Layout>
    );
};

export default BlogTemplate;
