import type { FC } from "hono/jsx";
import type { SiteData, CategoryData, MenuItem } from "../helpers/index.ts";

interface FooterProps {
    site: SiteData;
    custom: Record<string, any>;
    categories?: CategoryData[];
    footerMenu?: MenuItem[];
    blogUrl?: string;
}

export const Footer: FC<FooterProps> = (props) => {
    const { site, custom, categories = [], footerMenu = [], blogUrl = "/blog" } = props;
    const companyPhone = custom.company_phone || "+52 55 5555 0101";
    const companyEmail = custom.company_email || site.email || "hola@lexiapartners.com";
    const companyAddress = custom.company_address || "Av. Reforma 412, piso 18\nCiudad de México, MX";

    return (
        <footer class="footer-premium">
            <div class="container">
                <div class="row g-4">
                    {/* Brand Column */}
                    <div class="col-lg-4">
                        <div class="footer-logo mb-3">
                            {site.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p class="mb-3">
                            {site.description || "Historias legales y humanas que acompañan decisiones que transforman industrias."}
                        </p>
                        <p class="small text-muted">
                            © <span id="currentYear"></span> {site.name}. Todos los derechos reservados.
                        </p>
                    </div>

                    {/* Contact Column */}
                    <div class="col-lg-2 col-md-6">
                        <h6 class="text-uppercase mb-3 small fw-bold">Contacto</h6>
                        <ul class="list-unstyled small">
                            <li class="mb-2">
                                <div style="white-space: pre-line">{companyAddress}</div>
                            </li>
                            <li class="mb-2">
                                <a href={`tel:${companyPhone}`}>{companyPhone}</a>
                            </li>
                            <li class="mb-2">
                                <a href={`mailto:${companyEmail}`}>{companyEmail}</a>
                            </li>
                        </ul>
                    </div>

                    {/* Sitemap Column */}
                    <div class="col-lg-2 col-md-6">
                        <h6 class="text-uppercase mb-3 small fw-bold">Sitemap</h6>
                        <ul class="list-unstyled small">
                            {footerMenu.length > 0 ? (
                                footerMenu.map((item) => (
                                    <li class="mb-2" key={item.id}>
                                        <a href={item.url}>{item.label}</a>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li class="mb-2"><a href="#servicios">Soluciones</a></li>
                                    <li class="mb-2"><a href="#sectores">Sectores</a></li>
                                    <li class="mb-2"><a href="#case-studies">Casos</a></li>
                                    <li class="mb-2"><a href="#insights">Ideas</a></li>
                                    <li class="mb-2"><a href={blogUrl}>Blog</a></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Categories Column */}
                    {categories.length > 0 && (
                        <div class="col-lg-2 col-md-6">
                            <h6 class="text-uppercase mb-3 small fw-bold">Categorías</h6>
                            <ul class="list-unstyled small">
                                {categories.slice(0, 5).map((cat) => (
                                    <li class="mb-2" key={cat.id}>
                                        <a href={`/category/${cat.slug}`}>{cat.name}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Social Column */}
                    <div class="col-lg-2 col-md-6">
                        <h6 class="text-uppercase mb-3 small fw-bold">Social</h6>
                        <ul class="list-unstyled small">
                            <li class="mb-2">
                                <a href="https://www.linkedin.com/company/lexia-partners" target="_blank" rel="noopener">
                                    LinkedIn
                                </a>
                            </li>
                            <li class="mb-2">
                                <a href="https://twitter.com/lexiapartners" target="_blank" rel="noopener">
                                    X / Twitter
                                </a>
                            </li>
                            <li class="mb-2">
                                <a href="#newsletter">Newsletter</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div class="border-top border-secondary mt-4 pt-4">
                    <div class="row">
                        <div class="col-md-6 text-center text-md-start small text-muted">
                            <a href="/privacy" class="text-muted me-3">Política de privacidad</a>
                            <a href="/terms" class="text-muted me-3">Términos y condiciones</a>
                            <a href="/ethics" class="text-muted">Código de ética</a>
                        </div>
                        <div class="col-md-6 text-center text-md-end small text-muted mt-2 mt-md-0">
                            Powered by <a href="https://lexcms.dev" class="text-muted">LexCMS</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
