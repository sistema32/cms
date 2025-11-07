import { Hono } from "hono";
import * as mediaController from "../controllers/mediaController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";

const media = new Hono();

// Rutas públicas para servir archivos (con prefijo /serve)
media.get("/serve/uploads/:year/:month/:file", mediaController.serveMedia);
media.get("/serve/*", mediaController.serveMedia);

// Aplicar autenticación a todas las rutas excepto las de servir archivos
media.use("*", authMiddleware);

// Upload de media (requiere autenticación)
media.post("/", requirePermission("media", "create"), mediaController.uploadMedia);

// Listar media
media.get("/", requirePermission("media", "read"), mediaController.listMedia);

// Ver media por ID - IMPORTANTE: debe estar ANTES de /:year/:month/:file
// Usamos una validación más estricta: el ID debe ser solo dígitos sin '/'
media.get("/:id{\\d+}", requirePermission("media", "read"), mediaController.getMediaById);

// Actualizar SEO
media.patch("/:id{\\d+}/seo", requirePermission("media", "update"), mediaController.updateMediaSeo);

// Eliminar media
media.delete("/:id{\\d+}", requirePermission("media", "delete"), mediaController.deleteMedia);

// Ruta para servir archivos directamente: /:year/:month/:file
// Esta ruta está al final y requiere autenticación (por el middleware anterior)
// Nota: Las imágenes se sirven públicamente a través de /serve/uploads/:year/:month/:file
media.get("/:year{\\d{4}}/:month{\\d{2}}/:file", mediaController.serveMedia);

export default media;
