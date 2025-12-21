import { relations } from "drizzle-orm";
import {
    apiKeys,
    permissions,
    rolePermissions,
    roles,
    user2FA,
    users,
} from "./tables/auth.ts";
import {
    content,
    contentCategories,
    contentMeta,
    contentRevisions,
    contentSeo,
    contentTags,
} from "./tables/content.ts";
import { comments, contentFilters } from "./tables/feedback.ts";
import { media, mediaSeo, mediaSizes } from "./tables/media.ts";
import {
    pluginHealth,
    pluginMigrations,
    pluginPermissionGrants,
    plugins,
} from "./tables/plugins.ts";
import {
    menuItems,
    menus,
    widgetAreas,
    widgets,
} from "./tables/presentation.ts";
import {
    auditLogs,
    backups,
    emailQueue,
    emailTemplates,
    ipBlockRules,
    notificationPreferences,
    notifications,
    rateLimitRules,
    securityEvents,
    securityRules,
    securitySettings,
    webhookDeliveries,
    webhooks,
} from "./tables/system.ts";
import {
    categories,
    categorySeo,
    contentTypes,
    tags,
} from "./tables/taxonomy.ts";

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
        fields: [media.id],
        references: [mediaSeo.mediaId],
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

export const backupsRelations = relations(backups, ({ one }) => ({
    createdByUser: one(users, {
        fields: [backups.createdBy],
        references: [users.id],
    }),
}));

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

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
    user: one(users, {
        fields: [apiKeys.userId],
        references: [users.id],
    }),
}));
