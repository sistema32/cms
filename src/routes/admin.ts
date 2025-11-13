import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { Context, Next } from "hono";
import { env } from "../config/env.ts";
import { notificationService } from "../lib/email/index.ts";
import { DashboardPage } from "../admin/pages/Dashboard.tsx";
import { LoginPage } from "../admin/pages/Login.tsx";
import { ContentListPage } from "../admin/pages/ContentList.tsx";
import { ContentFormPage } from "../admin/pages/ContentForm.tsx";
import { PostFormPage } from "../admin/pages/PostFormPage.tsx";
import { PageFormPage } from "../admin/pages/PageFormPage.tsx";
import { CategoriesPage } from "../admin/pages/Categories.tsx";
import { TagsPage } from "../admin/pages/Tags.tsx";
import { UsersPageImproved } from "../admin/pages/UsersImproved.tsx";
import { RolesPageImproved } from "../admin/pages/RolesPageImproved.tsx";
import { PermissionsPageImproved } from "../admin/pages/PermissionsPageImproved.tsx";
import { SettingsPage } from "../admin/pages/Settings.tsx";
import { ThemesPage } from "../admin/pages/ThemesPage.tsx";
import { ThemePreviewPage } from "../admin/pages/ThemePreviewPage.tsx";
import { ThemeCustomizerPage } from "../admin/pages/ThemeCustomizerPage.tsx";
import { ThemeEditorPage } from "../admin/pages/ThemeEditorPage.tsx";
import { WidgetsPage } from "../admin/pages/WidgetsPage.tsx";
import { AppearanceMenusPage } from "../admin/pages/AppearanceMenusPage.tsx";
import { MediaLibraryPage } from "../admin/pages/MediaLibraryPage.tsx";
import { PluginsInstalledPage } from "../admin/pages/PluginsInstalledPage.tsx";
import { PluginsAvailablePage } from "../admin/pages/PluginsAvailablePage.tsx";
import { PluginsMarketplacePage } from "../admin/pages/PluginsMarketplacePage.tsx";
import { NotificationsPage } from "../admin/pages/NotificationsPage.tsx";
import { BackupsPage } from "../admin/pages/BackupsPage.tsx";
import { SystemUpdatesPage } from "../admin/pages/SystemUpdatesPage.tsx";
import { CommentsPage } from "../admin/pages/CommentsPage.tsx";
import { db } from "../config/db.ts";
import {
  categories,
  comments,
  content,
  contentCategories,
  contentSeo,
  contentTags,
  contentTypes,
  roles,
  tags,
  users,
} from "../db/schema.ts";
import { and, asc, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { generateToken, verifyToken } from "../utils/jwt.ts";
import { comparePassword } from "../utils/password.ts";
import { verifyTOTP } from "../services/twoFactorService.ts";
import {
  resolveFieldDefault,
  SETTINGS_DEFINITIONS,
  SETTINGS_FIELD_MAP,
} from "../config/settingsDefinitions.ts";
import { updateSetting as updateSettingService } from "../services/settingsService.ts";
import * as contentService from "../services/contentService.ts";
import * as themeService from "../services/themeService.ts";
import * as themePreviewService from "../services/themePreviewService.ts";
import * as themeCustomizerService from "../services/themeCustomizerService.ts";
import * as widgetService from "../services/widgetService.ts";
import * as menuService from "../services/menuService.ts";
import * as menuItemService from "../services/menuItemService.ts";
import * as mediaService from "../services/mediaService.ts";
import * as roleService from "../services/roleService.ts";
import * as permissionService from "../services/permissionService.ts";
import * as userService from "../services/userService.ts";
import { pluginService } from "../services/pluginService.ts";
import type { MenuItemWithChildren } from "../services/menuItemService.ts";
import { backupManager } from "../lib/backup/index.ts";
import { systemUpdatesService, SYSTEM_VERSION, getUpdateConfig } from "../lib/system-updates/index.ts";

function parseSettingValueForAdmin(value: string | null): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseIds(value: unknown): number[] {
  if (value === undefined || value === null) {
    return [];
  }
  const values = Array.isArray(value) ? value : [value];
  return values
    .map((v) => parseInt(String(v), 10))
    .filter((num) => Number.isFinite(num));
}

function parseStringField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const str = Array.isArray(value)
    ? String(value[value.length - 1])
    : String(value);
  const trimmed = str.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseNullableField(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const str = Array.isArray(value)
    ? String(value[value.length - 1])
    : String(value);
  const trimmed = str.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBooleanField(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  const values = Array.isArray(value) ? value : [value];
  const last = String(values[values.length - 1]).toLowerCase();
  return last === "true" || last === "1" || last === "on";
}

function extractSeoPayload(body: Record<string, unknown>) {
  const seo = {
    metaTitle: parseStringField(body.seo_metaTitle),
    metaDescription: parseStringField(body.seo_metaDescription),
    canonicalUrl: parseStringField(body.seo_canonicalUrl),
    ogTitle: parseStringField(body.seo_ogTitle),
    ogDescription: parseStringField(body.seo_ogDescription),
    ogImage: parseStringField(body.seo_ogImage),
    ogType: parseStringField(body.seo_ogType),
    twitterCard: parseStringField(body.seo_twitterCard),
    twitterTitle: parseStringField(body.seo_twitterTitle),
    twitterDescription: parseStringField(body.seo_twitterDescription),
    twitterImage: parseStringField(body.seo_twitterImage),
    focusKeyword: parseStringField(body.seo_focusKeyword),
    schemaJson: parseStringField(body.seo_schemaJson),
    noIndex: parseBooleanField(body.seo_noIndex),
    noFollow: parseBooleanField(body.seo_noFollow),
  };

  // Remove undefined properties to avoid overwriting with null
  Object.keys(seo).forEach((key) => {
    const typedKey = key as keyof typeof seo;
    if (seo[typedKey] === undefined || seo[typedKey] === "") {
      delete seo[typedKey];
    }
  });

  return seo;
}

/**
 * Admin Panel Routes
 * Dashboard, content management, and settings
 */

/**
 * Admin authentication middleware
 * Checks for JWT token in cookies and redirects to login if not authenticated
 */
async function adminAuth(c: Context, next: Next) {
  // Skip auth for static assets
  const path = c.req.path;
  if (path.startsWith(`${env.ADMIN_PATH}/assets/`)) {
    return await next();
  }

  const token = getCookie(c, "auth_token");

  if (!token) {
    return c.redirect(`${env.ADMIN_PATH}/login`);
  }

  try {
    const payload = await verifyToken(token);

    // Verify user still exists in database
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      deleteCookie(c, "auth_token");
      return c.redirect(`${env.ADMIN_PATH}/login?error=user_not_found`);
    }

    c.set("user", payload);
    await next();
  } catch (error) {
    console.error("Admin auth failed:", error);
    deleteCookie(c, "auth_token");
    return c.redirect(`${env.ADMIN_PATH}/login?error=session_expired`);
  }
}

const adminRouter = new Hono();

/**
 * Helper function to get all registered plugin panels for navigation
 */
async function getPluginPanels() {
  try {
    const { AdminPanelRegistry } = await import("../lib/plugin-system/index.ts");
    const allPanels = AdminPanelRegistry.getAllPanels();

    // Filter only panels that should show in menu
    return allPanels
      .filter(panel => panel.showInMenu !== false)
      .map(panel => ({
        id: panel.id,
        title: panel.title,
        pluginName: panel.pluginName,
        path: panel.path,
        icon: panel.icon,
      }));
  } catch (error) {
    console.error("Error loading plugin panels:", error);
    return [];
  }
}

async function getContentTypeBySlug(slug: string) {
  let contentType = await db.query.contentTypes.findFirst({
    where: eq(contentTypes.slug, slug),
  });

  if (!contentType && slug === "post") {
    const [created] = await db.insert(contentTypes).values({
      name: "Post",
      slug: "post",
      description: "Entradas de blog estándar",
      icon: "📝",
      isPublic: true,
      hasCategories: true,
      hasTags: true,
      hasComments: true,
    }).returning();
    contentType = created;
  }

  if (!contentType && slug === "page") {
    const [created] = await db.insert(contentTypes).values({
      name: "Page",
      slug: "page",
      description: "Páginas estáticas del sitio",
      icon: "📄",
      isPublic: true,
      hasCategories: false,
      hasTags: false,
      hasComments: false,
    }).returning();
    contentType = created;
  }

  if (!contentType) {
    throw new Error(`Tipo de contenido '${slug}' no encontrado`);
  }
  return contentType;
}

function mapMenuItems(nodes: MenuItemWithChildren[]): any[] {
  return nodes.map((item) => {
    let type: "custom" | "content" | "category" | "tag" = "custom";
    let reference: string | undefined;

    if ((item as any).content) {
      type = "content";
      reference = (item as any).content.slug;
    } else if ((item as any).category) {
      type = "category";
      reference = (item as any).category.slug;
    } else if ((item as any).tag) {
      type = "tag";
      reference = (item as any).tag.slug;
    }

    return {
      id: item.id,
      label: item.label,
      url: item.url,
      type,
      reference,
      children: item.children ? mapMenuItems(item.children) : [],
    };
  });
}

/**
 * GET /login - Show login form
 */
adminRouter.get("/login", async (c) => {
  // If already authenticated, redirect to dashboard
  const token = getCookie(c, "auth_token");
  if (token) {
    try {
      await verifyToken(token);
      return c.redirect(env.ADMIN_PATH);
    } catch {
      // Token invalid, continue to login
    }
  }

  const error = c.req.query("error");
  const errorMessages: Record<string, string> = {
    invalid_credentials: "Email o contraseña incorrectos",
    user_not_found: "Usuario no encontrado",
    session_expired:
      "Tu sesión ha expirado. Por favor, inicia sesión nuevamente",
    invalid_2fa: "Código 2FA inválido",
    requires_2fa: "Se requiere autenticación de dos factores",
  };

  return c.html(
    LoginPage({
      error: error ? errorMessages[error] : undefined,
    }),
  );
});

/**
 * POST /login - Process login
 */
adminRouter.post("/login", async (c) => {
  try {
    const body = await c.req.parseBody();
    const email = body.email as string;
    const password = body.password as string;

    if (!email || !password) {
      return c.html(
        LoginPage({
          error: "Email y contraseña son requeridos",
          email,
        }),
      );
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return c.html(
        LoginPage({
          error: "Email o contraseña incorrectos",
          email,
        }),
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return c.html(
        LoginPage({
          error: "Email o contraseña incorrectos",
          email,
        }),
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // Store userId temporarily in a short-lived cookie for 2FA verification
      setCookie(c, "2fa_user_id", user.id.toString(), {
        httpOnly: true,
        secure: env.DENO_ENV === "production",
        sameSite: "Lax",
        maxAge: 300, // 5 minutes
        path: env.ADMIN_PATH,
      });

      return c.html(
        LoginPage({
          email,
          requires2FA: true,
        }),
      );
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: env.DENO_ENV === "production",
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return c.redirect(env.ADMIN_PATH);
  } catch (error) {
    console.error("Login error:", error);
    return c.html(
      LoginPage({
        error: "Error al iniciar sesión. Por favor, intenta de nuevo",
      }),
    );
  }
});

/**
 * POST /login/verify-2fa - Verify 2FA code
 */
adminRouter.post("/login/verify-2fa", async (c) => {
  try {
    const body = await c.req.parseBody();
    const email = body.email as string;
    const code = body.code as string;
    const userIdCookie = getCookie(c, "2fa_user_id");

    if (!userIdCookie || !code) {
      return c.redirect(`${env.ADMIN_PATH}/login?error=invalid_2fa`);
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userIdCookie)),
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      deleteCookie(c, "2fa_user_id");
      return c.redirect(`${env.ADMIN_PATH}/login?error=invalid_2fa`);
    }

    // Verify 2FA code
    const isValid = verifyTOTP(user.twoFactorSecret, code);

    if (!isValid) {
      return c.html(
        LoginPage({
          email,
          requires2FA: true,
          error: "Código 2FA inválido",
        }),
      );
    }

    // Delete temporary cookie
    deleteCookie(c, "2fa_user_id");

    // Generate token and set cookie
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: env.DENO_ENV === "production",
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return c.redirect(env.ADMIN_PATH);
  } catch (error) {
    console.error("2FA verification error:", error);
    return c.redirect(`${env.ADMIN_PATH}/login?error=invalid_2fa`);
  }
});

/**
 * POST /logout - Logout
 */
adminRouter.post("/logout", (c) => {
  deleteCookie(c, "auth_token");
  return c.redirect(`${env.ADMIN_PATH}/login`);
});

// Serve admin static assets (must be before auth middleware)
adminRouter.get(
  "/assets/*",
  serveStatic({
    root: "./src/admin",
    rewriteRequestPath: (path) => path.replace(env.ADMIN_PATH, ""),
  }),
);

// Protect all other admin routes with authentication
adminRouter.use("/*", adminAuth);

/**
 * GET / - Dashboard home
 */
adminRouter.get("/", async (c) => {
  try {
    const user = c.get("user");

    // Get statistics
    const [
      totalPostsResult,
      totalUsersResult,
      totalCommentsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(content),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(comments),
    ]);

    const stats = {
      totalPosts: totalPostsResult[0]?.count || 0,
      totalUsers: totalUsersResult[0]?.count || 0,
      totalComments: totalCommentsResult[0]?.count || 0,
      totalViews: 0, // TODO: Implement view tracking
    };

    // Get recent posts
    const recentPostsData = await db.query.content.findMany({
      limit: 10,
      orderBy: [desc(content.createdAt)],
      with: {
        author: true,
      },
    });

    const recentPosts = recentPostsData.map((post) => ({
      id: post.id,
      title: post.title,
      author: post.author.name || post.author.email,
      status: post.status,
      createdAt: post.createdAt,
    }));

    // Get notifications for the user
    let notifications = [];
    let unreadNotificationCount = 0;
    try {
      notifications = await notificationService.getForUser({
        userId: user.userId,
        isRead: false,
        limit: 5,
        offset: 0,
      });
      unreadNotificationCount = await notificationService.getUnreadCount(user.userId);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }

    return c.html(
      DashboardPage({
        user: {
          name: user.name as string | null || user.email,
          email: user.email,
        },
        stats,
        recentPosts,
        notifications,
        unreadNotificationCount,
      }),
    );
  } catch (error: any) {
    console.error("Error rendering admin dashboard:", error);
    return c.text("Error al cargar el dashboard", 500);
  }
});

/**
 * GET /notifications - Notifications page
 */
adminRouter.get("/notifications", async (c) => {
  try {
    const user = c.get("user");

    // Get all notifications for the user
    let notifications = [];
    let unreadNotificationCount = 0;
    try {
      notifications = await notificationService.getForUser({
        userId: user.userId,
        limit: 100,
        offset: 0,
      });
      unreadNotificationCount = await notificationService.getUnreadCount(user.userId);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }

    return c.html(
      NotificationsPage({
        user: {
          name: user.name as string | null || user.email,
          email: user.email,
        },
        notifications,
        unreadNotificationCount,
      }),
    );
  } catch (error: any) {
    console.error("Error rendering notifications page:", error);
    return c.text("Error al cargar las notificaciones", 500);
  }
});

/**
 * GET /content - Content list
 */
adminRouter.get("/content", async (c) => {
  try {
    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const status = c.req.query("status");
    const limit = 20;
    const offset = (page - 1) * limit;

    // Get content with filters
    const whereClause = status ? eq(content.status, status) : undefined;

    const [contents, totalResult] = await Promise.all([
      db.query.content.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(content.createdAt)],
        with: {
          contentType: true,
          author: true,
        },
      }),
      db.select({ count: count() }).from(content).where(
        whereClause || undefined,
      ),
    ]);

    const totalPages = Math.ceil((totalResult[0]?.count || 0) / limit);

    return c.html(
      ContentListPage({
        user: { name: user.name as string | null, email: user.email },
        contents: contents.map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          status: item.status,
          contentType: { name: item.contentType.name },
          author: { name: item.author.name || "", email: item.author.email },
          createdAt: item.createdAt,
        })),
        totalPages,
        currentPage: page,
      }),
    );
  } catch (error: any) {
    console.error("Error rendering content list:", error);
    return c.text("Error al cargar el contenido", 500);
  }
});

