/**
 * ============================================
 * SEO PROMPTS
 * ============================================
 * Templates de prompts para generación de metadatos SEO
 */

export const SYSTEM_PROMPT = `Eres un experto en SEO especializado en generar metadatos optimizados para motores de búsqueda.

REGLAS ESTRICTAS:
- metaTitle: MÁXIMO 60 caracteres (óptimo: 50-60)
- metaDescription: MÁXIMO 160 caracteres (óptimo: 150-160)
- ogTitle: 60-90 caracteres, puede ser más creativo
- ogDescription: 200-300 caracteres, más detallada
- twitterTitle: MÁXIMO 70 caracteres
- twitterDescription: MÁXIMO 200 caracteres
- focusKeyword: 1-3 palabras clave principales
- ALT text: MÁXIMO 125 caracteres

IMPORTANTE:
- Genera contenido conciso, atractivo y persuasivo
- Incluye call-to-action cuando sea apropiado
- Usa palabras clave naturalmente, sin keyword stuffing
- Responde SOLO con JSON válido, sin texto adicional
- NO uses caracteres especiales que rompan el JSON`;

/**
 * Genera prompt para contenido (posts/páginas)
 */
export function buildContentSeoPrompt(content: {
  title: string;
  excerpt?: string;
  body?: string;
  categories?: string[];
  contentType?: string;
}): string {
  const contentPreview = content.body?.substring(0, 500) || "";
  const contentType = content.contentType || "artículo";

  return `
Genera metadatos SEO optimizados para este ${contentType}:

TÍTULO: "${content.title}"
EXTRACTO: "${content.excerpt || "N/A"}"
CATEGORÍAS: ${content.categories?.join(", ") || "N/A"}
CONTENIDO (primeros 500 caracteres):
"${contentPreview}"

GENERA:
1. metaTitle (50-60 chars): Título SEO optimizado con palabra clave principal
2. metaDescription (150-160 chars): Descripción persuasiva con call-to-action
3. ogTitle (60-90 chars): Título para redes sociales, puede ser más creativo
4. ogDescription (200-300 chars): Descripción detallada para Open Graph
5. twitterTitle (max 70 chars): Título breve para Twitter
6. twitterDescription (max 200 chars): Descripción para Twitter Card
7. focusKeyword: Palabra clave principal (1-3 palabras)

RESPONDE EN FORMATO JSON:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "ogTitle": "...",
  "ogDescription": "...",
  "twitterTitle": "...",
  "twitterDescription": "...",
  "focusKeyword": "..."
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`;
}

/**
 * Genera prompt para categorías
 */
export function buildCategorySeoPrompt(category: {
  name: string;
  description?: string;
  contentCount?: number;
  contentType?: string;
}): string {
  const contentType = category.contentType || "artículos";

  return `
Genera metadatos SEO para esta página de categoría:

NOMBRE CATEGORÍA: "${category.name}"
DESCRIPCIÓN: "${category.description || "N/A"}"
CANTIDAD DE ${contentType.toUpperCase()}: ${category.contentCount || 0}

CONTEXTO: Esta es una página de archivo/categoría que lista múltiples ${contentType}.

GENERA:
1. metaTitle (50-60 chars): Incluir nombre de categoría + sitio
2. metaDescription (150-160 chars): Describir qué encontrará el usuario
3. ogTitle (60-90 chars): Título atractivo para compartir
4. ogDescription (200-300 chars): Descripción completa
5. twitterTitle (max 70 chars): Título breve
6. twitterDescription (max 200 chars): Descripción corta
7. focusKeyword: Palabra clave de la categoría

EJEMPLO:
Si la categoría es "Tecnología" con 45 artículos:
- metaTitle: "Tecnología - Noticias y Tutoriales | LexCMS"
- metaDescription: "Explora 45 artículos sobre tecnología: noticias, tutoriales, reviews y guías. Mantente actualizado con las últimas tendencias tech."

RESPONDE EN FORMATO JSON:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "ogTitle": "...",
  "ogDescription": "...",
  "twitterTitle": "...",
  "twitterDescription": "...",
  "focusKeyword": "..."
}`;
}

/**
 * Genera prompt para ALT text de imágenes
 */
