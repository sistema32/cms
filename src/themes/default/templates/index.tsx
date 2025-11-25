import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";
import { PostCard } from "../partials/PostCard.tsx";
import { Pagination } from "../partials/Pagination.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData, PaginationData, MenuItem, CategoryData } from "../helpers/index.ts";

/**
 * Index Template - Página principal con lista de posts
 * Inspirado en index.hbs de Ghost y index.php de WordPress
 */

interface IndexProps {
  site: SiteData;
  custom: Record<string, any>;
  activeTheme?: string;
  posts: PostData[];
  pagination: PaginationData;
  blogUrl?: string;
  menu?: MenuItem[];
  footerMenu?: MenuItem[];
  categories?: CategoryData[];
}

export const IndexTemplate: FC<IndexProps> = (props) => {
  const { site, custom, activeTheme, posts, pagination, blogUrl = "/blog", menu = [], footerMenu = [], categories = [] } = props;

  const content = (
    <>
      <Header site={site} custom={custom} blogUrl={blogUrl} menu={menu} />

      <main class="site-main">
        <div class="container">
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
                    showTags={true}
                    showImage={true}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <Pagination pagination={pagination} baseUrl="/page" />
              )}
            </>
          ) : (
            <div class="no-posts">
              <h2>No hay posts publicados</h2>
              <p>Vuelve pronto para ver contenido nuevo.</p>
            </div>
          )}
        </div>
      </main>

      {custom.cta_text && (
        <section class="cta-section">
          <div class="container">
            <h2>{custom.cta_text}</h2>
            <a href="#subscribe" class="btn btn-primary">Suscribirse</a>
          </div>
        </section>
      )}

      <Footer site={site} custom={custom} blogUrl={blogUrl} footerMenu={footerMenu} categories={categories} />
    </>
  );

  return (
    <Layout
      site={site}
      custom={custom}
      activeTheme={activeTheme}
      bodyClass="home blog"
    >
      {content}
    </Layout>
  );
};

export default IndexTemplate;