/**
 * GET /content/new - New content form
 */
adminRouter.get("/content/new", async (c) => {
  try {
    const user = c.get("user");

    const [contentTypesData, categoriesData, tagsData] = await Promise.all([
      db.query.contentTypes.findMany(),
      db.query.categories.findMany(),
      db.query.tags.findMany(),
    ]);

return c.html(
      ContentFormPage({
        user: { name: user.name as string | null, email: user.email },
        contentTypes: contentTypesData,
        categories: categoriesData,
        tags: tagsData,
      }),
    );
  } catch (error: any) {
    console.error("Error rendering content form:", error);
    return c.text("Error al cargar el formulario", 500);
  }
});

/**
 * POST /content/new - Create content
 */
adminRouter.post("/content/new", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.parseBody();

    const [newContent] = await db.insert(content).values({
      title: body.title as string,
      slug: body.slug as string,
      body: body.body as string,
      excerpt: body.excerpt as string || null,
      status: body.status as string,
      contentTypeId: parseInt(body.contentTypeId as string),
      authorId: user.userId,
    }).returning();

    // Handle categories - get array from form data
    const categoryIds = Array.isArray(body.categories)
      ? body.categories.map((id: any) => parseInt(id as string))
      : body.categories
      ? [parseInt(body.categories as string)]
      : [];

    if (categoryIds.length > 0) {
      await db.insert(contentCategories).values(
        categoryIds.map((categoryId) => ({
          contentId: newContent.id,
          categoryId,
        })),
      );
    }

    // Handle tags - get array from form data
    const tagIds = Array.isArray(body.tags)
      ? body.tags.map((id: any) => parseInt(id as string))
      : body.tags
      ? [parseInt(body.tags as string)]
      : [];

    if (tagIds.length > 0) {
      await db.insert(contentTags).values(
        tagIds.map((tagId) => ({
          contentId: newContent.id,
          tagId,
        })),
      );
    }

    return c.redirect(`${env.ADMIN_PATH}/content`);
  } catch (error: any) {
    console.error("Error creating content:", error);
    return c.text("Error al crear el contenido", 500);
  }
});

/**
 * GET /content/edit/:id - Show content edit form
 */
adminRouter.get("/content/edit/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    // Get content with relations
    const contentItem = await db.query.content.findFirst({
      where: eq(content.id, id),
      with: {
        contentType: true,
        author: true,
      },
    });

    if (!contentItem) {
      return c.text("Contenido no encontrado", 404);
    }

    // Get selected categories
    const selectedCategoriesData = await db.query.contentCategories.findMany({
      where: eq(contentCategories.contentId, id),
    });
    const selectedCategories = selectedCategoriesData.map((c) => c.categoryId);

    // Get selected tags
    const selectedTagsData = await db.query.contentTags.findMany({
      where: eq(contentTags.contentId, id),
    });
    const selectedTags = selectedTagsData.map((t) => t.tagId);

    // Get all content types, categories, and tags for selects
    const [contentTypesData, categoriesData, tagsData] = await Promise.all([
      db.query.contentTypes.findMany(),
      db.query.categories.findMany(),
      db.query.tags.findMany(),
    ]);

    return c.html(ContentFormPage({
      user: { name: user.name, email: user.email },
      content: contentItem,
      contentTypes: contentTypesData,
      categories: categoriesData,
      tags: tagsData,
      selectedCategories,
      selectedTags,
    }));
  } catch (error: any) {
    console.error("Error loading content for edit:", error);
    return c.text("Error al cargar el contenido", 500);
  }
});

/**
 * POST /content/edit/:id - Update content
 */
adminRouter.post("/content/edit/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));
    const body = await c.req.parseBody();

    // Update content
    await db.update(content).set({
      title: body.title as string,
      slug: body.slug as string,
      body: body.body as string,
      excerpt: body.excerpt as string || null,
      status: body.status as string,
      contentTypeId: parseInt(body.contentTypeId as string),
      updatedAt: new Date(),
    }).where(eq(content.id, id));

    // Update categories - delete existing and insert new
    await db.delete(contentCategories).where(
      eq(contentCategories.contentId, id),
    );

    const categoryIds = Array.isArray(body.categories)
      ? body.categories.map((id: any) => parseInt(id as string))
      : body.categories
      ? [parseInt(body.categories as string)]
      : [];

    if (categoryIds.length > 0) {
      await db.insert(contentCategories).values(
        categoryIds.map((categoryId) => ({
          contentId: id,
          categoryId,
        })),
      );
    }

    // Update tags - delete existing and insert new
    await db.delete(contentTags).where(eq(contentTags.contentId, id));

    const tagIds = Array.isArray(body.tags)
      ? body.tags.map((id: any) => parseInt(id as string))
      : body.tags
      ? [parseInt(body.tags as string)]
      : [];

    if (tagIds.length > 0) {
      await db.insert(contentTags).values(
        tagIds.map((tagId) => ({
          contentId: id,
          tagId,
        })),
      );
    }

    return c.redirect(`${env.ADMIN_PATH}/content`);
  } catch (error: any) {
    console.error("Error updating content:", error);
    return c.text("Error al actualizar el contenido", 500);
  }
});

/**
 * POST /content/delete/:id - Delete content
 */
adminRouter.post("/content/delete/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    await db.delete(content).where(eq(content.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting content:", error);
    return c.json({ success: false }, 500);
  }
});

/**
 * GET /posts - Posts list
 */
adminRouter.get("/posts", async (c) => {
  try {
    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const status = c.req.query("status");
    const limit = 20;
    const offset = (page - 1) * limit;

    const postType = await getContentTypeBySlug("post");

    const conditions = [eq(content.contentTypeId, postType.id)];
    if (status) {
      conditions.push(eq(content.status, status));
    }

    const whereClause = conditions.length > 1
      ? and(...conditions)
      : conditions[0];

    const [posts, totalResult] = await Promise.all([
      db.query.content.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(content.createdAt)],
        with: {
          contentType: true,
          author: true,
        },
      }),
      db.select({ count: count() }).from(content).where(whereClause),
    ]);

    const totalPages = Math.ceil((totalResult[0]?.count || 0) / limit) || 1;

    return c.html(ContentListPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      contents: posts.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        status: item.status,
        contentType: { name: item.contentType.name },
        author: { name: item.author.name || "", email: item.author.email },
        createdAt: item.createdAt,
      })),
      totalPages,
      currentPage: page,
      title: "Entradas",
      createPath: `${env.ADMIN_PATH}/posts/new`,
      createLabel: "Nueva Entrada",
      basePath: `${env.ADMIN_PATH}/posts`,
      showContentType: false,
      activePage: "content.posts",
    }));
  } catch (error: any) {
    console.error("Error rendering posts list:", error);
    return c.text("Error al cargar las entradas", 500);
  }
});

/**
 * GET /posts/new - New post form
 */
adminRouter.get("/posts/new", async (c) => {
  try {
    const user = c.get("user");
    const postType = await getContentTypeBySlug("post");

    const [categoriesData, tagsData] = await Promise.all([
      db.query.categories.findMany({
        where: eq(categories.contentTypeId, postType.id),
        orderBy: (categories, { asc }) => [asc(categories.name)],
      }),
      db.query.tags.findMany({
        orderBy: (tags, { asc }) => [asc(tags.name)],
      }),
    ]);

    return c.html(PostFormPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      categories: categoriesData,
      tags: tagsData,
      selectedCategories: [],
      selectedTags: [],
      seo: {},
    }));
  } catch (error: any) {
    console.error("Error rendering new post form:", error);
    return c.text("Error al cargar el formulario", 500);
  }
});

/**
 * POST /posts/new - Create post
 */
adminRouter.post("/posts/new", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.parseBody();
    const postType = await getContentTypeBySlug("post");

    const categoryIds = parseIds(
      (body as any).categories ?? (body as any)["categories[]"],
    );
    const tagIds = parseIds((body as any).tags ?? (body as any)["tags[]"]);

    const title = parseStringField(body.title);
    const slug = parseStringField(body.slug);
    const bodyContent = parseStringField(body.body);

    if (!title || !slug || !bodyContent) {
      return c.text("Título, slug y contenido son obligatorios", 400);
    }

    const status = parseStringField(body.status) as
      | "draft"
      | "published"
      | "archived"
      | undefined;

    await contentService.createContent({
      contentTypeId: postType.id,
      title,
      slug,
      excerpt: parseNullableField(body.excerpt) ?? undefined,
      body: bodyContent,
      status: status && ["draft", "published", "archived"].includes(status)
        ? status
        : "draft",
      authorId: user.userId,
      categoryIds,
      tagIds,
      seo: extractSeoPayload(body as Record<string, unknown>),
    });

    return c.redirect(`${env.ADMIN_PATH}/posts`);
  } catch (error: any) {
    console.error("Error creating post:", error);
    return c.text("Error al crear la entrada", 500);
  }
});

/**
 * GET /posts/edit/:id - Edit post form
 */
adminRouter.get("/posts/edit/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));
    const postType = await getContentTypeBySlug("post");

    const postItem = await db.query.content.findFirst({
      where: and(eq(content.id, id), eq(content.contentTypeId, postType.id)),
      with: {
        contentType: true,
        contentCategories: true,
        contentTags: true,
      },
    });

    if (!postItem) {
      return c.text("Entrada no encontrada", 404);
    }

    const [categoriesData, tagsData, seoData] = await Promise.all([
      db.query.categories.findMany({
        where: eq(categories.contentTypeId, postType.id),
        orderBy: (categories, { asc }) => [asc(categories.name)],
      }),
      db.query.tags.findMany({
        orderBy: (tags, { asc }) => [asc(tags.name)],
      }),
      db.query.contentSeo.findFirst({ where: eq(contentSeo.contentId, id) }),
    ]);

    const selectedCategories = postItem.contentCategories?.map((cat) =>
      cat.categoryId
    ) ?? [];
    const selectedTags = postItem.contentTags?.map((tag) => tag.tagId) ?? [];

    const seo = seoData
      ? {
        metaTitle: seoData.metaTitle,
        metaDescription: seoData.metaDescription,
        canonicalUrl: seoData.canonicalUrl,
        ogTitle: seoData.ogTitle,
        ogDescription: seoData.ogDescription,
        ogImage: seoData.ogImage,
        ogType: seoData.ogType,
        twitterCard: seoData.twitterCard,
        twitterTitle: seoData.twitterTitle,
        twitterDescription: seoData.twitterDescription,
        twitterImage: seoData.twitterImage,
        focusKeyword: seoData.focusKeyword,
        schemaJson: seoData.schemaJson,
        noIndex: seoData.noIndex,
        noFollow: seoData.noFollow,
      }
      : {};

    return c.html(PostFormPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      post: {
        id: postItem.id,
        title: postItem.title,
        slug: postItem.slug,
        excerpt: postItem.excerpt,
        body: postItem.body,
        status: postItem.status,
      },
      categories: categoriesData,
      tags: tagsData,
      selectedCategories,
      selectedTags,
      seo,
    }));
  } catch (error: any) {
    console.error("Error loading post for edit:", error);
    return c.text("Error al cargar la entrada", 500);
  }
});

