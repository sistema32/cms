import { env } from "./env.ts";

type ValueProvider<T = unknown> = T | (() => T);

export type SettingFieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "select"
  | "boolean"
  | "password"
  | "url";

export interface SettingOption {
  value: string;
  label: string;
}

export interface SettingFieldDefinition {
  key: string;
  label: string;
  description?: string;
  type?: SettingFieldType;
  options?: SettingOption[];
  defaultValue?: ValueProvider;
  placeholder?: string;
}

export interface SettingCategoryDefinition {
  id: string;
  label: string;
  fields: SettingFieldDefinition[];
}

const boolEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }
  return value === "true";
};

const stringEnv = (value: string | undefined, fallback: string | null) => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  return value;
};

const settingsDefinitions: SettingCategoryDefinition[] = [
  {
    id: "general",
    label: "General",
    fields: [
      {
        key: "site_name",
        label: "Nombre del sitio",
        description: "Título principal que se muestra en todo el sitio.",
        type: "text",
        defaultValue: "LexCMS",
      },
      {
        key: "site_description",
        label: "Descripción del sitio",
        description: "Texto corto que describe el propósito del sitio.",
        type: "textarea",
        defaultValue: "Un CMS moderno y flexible",
      },
      {
        key: "site_url",
        label: "URL del sitio",
        description: "Dirección base utilizada para generar enlaces absolutos.",
        type: "url",
        defaultValue: () => env.BASE_URL ?? "http://localhost:8000",
      },
      {
        key: "admin_email",
        label: "Correo de administración",
        description: "Email donde se recibirán notificaciones del sistema.",
        type: "email",
        defaultValue: "admin@lexcms.com",
      },
      {
        key: "timezone",
        label: "Zona horaria",
        description: "Zona horaria por defecto para programaciones y fechas.",
        type: "text",
        defaultValue: "UTC",
        placeholder: "Ej. America/Mexico_City",
      },
      {
        key: "date_format",
        label: "Formato de fecha",
        description: "Formato por defecto para mostrar fechas.",
        type: "text",
        defaultValue: "DD/MM/YYYY",
        placeholder: "Ej. DD/MM/YYYY",
      },
      {
        key: "time_format",
        label: "Formato de hora",
        description: "Formato por defecto para mostrar horas.",
        type: "text",
        defaultValue: "HH:mm",
        placeholder: "Ej. HH:mm",
      },
      {
        key: "language",
        label: "Idioma",
        description: "Código de idioma por defecto del sitio.",
        type: "text",
        defaultValue: "es",
        placeholder: "Ej. es, en, fr",
      },
      {
        key: "week_starts_on",
        label: "Inicio de semana",
        description: "Día que se considera como inicio de la semana.",
        type: "select",
        defaultValue: 1,
        options: [
          { value: "0", label: "Domingo" },
          { value: "1", label: "Lunes" },
        ],
      },
    ],
  },
  {
    id: "reading",
    label: "Lectura",
    fields: [
      {
        key: "front_page_type",
        label: "Página de inicio",
        description: "Selecciona el tipo de portada predeterminado.",
        type: "select",
        defaultValue: "posts",
        options: [
          { value: "posts", label: "Entradas recientes" },
          { value: "page", label: "Una página estática" },
        ],
      },
      {
        key: "front_page_id",
        label: "Página estática",
        description: "ID de la página que se mostrará como portada (si aplica).",
        type: "number",
        defaultValue: null,
      },
      {
        key: "posts_page_id",
        label: "Página de entradas",
        description: "ID de la página que listará las entradas (si aplica).",
        type: "number",
        defaultValue: null,
      },
      {
        key: "posts_per_page",
        label: "Entradas por página",
        description: "Cantidad de contenidos en listados paginados.",
        type: "number",
        defaultValue: 10,
      },
      {
        key: "rss_posts_count",
        label: "Entradas en RSS",
        description: "Número de elementos incluidos en el feed RSS.",
        type: "number",
        defaultValue: 10,
      },
      {
        key: "rss_content_type",
        label: "Contenido RSS",
        description: "Determina si el feed muestra el contenido completo o un extracto.",
        type: "select",
        defaultValue: "full",
        options: [
          { value: "full", label: "Contenido completo" },
          { value: "excerpt", label: "Resumen" },
        ],
      },
      {
        key: "search_engine_visibility",
        label: "Visibilidad para buscadores",
        description: "Indica si se permite que motores de búsqueda indexen el sitio.",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },
  {
    id: "writing",
    label: "Escritura",
    fields: [
      {
        key: "default_post_category",
        label: "Categoría por defecto",
        description: "Categoría asignada automáticamente a nuevos contenidos.",
        type: "number",
        defaultValue: null,
      },
      {
        key: "default_post_format",
        label: "Formato por defecto",
        description: "Formato preseleccionado para nuevas entradas.",
        type: "select",
        defaultValue: "standard",
        options: [
          { value: "standard", label: "Estándar" },
          { value: "gallery", label: "Galería" },
          { value: "video", label: "Video" },
          { value: "quote", label: "Cita" },
          { value: "link", label: "Enlace" },
        ],
      },
    ],
  },
  {
    id: "discussion",
    label: "Comentarios",
    fields: [
      {
        key: "enable_comments",
        label: "Habilitar comentarios",
        description: "Permite comentarios globalmente en el sitio.",
        type: "boolean",
        defaultValue: boolEnv(Deno.env.get("ENABLE_COMMENTS"), true),
      },
      {
        key: "comment_moderation",
        label: "Moderar comentarios manualmente",
        description: "Requiere aprobación manual antes de publicar los comentarios.",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "comment_registration",
        label: "Usuarios registrados para comentar",
        description: "Restringe los comentarios a usuarios autenticados.",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "close_comments_days",
        label: "Cerrar comentarios tras (días)",
        description: "Cierra automáticamente comentarios después de cierto tiempo (0 = nunca).",
        type: "number",
        defaultValue: 0,
      },
      {
        key: "thread_comments",
        label: "Comentarios encadenados",
        description: "Habilita respuestas anidadas en los comentarios.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "thread_comments_depth",
        label: "Profundidad de hilos",
        description: "Niveles máximos permitidos para comentarios anidados.",
        type: "number",
        defaultValue: 5,
      },
      {
        key: "page_comments",
        label: "Paginar comentarios",
        description: "Divide los comentarios en páginas.",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "comments_per_page",
        label: "Comentarios por página",
        description: "Cantidad de comentarios mostrados por página.",
        type: "number",
        defaultValue: 50,
      },
      {
        key: "default_comments_page",
        label: "Orden de comentarios",
        description: "Determina si se muestran primero los más antiguos o recientes.",
        type: "select",
        defaultValue: "oldest",
        options: [
          { value: "oldest", label: "Más antiguos primero" },
          { value: "newest", label: "Más recientes primero" },
        ],
      },
    ],
  },
  {
    id: "media",
    label: "Medios",
    fields: [
      {
        key: "thumbnail_size_w",
        label: "Ancho miniaturas",
        type: "number",
        defaultValue: 150,
      },
      {
        key: "thumbnail_size_h",
        label: "Alto miniaturas",
        type: "number",
        defaultValue: 150,
      },
      {
        key: "medium_size_w",
        label: "Ancho medio",
        type: "number",
        defaultValue: 300,
      },
      {
        key: "medium_size_h",
        label: "Alto medio",
        type: "number",
        defaultValue: 300,
      },
      {
        key: "large_size_w",
        label: "Ancho grande",
        type: "number",
        defaultValue: 1024,
      },
      {
        key: "large_size_h",
        label: "Alto grande",
        type: "number",
        defaultValue: 1024,
      },
      {
        key: "uploads_use_yearmonth_folders",
        label: "Organizar por año/mes",
        description: "Guarda los archivos en carpetas por año y mes.",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    id: "permalinks",
    label: "Enlaces permanentes",
    fields: [
      {
        key: "permalink_structure",
        label: "Estructura de enlaces",
        description: "Patrón utilizado para generar URLs de contenido.",
        type: "text",
        defaultValue: "/:slug/",
        placeholder: "/:slug/",
      },
      {
        key: "category_base",
        label: "Base de categorías",
        type: "text",
        defaultValue: "category",
      },
      {
        key: "tag_base",
        label: "Base de tags",
        type: "text",
        defaultValue: "tag",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacidad",
    fields: [
      {
        key: "privacy_policy_page_id",
        label: "Página de política de privacidad",
        description: "ID de la página que contiene la política de privacidad.",
        type: "number",
        defaultValue: null,
      },
    ],
  },
  {
    id: "seo",
    label: "SEO",
    fields: [
      {
        key: "default_meta_title",
        label: "Meta título por defecto",
        description: "Título usado cuando un contenido no define su propio meta título.",
        type: "text",
        defaultValue: "LexCMS - Un CMS moderno y flexible",
      },
      {
        key: "default_meta_description",
        label: "Meta descripción por defecto",
        description: "Descripción utilizada cuando no hay una descripción específica.",
        type: "textarea",
        defaultValue:
          "Sistema de gestión de contenidos moderno, flexible y potente",
      },
      {
        key: "og_image_default",
        label: "Imagen por defecto (OpenGraph)",
        description: "URL a la imagen usada en redes sociales por defecto.",
        type: "url",
        defaultValue: null,
      },
      {
        key: "twitter_handle",
        label: "Usuario de Twitter/X",
        type: "text",
        defaultValue: "@lexcms",
      },
      {
        key: "google_analytics_id",
        label: "Google Analytics ID",
        description: "Código de seguimiento de Google Analytics.",
        type: "text",
        defaultValue: () =>
          stringEnv(Deno.env.get("GOOGLE_ANALYTICS_ID"), null),
      },
      {
        key: "google_search_console",
        label: "Google Search Console",
        description: "ID de verificación de Google Search Console.",
        type: "text",
        defaultValue: null,
      },
    ],
  },
  {
    id: "captcha",
    label: "Captcha",
    fields: [
      {
        key: "captcha_enabled",
        label: "Habilitar Captcha",
        description: "Activa un proveedor de captcha para formularios públicos.",
        type: "boolean",
        defaultValue: boolEnv(Deno.env.get("ENABLE_CAPTCHA"), false),
      },
      {
        key: "captcha_provider",
        label: "Proveedor de Captcha",
        description: "Selecciona el servicio de captcha a utilizar.",
        type: "select",
        defaultValue: () =>
          stringEnv(Deno.env.get("CAPTCHA_PROVIDER"), "recaptcha") || "recaptcha",
        options: [
          { value: "recaptcha", label: "Google reCAPTCHA" },
          { value: "hcaptcha", label: "hCaptcha" },
          { value: "turnstile", label: "Cloudflare Turnstile" },
        ],
      },
      {
        key: "captcha_recaptcha_secret",
        label: "reCAPTCHA Secret",
        type: "password",
        defaultValue: () =>
          stringEnv(Deno.env.get("RECAPTCHA_SECRET_KEY"), null),
      },
      {
        key: "captcha_hcaptcha_secret",
        label: "hCaptcha Secret",
        type: "password",
        defaultValue: () => stringEnv(Deno.env.get("HCAPTCHA_SECRET_KEY"), null),
      },
      {
        key: "captcha_turnstile_secret",
        label: "Turnstile Secret",
        type: "password",
        defaultValue: () =>
          stringEnv(Deno.env.get("TURNSTILE_SECRET_KEY"), null),
      },
    ],
  },
  {
    id: "theme",
    label: "Theme",
    fields: [
      {
        key: "active_theme",
        label: "Theme activo",
        description: "Nombre del theme que se usa en el frontend.",
        type: "text",
        defaultValue: "default",
      },
    ],
  },
  {
    id: "advanced",
    label: "Avanzado",
    fields: [
      {
        key: "maintenance_mode",
        label: "Modo mantenimiento",
        description: "Bloquea el acceso público mostrando un mensaje temporal.",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "enable_2fa",
        label: "Habilitar 2FA",
        description: "Obliga a los usuarios a configurar autenticación de dos factores.",
        type: "boolean",
        defaultValue: boolEnv(Deno.env.get("ENABLE_2FA"), false),
      },
      {
        key: "enable_registration",
        label: "Permitir registro de usuarios",
        description: "Permite a usuarios nuevos crear cuentas desde el frontend.",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
];

export const SETTINGS_DEFINITIONS: SettingCategoryDefinition[] = settingsDefinitions;

export function resolveFieldDefault(field: SettingFieldDefinition): unknown {
  if (typeof field.defaultValue === "function") {
    return (field.defaultValue as () => unknown)();
  }
  return field.defaultValue;
}

export function getDefaultSettingValues(): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const category of SETTINGS_DEFINITIONS) {
    for (const field of category.fields) {
      defaults[field.key] = resolveFieldDefault(field);
    }
  }
  return defaults;
}

export const SETTINGS_FIELD_MAP: Map<string, SettingFieldDefinition> = (() => {
  const map = new Map<string, SettingFieldDefinition>();
  for (const category of SETTINGS_DEFINITIONS) {
    for (const field of category.fields) {
      map.set(field.key, field);
    }
  }
  return map;
})();

export const SETTINGS_CATEGORY_KEY_MAP: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const category of SETTINGS_DEFINITIONS) {
    map[category.id] = category.fields.map((field) => field.key);
  }
  return map;
})();
