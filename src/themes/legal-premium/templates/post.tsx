import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData, CategoryData, MenuItem } from "../helpers/index.ts";

interface PostProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    post: PostData;
    relatedPosts?: PostData[];
    categories?: CategoryData[];
    blogUrl?: string;
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
}

export const PostTemplate: FC<PostProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        post,
        relatedPosts = [],
        categories = [],
        blogUrl = "/blog",
        menu = [],
        footerMenu = [],
    } = props;

    const content = (
        <>
            <Header site={site} custom={custom} menu={menu} blogUrl={blogUrl} />

            <main class="py-5">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-8 mx-auto">
                            <article class="mb-5">
                                {/* Post Header */}
                                <header class="mb-4">
                                    {post.categories.length > 0 && (
                                        <div class="mb-3">
                                            {post.categories.map((cat) => (
                                                <a
                                                    href={`/category/${cat.slug}`}
                                                    class="badge bg-primary bg-opacity-10 text-primary me-2"
                                                    key={cat.id}
                                                >
                                                    {cat.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    <h1 class="display-4 fw-bold mb-4">{post.title}</h1>

                                    <div class="d-flex align-items-center text-muted mb-4">
                                        <span class="me-3">Por {post.author.name}</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString("es", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric"
                                        })}</span>
                                    </div>

                                    {post.tags.length > 0 && (
                                        <div class="mb-4">
                                            {post.tags.map((tag) => (
                                                <a
                                                    href={`/tag/${tag.slug}`}
                                                    class="badge bg-secondary bg-opacity-10 text-secondary me-2"
                                                    key={tag.id}
                                                >
                                                    #{tag.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </header>

                                {/* Featured Image */}
                                {post.featureImage && (
                                    <figure class="mb-4">
                                        <img
                                            src={post.featureImage}
                                            alt={post.title}
                                            class="img-fluid rounded"
                                        />
                                    </figure>
                                )}

                                {/* Post Content */}
                                <div class="post-content">
                                    {raw(post.body || "")}
                                </div>
                            </article>

                            {/* Related Posts */}
                            {relatedPosts.length > 0 && (
                                <section class="mt-5">
                                    <h3 class="h4 fw-bold mb-4">Posts Relacionados</h3>
                                    <div class="row g-4">
                                        {relatedPosts.map((relatedPost) => (
                                            <div class="col-md-6" key={relatedPost.id}>
                                                <div class="card-premium h-100">
                                                    {relatedPost.featureImage && (
                                                        <img
                                                            src={relatedPost.featureImage}
                                                            alt={relatedPost.title}
                                                            class="card-img-top"
                                                            style="height: 150px; object-fit: cover;"
                                                        />
                                                    )}
                                                    <div class="card-body">
                                                        <h4 class="h6 fw-bold">
                                                            <a href={`/blog/${relatedPost.slug}`} class="text-decoration-none text-dark">
                                                                {relatedPost.title}
                                                            </a>
                                                        </h4>
                                                        {relatedPost.excerpt && (
                                                            <p class="small text-muted mb-0">{relatedPost.excerpt}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer site={site} custom={custom} categories={categories} footerMenu={footerMenu} blogUrl={blogUrl} />
        </>
    );

    return (
        <Layout
            site={site}
            custom={custom}
            activeTheme={activeTheme}
            title={post.title}
            description={post.excerpt || ""}
            bodyClass="post-single"
        >
            {content}
        </Layout>
    );
};

export default PostTemplate;
