import { html } from "hono/html";

export interface SeoFormValues {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogType?: string | null;
  twitterCard?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  focusKeyword?: string | null;
  schemaJson?: string | null;
  noIndex?: boolean | null;
  noFollow?: boolean | null;
}

const toValue = (value: string | null | undefined): string =>
  value === null || value === undefined ? "" : value;

export function renderSeoFields(
  seo: SeoFormValues = {},
): ReturnType<typeof html> {
  const metaTitle = toValue(seo.metaTitle);
  const metaDescription = toValue(seo.metaDescription);
  const canonicalUrl = toValue(seo.canonicalUrl);
  const ogTitle = toValue(seo.ogTitle);
  const ogDescription = toValue(seo.ogDescription);
  const ogImage = toValue(seo.ogImage);
  const ogType = toValue(seo.ogType) || "article";
  const twitterCard = toValue(seo.twitterCard) || "summary_large_image";
  const twitterTitle = toValue(seo.twitterTitle);
  const twitterDescription = toValue(seo.twitterDescription);
  const twitterImage = toValue(seo.twitterImage);
  const focusKeyword = toValue(seo.focusKeyword);
  const schemaJson = toValue(seo.schemaJson);
  const noIndex = Boolean(seo.noIndex);
  const noFollow = Boolean(seo.noFollow);

  return html`
    <div class="form-card">
      <h3 class="text-lg font-semibold mb-4">SEO</h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">Meta Title</label>
          <input
            type="text"
            name="seo_metaTitle"
            value="${metaTitle}"
            class="form-input"
            placeholder="Título SEO"
          />
        </div>
        <div>
          <label class="form-label">Meta Description</label>
          <textarea
            name="seo_metaDescription"
            rows="2"
            class="form-input"
            placeholder="Descripción SEO"
          >${metaDescription}</textarea>
        </div>
        <div>
          <label class="form-label">Canonical URL</label>
          <input
            type="url"
            name="seo_canonicalUrl"
            value="${canonicalUrl}"
            class="form-input"
            placeholder="https://example.com/tu-url"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">OG Title</label>
            <input
              type="text"
              name="seo_ogTitle"
              value="${ogTitle}"
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label">OG Type</label>
            <select name="seo_ogType" class="form-input">
              ${["article", "website", "profile", "product", "video.other"].map(
                (option) =>
                  html`
                    <option value="${option}" ${option === ogType
                      ? "selected"
                      : ""}>${option}</option>
                  `,
              )}
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">OG Description</label>
          <textarea name="seo_ogDescription" rows="2" class="form-input"
          >${ogDescription}</textarea>
        </div>
        <div>
          <label class="form-label">OG Image URL</label>
          <input
            type="url"
            name="seo_ogImage"
            value="${ogImage}"
            class="form-input"
            placeholder="https://example.com/imagen.jpg"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Twitter Card</label>
            <select name="seo_twitterCard" class="form-input">
              ${["summary", "summary_large_image", "app", "player"].map((
                option,
              ) =>
                html`
                  <option value="${option}" ${option === twitterCard
                    ? "selected"
                    : ""}>${option}</option>
                `
              )}
            </select>
          </div>
          <div>
            <label class="form-label">Twitter Title</label>
            <input
              type="text"
              name="seo_twitterTitle"
              value="${twitterTitle}"
              class="form-input"
            />
          </div>
        </div>

        <div>
          <label class="form-label">Twitter Description</label>
          <textarea name="seo_twitterDescription" rows="2" class="form-input"
          >${twitterDescription}</textarea>
        </div>
        <div>
          <label class="form-label">Twitter Image URL</label>
          <input
            type="url"
            name="seo_twitterImage"
            value="${twitterImage}"
            class="form-input"
            placeholder="https://example.com/imagen-twitter.jpg"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Keyword objetivo</label>
            <input
              type="text"
              name="seo_focusKeyword"
              value="${focusKeyword}"
              class="form-input"
              placeholder="Palabra clave principal"
            />
          </div>
          <div>
            <label class="form-label">Schema JSON-LD</label>
            <textarea
              name="seo_schemaJson"
              rows="2"
              class="form-input"
              placeholder='{"@context":"https://schema.org"}'
            >${schemaJson}</textarea>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="inline-flex items-center gap-2">
            <input type="hidden" name="seo_noIndex" value="false" />
            <input
              type="checkbox"
              name="seo_noIndex"
              value="true"
              class="form-checkbox"
              ${noIndex ? "checked" : ""}
            />
            <span>No index (evitar indexación)</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="hidden" name="seo_noFollow" value="false" />
            <input
              type="checkbox"
              name="seo_noFollow"
              value="true"
              class="form-checkbox"
              ${noFollow ? "checked" : ""}
            />
            <span>No follow (evitar seguimiento de enlaces)</span>
          </label>
        </div>
      </div>
    </div>
  `;
}

export default renderSeoFields;
