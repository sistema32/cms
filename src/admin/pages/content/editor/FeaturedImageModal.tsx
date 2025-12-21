import { html } from "hono/html";

export const FeaturedImageModal = () => {
    return html`
    <div id="featuredImageModal" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000; padding: 2rem; overflow-y: auto;">
      <div style="max-width: 1200px; margin: 0 auto; background: white; border-radius: 0.75rem; padding: 1.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Seleccionar Imagen Destacada</h3>
          <button
            type="button"
            onclick="closeFeaturedImagePicker()"
            style="width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; font-size: 1.5rem; color: #666;"
          >
            ×
          </button>
        </div>

        <!-- Upload Section -->
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">
          <input type="file" id="featuredImageUploadInput" accept="image/*" style="display: none;" />
          <button
            type="button"
            onclick="document.getElementById('featuredImageUploadInput').click()"
            style="width: 100%; padding: 0.75rem 1rem; background: #167bff; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: all 0.2s;"
            onmouseover="this.style.background='#1266dd';"
            onmouseout="this.style.background='#167bff';"
          >
            📤 Subir Nueva Imagen
          </button>
          <div id="uploadProgress" style="display: none; margin-top: 0.5rem; text-align: center; color: #167bff; font-size: 0.875rem;"></div>
        </div>

        <div id="featuredImageModalContent">
          <div style="text-align: center; padding: 2rem; color: #666;">
            Cargando...
          </div>
        </div>
      </div>
    </div>
  `;
};