export function buildMediaAltPrompt(media: {
  originalFilename: string;
  title?: string;
  caption?: string;
  description?: string;
  context?: string;
}): string {
  return `
Genera un texto ALT descriptivo y accesible para esta imagen:

NOMBRE ARCHIVO: "${media.originalFilename}"
TÍTULO: "${media.title || "N/A"}"
CAPTION: "${media.caption || "N/A"}"
DESCRIPCIÓN: "${media.description || "N/A"}"
CONTEXTO DE USO: "${media.context || "N/A"}"

REGLAS PARA ALT TEXT:
- MÁXIMO 125 caracteres
- Descriptivo pero conciso
- Explica QUÉ se ve en la imagen
- Incluye palabras clave relevantes si aplica
- Debe ser útil para lectores de pantalla (accesibilidad)
- NO uses "imagen de", "foto de" al inicio
- NO uses caracteres especiales innecesarios

EJEMPLOS BUENOS:
- "Desarrollador programando en TypeScript en laptop moderno con múltiples pantallas"
- "Gato naranja durmiendo en sofá gris junto a ventana con luz natural"
- "Dashboard de analytics mostrando gráficos de crecimiento de usuarios"

EJEMPLOS MALOS:
- "Imagen de una foto" (redundante)
- "IMG_2024_01_15.jpg" (nombre de archivo)
- "Foto" (muy vago)

RESPONDE SOLO CON EL TEXTO ALT, SIN JSON, SIN EXPLICACIONES.`;
}

/**
 * Genera prompt para schema JSON-LD
 */
export function buildSchemaJsonPrompt(content: {
  type: "Article" | "BlogPosting" | "WebPage" | "NewsArticle";
  title: string;
  description: string;
  author: string;
  publishedDate?: Date;
  modifiedDate?: Date;
  imageUrl?: string;
  url?: string;
  siteName?: string;
}): string {
  const schemaType = content.type || "Article";

  return `
Genera un schema JSON-LD válido según schema.org para este contenido:

TIPO SCHEMA: ${schemaType}
TÍTULO: "${content.title}"
DESCRIPCIÓN: "${content.description}"
AUTOR: "${content.author}"
FECHA PUBLICACIÓN: ${content.publishedDate?.toISOString() || "N/A"}
FECHA MODIFICACIÓN: ${content.modifiedDate?.toISOString() || "N/A"}
URL IMAGEN: ${content.imageUrl || "N/A"}
URL CONTENIDO: ${content.url || "N/A"}
NOMBRE SITIO: ${content.siteName || "LexCMS"}

GENERA un JSON-LD válido con:
- @context: "https://schema.org"
- @type: ${schemaType}
- headline: título del contenido
- description: descripción
- author: objeto Person con name
- datePublished: fecha en formato ISO 8601
- dateModified: fecha en formato ISO 8601 (si existe)
- image: URL de imagen (si existe)
- url: URL del contenido (si existe)
- publisher: objeto Organization con nombre del sitio

IMPORTANTE:
- Genera SOLO el JSON, sin markdown, sin \`\`\`json, sin texto adicional
- Debe ser JSON válido que se pueda parsear directamente
- Usa comillas dobles para strings
- Incluye TODOS los campos obligatorios de schema.org/${schemaType}

RESPONDE SOLO CON EL JSON PURO:`;
}

/**
 * Genera prompt para regenerar un campo específico
 */
export function buildRegenerateSingleFieldPrompt(
  field: string,
  originalValue: string,
  context: string,
): string {
  const fieldLimits: Record<string, string> = {
    metaTitle: "50-60 caracteres",
    metaDescription: "150-160 caracteres",
    ogTitle: "60-90 caracteres",
    ogDescription: "200-300 caracteres",
    twitterTitle: "70 caracteres máximo",
    twitterDescription: "200 caracteres máximo",
    focusKeyword: "1-3 palabras",
  };

  const limit = fieldLimits[field] || "según estándar SEO";

  return `
El usuario quiere regenerar este campo SEO:

CAMPO: ${field}
VALOR ACTUAL: "${originalValue}"
LÍMITE: ${limit}
CONTEXTO: "${context}"

Genera una NUEVA versión alternativa de este campo que:
- Sea diferente al valor actual
- Respete el límite de caracteres
- Mantenga el mismo tono y mensaje
- Sea igualmente efectiva para SEO

RESPONDE SOLO CON EL NUEVO TEXTO, SIN JSON, SIN EXPLICACIONES.`;
}
