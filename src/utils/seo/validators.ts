/**
 * ============================================
 * SEO VALIDATORS
 * ============================================
 * Validación de longitudes y formato de metadatos SEO
 */

export interface ValidationResult {
  valid: boolean;
  length: number;
  warning?: string;
  severity?: "info" | "warning" | "error";
}

export interface SeoValidationResults {
  metaTitle?: ValidationResult;
  metaDescription?: ValidationResult;
  ogTitle?: ValidationResult;
  ogDescription?: ValidationResult;
  twitterTitle?: ValidationResult;
  twitterDescription?: ValidationResult;
  focusKeyword?: ValidationResult;
  altText?: ValidationResult;
}

/**
 * Limites de caracteres según mejores prácticas SEO
 */
export const SEO_LIMITS = {
  metaTitle: { min: 30, optimal: 50, max: 60 },
  metaDescription: { min: 70, optimal: 150, max: 160 },
  ogTitle: { min: 30, optimal: 60, max: 90 },
  ogDescription: { min: 100, optimal: 200, max: 300 },
  twitterTitle: { min: 30, optimal: 60, max: 70 },
  twitterDescription: { min: 70, optimal: 150, max: 200 },
  focusKeyword: { min: 1, optimal: 2, max: 20 }, // Palabras, no caracteres
  altText: { min: 10, optimal: 80, max: 125 },
};

/**
 * Valida la longitud de metaTitle
 */
export function validateMetaTitle(title: string): ValidationResult {
  const length = title.length;
  const limits = SEO_LIMITS.metaTitle;

  if (length === 0) {
    return {
      valid: false,
      length: 0,
      warning: "El título no puede estar vacío",
      severity: "error",
    };
  }

  if (length < limits.min) {
    return {
      valid: false,
      length,
      warning: `Muy corto. Mínimo recomendado: ${limits.min} caracteres`,
      severity: "warning",
    };
  }

  if (length > limits.max) {
    return {
      valid: false,
      length,
      warning: `Demasiado largo. Los motores de búsqueda lo cortarán después de ${limits.max} caracteres`,
      severity: "error",
    };
  }

  if (length < limits.optimal) {
    return {
      valid: true,
      length,
      warning: `Aceptable. Óptimo: ${limits.optimal}-${limits.max} caracteres`,
      severity: "info",
    };
  }

  return {
    valid: true,
    length,
    severity: "info",
  };
}

/**
 * Valida la longitud de metaDescription
 */
export function validateMetaDescription(description: string): ValidationResult {
  const length = description.length;
  const limits = SEO_LIMITS.metaDescription;

  if (length === 0) {
    return {
      valid: false,
      length: 0,
      warning: "La descripción no puede estar vacía",
      severity: "error",
    };
  }

  if (length < limits.min) {
    return {
      valid: false,
      length,
      warning: `Muy corta. Mínimo recomendado: ${limits.min} caracteres`,
      severity: "warning",
    };
  }

  if (length > limits.max) {
    return {
      valid: false,
      length,
      warning: `Demasiado larga. Google la cortará después de ${limits.max} caracteres`,
      severity: "error",
    };
  }

  if (length < limits.optimal) {
    return {
      valid: true,
      length,
      warning: `Aceptable. Óptimo: ${limits.optimal}-${limits.max} caracteres`,
      severity: "info",
    };
  }

  return {
    valid: true,
    length,
    severity: "info",
  };
}

/**
 * Valida OG Title
 */
export function validateOgTitle(title: string): ValidationResult {
  const length = title.length;
  const limits = SEO_LIMITS.ogTitle;

  if (length === 0) {
    return { valid: false, length: 0, warning: "El título OG no puede estar vacío", severity: "error" };
  }

  if (length > limits.max) {
    return {
      valid: false,
      length,
      warning: `Demasiado largo. Máximo recomendado: ${limits.max} caracteres`,
      severity: "warning",
    };
  }

  return { valid: true, length, severity: "info" };
}

/**
 * Valida OG Description
 */
export function validateOgDescription(description: string): ValidationResult {
  const length = description.length;
  const limits = SEO_LIMITS.ogDescription;

  if (length === 0) {
    return { valid: false, length: 0, warning: "La descripción OG no puede estar vacía", severity: "error" };
  }

  if (length > limits.max) {
    return {
      valid: false,
      length,
      warning: `Demasiado larga. Máximo recomendado: ${limits.max} caracteres`,
      severity: "warning",
    };
  }

  return { valid: true, length, severity: "info" };
}

/**
 * Valida Twitter Title
 */
