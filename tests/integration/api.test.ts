import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { describe, it, beforeAll } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { app } from "../../src/app.ts";
import { db } from "../../src/config/db.ts";
import {
  roles,
  users,
  rolePermissions,
  permissions,
  contentMeta,
  contentSeo,
  contentTags,
  contentCategories,
  content,
  tags,
  categories,
  contentTypes,
  mediaSizes,
  mediaSeo,
  media,
} from "../../src/db/schema.ts";
import { eq } from "drizzle-orm";

const API_PREFIX = "/api";

function resolveApiPath(path: string): string {
  if (path.startsWith("/")) {
    return `${API_PREFIX}${path}`;
  }
  return `${API_PREFIX}/${path}`;
}

async function apiRequest(path: string, init?: RequestInit) {
  return await app.request(resolveApiPath(path), init);
}

function withAuthHeaders(
  token: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function promoteToSuperAdmin(userId: number) {
  let superAdminRole = await db.query.roles.findFirst({
    where: eq(roles.name, "superadmin"),
  });

  if (!superAdminRole) {
    const [created] = await db
      .insert(roles)
      .values({
        name: "superadmin",
        description: "Full access role for integration tests",
      })
      .returning();
    superAdminRole = created;
  }

  await db
    .update(users)
    .set({ roleId: superAdminRole.id })
    .where(eq(users.id, userId));
}

async function resetDatabase() {
  await db.delete(rolePermissions);
  await db.delete(permissions);
  await db.delete(contentMeta);
  await db.delete(contentSeo);
  await db.delete(contentTags);
  await db.delete(contentCategories);
  await db.delete(content);
  await db.delete(tags);
  await db.delete(categories);
  await db.delete(contentTypes);
  await db.delete(mediaSizes);
  await db.delete(mediaSeo);
  await db.delete(media);
  await db.delete(users);
  await db.delete(roles);
}

describe("API Integration Tests", () => {
  let authToken: string;
  let userId: number;
  let contentTypeId: number;
  let categoryId: number;
  let tagId: number;
  let contentId: number;
  let mediaId: number;

  beforeAll(async () => {
    await resetDatabase();

    const res = await apiRequest("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `integration-test-${Date.now()}@test.com`,
        password: "SecurePass123!",
        name: "Integration Test User",
      }),
    });

    assertEquals(res.status, 201);
    const data = await res.json();
    assertExists(data.data);
    assertExists(data.data.token);
    authToken = data.data.token;
    userId = data.data.user.id;

    await promoteToSuperAdmin(userId);
  });

  describe("Complete Content Workflow", () => {
    it("should create a content type", async () => {
      const res = await apiRequest("/content-types", {
        method: "POST",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          name: `Test Type ${Date.now()}`,
          slug: `test-type-${Date.now()}`,
          description: "Integration test content type",
        }),
      });

      assertEquals(res.status, 201);
      const data = await res.json();
      assertExists(data.contentType.id);
      contentTypeId = data.contentType.id;
    });

    it("should create a category", async () => {
      const res = await apiRequest("/categories", {
        method: "POST",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          name: `Test Category ${Date.now()}`,
          slug: `test-category-${Date.now()}`,
          description: "Integration test category",
        }),
      });

      assertEquals(res.status, 201);
      const data = await res.json();
      assertExists(data.category.id);
      categoryId = data.category.id;
    });

    it("should create a tag", async () => {
      const res = await apiRequest("/tags", {
        method: "POST",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          name: `Test Tag ${Date.now()}`,
          slug: `test-tag-${Date.now()}`,
        }),
      });

      assertEquals(res.status, 201);
      const data = await res.json();
      assertExists(data.tag.id);
      tagId = data.tag.id;
    });

    it("should upload media file", async () => {
      // Crear un archivo de imagen de prueba (1x1 pixel PNG)
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82,
      ]);

      const formData = new FormData();
      const blob = new Blob([pngData], { type: "image/png" });
      formData.append("file", blob, "test-image.png");
      formData.append(
        "seo",
        JSON.stringify({
          alt: "Test image for integration",
          title: "Integration Test Image",
          focusKeyword: "test",
        })
      );

      const res = await apiRequest("/media", {
        method: "POST",
        headers: withAuthHeaders(authToken),
        body: formData,
      });

      assertEquals(res.status, 201);
      const data = await res.json();
      assertExists(data.media.media.id);
      mediaId = data.media.media.id;

      // Verificar que se generaron múltiples tamaños
      assertExists(data.media.sizes);
      assertEquals(Array.isArray(data.media.sizes), true);

      // Verificar que se guardó el SEO
      assertExists(data.media.seo);
      assertEquals(data.media.seo.alt, "Test image for integration");
    });

    it("should create content with all relationships", async () => {
      const res = await apiRequest("/content", {
        method: "POST",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          contentTypeId: contentTypeId,
          title: `Integration Test Content ${Date.now()}`,
          slug: `integration-test-${Date.now()}`,
          body: "This is a comprehensive integration test",
          status: "published",
          featuredImageId: mediaId,
          categoryIds: [categoryId],
          tagIds: [tagId],
        }),
      });

      assertEquals(res.status, 201);
      const data = await res.json();
      assertExists(data.content.id);
      contentId = data.content.id;

      // Verificar relaciones
      assertExists(data.content.contentType);
      assertEquals(data.content.contentType.id, contentTypeId);
    });

    it("should retrieve content with all relationships", async () => {
      const res = await apiRequest(`/content/${contentId}`, {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
      const data = await res.json();

      // Verificar contenido
      assertEquals(data.content.id, contentId);
      assertExists(data.content.title);

      // Verificar relaciones cargadas
      assertExists(data.content.contentType);
      assertEquals(data.content.contentType.id, contentTypeId);

      assertExists(data.content.featuredImage);
      assertEquals(data.content.featuredImage.id, mediaId);

      // Verificar categorías
      assertExists(data.content.categories);
      assertEquals(Array.isArray(data.content.categories), true);

      // Verificar tags
      assertExists(data.content.tags);
      assertEquals(Array.isArray(data.content.tags), true);
    });

    it("should update content SEO", async () => {
      const res = await apiRequest("/content-seo", {
        method: "POST",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          contentId: contentId,
          metaTitle: "SEO Title for Integration Test",
          metaDescription: "This is the meta description",
          focusKeyword: "integration",
          canonicalUrl: `http://example.com/integration-test-${Date.now()}`,
        }),
      });

      assertEquals(res.status, 201);
      const data = await res.json();
      assertExists(data.seo);
      assertEquals(data.seo.metaTitle, "SEO Title for Integration Test");
    });

    it("should retrieve content SEO", async () => {
      const res = await apiRequest(`/content-seo/${contentId}`, {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.seo);
      assertEquals(data.seo.focusKeyword, "integration");
    });

    it("should add content metadata", async () => {
      const res = await apiRequest("/content-meta", {
        method: "POST",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          contentId: contentId,
          key: "custom_field",
          value: "Custom Value",
          type: "string",
        }),
      });

      assertEquals(res.status, 201);
      const data = await res.json();
      assertExists(data.meta);
      assertEquals(data.meta.key, "custom_field");
    });

    it("should list content with filters", async () => {
      const res = await apiRequest("/content?status=published&limit=10", {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.content);
      assertEquals(Array.isArray(data.content), true);
    });

    it("should search content", async () => {
      const res = await apiRequest("/content/search?q=Integration", {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.results);
      assertEquals(Array.isArray(data.results), true);
    });
  });

  describe("Media Integration", () => {
    it("should update media SEO", async () => {
      const res = await apiRequest(`/media/${mediaId}/seo`, {
        method: "PATCH",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          alt: "Updated alt text",
          caption: "Updated caption",
          credits: "Integration Test",
        }),
      });

      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.media.seo);
      assertEquals(data.media.seo.alt, "Updated alt text");
    });

    it("should list media with filters", async () => {
      const res = await apiRequest("/media?type=image&limit=10", {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.media);
      assertEquals(Array.isArray(data.media), true);
    });

    it("should serve media file with correct headers", async () => {
      // Primero obtener la URL del archivo
      const mediaRes = await apiRequest(`/media/${mediaId}`, {
        headers: withAuthHeaders(authToken),
      });

      const mediaData = await mediaRes.json();
      const fileUrl = mediaData.media.media.url;

      // Extract the file path from the URL without creating a new URL object
      const pathStart = fileUrl.startsWith('/') ? 0 : fileUrl.indexOf('/', 8); // 8 is the index after 'http://'
      const path = pathStart >= 0 ? fileUrl.substring(pathStart) : fileUrl;
      const filePath = path.replace(/^\/+/, "");
      const fileRes = await app.request(`/api/media/serve/${filePath}`);

      assertEquals(fileRes.status, 200);

      // Verificar headers de cache
      const cacheControl = fileRes.headers.get("Cache-Control");
      assertExists(cacheControl);
      assertEquals(cacheControl?.includes("max-age"), true);

      // Verificar content-type
      const contentType = fileRes.headers.get("Content-Type");
      assertExists(contentType);
      assertEquals(contentType?.includes("image/"), true);
    });
  });

  describe("Taxonomies Integration", () => {
    it("should create category hierarchy", async () => {
      // Crear categoría padre
      const parentRes = await apiRequest("/categories", {
        method: "POST",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          name: `Parent Category ${Date.now()}`,
          slug: `parent-cat-${Date.now()}`,
        }),
      });

      const parentData = await parentRes.json();
      const parentId = parentData.category.id;

      // Crear categoría hija
      const childRes = await apiRequest("/categories", {
        method: "POST",
        headers: {
          ...withAuthHeaders(authToken, { "Content-Type": "application/json" }),
        },
        body: JSON.stringify({
          name: `Child Category ${Date.now()}`,
          slug: `child-cat-${Date.now()}`,
          parentId: parentId,
        }),
      });

      assertEquals(childRes.status, 201);
      const childData = await childRes.json();
      assertEquals(childData.category.parentId, parentId);
    });

    it("should get categories tree", async () => {
      const res = await apiRequest("/categories/tree", {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.tree);
      assertEquals(Array.isArray(data.tree), true);
    });

    it("should get content by category", async () => {
      const res = await apiRequest(`/categories/${categoryId}/content`, {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.content);
      assertEquals(Array.isArray(data.content), true);
    });

    it("should get content by tag", async () => {
      const res = await apiRequest(`/tags/${tagId}/content`, {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
      const data = await res.json();
      assertExists(data.content);
      assertEquals(Array.isArray(data.content), true);
    });
  });

  describe("Cleanup", () => {
    it("should delete content", async () => {
      const res = await apiRequest(`/content/${contentId}`, {
        method: "DELETE",
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
    });

    it("should verify content is deleted", async () => {
      const res = await apiRequest(`/content/${contentId}`, {
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 404);
    });

    it("should delete media", async () => {
      const res = await apiRequest(`/media/${mediaId}`, {
        method: "DELETE",
        headers: withAuthHeaders(authToken),
      });

      assertEquals(res.status, 200);
    });
  });
});
