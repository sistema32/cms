import { html } from "hono/html";
import { NexusCard } from "@/admin/components/ui/index.ts";
import { CKEditorField } from "@/admin/components/editors/CKEditorField.tsx";
import { env } from "@/config/env.ts";

interface MainContentPanelProps {
    content?: {
        title: string;
        slug: string;
        body: string;
        excerpt?: string;
    };
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
    };
    errors?: Record<string, string>;
}

export const MainContentPanel = (props: MainContentPanelProps) => {
    const { content, seo = {}, errors = {} } = props;

    return html`
    <div>
      ${NexusCard({
        children: html`
          <!-- Title -->
          <div class="form-field">
            <label class="form-label">Título *</label>
            <input
              type="text"
              name="title"
              value="${content?.title || ""}"
              placeholder="Título del contenido"
              class="form-input"
              required
            />
            ${errors.title ? html`<p class="form-error">${errors.title}</p>` : ""}
          </div>

          <!-- Slug -->
          <div class="form-field">
            <label class="form-label">URL (Slug)</label>
            <input
              type="text"
              name="slug"
              value="${content?.slug || ""}"
              placeholder="url-amigable"
              class="form-input"
            />
            <p class="form-hint">Se generará automáticamente si se deja vacío</p>
            ${errors.slug ? html`<p class="form-error">${errors.slug}</p>` : ""}
          </div>

          <!-- Excerpt -->
          <div class="form-field">
            <label class="form-label">Extracto</label>
            <textarea
              name="excerpt"
              rows="3"
              placeholder="Breve descripción del contenido..."
              class="form-input"
              style="min-height: 100px;"
            >${content?.excerpt || ""}</textarea>
            ${errors.excerpt ? html`<p class="form-error">${errors.excerpt}</p>` : ""}
          </div>

          <!-- Body -->
          <div class="form-field">
            <label class="form-label">Contenido *</label>
            ${CKEditorField({
            name: "body",
            value: content?.body || "",
            placeholder: "Escribe tu contenido aquí...",
            required: true,
            mediaListEndpoint: `${env.ADMIN_PATH}/media/data`,
            mediaUploadEndpoint: `${env.ADMIN_PATH}/media`
        })}
            ${errors.body ? html`<p class="form-error">${errors.body}</p>` : ""}
          </div>
        `
    })}

      <!-- SEO Settings -->
      ${NexusCard({
        header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Configuración SEO</h3>`,
        children: html`
          <div class="form-field">
            <label class="form-label">Meta Título</label>
            <input
              type="text"
              name="seoMetaTitle"
              value="${seo.metaTitle || ""}"
              placeholder="Título para motores de búsqueda"
              class="form-input"
              maxlength="60"
            />
            <p class="form-hint">Recomendado: 50-60 caracteres</p>
          </div>

          <div class="form-field">
            <label class="form-label">Meta Descripción</label>
            <textarea
              name="seoMetaDescription"
              rows="3"
              placeholder="Descripción para motores de búsqueda"
              class="form-input"
              style="min-height: 80px;"
              maxlength="160"
            >${seo.metaDescription || ""}</textarea>
            <p class="form-hint">Recomendado: 150-160 caracteres</p>
          </div>

          <div class="form-field" style="margin-bottom: 0;">
            <label class="form-label">Palabras Clave</label>
            <input
              type="text"
              name="seoMetaKeywords"
              value="${seo.metaKeywords || ""}"
              placeholder="palabra1, palabra2, palabra3"
              class="form-input"
            />
            <p class="form-hint">Separadas por comas</p>
          </div>
        `
    })}
    </div>
  `;
};
