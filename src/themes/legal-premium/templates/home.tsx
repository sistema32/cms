import type { FC } from "hono/jsx";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import { Hero } from "../partials/Hero.tsx";
import type {
    SiteData,
    PostData,
    CategoryData,
    MenuItem,
} from "../helpers/index.ts";

/**
 * Home Template - Legal Premium Theme
 * Premium homepage for legal firms with all sections
 */

interface HomeProps {
    site: SiteData;
    custom: Record<string, any>;
    activeTheme?: string;
    featuredPosts?: PostData[];
    categories?: CategoryData[];
    blogUrl?: string;
    menu?: MenuItem[];
    footerMenu?: MenuItem[];
}

export const HomeTemplate: FC<HomeProps> = (props) => {
    const {
        site,
        custom,
        activeTheme,
        featuredPosts = [],
        categories = [],
        blogUrl = "/blog",
        menu = [],
        footerMenu = [],
    } = props;

    const showHero = custom.show_hero !== false;
    const showServices = custom.show_services !== false;
    const showIndustries = custom.show_industries !== false;
    const showCaseStudies = custom.show_case_studies !== false;
    const showInsights = custom.show_insights !== false;

    const content = (
        <>
            <Header site={site} custom={custom} menu={menu} blogUrl={blogUrl} />

            <main>
                {/* Hero Section */}
                {showHero && (
                    <Hero
                        title={custom.hero_title}
                        subtitle={custom.hero_subtitle}
                    />
                )}

                {/* Trust Bar */}
                <section class="py-4 bg-light border-top border-bottom reveal-on-scroll">
                    <div class="container">
                        <div class="row align-items-center">
                            <div class="col-md-3 text-center text-md-start mb-3 mb-md-0">
                                <small class="text-uppercase text-muted fw-semibold">Aliados de empresas como</small>
                            </div>
                            <div class="col-md-9">
                                <div class="d-flex flex-wrap justify-content-center justify-content-md-end gap-3">
                                    <span class="badge bg-white border px-3 py-2">NeuroQuant X</span>
                                    <span class="badge bg-white border px-3 py-2">Laika Mobility</span>
                                    <span class="badge bg-white border px-3 py-2">Sentinel Wallet</span>
                                    <span class="badge bg-white border px-3 py-2">Aether Foods</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Storyline Section */}
                <section class="py-5 bg-light reveal-on-scroll">
                    <div class="container py-md-4">
                        <div class="row g-5">
                            <div class="col-lg-5">
                                <h2 class="display-5 fw-bold mb-4">
                                    Qué ocurre cuando entramos a la sala de decisiones.
                                </h2>
                                <p class="lead mb-4">
                                    Cada engagement inicia con una historia clara: dónde está la fricción, qué stake está en riesgo y cómo se mide el impacto.
                                </p>
                                <ul class="list-unstyled">
                                    <li class="d-flex mb-3">
                                        <span class="text-primary me-3">●</span>
                                        <span>Construimos escenarios accionables con métricas financieras, regulatorias y de reputación.</span>
                                    </li>
                                    <li class="d-flex mb-3">
                                        <span class="text-primary me-3">●</span>
                                        <span>Diseñamos historias para el board que conectan legal, producto y growth en una sola hoja de ruta.</span>
                                    </li>
                                    <li class="d-flex mb-3">
                                        <span class="text-primary me-3">●</span>
                                        <span>Operamos con equipos in-house para activar quick wins mientras configuramos la estructura a largo plazo.</span>
                                    </li>
                                </ul>

                                <div class="card border-primary border-opacity-25 mt-4">
                                    <div class="card-body">
                                        <blockquote class="mb-3">
                                            <p class="fst-italic mb-0">
                                                "Llegaron en medio de una ronda Serie C y una investigación regulatoria. En 30 días teníamos narrativa única para inversionistas y reguladores, y el deal cerró sin down round."
                                            </p>
                                        </blockquote>
                                        <footer class="blockquote-footer">
                                            <small class="text-uppercase">CRO · Scale-up fintech LATAM</small>
                                        </footer>
                                    </div>
                                </div>
                            </div>

                            <div class="col-lg-7">
                                <div class="row g-4">
                                    <div class="col-12">
                                        <div class="card-premium p-4">
                                            <span class="badge bg-primary bg-opacity-10 text-primary mb-3">01 · Descubrimiento narrativo</span>
                                            <p class="mb-3">
                                                Entrevistamos líderes clave, revisamos data crítica y mapeamos riesgos competitivos para entender dónde realmente duele o se puede acelerar.
                                            </p>
                                            <small class="text-muted">Entregable: Storyboard ejecutivo + matriz de hipótesis.</small>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="card-premium p-4">
                                            <span class="badge bg-primary bg-opacity-10 text-primary mb-3">02 · Arquitectura jurídica</span>
                                            <p class="mb-3">
                                                Definimos estrategia legal-producto alineada al roadmap comercial, con quick wins y horizontes de 90/180 días para compliance, litigio y governance.
                                            </p>
                                            <small class="text-muted">Entregable: Blueprint priorizado + playbooks y owners.</small>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="card-premium p-4">
                                            <span class="badge bg-primary bg-opacity-10 text-primary mb-3">03 · Activación continua</span>
                                            <p class="mb-3">
                                                Trabajamos con tus squads para ejecutar, monitorear métricas y ajustar la estrategia conforme evoluciona el mercado o la negociación.
                                            </p>
                                            <small class="text-muted">Entregable: Dashboard vivo + governance sessions mensuales.</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                {showServices && (
                    <section id="servicios" class="py-5 reveal-on-scroll">
                        <div class="container py-md-4">
                            <div class="section-header text-center mb-5">
                                <h2 class="section-title">Tres frentes para blindar y acelerar ciclos de innovación</h2>
                                <p class="section-subtitle mx-auto">
                                    Acompañamos a tu equipo legal, producto y finanzas con squads especializados que traducen las prioridades del negocio en decisiones jurídicas accionables.
                                </p>
                            </div>

                            <div class="row g-4">
                                <div class="col-md-6 col-lg-3">
                                    <div class="service-card">
                                        <div class="service-icon">🚀</div>
                                        <h4 class="h6 fw-bold mb-3">Sprints de desbloqueo</h4>
                                        <p class="small text-muted mb-0">
                                            Sprints interdisciplinarios de 10 días que resuelven retos legales críticos con equipos producto y compliance.
                                        </p>
                                    </div>
                                </div>

                                <div class="col-md-6 col-lg-3">
                                    <div class="service-card">
                                        <div class="service-icon">⚖️</div>
                                        <h4 class="h6 fw-bold mb-3">Litigio preventivo</h4>
                                        <p class="small text-muted mb-0">
                                            Modelos de simulación procesal que anticipan escenarios y definen estrategias probatorias dinámicas.
                                        </p>
                                    </div>
                                </div>

                                <div class="col-md-6 col-lg-3">
                                    <div class="service-card">
                                        <div class="service-icon">🔒</div>
                                        <h4 class="h6 fw-bold mb-3">Compliance que escala</h4>
                                        <p class="small text-muted mb-0">
                                            Frameworks de cumplimiento integrados al stack tecnológico para escalar con seguridad y confianza.
                                        </p>
                                    </div>
                                </div>

                                <div class="col-md-6 col-lg-3">
                                    <div class="service-card">
                                        <div class="service-icon">💼</div>
                                        <h4 class="h6 fw-bold mb-3">Dealcraft de alto impacto</h4>
                                        <p class="small text-muted mb-0">
                                            Estructuración de rondas y M&A con playbooks vivos, data rooms automatizados y narrativa de inversión.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="row g-4 mt-4">
                                <div class="col-lg-6">
                                    <div class="glass-card p-4">
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <h5 class="h6 text-uppercase text-primary mb-0">Diseño regulatorio</h5>
                                            <span class="badge bg-primary">IA + Humanos</span>
                                        </div>
                                        <p class="mb-3">
                                            Mappeamos ecosistemas regulatorios con modelos predictivos y diseñamos hojas de ruta vivas actualizadas en tiempo real.
                                        </p>
                                        <div class="row g-3">
                                            <div class="col-6">
                                                <div class="small text-muted">Normas monitoreadas</div>
                                                <div class="h4 fw-bold">1,260+</div>
                                            </div>
                                            <div class="col-6">
                                                <div class="small text-muted">Talleres en vivo</div>
                                                <div class="h4 fw-bold">24/año</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-6">
                                    <div class="glass-card p-4">
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <h5 class="h6 text-uppercase text-primary mb-0">Impacto y ESG en acción</h5>
                                            <span class="badge bg-success">ESG Ready</span>
                                        </div>
                                        <p class="mb-3">
                                            Programas que integran gobernanza, privacidad, inclusión y clima en cada proyecto tecnológico.
                                        </p>
                                        <div class="row g-3">
                                            <div class="col-6">
                                                <div class="small text-muted">Huella mitigada</div>
                                                <div class="h4 fw-bold">-38% CO<sub>2</sub></div>
                                            </div>
                                            <div class="col-6">
                                                <div class="small text-muted">Protocolos de ética</div>
                                                <div class="h4 fw-bold">11 activos</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Industries Section */}
                {showIndustries && (
                    <section id="sectores" class="py-5 bg-light reveal-on-scroll">
                        <div class="container py-md-4">
                            <div class="row g-5">
                                <div class="col-lg-4">
                                    <h2 class="display-6 fw-bold mb-4">
                                        Sectorializamos equipos para influir en decisiones críticas
                                    </h2>
                                    <p class="lead mb-4">
                                        Cada célula combina abogados, estrategas de producto y científicos de datos especializados en industrias emergentes.
                                    </p>
                                    <ul class="list-unstyled">
                                        <li class="d-flex mb-3">
                                            <span class="text-primary me-3">●</span>
                                            <span>Journey legal continuo con dashboards compartidos y métricas accionables.</span>
                                        </li>
                                        <li class="d-flex mb-3">
                                            <span class="text-primary me-3">●</span>
                                            <span>Workshops inmersivos trimestrales con stakeholders de negocio.</span>
                                        </li>
                                        <li class="d-flex mb-3">
                                            <span class="text-primary me-3">●</span>
                                            <span>Biblioteca viva de precedentes y contratos modulares basada en IA generativa.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div class="col-lg-8">
                                    <div class="glass-card p-4 p-md-5">
                                        <div class="row g-4">
                                            <div class="col-md-6">
                                                <div class="card border-0 bg-white bg-opacity-75 p-4">
                                                    <h6 class="text-uppercase small text-muted mb-3">Fintech & Web3</h6>
                                                    <p class="mb-0">Licenciamientos, sandbox regulatorios y tokenomics responsables.</p>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="card border-0 bg-white bg-opacity-75 p-4">
                                                    <h6 class="text-uppercase small text-muted mb-3">Healthtech</h6>
                                                    <p class="mb-0">Data trust, consentimiento informado dinámico e interoperabilidad.</p>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="card border-0 bg-white bg-opacity-75 p-4">
                                                    <h6 class="text-uppercase small text-muted mb-3">Climate & Energy</h6>
                                                    <p class="mb-0">Finanzas verdes, PPAs inteligentes y gobernanza de datos climáticos.</p>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="card border-0 bg-white bg-opacity-75 p-4">
                                                    <h6 class="text-uppercase small text-muted mb-3">Retail 4.0</h6>
                                                    <p class="mb-0">Fidelización omnicanal, privacidad evolutiva y marketplaces éticos.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="card border-primary border-opacity-25 mt-4">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-center mb-3">
                                                    <small class="text-muted">Net Impact Score Clientes</small>
                                                    <span class="badge bg-primary">2025 target</span>
                                                </div>
                                                <div class="d-flex justify-content-between align-items-center mb-3">
                                                    <div class="h2 fw-bold mb-0">+63</div>
                                                    <small class="text-uppercase text-muted">vs. benchmark +28</small>
                                                </div>
                                                <div class="progress" style="height: 8px;">
                                                    <div class="progress-bar" role="progressbar" style="width: 78%" aria-valuenow="78" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Case Studies Section - Continued in next part due to length */}
                {showCaseStudies && (
                    <section id="case-studies" class="py-5 reveal-on-scroll">
                        <div class="container py-md-4">
                            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end mb-5">
                                <div>
                                    <h2 class="section-title">Historias donde el riesgo se convirtió en crecimiento</h2>
                                    <p class="section-subtitle">
                                        Seleccionamos tres momentos en los que un diagnóstico rápido y una narrativa jurídica precisa cambiaron el rumbo de la operación.
                                    </p>
                                </div>
                                <a href="#agenda" class="btn btn-premium btn-premium-outline mt-3 mt-md-0">
                                    Solicitar dossier completo
                                </a>
                            </div>

                            <div class="row g-4">
                                <div class="col-lg-4">
                                    <div class="case-study-card">
                                        <div class="position-relative">
                                            <img
                                                src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80"
                                                alt="Fintech case study"
                                                class="case-study-image"
                                                loading="lazy"
                                            />
                                            <span class="case-study-badge">+52% val.</span>
                                        </div>
                                        <div class="p-4">
                                            <div class="d-flex justify-content-between align-items-center mb-3">
                                                <small class="text-muted">Fintech / Serie C</small>
                                            </div>
                                            <h4 class="h5 fw-bold mb-3">Modelo jurídico de expansión para wallet multicontinente</h4>
                                            <p class="small text-muted mb-3">
                                                Co-diseñamos arquitectura legal y narrativa regulatoria que permitió abrir tres jurisdicciones en paralelo sin frenar la ronda Serie C.
                                            </p>
                                            <ul class="list-unstyled small">
                                                <li class="d-flex mb-2">
                                                    <span class="text-primary me-2">●</span>
                                                    <span>Se redujo 40% el time-to-market gracias a contratos reutilizables.</span>
                                                </li>
                                                <li class="d-flex">
                                                    <span class="text-primary me-2">●</span>
                                                    <span>Matriz regulatoria con alertas anticipadas para cada jurisdicción.</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-4">
                                    <div class="case-study-card">
                                        <div class="position-relative">
                                            <img
                                                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80"
                                                alt="Biotech case study"
                                                class="case-study-image"
                                                loading="lazy"
                                            />
                                            <span class="case-study-badge bg-success">ROI x3</span>
                                        </div>
                                        <div class="p-4">
                                            <div class="d-flex justify-content-between align-items-center mb-3">
                                                <small class="text-muted">Biotech / Venture Debt</small>
                                            </div>
                                            <h4 class="h5 fw-bold mb-3">Governance bioética para plataforma de terapias celulares</h4>
                                            <p class="small text-muted mb-3">
                                                Instalamos gobernanza bioética y data trusts que convencieron al comité de riesgo y habilitaron el crédito venture en seis semanas.
                                            </p>
                                            <ul class="list-unstyled small">
                                                <li class="d-flex mb-2">
                                                    <span class="text-success me-2">●</span>
                                                    <span>Certificación internacional en seis meses sin observaciones mayores.</span>
                                                </li>
                                                <li class="d-flex">
                                                    <span class="text-success me-2">●</span>
                                                    <span>Protocolos de consentimiento adaptativo integrados en UX de paciente.</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-4">
                                    <div class="case-study-card">
                                        <div class="position-relative">
                                            <img
                                                src="https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=900&q=80"
                                                alt="Climate tech case study"
                                                class="case-study-image"
                                                loading="lazy"
                                            />
                                            <span class="case-study-badge bg-info">Deal 480M</span>
                                        </div>
                                        <div class="p-4">
                                            <div class="d-flex justify-content-between align-items-center mb-3">
                                                <small class="text-muted">ClimateTech / M&A</small>
                                            </div>
                                            <h4 class="h5 fw-bold mb-3">Integración jurídica y ESG para fusión transcontinental</h4>
                                            <p class="small text-muted mb-3">
                                                Alineamos auditorías ESG, smart contracts y comunicación con inversionistas para ejecutar la fusión sin findings críticos.
                                            </p>
                                            <ul class="list-unstyled small">
                                                <li class="d-flex mb-2">
                                                    <span class="text-info me-2">●</span>
                                                    <span>Cero hallazgos críticos en auditoría posterior a la fusión.</span>
                                                </li>
                                                <li class="d-flex">
                                                    <span class="text-info me-2">●</span>
                                                    <span>Tablero ejecutivo con KPIs legales, ESG y financieros en tiempo real.</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Insights Section */}
                {showInsights && (
                    <section id="insights" class="py-5 bg-light reveal-on-scroll">
                        <div class="container py-md-4">
                            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end mb-5">
                                <div>
                                    <h2 class="section-title">Ideas para anticipar lo que viene</h2>
                                    <p class="section-subtitle">
                                        Nuestro observatorio comparte frameworks, data stories y narrativas legales que anticipan tendencias 2025+.
                                    </p>
                                </div>
                                <a href="#newsletter" class="btn btn-premium btn-premium-outline mt-3 mt-md-0">
                                    Recibir el radar mensual
                                </a>
                            </div>

                            <div class="row g-4">
                                {featuredPosts.slice(0, 3).length > 0 ? (
                                    featuredPosts.slice(0, 3).map((post) => (
                                        <div class="col-md-4" key={post.id}>
                                            <div class="card-premium p-4 h-100">
                                                <span class="badge bg-primary bg-opacity-10 text-primary mb-3">Radar normativo</span>
                                                <h4 class="h5 fw-bold mb-3">{post.title}</h4>
                                                <p class="small text-muted mb-3">{post.excerpt}</p>
                                                <a href={`/blog/${post.slug}`} class="btn btn-sm btn-link p-0 text-primary fw-semibold">
                                                    Leer insight →
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div class="col-md-4">
                                            <div class="card-premium p-4 h-100">
                                                <span class="badge bg-primary bg-opacity-10 text-primary mb-3">Radar normativo</span>
                                                <h4 class="h5 fw-bold mb-3">Cómo la agenda de IA 2025 redefine las licencias fintech LATAM</h4>
                                                <p class="small text-muted mb-3">
                                                    Analizamos cinco regulaciones emergentes y proponemos un roadmap operativo listo para co-crear con tus squads.
                                                </p>
                                                <a href={blogUrl} class="btn btn-sm btn-link p-0 text-primary fw-semibold">
                                                    Leer insight →
                                                </a>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="card-premium p-4 h-100">
                                                <span class="badge bg-primary bg-opacity-10 text-primary mb-3">Playbook</span>
                                                <h4 class="h5 fw-bold mb-3">Cómo preparar data rooms vivientes para rondas Serie B/C</h4>
                                                <p class="small text-muted mb-3">
                                                    Checklist accionable para convertir la due diligence en experiencia ágil para inversores y equipos internos.
                                                </p>
                                                <a href={blogUrl} class="btn btn-sm btn-link p-0 text-primary fw-semibold">
                                                    Descargar guía →
                                                </a>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="card-premium p-4 h-100">
                                                <span class="badge bg-primary bg-opacity-10 text-primary mb-3">Human first</span>
                                                <h4 class="h5 fw-bold mb-3">Protocolo de cuidado en investigaciones internas híbridas</h4>
                                                <p class="small text-muted mb-3">
                                                    Guía para combinar investigación avanzada con contención humana y equidad en organizaciones distribuidas.
                                                </p>
                                                <a href={blogUrl} class="btn btn-sm btn-link p-0 text-primary fw-semibold">
                                                    Explorar ideas →
                                                </a>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Contact/Agenda Section */}
                <section id="agenda" class="py-5 reveal-on-scroll">
                    <div class="container py-md-4">
                        <div class="glass-card p-4 p-md-5">
                            <div class="row g-5">
                                <div class="col-lg-7">
                                    <span class="badge bg-primary bg-opacity-10 text-primary mb-3">
                                        <span class="me-2">●</span>
                                        Diagnóstico 360°
                                    </span>
                                    <h2 class="display-6 fw-bold mb-4">
                                        Co-creemos tu mapa legal de los próximos 90 días
                                    </h2>
                                    <p class="lead mb-4">
                                        Facilitamos una sesión estratégica para entender tus objetivos, mapeamos riesgos latentes y priorizamos quick wins con impacto tangible.
                                    </p>

                                    <div class="row g-3 mb-4">
                                        <div class="col-md-6">
                                            <div class="d-flex">
                                                <span class="text-primary me-3">●</span>
                                                <span class="small">Radiografía de riesgos vs. oportunidades priorizadas por impacto y velocidad.</span>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="d-flex">
                                                <span class="text-primary me-3">●</span>
                                                <span class="small">Narrativa y próximos pasos para board, inversionistas y reguladores.</span>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="d-flex">
                                                <span class="text-primary me-3">●</span>
                                                <span class="small">Playbook de quick wins legales/producto con responsables claros.</span>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="d-flex">
                                                <span class="text-primary me-3">●</span>
                                                <span class="small">Toolbox de documentación y fuentes clave para continuar la operación.</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="card border-primary border-opacity-25 bg-primary bg-opacity-10">
                                        <div class="card-body">
                                            <div class="row g-3">
                                                <div class="col-md-4">
                                                    <small class="text-uppercase text-muted d-block mb-2">Kit día 2</small>
                                                    <p class="small mb-0">Resumen ejecutivo y matriz de riesgos priorizada.</p>
                                                </div>
                                                <div class="col-md-4">
                                                    <small class="text-uppercase text-muted d-block mb-2">Assets legales</small>
                                                    <p class="small mb-0">Cláusulas, checklists y templates adaptados.</p>
                                                </div>
                                                <div class="col-md-4">
                                                    <small class="text-uppercase text-muted d-block mb-2">Sesión de activación</small>
                                                    <p class="small mb-0">Workshop de 60 minutos con tu equipo.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-5">
                                    <div class="card border-0 shadow-sm">
                                        <div class="card-body p-4">
                                            <form class="needs-validation" novalidate>
                                                <div class="mb-3">
                                                    <label class="form-label small text-uppercase text-muted">Nombre completo</label>
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        placeholder="María López"
                                                        required
                                                    />
                                                </div>

                                                <div class="mb-3">
                                                    <label class="form-label small text-uppercase text-muted">Correo corporativo</label>
                                                    <input
                                                        type="email"
                                                        class="form-control"
                                                        placeholder="mlp@empresa.com"
                                                        required
                                                    />
                                                </div>

                                                <div class="mb-3">
                                                    <label class="form-label small text-uppercase text-muted">Objetivo prioritario</label>
                                                    <select class="form-select" required>
                                                        <option value="">Selecciona una opción</option>
                                                        <option value="escalamiento">Escalamiento y expansión</option>
                                                        <option value="compliance">Compliance tecnológico</option>
                                                        <option value="litigio">Litigio estratégico</option>
                                                        <option value="mya">M&A y transacciones</option>
                                                    </select>
                                                </div>

                                                <button type="submit" class="btn btn-premium btn-premium-primary w-100 mb-3">
                                                    Reservar diagnóstico 360°
                                                </button>

                                                <p class="small text-muted mb-0">
                                                    Confirmamos agenda en menos de 12 horas. Cumplimos con estándares SOC 2 y GDPR.
                                                </p>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer
                site={site}
                custom={custom}
                categories={categories}
                footerMenu={footerMenu}
                blogUrl={blogUrl}
            />
        </>
    );

    return (
        <Layout
            site={site}
            custom={custom}
            activeTheme={activeTheme}
            title={site.name}
            description={site.description}
            bodyClass="home legal-premium"
        >
            {content}
        </Layout>
    );
};

export default HomeTemplate;
