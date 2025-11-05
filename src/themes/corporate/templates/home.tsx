import { html } from "hono/html";
import { Layout } from "./Layout.tsx";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import type { SiteData, PostData } from "../helpers/index.ts";

/**
 * Corporate Home Template - Premium B2B homepage
 * Glassmorphism design with aurora effects
 */

interface HomeProps {
  site: SiteData;
  custom: Record<string, any>;
  featuredPosts: PostData[];
  categories?: Array<{ id: number; name: string; slug: string; count?: number }>;
}

export const HomeTemplate = (props: HomeProps) => {
  const { site, custom, featuredPosts, categories = [] } = props;

  const heroTitle = custom.homepage_hero_title || "Convertimos la incertidumbre en decisiones estratégicas";
  const heroSubtitle = custom.homepage_hero_subtitle || "Acompañamos a líderes y organizaciones cuando el tiempo apremia y las decisiones impactan el futuro.";
  const ctaText = custom.homepage_hero_cta_text || "Agenda una consultoría";
  const ctaUrl = custom.homepage_hero_cta_url || "#contacto";

  const content = html`
    <!-- Header -->
    ${Header({ site, custom })}

    <!-- Hero Section -->
    <header class="relative scroll-reveal">
      <div class="split-highlight absolute inset-y-0 right-0 hidden w-2/3 lg:block"></div>
      <div class="relative isolate">
        <div class="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pt-24">
          <div class="space-y-10">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-slate-300 shadow-aurora sm:text-xs sm:tracking-[0.35em]">
              <span class="h-1.5 w-1.5 rounded-full bg-primary-300"></span>
              Excelencia Profesional
            </div>

            <div class="space-y-6">
              <h1 class="text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                ${heroTitle}
              </h1>
              <p class="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                ${heroSubtitle}
              </p>
            </div>

            <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="${ctaUrl}"
                class="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-aurora transition hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
              >
                ${ctaText}
                <svg class="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
              <a href="#casos" class="inline-flex items-center justify-center text-sm font-semibold text-secondary-200 transition hover:text-secondary-100">
                Ver casos de éxito
              </a>
            </div>

            <!-- Metrics -->
            <dl class="grid gap-5 sm:grid-cols-3 sm:gap-6">
              <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-aurora">
                <dt class="text-xs uppercase tracking-[0.35em] text-slate-400">Clientes</dt>
                <dd class="mt-2 text-3xl font-semibold text-white">200+</dd>
                <p class="mt-3 text-xs text-slate-400">Empresas que confían en nosotros</p>
              </div>
              <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-aurora">
                <dt class="text-xs uppercase tracking-[0.35em] text-slate-400">Proyectos</dt>
                <dd class="mt-2 text-3xl font-semibold text-white">1,500+</dd>
                <p class="mt-3 text-xs text-slate-400">Entregados con excelencia</p>
              </div>
              <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-aurora">
                <dt class="text-xs uppercase tracking-[0.35em] text-slate-400">Experiencia</dt>
                <dd class="mt-2 text-3xl font-semibold text-white">15+</dd>
                <p class="mt-3 text-xs text-slate-400">Años liderando el sector</p>
              </div>
            </dl>
          </div>

          <!-- Right Panel -->
          <div class="glass-panel relative overflow-hidden rounded-3xl p-6 shadow-aurora sm:p-8">
            <div class="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary-500/30 blur-3xl"></div>
            <div class="absolute -bottom-12 -right-16 h-52 w-52 rounded-full bg-secondary-400/20 blur-3xl"></div>

            <div class="relative space-y-6">
              <h2 class="text-sm uppercase tracking-[0.35em] text-primary-200">Nuestra Metodología</h2>
              <p class="text-lg font-medium text-white">Resultados medibles en cada fase del proyecto</p>

              <ul class="space-y-4 text-sm text-slate-300">
                <li class="flex items-start gap-3">
                  <span class="mt-1 h-2 w-2 rounded-full bg-primary-300"></span>
                  Diagnóstico profundo de necesidades y oportunidades
                </li>
                <li class="flex items-start gap-3">
                  <span class="mt-1 h-2 w-2 rounded-full bg-primary-300"></span>
                  Estrategia personalizada con objetivos claros y medibles
                </li>
                <li class="flex items-start gap-3">
                  <span class="mt-1 h-2 w-2 rounded-full bg-primary-300"></span>
                  Ejecución ágil con reportes continuos de avance
                </li>
              </ul>

              <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div class="flex items-center justify-between text-xs text-slate-300">
                  <span>Satisfacción Cliente</span>
                  <span class="rounded-full bg-primary-500/30 px-2 py-1 text-[11px] font-semibold text-primary-50">98%</span>
                </div>
                <p class="mt-3 text-sm text-white">Recomendación activa por parte de nuestros clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <!-- Trust Bar -->
      <div class="scroll-reveal border-y border-white/10 bg-slate-950/60">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-[11px] uppercase tracking-[0.18em] text-slate-400 sm:gap-6 sm:px-6 sm:py-10 sm:text-xs sm:tracking-[0.35em] lg:px-8">
          <span>Con la confianza de</span>
          <span class="flex items-center gap-4 text-[10px] sm:gap-6 sm:text-[11px]">
            <span class="rounded-full border border-white/10 px-4 py-2">Empresa A</span>
            <span class="rounded-full border border-white/10 px-4 py-2">Empresa B</span>
            <span class="rounded-full border border-white/10 px-4 py-2">Empresa C</span>
            <span class="rounded-full border border-white/10 px-4 py-2">Empresa D</span>
          </span>
        </div>
      </div>

      <!-- Services Section -->
      <section id="servicios" class="scroll-reveal border-b border-white/10 bg-slate-950/80">
        <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div class="grid gap-8 sm:gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 class="text-2xl font-semibold text-white sm:text-4xl">
                Soluciones que transforman organizaciones
              </h2>
              <p class="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
                Combinamos experiencia, metodología y tecnología para entregar resultados que superan expectativas.
              </p>
            </div>

            <div class="grid gap-6">
              <article class="metric-card relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-aurora sm:p-8">
                <div class="flex items-start justify-between">
                  <h3 class="text-sm uppercase tracking-[0.3em] text-primary-100">Consultoría Estratégica</h3>
                  <span class="rounded-full bg-primary-500/20 px-3 py-1 text-[11px] font-semibold text-primary-100">Premium</span>
                </div>
                <p class="mt-4 text-sm text-slate-300">
                  Acompañamiento ejecutivo para decisiones de alto impacto en momentos críticos de la organización.
                </p>
              </article>

              <article class="metric-card relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-aurora sm:p-8">
                <div class="flex items-start justify-between">
                  <h3 class="text-sm uppercase tracking-[0.3em] text-primary-100">Transformación Digital</h3>
                  <span class="rounded-full bg-secondary-400/20 px-3 py-1 text-[11px] font-semibold text-secondary-100">Tech</span>
                </div>
                <p class="mt-4 text-sm text-slate-300">
                  Modernización de procesos y sistemas para organizaciones que buscan escalar y competir globalmente.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <!-- Latest Posts -->
      ${featuredPosts.length > 0 ? html`
        <section id="insights" class="scroll-reveal border-b border-white/10 bg-slate-950/90">
          <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 class="text-2xl font-semibold text-white sm:text-4xl">Últimas publicaciones</h2>
                <p class="mt-3 max-w-xl text-base leading-relaxed text-slate-300">
                  Insights y tendencias que están moldeando el futuro de la industria.
                </p>
              </div>
              <a href="/blog" class="inline-flex items-center text-sm font-semibold text-slate-200 transition hover:text-white">
                Ver todo el blog
                <svg class="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </div>

            <div class="mt-12 grid gap-8 md:grid-cols-3">
              ${featuredPosts.slice(0, 3).map((post) => html`
                <article class="case-study-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-aurora sm:p-8">
                  <div class="absolute inset-0 -z-10 bg-gradient-to-br from-primary-500/15 via-slate-900/60 to-slate-950/95 transition group-hover:via-slate-900/40"></div>

                  ${post.featureImage ? html`
                    <figure class="relative mb-5 overflow-hidden rounded-2xl">
                      <img src="${post.featureImage}" alt="${post.title}" loading="lazy" decoding="async" class="h-40 w-full object-cover sm:h-48" />
                    </figure>
                  ` : ''}

                  <div class="flex items-center justify-between text-xs text-slate-300 mb-4">
                    <time datetime="${post.createdAt}">
                      ${new Date(post.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                  </div>

                  <h3 class="text-xl font-semibold text-white mb-4">
                    <a href="/blog/${post.slug}" class="hover:text-primary-300 transition">${post.title}</a>
                  </h3>

                  ${post.excerpt ? html`
                    <p class="text-sm text-slate-300">${post.excerpt}</p>
                  ` : ''}

                  <a href="/blog/${post.slug}" class="mt-4 inline-flex items-center text-sm font-semibold text-primary-200 transition hover:text-primary-100">
                    Leer más →
                  </a>
                </article>
              `)}
            </div>
          </div>
        </section>
      ` : ''}

      <!-- Contact CTA -->
      <section id="contacto" class="scroll-reveal border-b border-white/10 bg-slate-950/95">
        <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div class="glass-panel relative overflow-hidden rounded-3xl p-8 shadow-aurora sm:p-10">
            <div class="absolute -right-16 top-12 h-56 w-56 rounded-full bg-primary-500/20 blur-3xl"></div>

            <div class="relative grid gap-8 sm:gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div class="space-y-6">
                <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-300">
                  <span class="h-1.5 w-1.5 rounded-full bg-primary-300"></span>
                  Hablemos
                </span>

                <h2 class="text-2xl font-semibold text-white sm:text-4xl">
                  ¿Listo para transformar tu organización?
                </h2>

                <p class="max-w-xl text-base leading-relaxed text-slate-300">
                  Agenda una sesión estratégica sin compromiso. Conversemos sobre tus desafíos y exploremos cómo podemos ayudarte.
                </p>

                <ul class="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <li class="flex items-start gap-3">
                    <span class="mt-1 h-2 w-2 rounded-full bg-primary-300"></span>
                    Diagnóstico inicial sin costo
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-1 h-2 w-2 rounded-full bg-primary-300"></span>
                    Propuesta personalizada en 48 horas
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-1 h-2 w-2 rounded-full bg-primary-300"></span>
                    Equipo dedicado desde el día uno
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="mt-1 h-2 w-2 rounded-full bg-primary-300"></span>
                    Resultados medibles y transparentes
                  </li>
                </ul>
              </div>

              <form class="relative grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-aurora">
                <label class="text-xs uppercase tracking-[0.35em] text-slate-400">Nombre</label>
                <input
                  type="text"
                  name="name"
                  class="w-full rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  placeholder="Tu nombre"
                  required
                />

                <label class="text-xs uppercase tracking-[0.35em] text-slate-400">Email</label>
                <input
                  type="email"
                  name="email"
                  class="w-full rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  placeholder="tu@email.com"
                  required
                />

                <label class="text-xs uppercase tracking-[0.35em] text-slate-400">Mensaje</label>
                <textarea
                  name="message"
                  rows="3"
                  class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  placeholder="Cuéntanos sobre tu proyecto..."
                  required
                ></textarea>

                <button
                  type="submit"
                  class="mt-4 inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-aurora transition hover:bg-primary-400"
                >
                  Enviar mensaje
                </button>

                <p class="text-[11px] text-slate-400">
                  Responderemos en menos de 24 horas. Toda tu información es confidencial.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    ${Footer({ site, custom })}

    <style>
      .split-highlight {
        background: linear-gradient(120deg, rgba(var(--aurora-primary), 0.25), rgba(var(--aurora-secondary), 0.2));
        clip-path: polygon(0 0, 100% 0, 75% 100%, 0% 100%);
      }

      body.light-mode .split-highlight {
        background: linear-gradient(120deg, rgba(var(--aurora-primary), 0.18), rgba(var(--aurora-secondary), 0.22));
      }

      .metric-card::before {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        background: conic-gradient(
          from 180deg at 50% 50%,
          rgba(var(--aurora-secondary), 0.35),
          rgba(var(--aurora-primary), 0.3),
          transparent 70%
        );
        opacity: 0;
        transition: opacity 0.5s ease;
        z-index: -1;
      }

      .metric-card:hover::before {
        opacity: 1;
      }

      .case-study-card {
        transition: transform 0.4s ease, box-shadow 0.4s ease;
      }

      .case-study-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 30px 80px -32px rgba(59, 130, 246, 0.45);
      }

      @media (max-width: 640px) {
        .tracking-\[0\.35em\] {
          letter-spacing: 0.22em !important;
        }
      }
    </style>
  `;

  return Layout({
    site,
    custom,
    bodyClass: "home front-page corporate-theme",
    children: content,
  });
};

export default HomeTemplate;
