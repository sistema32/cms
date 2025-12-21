import { html } from "hono/html";
import { NexusCard } from "@/admin/components/ui/index.ts";

interface PublishSettingsCardProps {
    content?: {
        status: string;
        scheduledAt?: string | null;
        visibility?: string | null;
        password?: string | null;
        contentTypeId: number;
        commentsEnabled?: boolean;
    };
    contentTypes: Array<{ id: number; name: string }>;
}

export const PublishSettingsCard = (props: PublishSettingsCardProps) => {
    const { content, contentTypes } = props;

    return NexusCard({
        header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Publicación</h3>`,
        children: html`
      <!-- Status -->
      <div class="form-field">
        <label class="form-label">Estado</label>
        <div class="status-select-wrapper">
          <div class="status-option">
            <input
              type="radio"
              id="status-draft"
              name="status"
              value="draft"
              ${!content || content.status === "draft" ? "checked" : ""}
            />
            <label for="status-draft">Borrador</label>
          </div>
          <div class="status-option">
            <input
              type="radio"
              id="status-published"
              name="status"
              value="published"
              ${content?.status === "published" ? "checked" : ""}
            />
            <label for="status-published">Publicado</label>
          </div>
          <div class="status-option">
            <input
              type="radio"
              id="status-scheduled"
              name="status"
              value="scheduled"
              ${content?.status === "scheduled" ? "checked" : ""}
            />
            <label for="status-scheduled">Programado</label>
          </div>
        </div>
      </div>

      <!-- Scheduled Date -->
      <div class="form-field" id="scheduledAtField" style="display: ${content?.status === 'scheduled' ? 'block' : 'none'};">
        <label class="form-label">Fecha de Publicación</label>
        <input
          type="datetime-local"
          name="scheduledAt"
          value="${content?.scheduledAt || ""}"
          class="form-input"
        />
      </div>

      <!-- Visibility -->
      <div class="form-field">
        <label class="form-label">Visibilidad</label>
        <select name="visibility" class="form-select">
          <option value="public" ${!content || content.visibility === "public" ? "selected" : ""}>Público</option>
          <option value="private" ${content?.visibility === "private" ? "selected" : ""}>Privado</option>
          <option value="password" ${content?.visibility === "password" ? "selected" : ""}>Protegido por contraseña</option>
        </select>
      </div>

      <!-- Password (shown when visibility is password) -->
      <div class="form-field" id="passwordField" style="display: ${content?.visibility === 'password' ? 'block' : 'none'};">
        <label class="form-label">Contraseña</label>
        <input
          type="password"
          name="password"
          value="${content?.password || ""}"
          placeholder="Contraseña de acceso"
          class="form-input"
        />
      </div>

      <!-- Content Type -->
      ${contentTypes.length > 0 ? html`
        <div class="form-field">
          <label class="form-label">Tipo de Contenido</label>
          <select name="contentTypeId" class="form-select" required>
            ${contentTypes.map(ct => html`
              <option
                value="${ct.id}"
                ${content?.contentTypeId === ct.id ? "selected" : ""}
              >
                ${ct.name}
              </option>
            `)}
          </select>
        </div>
      ` : ""}

      <!-- Comments Enabled -->
      <div class="form-field" style="margin-bottom: 0;">
        <div class="toggle-wrapper">
          <span class="toggle-label">Permitir comentarios</span>
          <label class="toggle-switch">
            <input
              type="checkbox"
              name="commentsEnabled"
              value="true"
              ${!content || content.commentsEnabled ? "checked" : ""}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `
    });
};
