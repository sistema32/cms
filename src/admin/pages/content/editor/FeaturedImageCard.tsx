import { html } from "hono/html";
import { NexusCard } from "@/admin/components/ui/index.ts";

interface FeaturedImageCardProps {
    featuredImage?: { id: number; url: string };
}

export const FeaturedImageCard = (props: FeaturedImageCardProps) => {
    const { featuredImage } = props;

    return NexusCard({
        header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Imagen Destacada</h3>`,
        children: html`
      <div id="featuredImagePreview" style="margin-bottom: 1rem;">
        ${featuredImage ? html`
          <img
            id="featuredImageImg"
            src="${featuredImage.url}"
            alt="Imagen destacada"
            class="featured-image-preview"
            style="width: 100%; border-radius: 0.5rem; margin-bottom: 0.5rem;"
          />
          <button
            type="button"
            onclick="removeFeaturedImage()"
            style="width: 100%; padding: 0.5rem; background: #f31260; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;"
          >
            Eliminar imagen
          </button>
        ` : html`
          <div style="text-align: center; padding: 2rem; border: 2px dashed #dcdee0; border-radius: 0.5rem; color: #888;">
            No hay imagen seleccionada
          </div>
        `}
      </div>
      <input type="hidden" id="featuredImageId" name="featuredImageId" value="${featuredImage?.id || ''}" />
      <button
        type="button"
        onclick="openFeaturedImagePicker()"
        style="width: 100%; padding: 0.75rem 1rem; background: transparent; color: #167bff; border: 2px solid #167bff; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: all 0.2s;"
        onmouseover="this.style.background='#167bff'; this.style.color='white';"
        onmouseout="this.style.background='transparent'; this.style.color='#167bff';"
      >
        Seleccionar Imagen
      </button>

      <style>
        .featured-image-preview {
          width: 100%;
          border-radius: var(--nexus-radius-md, 0.5rem);
          margin-bottom: 1rem;
        }
      </style>
    `
    });
};
