// @ts-nocheck
/**
 * OpenAPI Documentation Generator
 * Generates OpenAPI 3.0 specification for the public REST API
 */

import type { OpenAPISpec } from "./types.ts";
import { env } from "../../config/env.ts";

export class OpenAPIGenerator {
  private static instance: OpenAPIGenerator;

  private constructor() { }

  static getInstance(): OpenAPIGenerator {
    if (!OpenAPIGenerator.instance) {
      OpenAPIGenerator.instance = new OpenAPIGenerator();
    }
    return OpenAPIGenerator.instance;
  }

  /**
   * Generate complete OpenAPI specification
   */
  generateSpec(): OpenAPISpec {
    return {
      openapi: "3.0.0",
      info: {
        title: "LexCMS Public REST API",
        version: "1.0.0",
        description:
          "Public REST API for accessing LexCMS content, categories, tags, and more. Requires an API key for authentication.",
        contact: {
          name: "LexCMS Support",
          email: "support@lexcms.com",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url: `${env.BASE_URL}/api/v1`,
          description: "Production server",
        },
      ],
      paths: {
        "/content": {
          get: {
            summary: "List content",
            description: "Get a paginated list of published content",
            operationId: "listContent",
            tags: ["Content"],
            parameters: [
              {
                name: "page",
                in: "query",
                description: "Page number",
                schema: { type: "integer", default: 1 },
              },
              {
                name: "limit",
                in: "query",
                description: "Items per page",
                schema: { type: "integer", default: 20, maximum: 100 },
              },
              {
                name: "status",
                in: "query",
                description: "Filter by status",
                schema: { type: "string", enum: ["published", "draft"] },
              },
              {
                name: "category",
                in: "query",
                description: "Filter by category slug",
                schema: { type: "string" },
              },
              {
                name: "tag",
                in: "query",
                description: "Filter by tag slug",
                schema: { type: "string" },
              },
              {
                name: "search",
                in: "query",
                description: "Search in title and body",
                schema: { type: "string" },
              },
            ],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: {
                          type: "object",
                          properties: {
                            content: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Content" },
                            },
                            pagination: { $ref: "#/components/schemas/Pagination" },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "401": { $ref: "#/components/responses/Unauthorized" },
              "429": { $ref: "#/components/responses/RateLimited" },
            },
            security: [{ ApiKeyAuth: [] }],
          },
        },
        "/content/{slug}": {
          get: {
            summary: "Get content by slug",
            description: "Get a single piece of content by its URL slug",
            operationId: "getContentBySlug",
            tags: ["Content"],
            parameters: [
              {
                name: "slug",
                in: "path",
                required: true,
                description: "Content slug",
                schema: { type: "string" },
              },
            ],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: { $ref: "#/components/schemas/Content" },
                      },
                    },
                  },
                },
              },
              "404": { $ref: "#/components/responses/NotFound" },
              "401": { $ref: "#/components/responses/Unauthorized" },
            },
            security: [{ ApiKeyAuth: [] }],
          },
        },
        "/categories": {
          get: {
            summary: "List categories",
            description: "Get all categories",
            operationId: "listCategories",
            tags: ["Categories"],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Category" },
                        },
                      },
                    },
                  },
                },
              },
              "401": { $ref: "#/components/responses/Unauthorized" },
            },
            security: [{ ApiKeyAuth: [] }],
          },
        },
        "/tags": {
          get: {
            summary: "List tags",
            description: "Get all tags",
            operationId: "listTags",
            tags: ["Tags"],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Tag" },
                        },
                      },
                    },
                  },
                },
              },
              "401": { $ref: "#/components/responses/Unauthorized" },
            },
            security: [{ ApiKeyAuth: [] }],
          },
        },
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "API Key",
            description:
              "API key authentication. Use 'Bearer <your-api-key>' in the Authorization header or add '?api_key=<your-api-key>' to the URL.",
          },
        },
        schemas: {
          Content: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              title: { type: "string", example: "My First Post" },
              slug: { type: "string", example: "my-first-post" },
              excerpt: { type: "string", example: "This is a brief summary..." },
              body: { type: "string", example: "Full content here..." },
              status: { type: "string", enum: ["draft", "published"], example: "published" },
              featuredImage: { type: "string", example: "https://example.com/image.jpg", nullable: true },
              publishedAt: { type: "string", format: "date-time", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time", nullable: true },
              authorId: { type: "integer", example: 1 },
              contentTypeId: { type: "integer", example: 1 },
              metaTitle: { type: "string", nullable: true },
              metaDescription: { type: "string", nullable: true },
              metaKeywords: { type: "string", nullable: true },
            },
          },
          Category: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "Technology" },
              slug: { type: "string", example: "technology" },
              description: { type: "string", nullable: true },
              parentId: { type: "integer", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time", nullable: true },
            },
          },
          Tag: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "javascript" },
              slug: { type: "string", example: "javascript" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          Pagination: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 20 },
              total: { type: "integer", example: 100 },
              totalPages: { type: "integer", example: 5 },
            },
          },
          Error: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Error message" },
              message: { type: "string", example: "Detailed error description" },
            },
          },
        },
        responses: {
          Unauthorized: {
            description: "Unauthorized - Invalid or missing API key",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          NotFound: {
            description: "Resource not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          RateLimited: {
            description: "Rate limit exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      tags: [
        {
          name: "Content",
          description: "Content management endpoints",
        },
        {
          name: "Categories",
          description: "Category endpoints",
        },
        {
          name: "Tags",
          description: "Tag endpoints",
        },
      ],
    };
  }

  /**
   * Generate Swagger UI HTML
   */
  generateSwaggerHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LexCMS API Documentation</title>
  <link rel="stylesheet" href="${env.ADMIN_PATH}/assets/css/vendor/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${env.ADMIN_PATH}/assets/js/vendor/swagger-ui-bundle.js"></script>
  <script src="${env.ADMIN_PATH}/assets/js/vendor/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '${env.BASE_URL}/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  }
}

export const openAPIGenerator = OpenAPIGenerator.getInstance();
