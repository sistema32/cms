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

// Rutas protegidas
contents.use("*", authMiddleware);

// Utilidad para generar slug
contents.post("/generate-slug", contentController.generateSlug);

// CRUD de contenido
contents.post("/", requirePermission("content", "create"), contentController.createContent);
contents.patch("/:id", requirePermission("content", "update"), contentController.updateContent);
contents.delete("/:id", requirePermission("content", "delete"), contentController.deleteContent);

export default contents;
