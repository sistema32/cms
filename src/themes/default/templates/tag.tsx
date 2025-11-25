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
    TagData,
} from "../helpers/index.ts";

/**
 * Tag Template - Página de tag con posts
 */

interface TagProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    tag: TagData;
    posts: PostData[];
    pagination: PaginationData;
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
    categories?: CategoryData[];
}

export const TagTemplate: FC<TagProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        tag,
        posts,
        pagination,
        menu = [],
        footerMenu = [],
        categories = [],
    } = props;

    const content = (
        <>
            <Header site={site} custom={custom} blogUrl="/blog" menu={menu} />

            <main class="site-main tag-page">
                <div class="container">
                    <header class="page-header">
                        <h1 class="page-title">Tag: #{tag.name}</h1>
                        {tag.count && (
                            <p class="tag-count">{tag.count} artículos</p>
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
                                        showCategories={true}
                                        showTags={false}
                                        showImage={true}
                                    />
                                ))}
                            </div>

                            {pagination.totalPages > 1 && (
                                <Pagination
                                    pagination={pagination}
                                    baseUrl={`/tag/${tag.slug}/page`}
                                />
                            )}
                        </>
                    ) : (
                        <div class="no-posts">
                            <p>No hay posts con este tag.</p>
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
            title={`Tag: ${tag.name}`}
            description={`Posts etiquetados con ${tag.name}`}
            bodyClass={`tag tag-${tag.slug}`}
        >
            {content}
        </Layout>
    );
};

export default TagTemplate;