export function validateTwitterTitle(title: string): ValidationResult {
  const length = title.length;
  const limits = SEO_LIMITS.twitterTitle;

  if (length === 0) {
    return { valid: false, length: 0, warning: "El título de Twitter no puede estar vacío", severity: "error" };
  }

  if (length > limits.max) {
    return {
      valid: false,
      length,
      warning: `Demasiado largo. Máximo: ${limits.max} caracteres`,
      severity: "error",
    };
  }

  return { valid: true, length, severity: "info" };
}

/**
 * Valida Twitter Description
 */
export function validateTwitterDescription(description: string): ValidationResult {
  const length = description.length;
  const limits = SEO_LIMITS.twitterDescription;

  if (length === 0) {
    return { valid: false, length: 0, warning: "La descripción de Twitter no puede estar vacía", severity: "error" };
  }

  if (length > limits.max) {
    return {
      valid: false,
      length,
      warning: `Demasiado larga. Máximo: ${limits.max} caracteres`,
      severity: "error",
    };
  }

  return { valid: true, length, severity: "info" };
}

/**
 * Valida focus keyword (por cantidad de palabras, no caracteres)
 */
export function validateFocusKeyword(keyword: string): ValidationResult {
  const wordCount = keyword.trim().split(/\s+/).length;
  const charLength = keyword.length;
  const limits = SEO_LIMITS.focusKeyword;

  if (charLength === 0) {
    return {
      valid: false,
      length: 0,
      warning: "La palabra clave no puede estar vacía",
      severity: "error",
    };
  }

  if (wordCount > 4) {
    return {
      valid: false,
      length: charLength,
      warning: "Demasiadas palabras. Máximo recomendado: 1-3 palabras",
      severity: "warning",
    };
  }

  if (charLength > limits.max) {
    return {
      valid: false,
      length: charLength,
      warning: "Demasiado larga. Máximo: 20 caracteres",
      severity: "warning",
    };
  }

  return { valid: true, length: charLength, severity: "info" };
}

/**
 * Valida ALT text de imagen
 */
export function validateAltText(altText: string): ValidationResult {
  const length = altText.length;
  const limits = SEO_LIMITS.altText;

  if (length === 0) {
    return {
      valid: false,
      length: 0,
      warning: "El texto ALT no puede estar vacío",
      severity: "error",
    };
  }

  if (length < limits.min) {
    return {
      valid: false,
      length,
      warning: `Muy corto. Mínimo recomendado: ${limits.min} caracteres`,
      severity: "warning",
    };
  }

  if (length > limits.max) {
    return {
      valid: false,
      length,
      warning: `Demasiado largo. Los lectores de pantalla pueden cortarlo después de ${limits.max} caracteres`,
      severity: "error",
    };
  }

  return { valid: true, length, severity: "info" };
}

/**
 * Valida todos los campos SEO de contenido
 */
export function validateContentSeo(seo: {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  focusKeyword?: string;
}): SeoValidationResults {
  const results: SeoValidationResults = {};

  if (seo.metaTitle) {
    results.metaTitle = validateMetaTitle(seo.metaTitle);
  }

  if (seo.metaDescription) {
    results.metaDescription = validateMetaDescription(seo.metaDescription);
  }

  if (seo.ogTitle) {
    results.ogTitle = validateOgTitle(seo.ogTitle);
  }

  if (seo.ogDescription) {
    results.ogDescription = validateOgDescription(seo.ogDescription);
  }

  if (seo.twitterTitle) {
    results.twitterTitle = validateTwitterTitle(seo.twitterTitle);
  }

  if (seo.twitterDescription) {
    results.twitterDescription = validateTwitterDescription(
      seo.twitterDescription,
    );
  }

  if (seo.focusKeyword) {
    results.focusKeyword = validateFocusKeyword(seo.focusKeyword);
  }

  return results;
}

/**
 * Verifica si hay errores críticos en la validación
 */
export function hasValidationErrors(
  validation: SeoValidationResults,
): boolean {
  return Object.values(validation).some(
    (result) => result.severity === "error",
  );
}

/**
 * Verifica si hay warnings en la validación
 */
export function hasValidationWarnings(
  validation: SeoValidationResults,
): boolean {
  return Object.values(validation).some(
    (result) => result.severity === "warning",
  );
}

/**
 * Cuenta el total de errores
 */
export function countErrors(validation: SeoValidationResults): number {
  return Object.values(validation).filter(
    (result) => result.severity === "error",
  ).length;
}

/**
 * Cuenta el total de warnings
 */
export function countWarnings(validation: SeoValidationResults): number {
  return Object.values(validation).filter(
    (result) => result.severity === "warning",
  ).length;
}
