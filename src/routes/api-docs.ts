/**
 * API Documentation Routes
 * Serves OpenAPI spec and Swagger UI
 */

import { Hono } from "hono";
import { openAPIGenerator } from "../lib/api/index.ts";

const apiDocs = new Hono();

/**
 * Get OpenAPI JSON specification
 * GET /api/docs/openapi.json
 */
apiDocs.get("/openapi.json", (c) => {
  const spec = openAPIGenerator.generateSpec();

  c.header("Content-Type", "application/json");
  c.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

  return c.json(spec);
});

/**
 * Serve Swagger UI
 * GET /api/docs
 */
apiDocs.get("/", (c) => {
  const html = openAPIGenerator.generateSwaggerHTML();

  c.header("Content-Type", "text/html");
  c.header("Cache-Control", "public, max-age=3600");

  return c.html(html);
});

export default apiDocs;
