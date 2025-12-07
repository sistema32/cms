import { Hono } from "hono";
import * as mediaController from "../controllers/mediaController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";

const media = new Hono();

// Rutas públicas para servir archivos (con prefijo /serve)
media.get("/serve/uploads/:year/:month/:file", mediaController.serveMedia);
media.get("/serve/*", mediaController.serveMedia);

// Ruta para servir archivos directamente: /:year/:month/:file
// Mover antes del middleware de autenticación para permitir acceso público a imágenes
media.get("/:year{[0-9]{4}}/:month{[0-9]{2}}/:file", mediaController.serveMedia);

// Aplicar autenticación a todas las rutas excepto las de servir archivos
media.use("*", authMiddleware);

// Upload de media (requiere autenticación)
media.post("/", requirePermission("media", "create"), mediaController.uploadMedia);

// Listar media
media.get("/", requirePermission("media", "read"), mediaController.listMedia);

// Ver media por ID - IMPORTANTE: debe estar ANTES de /:year/:month/:file
// Usamos una validación más estricta: el ID debe ser solo dígitos sin '/'
media.get("/:id{[0-9]+}", requirePermission("media", "read"), mediaController.getMediaById);

// Actualizar SEO
media.patch("/:id{[0-9]+}/seo", requirePermission("media", "update"), mediaController.updateMediaSeo);

// Eliminar media
media.delete("/:id{[0-9]+}", requirePermission("media", "delete"), mediaController.deleteMedia);

// (Ruta movida al inicio para acceso público)

export default media;