/**
 * POST /posts/edit/:id - Update post
 */
adminRouter.post("/posts/edit/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.parseBody();
    const postType = await getContentTypeBySlug("post");

    const post = await db.query.content.findFirst({
      where: and(eq(content.id, id), eq(content.contentTypeId, postType.id)),
    });

    if (!post) {
      return c.text("Entrada no encontrada", 404);
    }

    const categoryIds = parseIds(
      (body as any).categories ?? (body as any)["categories[]"],
    );
    const tagIds = parseIds((body as any).tags ?? (body as any)["tags[]"]);

    const title = parseStringField(body.title) || post.title;
    const slug = parseStringField(body.slug) || post.slug;
    const status = parseStringField(body.status) as
      | "draft"
      | "published"
      | "archived"
      | undefined;

    await contentService.updateContent(id, {
      title,
      slug,
      excerpt: parseNullableField(body.excerpt),
      body: parseStringField(body.body) || post.body || undefined,
      status: status && ["draft", "published", "archived"].includes(status)
        ? status
        : post.status,
      categoryIds,
      tagIds,
      seo: extractSeoPayload(body as Record<string, unknown>),
    });

    return c.redirect(`${env.ADMIN_PATH}/posts`);
  } catch (error: any) {
    console.error("Error updating post:", error);
    return c.text("Error al actualizar la entrada", 500);
  }
});

/**
 * POST /posts/delete/:id - Delete post
 */
adminRouter.post("/posts/delete/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const postType = await getContentTypeBySlug("post");

    const post = await db.query.content.findFirst({
      where: and(eq(content.id, id), eq(content.contentTypeId, postType.id)),
    });

    if (!post) {
      return c.json({ success: false, error: "Entrada no encontrada" }, 404);
    }

    await contentService.deleteContent(id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return c.json({ success: false }, 500);
  }
});

/**
 * GET /pages - Pages list
 */
adminRouter.get("/pages", async (c) => {
  try {
    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const status = c.req.query("status");
    const limit = 20;
    const offset = (page - 1) * limit;

    const pageType = await getContentTypeBySlug("page");

    const conditions = [eq(content.contentTypeId, pageType.id)];
    if (status) {
      conditions.push(eq(content.status, status));
    }
    const whereClause = conditions.length > 1
      ? and(...conditions)
      : conditions[0];

    const [pages, totalResult] = await Promise.all([
      db.query.content.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(content.createdAt)],
        with: {
          contentType: true,
          author: true,
        },
      }),
      db.select({ count: count() }).from(content).where(whereClause),
    ]);

    const totalPages = Math.ceil((totalResult[0]?.count || 0) / limit) || 1;

    return c.html(ContentListPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      contents: pages.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        status: item.status,
        contentType: { name: item.contentType.name },
        author: { name: item.author.name || "", email: item.author.email },
        createdAt: item.createdAt,
      })),
      totalPages,
      currentPage: page,
      title: "Páginas",
      createPath: `${env.ADMIN_PATH}/pages/new`,
      createLabel: "Nueva Página",
      basePath: `${env.ADMIN_PATH}/pages`,
      showContentType: false,
      activePage: "content.pages",
    }));
  } catch (error: any) {
    console.error("Error rendering pages list:", error);
    return c.text("Error al cargar las páginas", 500);
  }
});

/**
 * GET /pages/new - New page form
 */
adminRouter.get("/pages/new", async (c) => {
  try {
    const user = c.get("user");

    return c.html(PageFormPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      seo: {},
    }));
  } catch (error: any) {
    console.error("Error rendering new page form:", error);
    return c.text("Error al cargar el formulario", 500);
  }
});

/**
 * POST /pages/new - Create page
 */
adminRouter.post("/pages/new", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.parseBody();
    const pageType = await getContentTypeBySlug("page");

    const title = parseStringField(body.title);
    const slug = parseStringField(body.slug);
    const bodyContent = parseStringField(body.body);

    if (!title || !slug || !bodyContent) {
      return c.text("Título, slug y contenido son obligatorios", 400);
    }

    const status = parseStringField(body.status) as
      | "draft"
      | "published"
      | "archived"
      | undefined;

    await contentService.createContent({
      contentTypeId: pageType.id,
      title,
      slug,
      excerpt: parseNullableField(body.excerpt) ?? undefined,
      body: bodyContent,
      status: status && ["draft", "published", "archived"].includes(status)
        ? status
        : "draft",
      authorId: user.userId,
      seo: extractSeoPayload(body as Record<string, unknown>),
    });

    return c.redirect(`${env.ADMIN_PATH}/pages`);
  } catch (error: any) {
    console.error("Error creating page:", error);
    return c.text("Error al crear la página", 500);
  }
});

/**
 * GET /pages/edit/:id - Edit page form
 */
adminRouter.get("/pages/edit/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));
    const pageType = await getContentTypeBySlug("page");

    const pageItem = await db.query.content.findFirst({
      where: and(eq(content.id, id), eq(content.contentTypeId, pageType.id)),
    });

    if (!pageItem) {
      return c.text("Página no encontrada", 404);
    }

    const seoData = await db.query.contentSeo.findFirst({
      where: eq(contentSeo.contentId, id),
    });

    const seo = seoData
      ? {
        metaTitle: seoData.metaTitle,
        metaDescription: seoData.metaDescription,
        canonicalUrl: seoData.canonicalUrl,
        ogTitle: seoData.ogTitle,
        ogDescription: seoData.ogDescription,
        ogImage: seoData.ogImage,
        ogType: seoData.ogType,
        twitterCard: seoData.twitterCard,
        twitterTitle: seoData.twitterTitle,
        twitterDescription: seoData.twitterDescription,
        twitterImage: seoData.twitterImage,
        focusKeyword: seoData.focusKeyword,
        schemaJson: seoData.schemaJson,
        noIndex: seoData.noIndex,
        noFollow: seoData.noFollow,
      }
      : {};

    return c.html(PageFormPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      page: {
        id: pageItem.id,
        title: pageItem.title,
        slug: pageItem.slug,
        excerpt: pageItem.excerpt,
        body: pageItem.body,
        status: pageItem.status,
      },
      seo,
    }));
  } catch (error: any) {
    console.error("Error loading page for edit:", error);
    return c.text("Error al cargar la página", 500);
  }
});

/**
 * POST /pages/edit/:id - Update page
 */
adminRouter.post("/pages/edit/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.parseBody();
    const pageType = await getContentTypeBySlug("page");

    const pageItem = await db.query.content.findFirst({
      where: and(eq(content.id, id), eq(content.contentTypeId, pageType.id)),
    });

    if (!pageItem) {
      return c.text("Página no encontrada", 404);
    }

    const title = parseStringField(body.title) || pageItem.title;
    const slug = parseStringField(body.slug) || pageItem.slug;
    const status = parseStringField(body.status) as
      | "draft"
      | "published"
      | "archived"
      | undefined;

    await contentService.updateContent(id, {
      title,
      slug,
      excerpt: parseNullableField(body.excerpt),
      body: parseStringField(body.body) || pageItem.body || undefined,
      status: status && ["draft", "published", "archived"].includes(status)
        ? status
        : pageItem.status,
      seo: extractSeoPayload(body as Record<string, unknown>),
    });

    return c.redirect(`${env.ADMIN_PATH}/pages`);
  } catch (error: any) {
    console.error("Error updating page:", error);
    return c.text("Error al actualizar la página", 500);
  }
});

/**
 * POST /pages/delete/:id - Delete page
 */
adminRouter.post("/pages/delete/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const pageType = await getContentTypeBySlug("page");

    const pageItem = await db.query.content.findFirst({
      where: and(eq(content.id, id), eq(content.contentTypeId, pageType.id)),
    });

    if (!pageItem) {
      return c.json({ success: false, error: "Página no encontrada" }, 404);
    }

    await contentService.deleteContent(id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting page:", error);
    return c.json({ success: false }, 500);
  }
});

/**
 * GET /media - Media Library
 */
adminRouter.get("/media", async (c) => {
  try {
    const user = c.get("user");
    const limit = Number(c.req.query("limit")) || 50;
    const offset = Number(c.req.query("offset")) || 0;
    const type = c.req.query("type");

    const mediaList = await mediaService.listMedia(limit, offset, type);

    return c.html(MediaLibraryPage({
      user: { name: user.name || user.email, email: user.email },
      media: mediaList as any[],
      limit,
      offset,
    }));
  } catch (error: any) {
    console.error("Error loading media library:", error);
    return c.text("Error al cargar biblioteca de medios", 500);
  }
});

adminRouter.get("/media/data", async (c) => {
  try {
    const limit = Number(c.req.query("limit")) || 50;
    const offset = Number(c.req.query("offset")) || 0;
    const type = c.req.query("type");

    const mediaList = await mediaService.listMedia(limit, offset, type);

    return c.json({
      media: mediaList,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error loading media data:", error);
    return c.json(
      { error: "Error al cargar biblioteca de medios" },
      500,
    );
  }
});

/**
 * GET /media/:id - Get single media details
 */
adminRouter.get("/media/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    const media = await mediaService.getMediaById(id);

    if (!media) {
      return c.json({ error: "Medio no encontrado" }, 404);
    }

    return c.json({ media });
  } catch (error: any) {
    console.error("Error loading media details:", error);
    return c.json({ error: "Error al cargar detalles del medio" }, 500);
  }
});

/**
 * POST /media - Upload media from admin panel
 */
adminRouter.post("/media", async (c) => {
  try {
    const user = c.get("user");
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No se proporcionó ningún archivo" }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const media = await mediaService.uploadMedia({
      data,
      filename: file.name,
      mimeType: file.type,
      uploadedBy: user.userId,
    });

    const fullMedia = await mediaService.getMediaById(media.id);

    return c.json({ media: fullMedia }, 201);
  } catch (error: any) {
    console.error("Error uploading media from admin:", error);

    if (
      error instanceof Error &&
      (error.message.includes("no soportado") ||
        error.message.includes("demasiado grande"))
    ) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      error: "Error al subir archivo",
      details: error.message || String(error),
    }, 500);
  }
});

/**
 * DELETE /media/:id - Delete media from admin panel
 */
adminRouter.delete("/media/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "ID inválido" }, 400);
    }

    await mediaService.deleteMedia(id);

    return c.json({ success: true, message: "Media eliminado exitosamente" });
  } catch (error: any) {
    console.error("Error deleting media from admin:", error);
    return c.json({ error: error.message || "Error al eliminar media" }, 500);
  }
});

/**
 * GET /appearance/themes - Themes overview
 */
adminRouter.get("/appearance/themes", async (c) => {
  try {
    const user = c.get("user");
    const settingsSaved = c.req.query("saved") === "1";
    const activeTheme = await themeService.getActiveTheme();
    const themeNames = await themeService.listAvailableThemes();

    const themes = await Promise.all(
      themeNames.map(async (name) => {
        const config = await themeService.loadThemeConfig(name);
        return {
          name,
          displayName: config?.displayName || config?.name || name,
          version: config?.version,
          description: config?.description,
          author: config?.author
            ? { name: config.author.name, url: config.author.url }
            : undefined,
          screenshots: config?.screenshots,
          isActive: name === activeTheme,
          parent: config?.parent, // Add parent theme info for child themes
        };
      }),
    );

    const activeConfig = await themeService.loadThemeConfig(activeTheme);
    let customSettings: Array<{
      key: string;
      label: string;
      type: string;
      description?: string;
      options?: string[];
      group?: string;
      defaultValue?: unknown;
      value?: unknown;
    }> = [];

    if (activeConfig?.config?.custom) {
      const savedSettings = await themeService.getThemeCustomSettings(
        activeTheme,
      );
      customSettings = Object.entries(activeConfig.config.custom).map(
        ([key, definition]: [string, any]) => {
          const type = definition.type || "text";
          let value = savedSettings[key];
          if (value === undefined) {
            value = definition.default ?? null;
          }
          return {
            key,
            label: definition.label || key,
            type,
            description: definition.description,
            options: Array.isArray(definition.options)
              ? definition.options
              : undefined,
            group: definition.group,
            defaultValue: definition.default,
            value,
          };
        },
      );
    }

    return c.html(ThemesPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      themes,
      activeTheme,
      customSettings,
      settingsSaved,
    }));
  } catch (error: any) {
    console.error("Error rendering themes page:", error);
    return c.text("Error al cargar los themes", 500);
  }
});

/**
 * POST /appearance/themes/activate - Activate theme
 */
adminRouter.post("/appearance/themes/activate", async (c) => {
  try {
    const body = await c.req.parseBody();
    const theme = parseStringField(body.theme);
    if (!theme) {
      return c.text("Theme inválido", 400);
    }

    await themeService.activateTheme(theme);
    return c.redirect(`${env.ADMIN_PATH}/appearance/themes`);
  } catch (error: any) {
    console.error("Error activating theme:", error);
    return c.text("Error al activar el theme", 500);
  }
});

/**
 * POST /appearance/themes/custom-settings - Update theme custom settings
 */
