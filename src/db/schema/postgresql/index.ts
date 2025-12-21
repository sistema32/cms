import {
    integer,
    primaryKey,
    pgTable,
    text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ============= TABLES =============

// ============= ROLES =============
export const roles = pgTable("roles", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false), // roles del sistema no se pueden eliminar
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

// ============= PERMISSIONS =============
export const permissions = pgTable("permissions", {
    id: serial("id").primaryKey(),
    module: text("module").notNull(), // ej: "users", "posts", "comments"
    action: text("action").notNull(), // ej: "create", "read", "update", "delete"
    description: text("description"),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

// ============= ROLE_PERMISSIONS (Many-to-Many) =============
export const rolePermissions = pgTable("role_permissions", {
    roleId: integer("role_id").notNull().references(() => roles.id, {
        onDelete: "cascade",
    }),
    permissionId: integer("permission_id").notNull().references(
        () => permissions.id,
        { onDelete: "cascade" },
    ),
}, (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

// ============= USERS =============
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name"),
    avatar: text("avatar"), // URL del avatar
    status: text("status").notNull().default("active"), // active, inactive, suspended
    roleId: integer("role_id").references(() => roles.id),
    twoFactorEnabled: boolean("two_factor_enabled").notNull()
        .default(false),
    twoFactorSecret: text("two_factor_secret"),
    lastLoginAt: timestamp("last_login_at"), // Último login
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= USER 2FA =============
export const user2FA = pgTable("user_2fa", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().unique().references(() => users.id, {
        onDelete: "cascade",
    }),
    secret: text("secret").notNull(), // Secret TOTP (encriptado)
    backupCodes: text("backup_codes").notNull(), // JSON array de códigos hasheados
    isEnabled: boolean("is_enabled").notNull().default(
        false,
    ),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= CONTENT TYPES =============
export const contentTypes = pgTable("content_types", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(), // post, page, product, event
    slug: text("slug").notNull().unique(),
    description: text("description"),
    icon: text("icon"), // emoji o nombre de icono
    isPublic: boolean("is_public").notNull().default(true),
    hasCategories: boolean("has_categories").notNull()
        .default(true),
    hasTags: boolean("has_tags").notNull().default(true),
    hasComments: boolean("has_comments").notNull().default(
        false,
    ),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= CATEGORIES =============
export const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: integer("parent_id"), // auto-referencia para jerarquía
    contentTypeId: integer("content_type_id").references(() => contentTypes.id, {
        onDelete: "cascade",
    }),
    color: text("color"), // hex color
    icon: text("icon"),
    order: integer("order").default(0),
    deletedAt: timestamp("deleted_at"), // soft delete
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= TAGS =============
export const tags = pgTable("tags", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    color: text("color"),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

// ============= CONTENT =============
export const content = pgTable("content", {
    id: serial("id").primaryKey(),
    contentTypeId: integer("content_type_id").notNull().references(
        () => contentTypes.id,
        { onDelete: "cascade" },
    ),
    parentId: integer("parent_id"), // Para páginas hijas (child pages)
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt"),
    body: text("body"),
    featuredImageId: integer("featured_image_id").references(() => media.id, {
        onDelete: "set null",
    }),
    authorId: integer("author_id").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    status: text("status").notNull().default("draft"), // draft, published, scheduled, archived
    visibility: text("visibility").notNull().default("public"), // public, private, password
    password: text("password"),
    publishedAt: timestamp("published_at"),
    scheduledAt: timestamp("scheduled_at"),
    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    commentsEnabled: boolean("comments_enabled").notNull()
        .default(false), // Control de comentarios a nivel de contenido individual
    template: text("template"), // Template personalizado para páginas (ej: "page-inicio", "page-contacto")
    featured: boolean("featured").notNull().default(false), // Post destacado para homepage y destacados
    sticky: boolean("sticky").notNull().default(false), // Post fijo en la parte superior de listados
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= CONTENT_CATEGORIES (Many-to-Many) =============
export const contentCategories = pgTable("content_categories", {
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    categoryId: integer("category_id").notNull().references(() => categories.id, {
        onDelete: "cascade",
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.contentId, table.categoryId] }),
}));

// ============= CONTENT_TAGS (Many-to-Many) =============
export const contentTags = pgTable("content_tags", {
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    tagId: integer("tag_id").notNull().references(() => tags.id, {
        onDelete: "cascade",
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.contentId, table.tagId] }),
}));

// ============= CONTENT_SEO =============
export const contentSeo = pgTable("content_seo", {
    id: serial("id").primaryKey(),
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }).unique(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    ogType: text("og_type").default("article"),
    twitterCard: text("twitter_card").default("summary_large_image"),
    twitterTitle: text("twitter_title"),
    twitterDescription: text("twitter_description"),
    twitterImage: text("twitter_image"),
    schemaJson: text("schema_json"), // JSON-LD
    focusKeyword: text("focus_keyword"),
    noIndex: boolean("no_index").notNull().default(false),
    noFollow: boolean("no_follow").notNull().default(false),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= CONTENT_META =============
export const contentMeta = pgTable("content_meta", {
    id: serial("id").primaryKey(),
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    key: text("key").notNull(),
    value: text("value"),
    type: text("type").default("string"), // string, number, boolean, json
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

// ============= COMMENTS =============
export const comments = pgTable("comments", {
    id: serial("id").primaryKey(),
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    parentId: integer("parent_id"), // self-reference para threading (1 nivel)
    authorId: integer("author_id").references(() => users.id, {
        onDelete: "set null",
    }), // nullable para guests
    authorName: text("author_name"), // para guests
    authorEmail: text("author_email"), // para guests
    authorWebsite: text("author_website"), // opcional
    body: text("body").notNull(), // contenido original sin censura
    bodyCensored: text("body_censored").notNull(), // contenido público con censura aplicada
    captchaToken: text("captcha_token"), // token del captcha verificado
    captchaProvider: text("captcha_provider"), // recaptcha, hcaptcha, turnstile
    status: text("status").notNull().default("approved"), // approved, spam, deleted
    ipAddress: text("ip_address"), // para seguridad/spam prevention
    userAgent: text("user_agent"), // para seguridad
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
    deletedAt: timestamp("deleted_at"), // soft delete
});

// ============= CONTENT_FILTERS =============
export const contentFilters = pgTable("content_filters", {
    id: serial("id").primaryKey(),
    type: text("type").notNull(), // word, email, link, phone
    pattern: text("pattern").notNull(), // texto o regex
    isRegex: boolean("is_regex").notNull().default(false), // si es regex o texto plano
    replacement: text("replacement").notNull(), // texto que reemplaza (ej: "[link removido]")
    description: text("description"), // opcional, para documentar el filtro
    isActive: boolean("is_active").notNull().default(true), // si está activo
    createdBy: integer("created_by").notNull().references(() => users.id, {
        onDelete: "cascade",
    }), // admin que lo creó
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= MEDIA =============
export const media = pgTable("media", {
    id: serial("id").primaryKey(),
    filename: text("filename").notNull(), // nombre sanitizado: hash_timestamp.webp
    originalFilename: text("original_filename").notNull(), // nombre original del archivo
    mimeType: text("mime_type").notNull(), // image/webp, video/webm, application/pdf
    size: integer("size").notNull(), // tamaño en bytes
    hash: text("hash").notNull().unique(), // SHA-256 hash para evitar duplicados
    path: text("path").notNull(), // ruta relativa: uploads/2025/11/hash_timestamp.webp
    url: text("url").notNull(), // URL completa del archivo
    storageProvider: text("storage_provider").notNull().default("local"), // local, s3, cloudinary
    type: text("type").notNull(), // image, video, audio, document
    width: integer("width"), // para imágenes y videos
    height: integer("height"), // para imágenes y videos
    duration: integer("duration"), // para videos y audios (en segundos)
    uploadedBy: integer("uploaded_by").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= MEDIA_SIZES =============
export const mediaSizes = pgTable("media_sizes", {
    id: serial("id").primaryKey(),
    mediaId: integer("media_id").notNull().references(() => media.id, {
        onDelete: "cascade",
    }),
    size: text("size").notNull(), // thumbnail, small, medium, large, original
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    path: text("path").notNull(),
    url: text("url").notNull(),
    fileSize: integer("file_size").notNull(), // tamaño en bytes
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

// ============= MEDIA_SEO =============
export const mediaSeo = pgTable("media_seo", {
    id: serial("id").primaryKey(),
    mediaId: integer("media_id").notNull().references(() => media.id, {
        onDelete: "cascade",
    }).unique(),
    alt: text("alt"), // texto alternativo (crítico para imágenes)
    title: text("title"), // título del medio
    caption: text("caption"), // descripción/caption
    description: text("description"), // descripción larga
    focusKeyword: text("focus_keyword"), // keyword SEO
    credits: text("credits"), // créditos/autor
    copyright: text("copyright"), // información de copyright
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= CATEGORY_SEO =============
export const categorySeo = pgTable("category_seo", {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id").notNull().references(() => categories.id, {
        onDelete: "cascade",
    }).unique(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImage: text("og_image"),
    ogType: text("og_type").default("website"),
    twitterCard: text("twitter_card").default("summary_large_image"),
    twitterTitle: text("twitter_title"),
    twitterDescription: text("twitter_description"),
    twitterImage: text("twitter_image"),
    schemaJson: text("schema_json"), // JSON-LD
    focusKeyword: text("focus_keyword"),
    noIndex: boolean("no_index").notNull().default(false),
    noFollow: boolean("no_follow").notNull().default(false),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= MENUS =============
export const menus = pgTable("menus", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= MENU_ITEMS =============
export const menuItems = pgTable("menu_items", {
    id: serial("id").primaryKey(),
    menuId: integer("menu_id").notNull().references(() => menus.id, {
        onDelete: "cascade",
    }),
    parentId: integer("parent_id"), // auto-referencia para jerarquía ilimitada

    // Contenido del item
    label: text("label").notNull(),
    title: text("title"), // atributo title (tooltip)

    // Tipos de enlaces (solo uno debe estar presente)
    url: text("url"),
    contentId: integer("content_id").references(() => content.id, {
        onDelete: "set null",
    }),
    categoryId: integer("category_id").references(() => categories.id, {
        onDelete: "set null",
    }),
    tagId: integer("tag_id").references(() => tags.id, { onDelete: "set null" }),

    // Configuración visual
    icon: text("icon"),
    cssClass: text("css_class"),
    cssId: text("css_id"),
    target: text("target").default("_self"), // "_self", "_blank", "_parent"

    // Control de orden y visibilidad
    order: integer("order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),

    // Control de permisos (opcional)
    requiredPermission: text("required_permission"),

    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= WIDGET AREAS =============
export const widgetAreas = pgTable("widget_areas", {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    theme: text("theme").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= WIDGETS =============
export const widgets = pgTable("widgets", {
    id: serial("id").primaryKey(),
    areaId: integer("area_id").references(() => widgetAreas.id, {
        onDelete: "cascade",
    }),
    type: text("type").notNull(), // 'search', 'recent-posts', 'custom-html', etc.
    title: text("title"),
    settings: text("settings"), // JSON
    order: integer("order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= SETTINGS =============
export const settings = pgTable("settings", {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value"), // JSON stringified para valores complejos
    category: text("category").notNull().default("general"), // Agrupar settings por categoría
    autoload: boolean("autoload").notNull().default(true), // WordPress-style: cargar en cache automáticamente
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

// ============= CONTENT REVISIONS (Historial de Versiones) =============
export const contentRevisions = pgTable("content_revisions", {
    id: serial("id").primaryKey(),
    contentId: integer("content_id").notNull().references(() => content.id, {
        onDelete: "cascade",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    status: text("status").notNull(),
    visibility: text("visibility").notNull(),
    password: text("password"),
    featuredImageId: integer("featured_image_id"),
    publishedAt: timestamp("published_at"),
    scheduledAt: timestamp("scheduled_at"),
    // Metadatos de la revisión
    revisionNumber: integer("revision_number").notNull(), // Número secuencial de versión
    authorId: integer("author_id").notNull().references(() => users.id, {
        onDelete: "cascade",
    }), // Autor de esta versión
    changesSummary: text("changes_summary"), // Resumen opcional de los cambios
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

// ============= PLUGINS (DB-first) =============
export const plugins = pgTable("plugins", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(), // slug
    displayName: text("display_name"),
    version: text("version"),
    description: text("description"),
    author: text("author"),
    homepage: text("homepage"),
    sourceUrl: text("source_url"),
    manifestHash: text("manifest_hash"),
    manifestSignature: text("manifest_signature"),
    status: text("status").notNull().default("inactive"), // inactive|active|error|degraded
    isSystem: boolean("is_system").notNull().default(false),
    settings: text("settings"), // JSON string
    permissions: text("permissions"), // JSON string declarativa
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pluginMigrations = pgTable("plugin_migrations", {
    id: serial("id").primaryKey(),
    pluginId: integer("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    appliedAt: timestamp("applied_at").notNull().defaultNow(),
}, (table) => ({
    uniq: unique("uniq_plugin_migration").on(table.pluginId, table.name),
}));

export const pluginHealth = pgTable("plugin_health", {
    id: serial("id").primaryKey(),
    pluginId: integer("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("ok"),
    lastCheckedAt: timestamp("last_checked_at"),
    lastError: text("last_error"),
    latencyMs: integer("latency_ms"),
});

export const pluginPermissionGrants = pgTable("plugin_permission_grants", {
    id: serial("id").primaryKey(),
    pluginId: integer("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    granted: boolean("granted").notNull().default(true),
    grantedBy: integer("granted_by"), // user id opcional
    grantedAt: timestamp("granted_at").notNull().defaultNow(),
});

// ============= AUDIT LOGS =============
export const auditLogs = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    // Who performed the action
    userId: integer("user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    userEmail: text("user_email"), // Store email in case user is deleted

    // What action was performed
    action: text("action").notNull(), // create, update, delete, login, logout, etc.
    entity: text("entity").notNull(), // user, content, plugin, setting, etc.
    entityId: text("entity_id"), // ID of the affected entity

    // Details
    description: text("description"), // Human-readable description
    changes: text("changes"), // JSON with before/after values
    metadata: text("metadata"), // JSON with additional context

    // Request context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Severity level
    level: text("level").notNull().default("info"), // debug, info, warning, error, critical

    // Timestamp
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

// ============= WEBHOOKS =============
export const webhooks = pgTable("webhooks", {
    id: serial("id").primaryKey(),

    // Configuration
    name: text("name").notNull(), // User-friendly name
    url: text("url").notNull(), // Target URL
    secret: text("secret"), // Secret for signature verification

    // Events to listen to
    events: text("events").notNull(), // JSON array of event names

    // Status
    isActive: boolean("is_active").notNull().default(true),

    // Retry configuration
    maxRetries: integer("max_retries").notNull().default(3),
    retryDelay: integer("retry_delay").notNull().default(60), // seconds

    // Statistics
    totalDeliveries: integer("total_deliveries").notNull().default(0),
    successfulDeliveries: integer("successful_deliveries").notNull().default(0),
    failedDeliveries: integer("failed_deliveries").notNull().default(0),
    lastDeliveryAt: timestamp("last_delivery_at"),
    lastSuccessAt: timestamp("last_success_at"),
    lastFailureAt: timestamp("last_failure_at"),

    // Metadata
    description: text("description"),
    metadata: text("metadata"), // JSON for additional config

    // Timestamps
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
    id: serial("id").primaryKey(),

    // Reference
    webhookId: integer("webhook_id").notNull().references(() => webhooks.id, {
        onDelete: "cascade",
    }),

    // Event data
    event: text("event").notNull(), // Event name (e.g., "content.created")
    payload: text("payload").notNull(), // JSON payload sent

    // Delivery attempt
    attempt: integer("attempt").notNull().default(1), // Current attempt number
    status: text("status").notNull(), // pending, success, failed, cancelled

    // Response
    responseStatus: integer("response_status"), // HTTP status code
    responseBody: text("response_body"), // Response body (truncated)
    responseTime: integer("response_time"), // Response time in ms

    // Error details
    errorMessage: text("error_message"),

    // Timestamps
    scheduledAt: timestamp("scheduled_at")
        .notNull()
        .defaultNow(),
    deliveredAt: timestamp("delivered_at"),
    nextRetryAt: timestamp("next_retry_at"),

    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

// ============= RELATIONS =============

export const rolesRelations = relations(roles, ({ many }) => ({
    users: many(users),
    rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(
    rolePermissions,
    ({ one }) => ({
        role: one(roles, {
            fields: [rolePermissions.roleId],
            references: [roles.id],
        }),
        permission: one(permissions, {
            fields: [rolePermissions.permissionId],
            references: [permissions.id],
        }),
    }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id],
    }),
    twoFactor: one(user2FA),
    content: many(content),
    media: many(media),
    comments: many(comments),
    contentFilters: many(contentFilters),
}));

export const user2FARelations = relations(user2FA, ({ one }) => ({
    user: one(users, {
        fields: [user2FA.userId],
        references: [users.id],
    }),
}));

export const contentTypesRelations = relations(contentTypes, ({ many }) => ({
    content: many(content),
    categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: "categoryParent",
    }),
    children: many(categories, {
        relationName: "categoryParent",
    }),
    contentType: one(contentTypes, {
        fields: [categories.contentTypeId],
        references: [contentTypes.id],
    }),
    contentCategories: many(contentCategories),
    seo: one(categorySeo, {
        fields: [categorySeo.categoryId],
        references: [categories.id],
    }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    contentTags: many(contentTags),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
    contentType: one(contentTypes, {
        fields: [content.contentTypeId],
        references: [contentTypes.id],
    }),
    parent: one(content, {
        fields: [content.parentId],
        references: [content.id],
        relationName: "contentParent",
    }),
    children: many(content, {
        relationName: "contentParent",
    }),
    featuredImage: one(media, {
        fields: [content.featuredImageId],
        references: [media.id],
    }),
    author: one(users, {
        fields: [content.authorId],
        references: [users.id],
    }),
    contentCategories: many(contentCategories),
    contentTags: many(contentTags),
    seo: one(contentSeo),
    meta: many(contentMeta),
    comments: many(comments),
    revisions: many(contentRevisions),
}));

export const contentCategoriesRelations = relations(
    contentCategories,
    ({ one }) => ({
        content: one(content, {
            fields: [contentCategories.contentId],
            references: [content.id],
        }),
        category: one(categories, {
            fields: [contentCategories.categoryId],
            references: [categories.id],
        }),
    }),
);

export const contentTagsRelations = relations(contentTags, ({ one }) => ({
    content: one(content, {
        fields: [contentTags.contentId],
        references: [content.id],
    }),
    tag: one(tags, {
        fields: [contentTags.tagId],
        references: [tags.id],
    }),
}));

export const contentSeoRelations = relations(contentSeo, ({ one }) => ({
    content: one(content, {
        fields: [contentSeo.contentId],
        references: [content.id],
    }),
}));

export const contentMetaRelations = relations(contentMeta, ({ one }) => ({
    content: one(content, {
        fields: [contentMeta.contentId],
        references: [content.id],
    }),
}));

export const mediaRelations = relations(media, ({ one, many }) => ({
    uploadedBy: one(users, {
        fields: [media.uploadedBy],
        references: [users.id],
    }),
    sizes: many(mediaSizes),
    seo: one(mediaSeo, {
        fields: [mediaSeo.mediaId],
        references: [media.id],
    }),
}));

export const mediaSizesRelations = relations(mediaSizes, ({ one }) => ({
    media: one(media, {
        fields: [mediaSizes.mediaId],
        references: [media.id],
    }),
}));

export const mediaSeoRelations = relations(mediaSeo, ({ one }) => ({
    media: one(media, {
        fields: [mediaSeo.mediaId],
        references: [media.id],
    }),
}));

export const categorySeoRelations = relations(categorySeo, ({ one }) => ({
    category: one(categories, {
        fields: [categorySeo.categoryId],
        references: [categories.id],
    }),
}));

export const menusRelations = relations(menus, ({ many }) => ({
    items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
    menu: one(menus, {
        fields: [menuItems.menuId],
        references: [menus.id],
    }),
    parent: one(menuItems, {
        fields: [menuItems.parentId],
        references: [menuItems.id],
        relationName: "menuItemParent",
    }),
    children: many(menuItems, {
        relationName: "menuItemParent",
    }),
    content: one(content, {
        fields: [menuItems.contentId],
        references: [content.id],
    }),
    category: one(categories, {
        fields: [menuItems.categoryId],
        references: [categories.id],
    }),
    tag: one(tags, {
        fields: [menuItems.tagId],
        references: [tags.id],
    }),
}));

export const widgetAreasRelations = relations(widgetAreas, ({ many }) => ({
    widgets: many(widgets),
}));

export const widgetsRelations = relations(widgets, ({ one }) => ({
    area: one(widgetAreas, {
        fields: [widgets.areaId],
        references: [widgetAreas.id],
    }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
    content: one(content, {
        fields: [comments.contentId],
        references: [content.id],
    }),
    author: one(users, {
        fields: [comments.authorId],
        references: [users.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: "comment_replies",
    }),
    replies: many(comments, {
        relationName: "comment_replies",
    }),
}));

export const contentFiltersRelations = relations(contentFilters, ({ one }) => ({
    createdBy: one(users, {
        fields: [contentFilters.createdBy],
        references: [users.id],
    }),
}));

export const contentRevisionsRelations = relations(
    contentRevisions,
    ({ one }) => ({
        content: one(content, {
            fields: [contentRevisions.contentId],
            references: [content.id],
        }),
        author: one(users, {
            fields: [contentRevisions.authorId],
            references: [users.id],
        }),
    }),
);

export const pluginsRelations = relations(plugins, ({ many }) => ({
    migrations: many(pluginMigrations),
    health: many(pluginHealth),
    permissionGrants: many(pluginPermissionGrants),
}));

export const pluginMigrationsRelations = relations(pluginMigrations, ({ one }) => ({
    plugin: one(plugins, {
        fields: [pluginMigrations.pluginId],
        references: [plugins.id],
    }),
}));

export const pluginHealthRelations = relations(pluginHealth, ({ one }) => ({
    plugin: one(plugins, {
        fields: [pluginHealth.pluginId],
        references: [plugins.id],
    }),
}));

export const pluginPermissionGrantsRelations = relations(pluginPermissionGrants, ({ one }) => ({
    plugin: one(plugins, {
        fields: [pluginPermissionGrants.pluginId],
        references: [plugins.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));

export const webhooksRelations = relations(webhooks, ({ many }) => ({
    deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(
    webhookDeliveries,
    ({ one }) => ({
        webhook: one(webhooks, {
            fields: [webhookDeliveries.webhookId],
            references: [webhooks.id],
        }),
    }),
);

// ============= EMAIL QUEUE =============
export const emailQueue = pgTable("email_queue", {
    id: serial("id").primaryKey(),
    to: text("to").notNull(), // JSON array of recipients
    from: text("from"), // JSON object
    subject: text("subject").notNull(),
    text: text("text"),
    html: text("html"),
    attachments: text("attachments"), // JSON array
    headers: text("headers"), // JSON object
    priority: text("priority").notNull().default("normal"), // high, normal, low
    status: text("status").notNull().default("pending"), // pending, processing, sent, failed, cancelled
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastAttemptAt: timestamp("last_attempt_at"),
    nextRetryAt: timestamp("next_retry_at"),
    sentAt: timestamp("sent_at"),
    error: text("error"),
    provider: text("provider"), // smtp, sendgrid, mailgun, etc.
    providerMessageId: text("provider_message_id"),
    metadata: text("metadata"), // JSON object
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: timestamp("updated_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= EMAIL TEMPLATES =============
export const emailTemplates = pgTable("email_templates", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    subject: text("subject").notNull(),
    textTemplate: text("text_template").notNull(),
    htmlTemplate: text("html_template").notNull(),
    variables: text("variables"), // JSON array of variable names
    description: text("description"),
    category: text("category"), // auth, notification, system, etc.
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: timestamp("updated_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= NOTIFICATIONS =============
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    type: text("type").notNull(), // comment.new, mention, content.published, etc.
    title: text("title").notNull(),
    message: text("message").notNull(),
    icon: text("icon"),
    link: text("link"),
    actionLabel: text("action_label"),
    actionUrl: text("action_url"),
    data: text("data"), // JSON additional data
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    emailSent: boolean("email_sent").notNull().default(
        false,
    ),
    emailSentAt: timestamp("email_sent_at"),
    priority: text("priority").notNull().default("normal"), // low, normal, high
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= NOTIFICATION PREFERENCES =============
export const notificationPreferences = pgTable("notification_preferences", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().unique().references(() => users.id, {
        onDelete: "cascade",
    }),
    emailNotifications: boolean("email_notifications")
        .notNull().default(true),
    emailDigest: text("email_digest").notNull().default("daily"), // never, daily, weekly
    notifyComments: boolean("notify_comments").notNull()
        .default(true),
    notifyReplies: boolean("notify_replies").notNull()
        .default(true),
    notifyMentions: boolean("notify_mentions").notNull()
        .default(true),
    notifyContentPublished: integer("notify_content_published", {
        mode: "boolean",
    }).notNull().default(true),
    notifySystemAlerts: boolean("notify_system_alerts")
        .notNull().default(true),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: timestamp("updated_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

// ============= EMAIL & NOTIFICATION RELATIONS =============

export const emailQueueRelations = relations(emailQueue, ({ }) => ({}));

export const emailTemplatesRelations = relations(emailTemplates, ({ }) => ({}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export const notificationPreferencesRelations = relations(
    notificationPreferences,
    ({ one }) => ({
        user: one(users, {
            fields: [notificationPreferences.userId],
            references: [users.id],
        }),
    }),
);

// ============= BACKUPS =============
export const backups = pgTable("backups", {
    id: serial("id").primaryKey(),
    filename: text("filename").notNull(),
    type: text("type").notNull(), // full, database, media, config
    size: integer("size").notNull(), // bytes
    status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed
    storageProvider: text("storage_provider").notNull().default("local"), // local, s3
    storagePath: text("storage_path").notNull(),
    compressed: boolean("compressed").notNull().default(
        true,
    ),
    includesMedia: boolean("includes_media").notNull()
        .default(false),
    includesDatabase: boolean("includes_database").notNull()
        .default(false),
    includesConfig: boolean("includes_config").notNull()
        .default(false),
    checksum: text("checksum").notNull(), // SHA-256
    error: text("error"),
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at"),
    createdBy: integer("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

export const backupsRelations = relations(backups, ({ one }) => ({
    createdByUser: one(users, {
        fields: [backups.createdBy],
        references: [users.id],
    }),
}));

// ============= SECURITY =============

// IP Block Rules
export const ipBlockRules = pgTable("ip_block_rules", {
    id: serial("id").primaryKey(),
    ip: text("ip").notNull().unique(),
    type: text("type").notNull(), // block, whitelist
    reason: text("reason"),
    expiresAt: timestamp("expires_at"),
    createdBy: integer("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

// Security Events
export const securityEvents = pgTable("security_events", {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    ip: text("ip").notNull(),
    userAgent: text("user_agent"),
    path: text("path"),
    method: text("method"),
    userId: integer("user_id").references(() => users.id, {
        onDelete: "set null",
    }),
    details: text("details"), // JSON
    severity: text("severity").notNull().default("low"),
    ruleId: integer("rule_id"), // Reference to security rule that triggered this event
    blocked: boolean("blocked").notNull().default(false), // Whether request was blocked
    referer: text("referer"), // HTTP Referer header
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

// Rate Limit Rules (Custom rate limiting per endpoint)
export const rateLimitRules = pgTable("rate_limit_rules", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    path: text("path").notNull(), // /api/auth/login, /api/content, etc.
    method: text("method"), // GET, POST, PUT, DELETE, null = all methods
    maxRequests: integer("max_requests").notNull(), // Max requests allowed
    windowSeconds: integer("window_seconds").notNull(), // Time window in seconds
    enabled: boolean("enabled").notNull().default(true),
    createdBy: integer("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: timestamp("updated_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

// Security Rules (Custom security patterns)
export const securityRules = pgTable("security_rules", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(), // sql_injection, xss, path_traversal, custom
    pattern: text("pattern").notNull(), // Regex pattern to match
    action: text("action").notNull(), // block, log, alert
    severity: text("severity").notNull(), // critical, high, medium, low
    enabled: boolean("enabled").notNull().default(true),
    triggerCount: integer("trigger_count").notNull().default(0), // How many times this rule was triggered
    description: text("description"), // Optional description
    createdBy: integer("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: timestamp("updated_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

// Security Settings (Configuration for security features)
export const securitySettings = pgTable("security_settings", {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    type: text("type").notNull().default("string"), // string, number, boolean, json
    category: text("category").notNull(), // rate_limit, headers, notifications, cleanup
    description: text("description"),
    updatedBy: integer("updated_by").references(() => users.id, {
        onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

export const ipBlockRulesRelations = relations(ipBlockRules, ({ one }) => ({
    createdByUser: one(users, {
        fields: [ipBlockRules.createdBy],
        references: [users.id],
    }),
}));

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
    user: one(users, {
        fields: [securityEvents.userId],
        references: [users.id],
    }),
    rule: one(securityRules, {
        fields: [securityEvents.ruleId],
        references: [securityRules.id],
    }),
}));

export const rateLimitRulesRelations = relations(rateLimitRules, ({ one }) => ({
    createdByUser: one(users, {
        fields: [rateLimitRules.createdBy],
        references: [users.id],
    }),
}));

export const securityRulesRelations = relations(securityRules, ({ one, many }) => ({
    createdByUser: one(users, {
        fields: [securityRules.createdBy],
        references: [users.id],
    }),
    events: many(securityEvents),
}));

export const securitySettingsRelations = relations(securitySettings, ({ one }) => ({
    updatedByUser: one(users, {
        fields: [securitySettings.updatedBy],
        references: [users.id],
    }),
}));

// ============= API KEYS =============

// API Keys for public REST API access
export const apiKeys = pgTable("api_keys", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    key: text("key").notNull().unique(),
    userId: integer("user_id").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    permissions: text("permissions").notNull(), // JSON array of permission strings
    rateLimit: integer("rate_limit"), // Requests per hour
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: timestamp("updated_at").notNull().default(
        sql`(unixepoch())`,
    ),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
    user: one(users, {
        fields: [apiKeys.userId],
        references: [users.id],
    }),
}));

// ============= JOBS =============

// Background Jobs Queue
export const jobs = pgTable("jobs", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // Job type
    data: text("data").notNull(), // JSON payload
    status: text("status").notNull().default("pending"), // pending, active, completed, failed, delayed, cancelled
    priority: text("priority").notNull().default("normal"), // low, normal, high, critical
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    progress: integer("progress").notNull().default(0), // 0-100
    result: text("result"), // JSON result
    error: text("error"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    failedAt: timestamp("failed_at"),
    scheduledFor: timestamp("scheduled_for"),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: timestamp("updated_at"),
});

// Scheduled Jobs (cron-like)
export const scheduledJobs = pgTable("scheduled_jobs", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    schedule: text("schedule").notNull(), // Cron expression
    jobName: text("job_name").notNull(), // Job type to create
    jobData: text("job_data").notNull(), // JSON data
    enabled: boolean("enabled").notNull().default(true),
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    createdAt: timestamp("created_at").notNull().default(
        sql`(unixepoch())`,
    ),
    updatedAt: timestamp("updated_at"),
});

// ============= TYPES =============

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type User2FA = typeof user2FA.$inferSelect;
export type NewUser2FA = typeof user2FA.$inferInsert;

export type ContentType = typeof contentTypes.$inferSelect;
export type NewContentType = typeof contentTypes.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;

export type ContentCategory = typeof contentCategories.$inferSelect;
export type NewContentCategory = typeof contentCategories.$inferInsert;

export type ContentTag = typeof contentTags.$inferSelect;
export type NewContentTag = typeof contentTags.$inferInsert;

export type ContentSeo = typeof contentSeo.$inferSelect;
export type NewContentSeo = typeof contentSeo.$inferInsert;

export type ContentMeta = typeof contentMeta.$inferSelect;
export type NewContentMeta = typeof contentMeta.$inferInsert;

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

export type MediaSize = typeof mediaSizes.$inferSelect;
export type NewMediaSize = typeof mediaSizes.$inferInsert;

export type MediaSeo = typeof mediaSeo.$inferSelect;
export type NewMediaSeo = typeof mediaSeo.$inferInsert;

export type CategorySeo = typeof categorySeo.$inferSelect;
export type NewCategorySeo = typeof categorySeo.$inferInsert;

export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type WidgetArea = typeof widgetAreas.$inferSelect;
export type NewWidgetArea = typeof widgetAreas.$inferInsert;

export type Widget = typeof widgets.$inferSelect;
export type NewWidget = typeof widgets.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type ContentFilter = typeof contentFilters.$inferSelect;
export type NewContentFilter = typeof contentFilters.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type ContentRevision = typeof contentRevisions.$inferSelect;
export type NewContentRevision = typeof contentRevisions.$inferInsert;

export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;

// Legacy plugin hook types removed

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

export type EmailQueue = typeof emailQueue.$inferSelect;
export type NewEmailQueue = typeof emailQueue.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type NotificationPreference =
    typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference =
    typeof notificationPreferences.$inferInsert;

export type Backup = typeof backups.$inferSelect;
export type NewBackup = typeof backups.$inferInsert;

export type IPBlockRule = typeof ipBlockRules.$inferSelect;
export type NewIPBlockRule = typeof ipBlockRules.$inferInsert;

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;

export type APIKey = typeof apiKeys.$inferSelect;
export type NewAPIKey = typeof apiKeys.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type NewScheduledJob = typeof scheduledJobs.$inferInsert;

export type RateLimitRule = typeof rateLimitRules.$inferSelect;
export type NewRateLimitRule = typeof rateLimitRules.$inferInsert;

export type SecurityRule = typeof securityRules.$inferSelect;
export type NewSecurityRule = typeof securityRules.$inferInsert;

export type SecuritySetting = typeof securitySettings.$inferSelect;
export type NewSecuritySetting = typeof securitySettings.$inferInsert;
