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
 * Category Template - Página de categoría con posts
 */

interface CategoryProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    category: CategoryData;
    posts: PostData[];
    pagination: PaginationData;
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
    categories?: CategoryData[];
}

export const CategoryTemplate: FC<CategoryProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        category,
        posts,
        pagination,
        menu = [],
        footerMenu = [],
        categories = [],
    } = props;

    const content = (
        <>
            <Header site={site} custom={custom} blogUrl="/blog" menu={menu} />

            <main class="site-main category-page">
                <div class="container">
                    <header class="page-header">
                        <h1 class="page-title">Categoría: {category.name}</h1>
                        {category.description && (
                            <p class="page-description">{category.description}</p>
                        )}
                        {category.count && (
                            <p class="category-count">{category.count} artículos</p>
                        )}
                    </header>

                    {posts.length > 0 ? (
                        <>
                            <div class="posts-grid grid-3">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        showExcerpt={true}
                                        showAuthor={true}
                                        showDate={true}
                                        showCategories={false}
                                        showTags={true}
                                        showImage={true}
                                    />
                                ))}
                            </div>

                            {pagination.totalPages > 1 && (
                                <Pagination
                                    pagination={pagination}
                                    baseUrl={`/category/${category.slug}/page`}
                                />
                            )}
                        </>
                    ) : (
                        <div class="no-posts">
                            <p>No hay posts en esta categoría.</p>
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
            title={`Categoría: ${category.name}`}
            description={category.description || `Posts en ${category.name}`}
            bodyClass={`category category-${category.slug}`}
        >
            {content}
        </Layout>
    );
};

export default CategoryTemplate;
