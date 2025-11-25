import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import type { SiteData } from "../helpers/index.ts";

interface LayoutProps {
    site: SiteData;
    custom: Record<string, any>;
    title?: string;
    description?: string;
    bodyClass?: string;
    activeTheme?: string;
    children?: any;
}

export const Layout: FC<LayoutProps> = (props) => {
    const {
        site,
        custom,
        title,
        description,
        bodyClass = "",
        children,
    } = props;

    const pageTitle = title ? `${title} | ${site.name}` : site.name;
    const pageDescription = description || site.description;
    const isDarkMode = custom.color_scheme === "Dark";
    const primaryColor = custom.primary_color || "#2d6aff";
    const secondaryColor = custom.secondary_color || "#40ebd0";

    return (
        <>
            {raw('<!DOCTYPE html>')}
            <html lang={site.language || "es"}>
                <head>
                    <meta charSet="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>{pageTitle}</title>
                    <meta name="description" content={pageDescription} />

                    {/* Bootstrap 5 CSS */}
                    <link
                        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                        rel="stylesheet"
                        integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
                        crossOrigin="anonymous"
                    />

                    {/* Google Fonts */}
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                        rel="stylesheet"
                    />

                    {/* Theme CSS */}
                    <link rel="stylesheet" href="/themes/legal-premium/assets/css/theme.css" />

                    {/* Custom Colors */}
                    <style>
                        {raw(`
              :root {
                --bs-primary: ${primaryColor};
                --bs-secondary: ${secondaryColor};
              }
            `)}
                    </style>
                </head>
                <body class={`${bodyClass} ${isDarkMode ? 'dark-mode' : ''}`}>
                    {children}

                    {/* Bootstrap 5 JS Bundle */}
                    <script
                        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
                        integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
                        crossOrigin="anonymous"
                    ></script>

                    {/* Theme JS */}
                    <script src="/themes/legal-premium/assets/js/theme.js"></script>
                </body>
            </html>
        </>
    );
};

export default Layout;
