import { Hono } from "hono";
import * as contentController from "../controllers/contentController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission, allowPublic } from "../middleware/permission.ts";

const contents = new Hono();

// Rutas públicas (para leer contenido publicado)
contents.get("/", allowPublic("content", "read"), contentController.getAllContent);
contents.get("/search", allowPublic("content", "read"), contentController.searchContent);
contents.get("/slug/:slug", allowPublic("content", "read"), contentController.getContentBySlug);
contents.get("/:id", allowPublic("content", "read"), contentController.getContentById);

// Rutas públicas para páginas hijas
contents.get("/:id/children", allowPublic("content", "read"), contentController.getChildPages);

// Rutas protegidas
contents.use("*", authMiddleware);

// Utilidad para generar slug
contents.post("/generate-slug", contentController.generateSlug);

// CRUD de contenido
contents.post("/", requirePermission("content", "create"), contentController.createContent);
contents.patch("/:id", requirePermission("content", "update"), contentController.updateContent);
contents.delete("/:id", requirePermission("content", "delete"), contentController.deleteContent);

// Rutas de revisiones
contents.get("/:id/revisions", requirePermission("content", "read"), contentController.getContentRevisions);
contents.get("/:id/revisions/:revisionId", requirePermission("content", "read"), contentController.getRevisionById);
contents.post("/:id/revisions/:revisionId/restore", requirePermission("content", "update"), contentController.restoreRevision);
contents.get("/revisions/compare", requirePermission("content", "read"), contentController.compareRevisions);
contents.delete("/revisions/:revisionId", requirePermission("content", "delete"), contentController.deleteRevision);

export default contents;
