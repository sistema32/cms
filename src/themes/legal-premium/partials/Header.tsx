import type { FC } from "hono/jsx";
import type { SiteData, MenuItem } from "../helpers/index.ts";

interface HeaderProps {
    site: SiteData;
    custom: Record<string, any>;
    menu?: MenuItem[];
    blogUrl?: string;
}

export const Header: FC<HeaderProps> = (props) => {
    const { site, custom, menu = [], blogUrl = "/blog" } = props;

    return (
        <nav class="navbar navbar-expand-lg navbar-premium sticky-top">
            <div class="container">
                <a class="navbar-brand d-flex align-items-center" href="/">
                    <div class="footer-logo me-2">
                        {site.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div class="d-none d-sm-block">
                        <div class="fw-bold">{site.name}</div>
                        <small class="text-muted">{site.tagline || "Legal Excellence"}</small>
                    </div>
                </a>

                <div class="d-flex align-items-center order-lg-3">
                    {/* Theme Toggle */}
                    <button
                        id="themeToggle"
                        class="btn btn-sm btn-outline-secondary rounded-circle me-2"
                        type="button"
                        aria-label="Toggle theme"
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
                        </svg>
                    </button>

                    {/* Mobile Toggle */}
                    <button
                        class="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span class="navbar-toggler-icon"></span>
                    </button>
                </div>

                <div class="collapse navbar-collapse order-lg-2" id="navbarNav">
                    <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                        {menu.length > 0 ? (
                            menu.map((item) => (
                                <li class="nav-item" key={item.id}>
                                    <a class="nav-link" href={item.url}>
                                        {item.label}
                                    </a>
                                </li>
                            ))
                        ) : (
                            <>
                                <li class="nav-item">
                                    <a class="nav-link" href="#servicios">Soluciones</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#sectores">Sectores</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#case-studies">Casos</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#insights">Ideas</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href={blogUrl}>Blog</a>
                                </li>
                            </>
                        )}
                    </ul>

                    <a href="#agenda" class="btn btn-premium btn-premium-primary d-none d-lg-inline-block">
                        Agenda un diagnóstico
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default Header;
