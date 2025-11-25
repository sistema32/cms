import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, CategoryData, MenuItem } from "../helpers/index.ts";

interface PageData {
    id: number;
    title: string;
    slug: string;
    body: string;
    featureImage?: string | null;
}

interface PageProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    page: PageData;
    categories?: CategoryData[];
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
}

export const PageTemplate: FC<PageProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        page,
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
                        <div class="col-lg-8 mx-auto">
                            <article>
                                {page.featureImage && (
                                    <figure class="mb-4">
                                        <img
                                            src={page.featureImage}
                                            alt={page.title}
                                            class="img-fluid rounded"
                                        />
                                    </figure>
                                )}

                                <header class="mb-4">
                                    <h1 class="display-4 fw-bold">{page.title}</h1>
                                </header>

                                <div class="page-content">
                                    {raw(page.body)}
                                </div>
                            </article>
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
            title={page.title}
            bodyClass="page-template"
        >
            {content}
        </Layout>
    );
};

export default PageTemplate;
