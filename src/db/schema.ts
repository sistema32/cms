import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ============= TABLES =============

// ============= ROLES =============
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= PERMISSIONS =============
export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  module: text("module").notNull(), // ej: "users", "posts", "comments"
  action: text("action").notNull(), // ej: "create", "read", "update", "delete"
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= ROLE_PERMISSIONS (Many-to-Many) =============
export const rolePermissions = sqliteTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

// ============= USERS =============
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  roleId: integer("role_id").references(() => roles.id),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= USER 2FA =============
export const user2FA = sqliteTable("user_2fa", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(), // Secret TOTP (encriptado)
  backupCodes: text("backup_codes").notNull(), // JSON array de códigos hasheados
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= CONTENT TYPES =============
export const contentTypes = sqliteTable("content_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // post, page, product, event
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // emoji o nombre de icono
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  hasCategories: integer("has_categories", { mode: "boolean" }).notNull().default(true),
  hasTags: integer("has_tags", { mode: "boolean" }).notNull().default(true),
  hasComments: integer("has_comments", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= CATEGORIES =============
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id"), // auto-referencia para jerarquía
  contentTypeId: integer("content_type_id").references(() => contentTypes.id, { onDelete: "cascade" }),
  color: text("color"), // hex color
  icon: text("icon"),
  order: integer("order").default(0),
  deletedAt: integer("deleted_at", { mode: "timestamp" }), // soft delete
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= TAGS =============
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= CONTENT =============
export const content = sqliteTable("content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentTypeId: integer("content_type_id").notNull().references(() => contentTypes.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // Para páginas hijas (child pages)
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  body: text("body"),
  featuredImageId: integer("featured_image_id").references(() => media.id, {
    onDelete: "set null",
  }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"), // draft, published, scheduled, archived
  visibility: text("visibility").notNull().default("public"), // public, private, password
  password: text("password"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  commentsEnabled: integer("comments_enabled", { mode: "boolean" }).notNull().default(false), // Control de comentarios a nivel de contenido individual
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= CONTENT_CATEGORIES (Many-to-Many) =============
export const contentCategories = sqliteTable("content_categories", {
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.contentId, table.categoryId] }),
}));

// ============= CONTENT_TAGS (Many-to-Many) =============
export const contentTags = sqliteTable("content_tags", {
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.contentId, table.tagId] }),
}));

// ============= CONTENT_SEO =============
export const contentSeo = sqliteTable("content_seo", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }).unique(),
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
  noIndex: integer("no_index", { mode: "boolean" }).notNull().default(false),
  noFollow: integer("no_follow", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= CONTENT_META =============
export const contentMeta = sqliteTable("content_meta", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value"),
  type: text("type").default("string"), // string, number, boolean, json
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= COMMENTS =============
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // self-reference para threading (1 nivel)
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }), // nullable para guests
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
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }), // soft delete
});

// ============= CONTENT_FILTERS =============
export const contentFilters = sqliteTable("content_filters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // word, email, link, phone
  pattern: text("pattern").notNull(), // texto o regex
  isRegex: integer("is_regex", { mode: "boolean" }).notNull().default(false), // si es regex o texto plano
  replacement: text("replacement").notNull(), // texto que reemplaza (ej: "[link removido]")
  description: text("description"), // opcional, para documentar el filtro
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), // si está activo
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }), // admin que lo creó
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= MEDIA =============
export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= MEDIA_SIZES =============
export const mediaSizes = sqliteTable("media_sizes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mediaId: integer("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  size: text("size").notNull(), // thumbnail, small, medium, large, original
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  path: text("path").notNull(),
  url: text("url").notNull(),
  fileSize: integer("file_size").notNull(), // tamaño en bytes
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= MEDIA_SEO =============
export const mediaSeo = sqliteTable("media_seo", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mediaId: integer("media_id").notNull().references(() => media.id, { onDelete: "cascade" }).unique(),
  alt: text("alt"), // texto alternativo (crítico para imágenes)
  title: text("title"), // título del medio
  caption: text("caption"), // descripción/caption
  description: text("description"), // descripción larga
  focusKeyword: text("focus_keyword"), // keyword SEO
  credits: text("credits"), // créditos/autor
  copyright: text("copyright"), // información de copyright
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= CATEGORY_SEO =============
export const categorySeo = sqliteTable("category_seo", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }).unique(),
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
  noIndex: integer("no_index", { mode: "boolean" }).notNull().default(false),
  noFollow: integer("no_follow", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= MENUS =============
export const menus = sqliteTable("menus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= MENU_ITEMS =============
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  menuId: integer("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // auto-referencia para jerarquía ilimitada

  // Contenido del item
  label: text("label").notNull(),
  title: text("title"), // atributo title (tooltip)

  // Tipos de enlaces (solo uno debe estar presente)
  url: text("url"),
  contentId: integer("content_id").references(() => content.id, { onDelete: "set null" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  tagId: integer("tag_id").references(() => tags.id, { onDelete: "set null" }),

  // Configuración visual
  icon: text("icon"),
  cssClass: text("css_class"),
  target: text("target").default("_self"), // "_self", "_blank", "_parent"

  // Control de orden y visibilidad
  order: integer("order").notNull().default(0),
  isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),

  // Control de permisos (opcional)
  requiredPermission: text("required_permission"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= SETTINGS =============
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"), // JSON stringified para valores complejos
  category: text("category").notNull().default('general'), // Agrupar settings por categoría
  autoload: integer("autoload", { mode: "boolean" }).notNull().default(true), // WordPress-style: cargar en cache automáticamente
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= CONTENT REVISIONS (Historial de Versiones) =============
export const contentRevisions = sqliteTable("content_revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  excerpt: text("excerpt"),
  body: text("body"),
  status: text("status").notNull(),
  visibility: text("visibility").notNull(),
  password: text("password"),
  featuredImageId: integer("featured_image_id"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  // Metadatos de la revisión
  revisionNumber: integer("revision_number").notNull(), // Número secuencial de versión
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Autor de esta versión
  changesSummary: text("changes_summary"), // Resumen opcional de los cambios
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============= RELATIONS =============

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  twoFactor: one(user2FA, {
    fields: [users.id],
    references: [user2FA.userId],
  }),
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
  seo: one(categorySeo),
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

export const contentCategoriesRelations = relations(contentCategories, ({ one }) => ({
  content: one(content, {
    fields: [contentCategories.contentId],
    references: [content.id],
  }),
  category: one(categories, {
    fields: [contentCategories.categoryId],
    references: [categories.id],
  }),
}));

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
  seo: one(mediaSeo),
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
  }),
  children: many(menuItems),
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

export const contentRevisionsRelations = relations(contentRevisions, ({ one }) => ({
  content: one(content, {
    fields: [contentRevisions.contentId],
    references: [content.id],
  }),
  author: one(users, {
    fields: [contentRevisions.authorId],
    references: [users.id],
  }),
}));

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

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type ContentFilter = typeof contentFilters.$inferSelect;
export type NewContentFilter = typeof contentFilters.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type ContentRevision = typeof contentRevisions.$inferSelect;
export type NewContentRevision = typeof contentRevisions.$inferInsert;