adminRouter.post("/appearance/themes/custom-settings", async (c) => {
  try {
    const body = await c.req.parseBody();
    const theme = parseStringField(body.theme) ||
      await themeService.getActiveTheme();

    const config = await themeService.loadThemeConfig(theme);
    const customDefinitions = config?.config?.custom || {};

    const updates: Record<string, unknown> = {};

    for (const [key, definition] of Object.entries(customDefinitions)) {
      const fieldName = `custom_${key}`;
      const type = (definition as any).type || "text";
      const value = (body as Record<string, unknown>)[fieldName];

      switch (type) {
        case "boolean":
          updates[key] = parseBooleanField(value);
          break;
        case "number":
        case "range": {
          const numValue = parseNullableField(value);
          updates[key] = numValue ? Number(numValue) : null;
          break;
        }
        case "select":
        case "text":
        case "textarea":
        case "url":
        case "image":
        case "image_upload":
        case "color":
          updates[key] = parseNullableField(value) ?? null;
          break;
        default:
          updates[key] = parseNullableField(value) ?? null;
          break;
      }
    }

    await themeService.updateThemeCustomSettings(theme, updates);
    return c.redirect(`${env.ADMIN_PATH}/appearance/themes?saved=1`);
  } catch (error: any) {
    console.error("Error updating theme custom settings:", error);
    return c.text("Error al guardar la configuración del theme", 500);
  }
});

/**
 * GET /appearance/themes/preview - Theme preview page
 */
adminRouter.get("/appearance/themes/preview", async (c) => {
  try {
    const user = c.get("user");
    const themeName = c.req.query("theme");

    if (!themeName) {
      return c.text("Theme no especificado", 400);
    }

    const config = await themeService.loadThemeConfig(themeName);
    if (!config) {
      return c.text("Theme no encontrado", 404);
    }

    // Crear sesión de preview
    const token = await themePreviewService.createPreviewToken(
      user.id,
      themeName
    );

    return c.html(ThemePreviewPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      themeName,
      themeDisplayName: config.displayName || config.name,
      previewUrl: "/",
      previewToken: token,
    }));
  } catch (error: any) {
    console.error("Error loading theme preview:", error);
    return c.text("Error al cargar la vista previa", 500);
  }
});

/**
 * GET /appearance/themes/customize - Theme customizer page
 */
adminRouter.get("/appearance/themes/customize", async (c) => {
  try {
    const user = c.get("user");
    const themeName = c.req.query("theme") || await themeService.getActiveTheme();

    const config = await themeService.loadThemeConfig(themeName);
    if (!config) {
      return c.text("Theme no encontrado", 404);
    }

    // Crear sesión de customizer
    const session = await themeCustomizerService.createSession(
      user.id,
      themeName
    );

    // Preparar custom settings
    const savedSettings = await themeService.getThemeCustomSettings(themeName);
    const customSettings = Object.entries(config.config?.custom || {}).map(
      ([key, definition]) => {
        const typed = definition as any;
        return {
          key,
          label: typed.label || key,
          type: typed.type || "text",
          description: typed.description,
          options: typed.options,
          group: typed.group || "general",
          defaultValue: typed.default,
          value: savedSettings[key] !== undefined ? savedSettings[key] : typed.default,
          min: typed.min,
          max: typed.max,
          step: typed.step,
        };
      }
    );

    return c.html(ThemeCustomizerPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      themeName,
      themeDisplayName: config.displayName || config.name,
      customSettings,
      sessionId: session.id,
    }));
  } catch (error: any) {
    console.error("Error loading theme customizer:", error);
    return c.text("Error al cargar el personalizador", 500);
  }
});

/**
 * GET /appearance/themes/editor - Theme code editor page
 */
adminRouter.get("/appearance/themes/editor", async (c) => {
  try {
    const user = c.get("user");
    const themeName = c.req.query("theme") || await themeService.getActiveTheme();
    const filePath = c.req.query("file");

    // Build file tree
    const themeDir = join(Deno.cwd(), "src", "themes", themeName);

    async function buildFileTree(dirPath: string, relativePath = ""): Promise<any[]> {
      const files: any[] = [];

      try {
        for await (const entry of Deno.readDir(dirPath)) {
          const entryPath = join(dirPath, entry.name);
          const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

          if (entry.isDirectory) {
            const children = await buildFileTree(entryPath, relPath);
            files.push({
              name: entry.name,
              path: relPath,
              type: "directory",
              children,
            });
          } else if (entry.isFile) {
            const ext = entry.name.split(".").pop();
            files.push({
              name: entry.name.replace(`.${ext}`, ""),
              path: relPath,
              type: "file",
              extension: ext,
            });
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
      }

      return files.sort((a, b) => {
        if (a.type === "directory" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "directory") return 1;
        return a.name.localeCompare(b.name);
      });
    }

    const fileTree = await buildFileTree(themeDir);

    // Load file content if requested
    let currentContent;
    let error;

    if (filePath) {
      try {
        const fullPath = join(themeDir, filePath);
        // Security: ensure the path is within the theme directory
        if (!fullPath.startsWith(themeDir)) {
          throw new Error("Invalid file path");
        }
        currentContent = await Deno.readTextFile(fullPath);
      } catch (err) {
        console.error("Error loading file:", err);
        error = `No se pudo cargar el archivo: ${err.message}`;
      }
    }

    return c.html(ThemeEditorPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      themeName,
      fileTree,
      currentFile: filePath,
      currentContent,
      error,
    }));
  } catch (error: any) {
    console.error("Error loading theme editor:", error);
    return c.text("Error al cargar el editor", 500);
  }
});

/**
 * POST /api/admin/themes/editor/save - Save theme file
 */
adminRouter.post("/api/admin/themes/editor/save", async (c) => {
  try {
    const body = await c.req.parseBody();
    const themeName = parseStringField(body.theme);
    const filePath = parseStringField(body.file);
    const content = String(body.content || "");

    if (!themeName || !filePath) {
      return c.text("Parámetros inválidos", 400);
    }

    const themeDir = join(Deno.cwd(), "src", "themes", themeName);
    const fullPath = join(themeDir, filePath);

    // Security: ensure the path is within the theme directory
    if (!fullPath.startsWith(themeDir)) {
      return c.text("Ruta de archivo inválida", 400);
    }

    await Deno.writeTextFile(fullPath, content);

    // Invalidate theme cache
    themeService.invalidateThemeCache(themeName);

    return c.redirect(`${env.ADMIN_PATH}/appearance/themes/editor?theme=${themeName}&file=${encodeURIComponent(filePath)}&saved=1`);
  } catch (error: any) {
    console.error("Error saving theme file:", error);
    return c.text("Error al guardar el archivo", 500);
  }
});

/**
 * GET /appearance/widgets - Widgets management page
 */
adminRouter.get("/appearance/widgets", async (c) => {
  try {
    const user = c.get("user");
    const activeTheme = await themeService.getActiveTheme();
    const config = await themeService.getActiveThemeConfig();

    // Get widget areas from theme config
    const widgetAreas = await widgetService.getWidgetAreasForTheme(activeTheme);
    const availableWidgets = widgetService.getAvailableWidgetTypes();

    return c.html(WidgetsPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      widgetAreas,
      availableWidgets,
      activeTheme,
    }));
  } catch (error: any) {
    console.error("Error loading widgets page:", error);
    return c.text("Error al cargar la página de widgets", 500);
  }
});

/**
 * GET /api/admin/themes/cache/stats - Get cache statistics
 */
adminRouter.get("/api/admin/themes/cache/stats", async (c) => {
  try {
    const stats = themeService.getCacheStats();
    return c.json(stats);
  } catch (error: any) {
    console.error("Error getting cache stats:", error);
    return c.json({ error: "Failed to get cache stats" }, 500);
  }
});

/**
 * POST /api/admin/themes/cache/clear - Clear theme cache
 */
adminRouter.post("/api/admin/themes/cache/clear", async (c) => {
  try {
    const body = await c.req.json();
    const themeName = body?.theme;

    if (themeName) {
      themeService.invalidateThemeCache(themeName);
      return c.json({ success: true, message: `Cache cleared for theme: ${themeName}` });
    } else {
      themeService.invalidateAllCache();
      return c.json({ success: true, message: "All cache cleared" });
    }
  } catch (error: any) {
    console.error("Error clearing cache:", error);
    return c.json({ error: "Failed to clear cache" }, 500);
  }
});

/**
 * POST /api/admin/themes/cache/warmup - Warmup theme cache
 */
adminRouter.post("/api/admin/themes/cache/warmup", async (c) => {
  try {
    const body = await c.req.json();
    const themeName = body?.theme;

    await themeService.warmupCache(themeName);
    return c.json({ success: true, message: "Cache warmed up successfully" });
  } catch (error: any) {
    console.error("Error warming up cache:", error);
    return c.json({ error: "Failed to warmup cache" }, 500);
  }
});

/**
 * GET /api/admin/themes/config/export - Export theme configuration
 */
