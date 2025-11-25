/**
 * ============================================
 * SEO AI SERVICE - MODO SIMULACIÓN
 * ============================================
 * Generación de metadatos SEO sin usar AI real
 * Útil para testing y desarrollo sin Ollama
 */

import { truncateMetaTitle, truncateMetaDescription, cleanFocusKeyword, truncateAltText } from "../utils/seo/formatters.ts";

/**
 * Templates de meta descriptions por tipo de contenido
 * Simplificado: 2 templates básicos para mock
 */
const DESCRIPTION_TEMPLATES = [
  "Descubre {title} en esta guía completa. Aprende todo lo que necesitas saber con ejemplos prácticos y consejos útiles.",
  "Guía completa sobre {title}. Información actualizada, ejemplos prácticos y consejos de expertos para ayudarte.",
];

/**
 * Extrae palabras clave del título
 */
function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3) // Filtrar palabras cortas (artículos, preposiciones)
    .slice(0, 5); // Máximo 5 palabras
}

/**
 * Capitaliza primera letra de cada palabra
 */
function capitalizeWords(text: string): string {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Genera meta description basada en template
 */
function generateDescription(title: string, excerpt?: string): string {
  if (excerpt && excerpt.length > 0) {
    return truncateMetaDescription(excerpt);
  }

  // Usar primer template por defecto (más simple que random)
  const template = DESCRIPTION_TEMPLATES[0];
  const description = template.replace(/{title}/g, title.toLowerCase());

  return truncateMetaDescription(description);
}

/**
 * Genera título social (OG/Twitter) más creativo
 * Simplificado: agrega sufijo solo si hay espacio
 */
function generateSocialTitle(title: string): string {
  // Agregar sufijo solo si el título es corto
  if (title.length < 50) {
    return `${title} - Guía Completa`;
  }
  return title;
}

/**
 * Genera descripción social más detallada
 * Simplificado: agrega texto fijo si hay espacio
 */
function generateSocialDescription(
  title: string,
  description: string,
): string {
  let social = description;

  // Si hay espacio, agregar texto adicional fijo
  if (social.length < 250) {
    social += " Incluye ejemplos prácticos y consejos de expertos.";
  }

  return social.substring(0, 300);
}

/**
 * MOCK: Genera sugerencias de SEO para contenido
 */
export async function generateContentSeoMock(content: {
  title: string;
  excerpt?: string;
  body?: string;
  categories?: string[];
}): Promise<{
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  focusKeyword: string;
}> {
  // Simular delay de red (200-500ms)
  await new Promise((resolve) =>
    setTimeout(resolve, 200 + Math.random() * 300)
  );

  // Generar metaTitle
  let metaTitle = content.title;
  if (content.categories && content.categories.length > 0) {
    const category = content.categories[0];
    metaTitle = `${content.title} - ${category}`;
  }
  metaTitle = truncateMetaTitle(metaTitle);

  // Generar metaDescription
  const metaDescription = generateDescription(content.title, content.excerpt);

  // Generar títulos sociales
  const ogTitle = truncateMetaTitle(generateSocialTitle(content.title));
  const twitterTitle = truncateMetaTitle(content.title);

  // Generar descripciones sociales
  const ogDescription = generateSocialDescription(
    content.title,
    metaDescription,
  );
  const twitterDescription = metaDescription.substring(0, 200);

  // Generar focus keyword
  const keywords = extractKeywords(content.title);
  const focusKeyword = cleanFocusKeyword(keywords.slice(0, 2).join(" "));

  return {
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    focusKeyword,
  };
}

/**
 * MOCK: Genera sugerencias de SEO para categoría
 */
export async function generateCategorySeoMock(category: {
  name: string;
  description?: string;
  contentCount?: number;
}): Promise<{
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  focusKeyword: string;
}> {
  // Simular delay
  await new Promise((resolve) =>
    setTimeout(resolve, 200 + Math.random() * 300)
  );

  const count = category.contentCount || 0;
  const capitalizedName = capitalizeWords(category.name);

  // Meta title para categoría
  const metaTitle = truncateMetaTitle(
    `${capitalizedName} - Artículos y Noticias | LexCMS`,
  );

  // Meta description
  let metaDescription = category.description ||
    `Explora ${count} artículos sobre ${category.name.toLowerCase()}.`;
  metaDescription += " Noticias, tutoriales y guías actualizadas.";
  metaDescription = truncateMetaDescription(metaDescription);

  // Social titles
  const ogTitle = truncateMetaTitle(
    `${capitalizedName} - Descubre Todo Sobre Este Tema`,
  );
  const twitterTitle = truncateMetaTitle(`${capitalizedName} en LexCMS`);

  // Social descriptions
  const ogDescription = `Explora nuestra colección de ${count} artículos sobre ${category.name.toLowerCase()}. Mantente actualizado con las últimas noticias, tutoriales y guías de expertos.`;
  const twitterDescription = metaDescription;

  // Focus keyword
  const focusKeyword = cleanFocusKeyword(category.name.toLowerCase());

  return {
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    focusKeyword,
  };
}

/**
 * MOCK: Genera ALT text para media
 */
export async function generateMediaAltMock(media: {
  originalFilename: string;
  title?: string;
  caption?: string;
  description?: string;
  context?: string;
}): Promise<string> {
  // Simular delay
  await new Promise((resolve) =>
    setTimeout(resolve, 150 + Math.random() * 200)
  );

  // Si hay título, usarlo como base
  if (media.title) {
    let alt = media.title;

    // Agregar contexto si existe
    if (media.context) {
      alt += ` - ${media.context}`;
    }

    // Agregar caption si hay espacio
    if (media.caption && alt.length < 80) {
      alt += `. ${media.caption}`;
    }

    return truncateAltText(alt);
  }

  // Si hay caption, usarla
  if (media.caption) {
    return truncateAltText(media.caption);
  }

  // Si hay description, usarla
  if (media.description) {
    return truncateAltText(media.description);
  }

  // Fallback: limpiar filename
  const cleanName = media.originalFilename
    .replace(/\.[^.]+$/, "") // Remover extensión
    .replace(/[-_]/g, " ") // Reemplazar separadores
    .replace(/\d{4}-?\d{2}-?\d{2}/g, "") // Remover fechas
    .trim();

  return truncateAltText(capitalizeWords(cleanName));
}

/**
 * MOCK: Genera schema JSON-LD
 */
export async function generateSchemaJsonMock(content: {
  type: "Article" | "BlogPosting" | "WebPage" | "NewsArticle";
  title: string;
  description: string;
  author: string;
  publishedDate?: Date;
  modifiedDate?: Date;
  imageUrl?: string;
  url?: string;
  siteName?: string;
}): Promise<string> {
  // Simular delay
  await new Promise((resolve) =>
    setTimeout(resolve, 200 + Math.random() * 300)
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": content.type,
    headline: content.title,
    description: content.description,
    author: {
      "@type": "Person",
      name: content.author,
    },
    datePublished: content.publishedDate?.toISOString() ||
      new Date().toISOString(),
    ...(content.modifiedDate && {
      dateModified: content.modifiedDate.toISOString(),
    }),
    ...(content.imageUrl && { image: content.imageUrl }),
    ...(content.url && { url: content.url }),
    publisher: {
      "@type": "Organization",
      name: content.siteName || "LexCMS",
      logo: {
        "@type": "ImageObject",
        url: "https://lexcms.com/logo.png",
      },
    },
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * MOCK: Regenera un campo específico con variación
 * Simplificado: variaciones básicas sin lógica compleja
 */
export async function regenerateSingleFieldMock(
  field: string,
  originalValue: string,
  context: string,
): Promise<string> {
  // Simular delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Generar variaciones simples según el campo
  switch (field) {
    case "metaTitle":
      return truncateMetaTitle(`Guía: ${context}`);
    case "metaDescription":
      return originalValue.replace(/\.$/, "") + ". Incluye ejemplos prácticos y consejos útiles.";
    case "focusKeyword":
      return context.split(" ").slice(0, 2).join(" ");
    default:
      return originalValue;
  }
}
