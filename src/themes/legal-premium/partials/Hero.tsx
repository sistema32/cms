import type { FC } from "hono/jsx";

interface HeroProps {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaUrl?: string;
    metrics?: Array<{
        label: string;
        value: string;
        description: string;
    }>;
}

export const Hero: FC<HeroProps> = (props) => {
    const {
        title = "Convertimos la incertidumbre regulatoria en decisiones estratégicas",
        subtitle = "Partner legal para builders que transforman industrias",
        ctaText = "Agenda tu diagnóstico",
        ctaUrl = "#agenda",
        metrics = [
            { label: "NPS 2024", value: "92", description: "Scale-ups y corporativos" },
            { label: "Horas Estrategia", value: "+18k", description: "Alta criticidad y valuación" },
            { label: "Jurisdicciones", value: "12", description: "LATAM, USA y Europa" }
        ]
    } = props;

    return (
        <section class="hero-section">
            <div class="container">
                <div class="row align-items-center g-5">
                    <div class="col-lg-6">
                        <div class="hero-badge mb-4">
                            <span class="badge-premium bg-primary bg-opacity-10 text-primary">
                                <span class="me-2">●</span>
                                Partner legal para builders
                            </span>
                        </div>

                        <h1 class="display-3 fw-bold mb-4">
                            {title}
                        </h1>

                        <p class="lead mb-4 text-muted">
                            {subtitle}
                        </p>

                        <div class="d-flex flex-column flex-sm-row gap-3 mb-5">
                            <a href={ctaUrl} class="btn btn-premium btn-premium-primary btn-lg">
                                {ctaText}
                                <svg class="ms-2" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                                </svg>
                            </a>
                            <a href="#case-studies" class="btn btn-premium btn-premium-outline btn-lg">
                                Ver casos de éxito
                            </a>
                        </div>

                        {/* Metrics */}
                        <div class="row g-3">
                            {metrics.map((metric, index) => (
                                <div class="col-md-4" key={index}>
                                    <div class="metric-card">
                                        <div class="metric-label mb-2">{metric.label}</div>
                                        <div class="metric-value mb-2">{metric.value}</div>
                                        <div class="small text-muted">{metric.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div class="col-lg-6">
                        <div class="glass-card p-4 p-md-5">
                            <h3 class="h5 text-uppercase mb-3 text-primary">Primeras 72 horas</h3>
                            <p class="fw-semibold mb-4">
                                Esta es la hoja de ruta que activamos apenas agendas tu diagnóstico.
                            </p>

                            <ul class="list-unstyled">
                                <li class="d-flex mb-3">
                                    <span class="text-primary me-3">●</span>
                                    <span>Kickoff de 90 minutos con founders y líderes para alinear hipótesis y métricas.</span>
                                </li>
                                <li class="d-flex mb-3">
                                    <span class="text-primary me-3">●</span>
                                    <span>Due diligence express sobre contratos, gobierno de datos y pasivos regulatorios.</span>
                                </li>
                                <li class="d-flex mb-3">
                                    <span class="text-primary me-3">●</span>
                                    <span>Diseño de narrativa y mensajes clave para consejo, inversionistas y equipos.</span>
                                </li>
                            </ul>

                            <div class="card border-primary border-opacity-25 bg-primary bg-opacity-10 mt-4">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <small class="text-muted">Entrega día 5</small>
                                        <span class="badge bg-primary">EN CURSO</span>
                                    </div>
                                    <p class="mb-0 small">
                                        Roadmap accionable con riesgos, quick wins y owners listos para implementar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