adminRouter.get("/api/admin/themes/config/export", async (c) => {
  try {
    const themeName = c.req.query("theme");
    const includeMenus = c.req.query("includeMenus") === "true";

    const { exportThemeConfig, formatExport, generateExportFilename } = await import(
      "../services/themeConfigService.ts"
    );

    const activeTheme = themeName || await themeService.getActiveTheme();
    const exportData = await exportThemeConfig(activeTheme, {
      includeMenus,
      metadata: { exportedBy: "LexCMS Admin" },
    });

    const jsonContent = formatExport(exportData, true);
    const filename = generateExportFilename(activeTheme);

    // Set headers for download
    c.header("Content-Type", "application/json");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);

    return c.body(jsonContent);
  } catch (error: any) {
    console.error("Error exporting theme config:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/config/import - Import theme configuration
 */
adminRouter.post("/api/admin/themes/config/import", async (c) => {
  try {
    const body = await c.req.json();
    const { config, options } = body;

    if (!config) {
      return c.json({ error: "Configuration data is required" }, 400);
    }

    const { importThemeConfig, validateThemeConfigExport } = await import(
      "../services/themeConfigService.ts"
    );

    // Validate first
    const validation = await validateThemeConfigExport(config);
    if (!validation.valid) {
      return c.json({
        error: "Invalid configuration",
        errors: validation.errors,
        warnings: validation.warnings,
      }, 400);
    }

    // Import
    const result = await importThemeConfig(config, options);

    return c.json(result);
  } catch (error: any) {
    console.error("Error importing theme config:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/config/validate - Validate theme configuration
 */
adminRouter.post("/api/admin/themes/config/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { config } = body;

    if (!config) {
      return c.json({ error: "Configuration data is required" }, 400);
    }

    const { validateThemeConfigExport } = await import("../services/themeConfigService.ts");

    const validation = await validateThemeConfigExport(config);

    return c.json(validation);
  } catch (error: any) {
    console.error("Error validating theme config:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Theme Preview API Endpoints
 */

/**
 * POST /api/admin/themes/preview/create - Create preview session
 */
adminRouter.post("/api/admin/themes/preview/create", async (c) => {
  try {
    const body = await c.req.json();
    const { theme } = body;

    if (!theme) {
      return c.json({ error: "Theme name is required" }, 400);
    }

    // Get current user from session
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { themePreviewService } = await import("../services/themePreviewService.ts");
    const session = await themePreviewService.createPreviewSession(theme, user.id);

    // Generate preview URL
    const baseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;
    const previewUrl = `${baseUrl}/?theme_preview=1&preview_token=${session.token}`;

    return c.json({
      success: true,
      session: {
        token: session.token,
        theme: session.theme,
        expiresAt: session.expiresAt,
      },
      previewUrl,
    });
  } catch (error: any) {
    console.error("Error creating preview session:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/preview/activate - Activate previewed theme
 */
adminRouter.post("/api/admin/themes/preview/activate", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return c.json({ error: "Preview token is required" }, 400);
    }

    const { themePreviewService } = await import("../services/themePreviewService.ts");
    const session = await themePreviewService.verifyPreviewToken(token);

    if (!session) {
      return c.json({ error: "Invalid or expired preview token" }, 400);
    }

    // Activate the theme
    await themeService.activateTheme(session.theme);

    // End the preview session
    await themePreviewService.endPreviewSession(token);

    return c.json({
      success: true,
      theme: session.theme,
      message: "Theme activated successfully",
    });
  } catch (error: any) {
    console.error("Error activating preview theme:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /api/admin/themes/preview/:token - End preview session
 */
adminRouter.delete("/api/admin/themes/preview/:token", async (c) => {
  try {
    const token = c.req.param("token");

    const { themePreviewService } = await import("../services/themePreviewService.ts");
    await themePreviewService.endPreviewSession(token);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error ending preview session:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Theme Customizer API Endpoints
 */

/**
 * POST /api/admin/themes/customizer/session - Create customizer session
 */
adminRouter.post("/api/admin/themes/customizer/session", async (c) => {
  try {
    const body = await c.req.json();
    const { theme } = body;

    if (!theme) {
      return c.json({ error: "Theme name is required" }, 400);
    }

    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    const session = await themeCustomizerService.createSession(user.id, theme);

    // Check for existing draft
    const draft = await themeCustomizerService.loadDraft(user.id, theme);

    return c.json({
      success: true,
      sessionId: session.id,
      hasDraft: draft !== null,
      draftChanges: draft?.length || 0,
    });
  } catch (error: any) {
    console.error("Error creating customizer session:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /api/admin/themes/customizer/state/:sessionId - Get customizer state
 */
adminRouter.get("/api/admin/themes/customizer/state/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    const state = await themeCustomizerService.getState(sessionId);

    return c.json(state);
  } catch (error: any) {
    console.error("Error getting customizer state:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/customizer/change - Apply a change
 */
adminRouter.post("/api/admin/themes/customizer/change", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, settingKey, value, description } = body;

    if (!sessionId || !settingKey) {
      return c.json({ error: "sessionId and settingKey are required" }, 400);
    }

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    const state = await themeCustomizerService.applyChange(
      sessionId,
      settingKey,
      value,
      description
    );

    return c.json({ success: true, state });
  } catch (error: any) {
    console.error("Error applying change:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/customizer/undo - Undo last change
 */
adminRouter.post("/api/admin/themes/customizer/undo", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({ error: "sessionId is required" }, 400);
    }

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    const state = await themeCustomizerService.undo(sessionId);

    return c.json({ success: true, state });
  } catch (error: any) {
    console.error("Error undoing change:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/customizer/redo - Redo last undone change
 */
adminRouter.post("/api/admin/themes/customizer/redo", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({ error: "sessionId is required" }, 400);
    }

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    const state = await themeCustomizerService.redo(sessionId);

    return c.json({ success: true, state });
  } catch (error: any) {
    console.error("Error redoing change:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/customizer/reset - Reset all changes
 */
adminRouter.post("/api/admin/themes/customizer/reset", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({ error: "sessionId is required" }, 400);
    }

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    const state = await themeCustomizerService.reset(sessionId);

    return c.json({ success: true, state });
  } catch (error: any) {
    console.error("Error resetting changes:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/customizer/save-draft - Save as draft
 */
adminRouter.post("/api/admin/themes/customizer/save-draft", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({ error: "sessionId is required" }, 400);
    }

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    await themeCustomizerService.saveDraft(sessionId);

    return c.json({ success: true, message: "Draft saved successfully" });
  } catch (error: any) {
    console.error("Error saving draft:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/themes/customizer/publish - Publish changes
 */
adminRouter.post("/api/admin/themes/customizer/publish", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({ error: "sessionId is required" }, 400);
    }

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    await themeCustomizerService.publish(sessionId);

    return c.json({ success: true, message: "Changes published successfully" });
  } catch (error: any) {
    console.error("Error publishing changes:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /api/admin/themes/customizer/history/:sessionId - Get change history
 */
adminRouter.get("/api/admin/themes/customizer/history/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    const history = themeCustomizerService.getHistory(sessionId);

    return c.json({ history });
  } catch (error: any) {
    console.error("Error getting history:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /api/admin/themes/customizer/session/:sessionId - End session
 */
adminRouter.delete("/api/admin/themes/customizer/session/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");

    const { themeCustomizerService } = await import("../services/themeCustomizerService.ts");
    await themeCustomizerService.endSession(sessionId);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error ending session:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Widget API Endpoints
 */

/**
 * GET /api/admin/widgets/types - Get available widget types
 */
adminRouter.get("/api/admin/widgets/types", async (c) => {
  try {
    const { getAvailableWidgetTypes } = await import("../services/widgetService.ts");
    const types = getAvailableWidgetTypes();
    return c.json(types);
  } catch (error: any) {
    console.error("Error getting widget types:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /api/admin/widgets/areas - Get widget areas
 */
adminRouter.get("/api/admin/widgets/areas", async (c) => {
  try {
    const theme = c.req.query("theme");
    const { getWidgetAreasByTheme, getWidgetAreaBySlug } = await import(
      "../services/widgetService.ts"
    );

    if (theme) {
      const areas = await getWidgetAreasByTheme(theme);
      return c.json(areas);
    }

    const activeTheme = await themeService.getActiveTheme();
    const areas = await getWidgetAreasByTheme(activeTheme);
    return c.json(areas);
  } catch (error: any) {
    console.error("Error getting widget areas:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /api/admin/widgets/areas/:slug - Get widget area by slug
 */
adminRouter.get("/api/admin/widgets/areas/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const { getWidgetAreaBySlug } = await import("../services/widgetService.ts");

    const area = await getWidgetAreaBySlug(slug);

    if (!area) {
      return c.json({ error: "Widget area not found" }, 404);
    }

    return c.json(area);
  } catch (error: any) {
    console.error("Error getting widget area:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/widgets/areas - Create widget area
 */
adminRouter.post("/api/admin/widgets/areas", async (c) => {
  try {
    const body = await c.req.json();
    const { createWidgetArea } = await import("../services/widgetService.ts");

    const areaId = await createWidgetArea(body);

    return c.json({ success: true, areaId });
  } catch (error: any) {
    console.error("Error creating widget area:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /api/admin/widgets/areas/:id - Update widget area
 */
adminRouter.put("/api/admin/widgets/areas/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { updateWidgetArea } = await import("../services/widgetService.ts");

    await updateWidgetArea(id, body);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error updating widget area:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /api/admin/widgets/areas/:id - Delete widget area
 */
adminRouter.delete("/api/admin/widgets/areas/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const { deleteWidgetArea } = await import("../services/widgetService.ts");

    await deleteWidgetArea(id);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting widget area:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/widgets - Create widget
 */
adminRouter.post("/api/admin/widgets", async (c) => {
  try {
    const body = await c.req.json();
    const { createWidget } = await import("../services/widgetService.ts");

    const widgetId = await createWidget(body);

    return c.json({ success: true, widgetId });
  } catch (error: any) {
    console.error("Error creating widget:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /api/admin/widgets/:id - Get widget by ID
 */
adminRouter.get("/api/admin/widgets/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const { getWidgetById } = await import("../services/widgetService.ts");

    const widget = await getWidgetById(id);

    if (!widget) {
      return c.json({ error: "Widget not found" }, 404);
    }

    return c.json(widget);
  } catch (error: any) {
    console.error("Error getting widget:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /api/admin/widgets/:id - Update widget
 */
adminRouter.put("/api/admin/widgets/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { updateWidget } = await import("../services/widgetService.ts");

    await updateWidget(id, body);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error updating widget:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /api/admin/widgets/:id - Delete widget
 */
adminRouter.delete("/api/admin/widgets/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const { deleteWidget } = await import("../services/widgetService.ts");

    await deleteWidget(id);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting widget:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/widgets/reorder - Reorder widgets in an area
 */
adminRouter.post("/api/admin/widgets/reorder", async (c) => {
  try {
    const body = await c.req.json();
    const { areaId, widgetIds } = body;

    if (!areaId || !Array.isArray(widgetIds)) {
      return c.json({ error: "areaId and widgetIds array required" }, 400);
    }

    const { reorderWidgets } = await import("../services/widgetService.ts");

    await reorderWidgets(areaId, widgetIds);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering widgets:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /api/admin/widgets/validate - Validate widget settings
 */
adminRouter.post("/api/admin/widgets/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { type, settings } = body;

    if (!type) {
      return c.json({ error: "Widget type is required" }, 400);
    }

    const { validateWidgetSettings } = await import("../services/widgetService.ts");

    const validation = await validateWidgetSettings(type, settings);

    return c.json(validation);
  } catch (error: any) {
    console.error("Error validating widget settings:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /appearance/menus - Menu manager
 */
adminRouter.get("/appearance/menus", async (c) => {
  try {
    const user = c.get("user");
    const menusResult = await menuService.getAllMenus({
      limit: 100,
      orderBy: "name",
      orderDirection: "asc",
    });
    const menuList = menusResult.menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      slug: menu.slug,
      description: menu.description,
      isActive: menu.isActive,
    }));

    const requestedId = c.req.query("menuId");
    let selectedMenu = menuList[0] || null;
    if (requestedId) {
      const match = menuList.find((menu) => menu.id === parseInt(requestedId));
      if (match) {
        selectedMenu = match;
      }
    }

    let selectedMenuData: any = null;
    if (selectedMenu) {
      const hierarchy = await menuItemService.getMenuItemsHierarchy(
        selectedMenu.id,
      );
      selectedMenuData = {
        ...selectedMenu,
        items: mapMenuItems(hierarchy),
      };
    }

    let postType: typeof contentTypes.$inferSelect | null = null;
    let pageType: typeof contentTypes.$inferSelect | null = null;
    try {
      postType = await getContentTypeBySlug("post");
    } catch (error) {
      console.warn("Content type 'post' not found:", error);
    }
    try {
      pageType = await getContentTypeBySlug("page");
    } catch (error) {
      console.warn("Content type 'page' not found:", error);
    }

    const [categoriesData, postsData, pagesData] = await Promise.all([
      db.query.categories.findMany({
        columns: { id: true, name: true, slug: true },
        orderBy: (categories, { asc }) => [asc(categories.name)],
      }),
      postType
        ? db.query.content.findMany({
          columns: { id: true, title: true, slug: true },
          where: eq(content.contentTypeId, postType.id),
          orderBy: [desc(content.createdAt)],
          limit: 30,
        })
        : Promise.resolve([]),
      pageType
        ? db.query.content.findMany({
          columns: { id: true, title: true, slug: true },
          where: eq(content.contentTypeId, pageType.id),
          orderBy: [desc(content.createdAt)],
          limit: 30,
        })
        : Promise.resolve([]),
    ]);

    return c.html(AppearanceMenusPage({
      user: {
        name: user.name || user.email,
        email: user.email,
      },
      menus: menuList,
      selectedMenu: selectedMenuData,
      categories: categoriesData,
      posts: postsData,
      pages: pagesData,
    }));
  } catch (error: any) {
    console.error("Error rendering appearance menus page:", error);
    return c.text("Error al cargar los menús", 500);
  }
});

/**
 * POST /appearance/menus/create - Create menu
 */
adminRouter.post("/appearance/menus/create", async (c) => {
  try {
    const body = await c.req.parseBody();
    const name = parseStringField(body.name);
    const slug = parseStringField(body.slug);
    const description = parseNullableField(body.description);

    if (!name || !slug) {
      return c.text("Nombre y slug son requeridos", 400);
    }

    const menu = await menuService.createMenu({
      name,
      slug,
      description: description ?? null,
      isActive: false,
    });

    return c.redirect(`${env.ADMIN_PATH}/appearance/menus?menuId=${menu.id}`);
  } catch (error: any) {
    console.error("Error creating menu:", error);
    return c.text("Error al crear el menú", 500);
  }
});

/**
 * POST /appearance/menus/:id/update - Update menu
 */
adminRouter.post("/appearance/menus/:id/update", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.parseBody();
    const name = parseStringField(body.name);
    const slug = parseStringField(body.slug);
    const description = parseNullableField(body.description);
    const isActive = parseBooleanField(body.isActive);

    if (!name || !slug) {
      return c.text("Nombre y slug son requeridos", 400);
    }

    await menuService.updateMenu(id, {
      name,
      slug,
      description: description ?? null,
      isActive,
    });

    return c.redirect(`${env.ADMIN_PATH}/appearance/menus?menuId=${id}`);
  } catch (error: any) {
    console.error("Error updating menu:", error);
    return c.text("Error al actualizar el menú", 500);
  }
});

/**
 * POST /appearance/menus/:id/delete - Delete menu
 */
adminRouter.post("/appearance/menus/:id/delete", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    await menuService.deleteMenu(id);
    return c.redirect(`${env.ADMIN_PATH}/appearance/menus`);
  } catch (error: any) {
    console.error("Error deleting menu:", error);
    return c.text("Error al eliminar el menú", 500);
  }
});

/**
 * POST /appearance/menus/:id/items/add - Add items to menu
 */
adminRouter.post("/appearance/menus/:id/items/add", async (c) => {
  try {
    const menuId = parseInt(c.req.param("id"));
    const body = await c.req.parseBody();
    const type = parseStringField(body.type);

    const existingItems = await menuItemService.getMenuItems(menuId);
    let order = existingItems.length > 0
      ? Math.max(...existingItems.map((item) => item.order ?? 0)) + 1
      : 0;

    if (type === "category") {
      const categoryIds = parseIds(
        (body as any)["categoryIds"] ?? (body as any)["categoryIds[]"],
      );
      if (categoryIds.length > 0) {
        const categoriesInfo = await db.query.categories.findMany({
          where: inArray(categories.id, categoryIds),
          columns: { id: true, name: true },
        });
        const categoryMap = new Map(
          categoriesInfo.map((cat) => [cat.id, cat.name]),
        );

        for (const categoryId of categoryIds) {
          await menuItemService.createMenuItem({
            menuId,
            label: categoryMap.get(categoryId) || `Categoría ${categoryId}`,
            categoryId,
            parentId: null,
            order,
            isVisible: true,
          });
          order++;
        }
      }
    } else if (type === "page" || type === "post") {
      const contentIds = parseIds(
        (body as any)["contentIds"] ?? (body as any)["contentIds[]"],
      );
      if (contentIds.length > 0) {
        const contentItems = await db.query.content.findMany({
          where: inArray(content.id, contentIds),
          columns: { id: true, title: true },
        });
        const contentMap = new Map(
          contentItems.map((item) => [item.id, item.title]),
        );

        for (const contentId of contentIds) {
          const title = contentMap.get(contentId);
          if (!title) continue;
          await menuItemService.createMenuItem({
            menuId,
            label: title,
            contentId,
            parentId: null,
            order,
            isVisible: true,
          });
          order++;
        }
      }
    } else if (type === "custom") {
      const label = parseStringField(body.label);
      const url = parseStringField(body.url);
      if (!label || !url) {
        return c.text("Etiqueta y URL son requeridas", 400);
      }
      await menuItemService.createMenuItem({
        menuId,
        label,
        url,
        parentId: null,
        order,
        isVisible: true,
      });
    }

    return c.redirect(`${env.ADMIN_PATH}/appearance/menus?menuId=${menuId}`);
  } catch (error: any) {
    console.error("Error adding menu items:", error);
    return c.text("Error al agregar elementos al menú", 500);
  }
});

/**
 * POST /appearance/menus/items/reorder - Reorder menu items
 */
adminRouter.post("/appearance/menus/items/reorder", async (c) => {
  try {
    const body = await c.req.json();
    const items = Array.isArray(body.items) ? body.items : [];

    for (const item of items) {
      await menuItemService.updateMenuItem(item.id, {
        parentId: item.parentId ?? null,
        order: item.order,
      });
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering menu items:", error);
    return c.json({ success: false }, 500);
  }
});

/**
 * POST /appearance/menus/items/delete - Delete menu item
 */
adminRouter.post("/appearance/menus/items/delete", async (c) => {
  try {
    const body = await c.req.json();
    const itemId = Number(body.itemId);
    if (!itemId) {
      return c.json({ success: false }, 400);
    }
    await menuItemService.deleteMenuItem(itemId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting menu item:", error);
    return c.json({ success: false }, 500);
  }
});

/**
 * POST /appearance/menus/items/update - Update menu item label
 */
adminRouter.post("/appearance/menus/items/update", async (c) => {
  try {
    const body = await c.req.json();
    const itemId = Number(body.itemId);
    const label = parseStringField(body.label);
    if (!itemId || !label) {
      return c.json({ success: false }, 400);
    }

    await menuItemService.updateMenuItem(itemId, { label });
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error updating menu item:", error);
    return c.json({ success: false }, 500);
  }
});

/**
 * GET /categories - Categories list
 */
adminRouter.get("/categories", async (c) => {
  try {
    const user = c.get("user");
    const categoriesData = await db.query.categories.findMany({
      with: {
        contentCategories: true,
      },
    });

    // Map to include content count
    const categoriesWithCount = categoriesData.map((cat) => ({
      ...cat,
      _count: { content: cat.contentCategories?.length || 0 },
    }));

    return c.html(CategoriesPage({
      user: { name: user.name || user.email, email: user.email },
      categories: categoriesWithCount,
    }));
  } catch (error: any) {
    console.error("Error:", error);
    return c.text("Error al cargar categorías", 500);
  }
});

adminRouter.post("/categories/create", async (c) => {
  try {
    const body = await c.req.parseBody();
    await db.insert(categories).values({
      name: body.name as string,
      slug: body.slug as string,
      description: body.description as string || null,
    });
    return c.redirect(`${env.ADMIN_PATH}/categories`);
  } catch (error: any) {
    return c.text("Error al crear categoría", 500);
  }
});

adminRouter.post("/categories/edit/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.parseBody();
    await db.update(categories).set({
      name: body.name as string,
      slug: body.slug as string,
      description: body.description as string || null,
    }).where(eq(categories.id, id));
    return c.redirect(`${env.ADMIN_PATH}/categories`);
  } catch (error: any) {
    return c.text("Error al actualizar", 500);
  }
});

adminRouter.post("/categories/delete/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    await db.delete(categories).where(eq(categories.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false }, 500);
  }
});

/**
 * GET /tags - Tags list
 */
adminRouter.get("/tags", async (c) => {
  try {
    const user = c.get("user");
    const tagsData = await db.query.tags.findMany({
      with: {
        contentTags: true,
      },
    });

    // Map to include content count
    const tagsWithCount = tagsData.map((tag) => ({
      ...tag,
      _count: { content: tag.contentTags?.length || 0 },
    }));

    return c.html(TagsPage({
      user: { name: user.name || user.email, email: user.email },
      tags: tagsWithCount,
    }));
  } catch (error: any) {
    return c.text("Error al cargar tags", 500);
  }
});

adminRouter.post("/tags/create", async (c) => {
  try {
    const body = await c.req.parseBody();
    await db.insert(tags).values({
      name: body.name as string,
      slug: body.slug as string,
    });
    return c.redirect(`${env.ADMIN_PATH}/tags`);
  } catch (error: any) {
    return c.text("Error al crear tag", 500);
  }
});

adminRouter.post("/tags/edit/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.parseBody();
    await db.update(tags).set({
      name: body.name as string,
      slug: body.slug as string,
    }).where(eq(tags.id, id));
    return c.redirect(`${env.ADMIN_PATH}/tags`);
  } catch (error: any) {
    return c.text("Error al actualizar", 500);
  }
});

adminRouter.post("/tags/delete/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    await db.delete(tags).where(eq(tags.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false }, 500);
  }
});

/**
 * GET /users - Users list with filters and pagination
 */
adminRouter.get("/users", async (c) => {
  try {
    const user = c.get("user");

    // Verificar permiso para ver usuarios
    const hasPermission = await permissionService.userHasPermission(user.userId, "users", "read");
    if (!hasPermission) {
      return c.html(`<h1>Acceso Denegado</h1><p>No tienes permiso para ver usuarios</p>`, 403);
    }

    const query = c.req.query();

    // Obtener filtros de la query
    const filters: any = {};
    if (query.search) filters.search = query.search;
    if (query.status) filters.status = query.status;
    if (query.roleId) filters.roleId = parseInt(query.roleId);
    if (query.limit) filters.limit = parseInt(query.limit) || 20;
    if (query.offset) filters.offset = parseInt(query.offset) || 0;

    const [usersResult, rolesData, stats, userPermissions] = await Promise.all([
      userService.getUsersWithFilters(filters),
      db.query.roles.findMany(),
      userService.getUserStats(),
      permissionService.getUserPermissions(user.userId),
    ]);

    return c.html(UsersPageImproved({
      user: { name: user.name || user.email, email: user.email },
      users: usersResult.users,
      roles: rolesData,
      stats,
      filters,
      pagination: {
        total: usersResult.total,
        hasMore: usersResult.hasMore,
        offset: filters.offset || 0,
        limit: filters.limit || 20,
      },
      userPermissions: userPermissions.map(p => `${p.module}:${p.action}`),
    }));
  } catch (error: any) {
    console.error("Error loading users:", error);
    return c.text("Error al cargar usuarios", 500);
  }
});

adminRouter.post("/users/create", async (c) => {
  try {
    const user = c.get("user");

    // Verificar permiso para crear usuarios
    const hasPermission = await permissionService.userHasPermission(user.userId, "users", "create");
    if (!hasPermission) {
      return c.text("No tienes permiso para crear usuarios", 403);
    }

    const body = await c.req.parseBody();
    const { hashPassword } = await import("../utils/password.ts");
    const hashedPassword = await hashPassword(body.password as string);

    await db.insert(users).values({
      name: body.name as string,
      email: body.email as string,
      password: hashedPassword,
      roleId: body.roleId ? parseInt(body.roleId as string) : null,
      status: (body.status as string) || "active",
    });
    return c.redirect(`${env.ADMIN_PATH}/users`);
  } catch (error: any) {
    console.error("Error creating user:", error);
    return c.text("Error al crear usuario: " + error.message, 500);
  }
});

/**
 * POST /users/edit/:id - Update user
 */
adminRouter.post("/users/edit/:id", async (c) => {
  try {
    const user = c.get("user");

    // Verificar permiso para actualizar usuarios
    const hasPermission = await permissionService.userHasPermission(user.userId, "users", "update");
    if (!hasPermission) {
      return c.text("No tienes permiso para actualizar usuarios", 403);
    }

    const id = parseInt(c.req.param("id"));
    const body = await c.req.parseBody();

    const updateData: any = {
      name: body.name as string,
      email: body.email as string,
      roleId: body.roleId ? parseInt(body.roleId as string) : null,
      status: (body.status as string) || "active",
      updatedAt: new Date(),
    };

    // Only update password if provided
    if (body.password && (body.password as string).trim() !== "") {
      const { hashPassword } = await import("../utils/password.ts");
      updateData.password = await hashPassword(body.password as string);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));
    return c.redirect(`${env.ADMIN_PATH}/users`);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return c.text("Error al actualizar usuario: " + error.message, 500);
  }
});

adminRouter.post("/users/delete/:id", async (c) => {
  try {
    const user = c.get("user");

    // Verificar permiso para eliminar usuarios
    const hasPermission = await permissionService.userHasPermission(user.userId, "users", "delete");
    if (!hasPermission) {
      return c.json({ success: false, error: "No tienes permiso para eliminar usuarios" }, 403);
    }

    const id = parseInt(c.req.param("id"));
    await userService.deleteUser(id);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * POST /users/bulk-status - Bulk update user status
 */
adminRouter.post("/users/bulk-status", async (c) => {
  try {
    const user = c.get("user");

    // Verificar permiso para actualizar usuarios
    const hasPermission = await permissionService.userHasPermission(user.userId, "users", "update");
    if (!hasPermission) {
      return c.json({ success: false, error: "No tienes permiso para actualizar usuarios" }, 403);
    }

    const body = await c.req.json();
    const { userIds, status } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return c.json({ success: false, error: "No se especificaron usuarios" }, 400);
    }

    if (!["active", "inactive", "suspended"].includes(status)) {
      return c.json({ success: false, error: "Estado inválido" }, 400);
    }

    const updated = await userService.bulkUpdateUserStatus(userIds, status);
    return c.json({ success: true, updated });
  } catch (error: any) {
    console.error("Error bulk updating user status:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * POST /users/bulk-delete - Bulk delete users
 */
adminRouter.post("/users/bulk-delete", async (c) => {
  try {
    const user = c.get("user");

    // Verificar permiso para eliminar usuarios
    const hasPermission = await permissionService.userHasPermission(user.userId, "users", "delete");
    if (!hasPermission) {
      return c.json({ success: false, error: "No tienes permiso para eliminar usuarios" }, 403);
    }

    const body = await c.req.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return c.json({ success: false, error: "No se especificaron usuarios" }, 400);
    }

    const deleted = await userService.deleteUsers(userIds);
    return c.json({ success: true, deleted });
  } catch (error: any) {
    console.error("Error bulk deleting users:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * GET /roles - Roles management with statistics
 */
adminRouter.get("/roles", async (c) => {
  try {
    const user = c.get("user");

    // Verificar permiso para ver roles
    const hasPermission = await permissionService.userHasPermission(user.userId, "roles", "read");
    if (!hasPermission) {
      return c.html(`<h1>Acceso Denegado</h1><p>No tienes permiso para ver roles</p>`, 403);
    }

    const [rolesData, permissionsData, stats, userPermissions] = await Promise.all([
      roleService.getAllRolesWithStats(),
      permissionService.getAllPermissions(),
      roleService.getRoleStats(),
      permissionService.getUserPermissions(user.userId),
    ]);

    const formattedRoles = rolesData
      .map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        userCount: role.userCount,
        permissionCount: role.permissionCount,
        createdAt: role.createdAt,
        permissions: (role.permissions || []).map((perm) => ({
          id: perm.id,
          module: perm.module,
          action: perm.action,
          description: perm.description,
        })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es-ES"));

    const sortedPermissions = permissionsData.sort((a, b) => {
      const moduleCompare = a.module.localeCompare(b.module, "es-ES");
      if (moduleCompare !== 0) return moduleCompare;
      return a.action.localeCompare(b.action, "es-ES");
    });

    return c.html(
      RolesPageImproved({
        user: { name: user.name || user.email, email: user.email },
        roles: formattedRoles,
        permissions: sortedPermissions,
        stats,
        userPermissions: userPermissions.map(p => `${p.module}:${p.action}`),
      })
    );
  } catch (error: any) {
    console.error("Error loading roles:", error);
    return c.text("Error al cargar roles", 500);
  }
});

adminRouter.post("/roles/create", async (c) => {
  try {
    const user = c.get("user");

    // Verificar si es superadmin
    const isSuperAdmin = user.userId === 1 ||
      await permissionService.userHasPermission(user.userId, "roles", "create");
    if (!isSuperAdmin) {
      return c.text("Solo superadmin puede crear roles", 403);
    }

    const body = await c.req.parseBody();
    const name = parseStringField(body.name);
    const description = parseNullableField(body.description) ?? null;

    if (!name) {
      return c.text("El nombre del rol es obligatorio", 400);
    }

    await roleService.createRole({ name, description });

    return c.redirect(`${env.ADMIN_PATH}/roles`);
  } catch (error: any) {
    console.error("Error creating role:", error);
    const message = error instanceof Error
      ? error.message
      : "Error al crear rol";
    return c.text(message, 400);
  }
});

adminRouter.post("/roles/edit/:id", async (c) => {
  try {
    const user = c.get("user");

    // Verificar si es superadmin
    const isSuperAdmin = user.userId === 1 ||
      await permissionService.userHasPermission(user.userId, "roles", "update");
    if (!isSuperAdmin) {
      return c.text("Solo superadmin puede actualizar roles", 403);
    }

    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id)) {
      return c.text("ID inválido", 400);
    }

    const body = await c.req.parseBody();
    const name = parseStringField(body.name);
    const description = parseNullableField(body.description) ?? null;

    if (!name) {
      return c.text("El nombre del rol es obligatorio", 400);
    }

    await roleService.updateRole(id, { name, description });

    return c.redirect(`${env.ADMIN_PATH}/roles`);
  } catch (error: any) {
    console.error("Error updating role:", error);
    const message = error instanceof Error
      ? error.message
      : "Error al actualizar rol";
    return c.text(message, 400);
  }
});

adminRouter.post("/roles/delete/:id", async (c) => {
  try {
    const user = c.get("user");

    // Verificar si es superadmin
    const isSuperAdmin = user.userId === 1 ||
      await permissionService.userHasPermission(user.userId, "roles", "delete");
    if (!isSuperAdmin) {
      return c.json({ success: false, error: "Solo superadmin puede eliminar roles" }, 403);
    }

    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    await roleService.deleteRole(id);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error al eliminar rol",
      },
      400,
    );
  }
});

/**
 * POST /roles/clone/:id - Clone a role with all its permissions
 */
adminRouter.post("/roles/clone/:id", async (c) => {
  try {
    const user = c.get("user");

    // Verificar si es superadmin
    const isSuperAdmin = user.userId === 1 ||
      await permissionService.userHasPermission(user.userId, "roles", "create");
    if (!isSuperAdmin) {
      return c.text("Solo superadmin puede clonar roles", 403);
    }

    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id)) {
      return c.text("ID inválido", 400);
    }

    const body = await c.req.parseBody();
    const newName = parseStringField(body.newName);
    const newDescription = parseNullableField(body.newDescription);

    if (!newName) {
      return c.text("El nombre del nuevo rol es obligatorio", 400);
    }

    await roleService.cloneRole(id, newName, newDescription || undefined);

    return c.redirect(`${env.ADMIN_PATH}/roles`);
  } catch (error: any) {
    console.error("Error cloning role:", error);
    const message = error instanceof Error ? error.message : "Error al clonar rol";
    return c.text(message, 400);
  }
});

adminRouter.post("/roles/:id/permissions", async (c) => {
  try {
    const user = c.get("user");

    // Verificar si es superadmin
    const isSuperAdmin = user.userId === 1 ||
      await permissionService.userHasPermission(user.userId, "role_permissions", "update");
    if (!isSuperAdmin) {
      return c.text("Solo superadmin puede asignar permisos a roles", 403);
    }

    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id)) {
      return c.text("ID inválido", 400);
    }

    const formData = await c.req.formData();
    const permissionIds = formData.getAll("permissionIds[]")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value)) as number[];

    await roleService.assignPermissionsToRole(id, permissionIds);

    return c.redirect(`${env.ADMIN_PATH}/roles`);
  } catch (error: any) {
    console.error("Error assigning permissions:", error);
    return c.text("Error al asignar permisos al rol", 400);
  }
});

/**
 * GET /permissions - Permissions management with grouping and stats
 */
adminRouter.get("/permissions", async (c) => {
  try {
    const user = c.get("user");

    // Verificar permiso para ver permisos
    const hasPermission = await permissionService.userHasPermission(user.userId, "permissions", "read");
    if (!hasPermission) {
      return c.html(`<h1>Acceso Denegado</h1><p>No tienes permiso para ver permisos</p>`, 403);
    }

    const [permissionsData, permissionsByModule, modules, stats, userPermissions] = await Promise.all([
      permissionService.getAllPermissions(),
      permissionService.getPermissionsGroupedByModule(),
      permissionService.getModules(),
      permissionService.getPermissionStats(),
      permissionService.getUserPermissions(user.userId),
    ]);

    const sortedPermissions = permissionsData.sort((a, b) => {
      const moduleCompare = a.module.localeCompare(b.module, "es-ES");
      if (moduleCompare !== 0) return moduleCompare;
      return a.action.localeCompare(b.action, "es-ES");
    });

    return c.html(
      PermissionsPageImproved({
        user: { name: user.name || user.email, email: user.email },
        permissions: sortedPermissions,
        permissionsByModule,
        modules,
        stats,
        userPermissions: userPermissions.map(p => `${p.module}:${p.action}`),
      })
    );
  } catch (error: any) {
    console.error("Error loading permissions:", error);
    return c.text("Error al cargar permisos", 500);
  }
});

adminRouter.post("/permissions/create", async (c) => {
  try {
    const user = c.get("user");

    // Verificar si es superadmin
    const isSuperAdmin = user.userId === 1 ||
      await permissionService.userHasPermission(user.userId, "permissions", "create");
    if (!isSuperAdmin) {
      return c.text("Solo superadmin puede crear permisos", 403);
    }

    const body = await c.req.parseBody();
    const moduleName = parseStringField(body.module);
    const actionName = parseStringField(body.action);
    const description = parseNullableField(body.description) ?? null;

    if (!moduleName || !actionName) {
      return c.text("Módulo y acción son obligatorios", 400);
    }

    await permissionService.createPermission({
      module: moduleName,
      action: actionName,
      description,
    });

    return c.redirect(`${env.ADMIN_PATH}/permissions`);
  } catch (error: any) {
    console.error("Error creating permission:", error);
    const message = error instanceof Error
      ? error.message
      : "Error al crear permiso";
    return c.text(message, 400);
  }
});

adminRouter.post("/permissions/edit/:id", async (c) => {
  try {
    const user = c.get("user");

    // Verificar si es superadmin
    const isSuperAdmin = user.userId === 1 ||
      await permissionService.userHasPermission(user.userId, "permissions", "update");
    if (!isSuperAdmin) {
      return c.text("Solo superadmin puede actualizar permisos", 403);
    }

    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id)) {
      return c.text("ID inválido", 400);
    }

    const body = await c.req.parseBody();
    const moduleName = parseStringField(body.module);
    const actionName = parseStringField(body.action);
    const description = parseNullableField(body.description) ?? null;

    if (!moduleName || !actionName) {
      return c.text("Módulo y acción son obligatorios", 400);
    }

    await permissionService.updatePermission(id, {
      module: moduleName,
      action: actionName,
      description,
    });

    return c.redirect(`${env.ADMIN_PATH}/permissions`);
  } catch (error: any) {
    console.error("Error updating permission:", error);
    const message = error instanceof Error
      ? error.message
      : "Error al actualizar permiso";
    return c.text(message, 400);
  }
});

adminRouter.post("/permissions/delete/:id", async (c) => {
  try {
    const user = c.get("user");

    // Verificar si es superadmin
    const isSuperAdmin = user.userId === 1 ||
      await permissionService.userHasPermission(user.userId, "permissions", "delete");
    if (!isSuperAdmin) {
      return c.json({ success: false, message: "Solo superadmin puede eliminar permisos" }, 403);
    }

    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id)) {
      return c.json({ success: false, message: "ID inválido" }, 400);
    }

    await permissionService.deletePermission(id);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting permission:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error
          ? error.message
          : "Error al eliminar permiso",
      },
      400,
    );
  }
});

/**
 * GET /settings - Settings page
 */
adminRouter.get("/settings", async (c) => {
  try {
    const user = c.get("user");
    const requestedCategory = (c.req.query("category") || "general")
      .toLowerCase();
    const settingsData = await db.query.settings.findMany();

    const storedValues: Record<string, unknown> = {};
    for (const setting of settingsData) {
      storedValues[setting.key] = parseSettingValueForAdmin(setting.value);
    }

    const resolvedSettings: Record<string, unknown> = {};
    const categories = SETTINGS_DEFINITIONS.map((category) => {
      const fields = category.fields.map((field) => {
        const defaultValue = resolveFieldDefault(field);
        const storedValue = storedValues[field.key];
        const value = storedValue !== undefined ? storedValue : defaultValue;

        if (value !== undefined) {
          resolvedSettings[field.key] = value;
        } else if (!(field.key in resolvedSettings)) {
          resolvedSettings[field.key] = null;
        }

        return {
          ...field,
          defaultValue,
        };
      });

      const hasValue = fields.some((field) => {
        const value = resolvedSettings[field.key];
        if (value === undefined || value === null) {
          return false;
        }
        if (typeof value === "string") {
          return value.trim().length > 0;
        }
        return true;
      });

      return {
        id: category.id,
        label: category.label,
        fields,
        available: hasValue || fields.length > 0,
      };
    });

    for (const [key, value] of Object.entries(storedValues)) {
      if (!(key in resolvedSettings)) {
        resolvedSettings[key] = value;
      }
    }

    const validCategoryIds = new Set(categories.map((category) => category.id));
    const fallbackCategory = categories.find((category) =>
      category.available
    )?.id ??
      categories[0]?.id ??
      "general";
    const selectedCategory = validCategoryIds.has(requestedCategory)
      ? requestedCategory
      : fallbackCategory;

    return c.html(SettingsPage({
      user: { name: user.name || user.email, email: user.email },
      settings: resolvedSettings,
      categories,
      selectedCategory,
    }));
  } catch (error: any) {
    return c.text("Error al cargar configuración", 500);
  }
});

adminRouter.post("/settings/save", async (c) => {
  try {
    const body = await c.req.parseBody();

    for (const [key, value] of Object.entries(body)) {
      if (key === "settings_category") {
        continue;
      }

      const fieldDefinition = SETTINGS_FIELD_MAP.get(key);
      if (!fieldDefinition) {
        continue;
      }

      const rawValue = Array.isArray(value) ? value[value.length - 1] : value;

      if (rawValue instanceof File) {
        continue;
      }

      let normalizedValue: unknown = rawValue;
      const fieldType = fieldDefinition.type ?? "text";

      switch (fieldType) {
        case "boolean": {
          const stringValue = typeof rawValue === "string"
            ? rawValue
            : `${rawValue ?? ""}`;
          normalizedValue = stringValue === "true" || stringValue === "1" ||
            stringValue === "on";
          break;
        }
        case "number": {
          const stringValue = typeof rawValue === "string"
            ? rawValue.trim()
            : `${rawValue ?? ""}`.trim();
          if (stringValue === "") {
            normalizedValue = null;
          } else {
            const parsedValue = Number(stringValue);
            normalizedValue = Number.isNaN(parsedValue) ? null : parsedValue;
          }
          break;
        }
        case "textarea": {
          const stringValue = typeof rawValue === "string"
            ? rawValue
            : `${rawValue ?? ""}`;
          normalizedValue = stringValue.trim().length > 0 ? stringValue : null;
          break;
        }
        case "password": {
          const stringValue = typeof rawValue === "string"
            ? rawValue.trim()
            : "";
          if (stringValue.length === 0) {
            continue;
          }
          normalizedValue = stringValue;
          break;
        }
        case "select":
        case "email":
        case "url":
        case "text": {
          const stringValue = typeof rawValue === "string"
            ? rawValue.trim()
            : `${rawValue ?? ""}`.trim();
          normalizedValue = stringValue.length > 0 ? stringValue : null;
          break;
        }
        default: {
          if (typeof rawValue === "string") {
            const trimmed = rawValue.trim();
            normalizedValue = trimmed.length > 0 ? trimmed : null;
          } else {
            normalizedValue = rawValue ?? null;
          }
        }
      }

      await updateSettingService(key, normalizedValue);
    }

    let redirectCategory: string | undefined;
    const rawCategory = (body as Record<string, any>).settings_category;
    if (typeof rawCategory === "string") {
      redirectCategory = rawCategory;
    } else if (Array.isArray(rawCategory)) {
      redirectCategory = rawCategory[0];
    }

    const redirectUrl = redirectCategory
      ? `${env.ADMIN_PATH}/settings?category=${redirectCategory}`
      : `${env.ADMIN_PATH}/settings`;

    return c.redirect(redirectUrl);
  } catch (error: any) {
    return c.text("Error al guardar configuración", 500);
  }
});

/**
 * POST /settings/clear-cache - Clear application cache
 */
adminRouter.post("/settings/clear-cache", async (c) => {
  try {
    // TODO: Implement actual cache clearing (Redis, memory cache, etc.)
    // For now, just return success
    console.log("Cache cleared (placeholder)");
    return c.json({ success: true, message: "Cache limpiado exitosamente" });
  } catch (error: any) {
    console.error("Error clearing cache:", error);
    return c.json({ success: false, message: "Error al limpiar cache" }, 500);
  }
});

/**
 * GET /settings/export - Export settings as JSON
 */
adminRouter.get("/settings/export", async (c) => {
  try {
    const settingsData = await db.query.settings.findMany();

    // Convert to simple key-value object
    const settingsExport: Record<string, any> = {};
    settingsData.forEach((s) => {
      settingsExport[s.key] = {
        value: s.value,
        category: s.category,
        autoload: s.autoload,
      };
    });

    // Set headers for file download
    c.header("Content-Type", "application/json");
    c.header(
      "Content-Disposition",
      `attachment; filename="lexcms-settings-${Date.now()}.json"`,
    );

    return c.json(settingsExport, 200);
  } catch (error: any) {
    console.error("Error exporting settings:", error);
    return c.text("Error al exportar configuración", 500);
  }
});

/**
 * GET /plugins - Redirect to installed plugins
 */
adminRouter.get("/plugins", async (c) => {
  return c.redirect("/admincp/plugins/installed");
});

/**
 * GET /plugins/installed - Installed plugins page
 */
adminRouter.get("/plugins/installed", async (c) => {
  try {
    const user = c.get("user");

    const [installedPlugins, stats] = await Promise.all([
      pluginService.getAllPlugins(),
      pluginService.getPluginStats(),
    ]);

    // Map installed plugins to the format expected by the page
    const formattedInstalledPlugins = installedPlugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      displayName: plugin.name,
      description: undefined,
      author: undefined,
      category: undefined,
      status: plugin.isActive ? "active" : "inactive",
      isInstalled: true,
    }));

    // Load plugin details for installed plugins
    const detailedPlugins = await Promise.all(
      formattedInstalledPlugins.map(async (plugin) => {
        try {
          const details = await pluginService.getPluginDetails(plugin.name);
          if (details && details.manifest) {
            return {
              ...plugin,
              displayName: details.manifest.displayName || plugin.name,
              description: details.manifest.description,
              author: details.manifest.author,
              category: details.manifest.category,
            };
          }
        } catch (error) {
          console.error(`Error loading details for ${plugin.name}:`, error);
        }
        return plugin;
      }),
    );

    return c.html(
      PluginsInstalledPage({
        user: {
          name: user.name || user.email,
          email: user.email,
        },
        plugins: detailedPlugins as any[],
        stats,
      }),
    );
  } catch (error: any) {
    console.error("Error loading installed plugins page:", error);
    return c.text("Error al cargar plugins instalados", 500);
  }
});

/**
 * GET /plugins/available - Available plugins page
 */
adminRouter.get("/plugins/available", async (c) => {
  try {
    const user = c.get("user");

    const [availablePlugins, stats] = await Promise.all([
      pluginService.getAvailablePlugins(),
      pluginService.getPluginStats(),
    ]);

    // Load manifests for available plugins
    const pluginsWithManifest = await Promise.all(
      availablePlugins.map(async (pluginName) => {
        try {
          const manifest = await pluginService.getPluginManifest(pluginName);
          return {
            name: pluginName,
            displayName: manifest.displayName,
            description: manifest.description,
            version: manifest.version,
            author: manifest.author,
            category: manifest.category,
            tags: manifest.tags,
          };
        } catch (error) {
          console.error(`Error loading manifest for ${pluginName}:`, error);
          return {
            name: pluginName,
            displayName: pluginName,
            description: "Error loading plugin information",
            version: "unknown",
            author: "unknown",
            category: undefined,
            tags: [],
          };
        }
      }),
    );

    return c.html(
      PluginsAvailablePage({
        user: {
          name: user.name || user.email,
          email: user.email,
        },
        plugins: pluginsWithManifest as any[],
        stats,
      }),
    );
  } catch (error: any) {
    console.error("Error loading available plugins page:", error);
    return c.text("Error al cargar plugins disponibles", 500);
  }
});

/**
 * GET /plugins/marketplace - Marketplace plugins page
 */
adminRouter.get("/plugins/marketplace", async (c) => {
  try {
    const user = c.get("user");

    // Load marketplace plugins from JSON file
    const marketplaceData = await Deno.readTextFile(
      "./src/data/marketplace-plugins.json",
    );
    const marketplacePlugins = JSON.parse(marketplaceData);

    // Get installed plugin names
    const installedPlugins = await pluginService.getAllPlugins();
    const installedPluginNames = installedPlugins.map((p) => p.name);

    // Get stats
    const stats = await pluginService.getPluginStats();

    // Extract unique categories
    const categories = [
      ...new Set(marketplacePlugins.map((p: any) => p.category)),
    ].sort();

    return c.html(
      PluginsMarketplacePage({
        user: {
          name: user.name || user.email,
          email: user.email,
        },
        plugins: marketplacePlugins,
        stats,
        categories,
        installedPluginNames,
      }),
    );
  } catch (error: any) {
    console.error("Error loading marketplace page:", error);
    return c.text("Error al cargar marketplace", 500);
  }
});

/**
 * GET /plugins/:pluginName/:panelPath* - Dynamic plugin admin panel routes
 */
adminRouter.get("/plugins/:pluginName/*", async (c) => {
  try {
    const user = c.get("user");
    const pluginName = c.req.param("pluginName");
    const fullPath = c.req.path;

    // Import AdminPanelRegistry
    const { AdminPanelRegistry } = await import("../lib/plugin-system/index.ts");
    const { pluginLoader } = await import("../lib/plugin-system/PluginLoader.ts");

    // Find the panel by matching the full path
    const panel = AdminPanelRegistry.getPanelByPath(fullPath);

    if (!panel) {
      return c.text(`Panel no encontrado: ${fullPath}`, 404);
    }

    // Check if plugin is active
    const plugin = pluginLoader.getPlugin(pluginName);
    if (!plugin || plugin.status !== 'active') {
      return c.text(`El plugin "${pluginName}" no está activo`, 403);
    }

    // Check user permissions if required
    if (panel.requiredPermissions && panel.requiredPermissions.length > 0) {
      // TODO: Implement permission checking
      // For now, we'll allow all authenticated users
    }

    // Prepare context for the panel component
    const context = {
      user: {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: user.role || 'admin',
      },
      query: c.req.query(),
      pluginAPI: plugin.instance,
      settings: plugin.settings || {},
      request: c.req,
    };

    // Render the panel component
    const content = await panel.component(context);

    return c.html(content);
  } catch (error: any) {
    console.error("Error rendering plugin panel:", error);
    return c.text(`Error al cargar el panel: ${error.message}`, 500);
  }
});

/**
 * Comments Management
 * GET /comments - Comments management page
 * Allows filtering and moderating comments
 */

// Comments page
adminRouter.get("/comments", async (c) => {
  try {
    const user = c.get("user");
    const filter = c.req.query("filter") || "all";
    const page = parseInt(c.req.query("page") || "1");
    const limit = 50;
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: any[] = [];

    if (filter === "pending") {
      conditions.push(eq(comments.status, "pending"));
    } else if (filter === "approved") {
      conditions.push(eq(comments.status, "approved"));
    } else if (filter === "spam") {
      conditions.push(eq(comments.status, "spam"));
    } else if (filter === "deleted") {
      conditions.push(isNotNull(comments.deletedAt));
    }

    // Fetch comments with content information
    const commentsData = await db
      .select({
        id: comments.id,
        contentId: comments.contentId,
        contentTitle: content.title,
        contentSlug: content.slug,
        parentId: comments.parentId,
        authorId: comments.authorId,
        authorName: comments.authorName,
        authorEmail: comments.authorEmail,
        authorWebsite: comments.authorWebsite,
        body: comments.body,
        bodyCensored: comments.bodyCensored,
        status: comments.status,
        ipAddress: comments.ipAddress,
        userAgent: comments.userAgent,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })
      .from(comments)
      .leftJoin(content, eq(comments.contentId, content.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    // Get stats
    const [statsData] = await db
      .select({
        total: count(),
      })
      .from(comments);

    const [approvedCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.status, "approved"));

    const [pendingCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.status, "pending"));

    const [spamCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.status, "spam"));

    const [deletedCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(isNotNull(comments.deletedAt));

    const stats = {
      total: statsData.total,
      approved: approvedCount.count,
      pending: pendingCount.count,
      spam: spamCount.count,
      deleted: deletedCount.count,
    };

    const totalPages = Math.ceil(stats.total / limit);

    // Format comments
    const formattedComments = commentsData.map((comment) => ({
      id: comment.id,
      contentId: comment.contentId,
      contentTitle: comment.contentTitle,
      contentSlug: comment.contentSlug,
      parentId: comment.parentId,
      author: {
        id: comment.authorId,
        name: comment.authorName || "Anónimo",
        email: comment.authorEmail || "",
        website: comment.authorWebsite,
      },
      body: comment.body,
      bodyCensored: comment.bodyCensored,
      status: comment.status as "approved" | "spam" | "deleted" | "pending",
      ipAddress: comment.ipAddress,
      userAgent: comment.userAgent,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    return c.html(
      CommentsPage({
        user: {
          name: user.name || user.email,
          email: user.email,
        },
        comments: formattedComments,
        stats,
        filter,
        page,
        totalPages,
      }),
    );
  } catch (error: any) {
    console.error("Error loading comments page:", error);
    return c.text("Error al cargar página de comentarios", 500);
  }
});

/**
 * Auto-Moderation Management
 * GET /auto-moderation - Auto-moderation configuration page
 * POST /auto-moderation/update - Update plugin configuration
 * POST /auto-moderation/verify-akismet - Verify Akismet API key
 * POST /auto-moderation/reset-stats - Reset plugin statistics
 */

// Auto-moderation page
adminRouter.get("/auto-moderation", async (c) => {
  try {
    const user = c.get("user");
    const { getAutoModeration } = await import("../../plugins/auto-moderation/index.ts");
    const plugin = getAutoModeration();

    if (!plugin) {
      return c.text("Auto-moderation plugin not initialized", 500);
    }

    const config = plugin.getConfig();
    const stats = plugin.getStats();

    // Verify Akismet if configured
    let akismetVerified: boolean | undefined = undefined;
    if (config.services.akismet) {
      try {
        akismetVerified = await plugin.verifyAkismetKey();
      } catch (error) {
        console.error('Error verifying Akismet:', error);
        akismetVerified = false;
      }
    }

    const { AutoModerationPage } = await import("../admin/pages/AutoModerationPage.tsx");

    return c.html(
      AutoModerationPage({
        user: {
          name: user.name || user.email,
          email: user.email,
        },
        config: {
          enabled: config.enabled,
          strategy: config.strategy,
          hasAkismet: !!config.services.akismet,
          akismetVerified,
          threshold: config.localDetector.threshold,
          autoApprove: config.actions.autoApprove,
          autoApproveThreshold: config.actions.autoApproveThreshold,
          autoMarkSpam: config.actions.autoMarkSpam,
          autoMarkSpamThreshold: config.actions.autoMarkSpamThreshold,
          learningEnabled: config.learning.enabled,
          sendFeedback: config.learning.sendFeedback,
        },
        stats,
      }),
    );
  } catch (error: any) {
    console.error("Error loading auto-moderation page:", error);
    return c.text("Error al cargar página de auto-moderación", 500);
  }
});

// Update auto-moderation configuration
adminRouter.post("/auto-moderation/update", async (c) => {
  try {
    const formData = await c.req.formData();
    const { getAutoModeration } = await import("../../plugins/auto-moderation/index.ts");
    const plugin = getAutoModeration();

    if (!plugin) {
      return c.json({ error: "Auto-moderation plugin not initialized" }, 500);
    }

    // Parse form data
    const newConfig: any = {
      enabled: formData.get("enabled") === "on",
      strategy: formData.get("strategy") as any,
    };

    const threshold = formData.get("threshold");
    if (threshold) {
      newConfig.localDetector = {
        threshold: parseInt(threshold as string),
      };
    }

    newConfig.actions = {
      autoApprove: formData.get("autoApprove") === "on",
      autoApproveThreshold: parseInt(formData.get("autoApproveThreshold") as string || "20"),
      autoMarkSpam: formData.get("autoMarkSpam") === "on",
      autoMarkSpamThreshold: parseInt(formData.get("autoMarkSpamThreshold") as string || "80"),
      sendToModeration: true,
    };

    newConfig.learning = {
      enabled: formData.get("learningEnabled") === "on",
      sendFeedback: formData.get("sendFeedback") === "on",
      updateBlacklist: true,
      updateWhitelist: true,
    };

    // Update configuration
    plugin.updateConfig(newConfig);

    return c.redirect("/admin/auto-moderation");
  } catch (error: any) {
    console.error("Error updating auto-moderation config:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Verify Akismet API key
adminRouter.post("/auto-moderation/verify-akismet", async (c) => {
  try {
    const { getAutoModeration } = await import("../../plugins/auto-moderation/index.ts");
    const plugin = getAutoModeration();

    if (!plugin) {
      return c.json({ error: "Auto-moderation plugin not initialized" }, 500);
    }

    const verified = await plugin.verifyAkismetKey();
    return c.json({ verified });
  } catch (error: any) {
    console.error("Error verifying Akismet:", error);
    return c.json({ error: error.message, verified: false }, 500);
  }
});

// Reset statistics
adminRouter.post("/auto-moderation/reset-stats", async (c) => {
  try {
    const { getAutoModeration } = await import("../../plugins/auto-moderation/index.ts");
    const plugin = getAutoModeration();

    if (!plugin) {
      return c.json({ error: "Auto-moderation plugin not initialized" }, 500);
    }

    plugin.resetStats();
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error resetting stats:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Backups Management
 * GET /backups - Backups management page
 * POST /api/backups - Create a new backup
 * DELETE /api/backups/:id - Delete a backup
 * GET /api/backups/:id/download - Download a backup
 */

// Backups page
adminRouter.get("/backups", async (c) => {
  try {
    const user = c.get("user");

    const [backups, stats] = await Promise.all([
      backupManager.getBackups({ limit: 100 }),
      backupManager.getStats(),
    ]);

    return c.html(
      BackupsPage({
        user: {
          name: user.name || user.email,
          email: user.email,
        },
        backups: backups as any[],
        stats: stats as any,
      }),
    );
  } catch (error: any) {
    console.error("Error loading backups page:", error);
    return c.text("Error al cargar página de backups", 500);
  }
});

// Create backup API
adminRouter.post("/api/backups", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const backupId = await backupManager.createBackup(
      {
        type: body.type || "full",
        includeMedia: body.includeMedia ?? true,
        includeDatabase: body.includeDatabase ?? true,
        includeConfig: body.includeConfig ?? true,
        compression: body.compression ?? true,
        notifyUser: true,
      },
      user.userId,
    );

    return c.json({ success: true, backupId });
  } catch (error: any) {
    console.error("Error creating backup:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete backup API
adminRouter.delete("/api/backups/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "Invalid backup ID" }, 400);
    }

    await backupManager.deleteBackup(id);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting backup:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Download backup API
adminRouter.get("/api/backups/:id/download", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.text("Invalid backup ID", 400);
    }

    const backup = await backupManager.getBackupById(id);

    if (!backup) {
      return c.text("Backup not found", 404);
    }

    if (backup.status !== "completed") {
      return c.text("Backup is not completed yet", 400);
    }

    // Read file and send it
    const file = await Deno.readFile(backup.storagePath);

    c.header("Content-Type", "application/gzip");
    c.header("Content-Disposition", `attachment; filename="${backup.filename}"`);
    c.header("Content-Length", file.length.toString());

    return c.body(file);
  } catch (error: any) {
    console.error("Error downloading backup:", error);
    return c.text("Error downloading backup: " + error.message, 500);
  }
});

/**
 * System Updates Management
 * GET /system-updates - System updates page
 */

// System updates page
adminRouter.get("/system-updates", async (c) => {
  try {
    const user = c.get("user");

    // Check for updates
    const checkResult = await systemUpdatesService.checkForUpdates();

    // Get configuration
    const config = getUpdateConfig();

    return c.html(
      SystemUpdatesPage({
        user: {
          name: user.name || user.email,
          email: user.email,
        },
        currentVersion: SYSTEM_VERSION,
        latestVersion: checkResult.latestVersion,
        updates: checkResult.updates,
        news: checkResult.news,
        config,
        lastChecked: checkResult.lastChecked,
      }),
    );
  } catch (error: any) {
    console.error("Error loading system updates page:", error);
    return c.text("Error al cargar página de actualizaciones", 500);
  }
});

export default adminRouter;
