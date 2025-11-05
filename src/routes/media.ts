import { Hono } from "hono";
import * as mediaController from "../controllers/mediaController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";

const media = new Hono();

// Rutas públicas para servir archivos (relativas a /uploads)
media.get("/serve/uploads/:year/:month/:file", mediaController.serveMedia);
media.get("/serve/*", mediaController.serveMedia);
// Ruta directa: /uploads/:year/:month/:file
media.get("/:year/:month/:file", mediaController.serveMedia);

// Rutas protegidas
media.use("*", authMiddleware);

// Upload de media (requiere autenticación)
media.post("/", requirePermission("media", "create"), mediaController.uploadMedia);

// Listar media
media.get("/", requirePermission("media", "read"), mediaController.listMedia);

// Ver media por ID
media.get("/:id", requirePermission("media", "read"), mediaController.getMediaById);

// Actualizar SEO
media.patch("/:id/seo", requirePermission("media", "update"), mediaController.updateMediaSeo);

// Eliminar media
media.delete("/:id", requirePermission("media", "delete"), mediaController.deleteMedia);

export default media;
