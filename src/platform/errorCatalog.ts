/**
 * Catálogo central de errores de dominio con mensajes por defecto.
 * Facilita estandarizar códigos y habilitar i18n en el futuro.
 */
export type ErrorDefinition = {
  message: string;
  messages?: Record<string, string>; // mensajes por locale, ej. { en: "...", es: "..." }
  status?: number;
  trackingCode?: string;
};

const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  unauthorized: {
    message: "No autorizado",
    messages: { en: "Unauthorized" },
    status: 401,
    trackingCode: "0xE401",
  },
  forbidden: {
    message: "Acceso prohibido",
    messages: { en: "Forbidden" },
    status: 403,
    trackingCode: "0xE403",
  },
  invalid_id: {
    message: "ID inválido",
    messages: { en: "Invalid ID" },
    status: 400,
    trackingCode: "0xE400",
  },
  invalid_url: {
    message: "URL no permitida",
    messages: { en: "URL not allowed" },
    status: 400,
    trackingCode: "0xE4003",
  },
  payload_too_large: {
    message: "Payload demasiado grande",
    messages: { en: "Payload too large" },
    status: 413,
    trackingCode: "0xE413",
  },
  json_too_deep: {
    message: "JSON demasiado anidado",
    messages: { en: "JSON too deep" },
    status: 400,
    trackingCode: "0xE4006",
  },
  csrf_failed: {
    message: "CSRF inválido",
    messages: { en: "Invalid CSRF token" },
    status: 403,
    trackingCode: "0xE4031",
  },
  validation_error: {
    message: "Datos inválidos",
    messages: { en: "Invalid data" },
    status: 400,
    trackingCode: "0xE4001",
  },
  not_found: {
    message: "Recurso no encontrado",
    messages: { en: "Resource not found" },
    status: 404,
    trackingCode: "0xE404",
  },
  internal_error: {
    message: "Error interno",
    messages: { en: "Internal error" },
    status: 500,
    trackingCode: "0xE500",
  },
  login_failed: {
    message: "Credenciales inválidas",
    messages: { en: "Invalid credentials" },
    status: 401,
    trackingCode: "0xE4011",
  },
  register_failed: {
    message: "No se pudo registrar",
    messages: { en: "Registration failed" },
    status: 400,
    trackingCode: "0xE4002",
  },
  content_not_found: {
    message: "Contenido no encontrado",
    messages: { en: "Content not found" },
    status: 404,
    trackingCode: "0xE4041",
  },
  post_not_found: {
    message: "Entrada no encontrada",
    messages: { en: "Post not found" },
    status: 404,
    trackingCode: "0xE4042",
  },
  page_not_found: {
    message: "Página no encontrada",
    messages: { en: "Page not found" },
    status: 404,
    trackingCode: "0xE4043",
  },
  comment_not_found: {
    message: "Comentario no encontrado",
    messages: { en: "Comment not found" },
    status: 404,
    trackingCode: "0xE4046",
  },
  tag_not_found: {
    message: "Tag no encontrado",
    messages: { en: "Tag not found" },
    status: 404,
    trackingCode: "0xE4047",
  },
  category_not_found: {
    message: "Categoría no encontrada",
    messages: { en: "Category not found" },
    status: 404,
    trackingCode: "0xE4048",
  },
  seo_not_found: {
    message: "SEO no encontrado",
    messages: { en: "SEO entry not found" },
    status: 404,
    trackingCode: "0xE4049",
  },
  revision_not_found: {
    message: "Revisión no encontrada",
    messages: { en: "Revision not found" },
    status: 404,
    trackingCode: "0xE404A",
  },
  role_not_found: {
    message: "Rol no encontrado",
    messages: { en: "Role not found" },
    status: 404,
    trackingCode: "0xE404B",
  },
  user_not_found: {
    message: "Usuario no encontrado",
    messages: { en: "User not found" },
    status: 404,
    trackingCode: "0xE404C",
  },
  form_not_found: {
    message: "Formulario no encontrado",
    messages: { en: "Form not found" },
    status: 404,
    trackingCode: "0xE404D",
  },
  rule_not_found: {
    message: "Regla no encontrada",
    messages: { en: "Rule not found" },
    status: 404,
    trackingCode: "0xE404E",
  },
  ip_rule_not_found: {
    message: "Regla de IP no encontrada",
    messages: { en: "IP rule not found" },
    status: 404,
    trackingCode: "0xE404F",
  },
  rate_limit_rule_not_found: {
    message: "Regla de rate limit no encontrada",
    messages: { en: "Rate limit rule not found" },
    status: 404,
    trackingCode: "0xE4050",
  },
  menu_not_found: {
    message: "Menú no encontrado",
    messages: { en: "Menu not found" },
    status: 404,
    trackingCode: "0xE4044",
  },
  menu_item_not_found: {
    message: "Item no encontrado",
    messages: { en: "Menu item not found" },
    status: 404,
    trackingCode: "0xE4045",
  },
  rate_limit_exceeded: {
    message: "Límite de peticiones excedido",
    messages: { en: "Rate limit exceeded" },
    status: 429,
    trackingCode: "0xE429",
  },
};

export function getErrorDefinition(code: string): ErrorDefinition | undefined {
  return ERROR_CATALOG[code];
}

export function resolveErrorMessage(code: string, locale = "es"): string | undefined {
  const def = ERROR_CATALOG[code];
  if (!def) return;
  if (def.messages?.[locale]) return def.messages[locale];
  return def.message;
}

export const errorCatalog = ERROR_CATALOG;
