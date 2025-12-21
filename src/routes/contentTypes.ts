import { Hono } from "hono";
import * as contentTypeController from "@/controllers/contentTypeController.ts";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission, requireSuperAdmin } from "@/middleware/permission.ts";

const contentTypes = new Hono();

// Todas las rutas requieren autenticación
contentTypes.use("*", authMiddleware);

// GET /content-types - Leer todos los tipos de contenido
contentTypes.get("/", requirePermission("content_types", "read"), contentTypeController.getAllContentTypes);

// GET /content-types/:id - Leer un tipo por ID
contentTypes.get("/:id", requirePermission("content_types", "read"), contentTypeController.getContentTypeById);

// GET /content-types/slug/:slug - Leer un tipo por slug
contentTypes.get("/slug/:slug", requirePermission("content_types", "read"), contentTypeController.getContentTypeBySlug);

// POST /content-types - Crear tipo de contenido (solo superadmin)
contentTypes.post("/", requireSuperAdmin(), contentTypeController.createContentType);

// PATCH /content-types/:id - Actualizar tipo (solo superadmin)
contentTypes.patch("/:id", requireSuperAdmin(), contentTypeController.updateContentType);

// DELETE /content-types/:id - Eliminar tipo (solo superadmin)
contentTypes.delete("/:id", requireSuperAdmin(), contentTypeController.deleteContentType);

export default contentTypes;
