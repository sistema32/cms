import { Hono } from "hono";
import * as mediaController from "../controllers/mediaController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";

const media = new Hono();

// Rutas públicas para servir archivos
media.get("/serve/uploads/:year/:month/:file", mediaController.serveMedia);
media.get("/serve/*", mediaController.serveMedia);

// Middleware para validar que la ruta /:year/:month/:file solo haga match con año/mes válidos
// Esto evita conflictos con /:id que usa solo un número
media.get("/:year/:month/:file", async (c, next) => {
  const year = c.req.param("year");
  const month = c.req.param("month");

  // Validar que year sea un número de 4 dígitos (ej: 2024, 2025)
  // y month sea un número de 2 dígitos (ej: 01, 12)
  const yearRegex = /^\d{4}$/;
  const monthRegex = /^\d{2}$/;

  if (yearRegex.test(year) && monthRegex.test(month)) {
    // Es una ruta válida de archivo (/:year/:month/:file)
    return mediaController.serveMedia(c);
  }

  // No es una ruta de archivo válida, continuar con otras rutas
  await next();
});

// Rutas protegidas
media.use("*", authMiddleware);

// Upload de media (requiere autenticación)
media.post("/", requirePermission("media", "create"), mediaController.uploadMedia);

// Listar media
media.get("/", requirePermission("media", "read"), mediaController.listMedia);

// Ver media por ID - ahora no colisiona con /:year/:month/:file gracias a la validación
media.get("/:id", requirePermission("media", "read"), mediaController.getMediaById);

// Actualizar SEO
media.patch("/:id/seo", requirePermission("media", "update"), mediaController.updateMediaSeo);

// Eliminar media
media.delete("/:id", requirePermission("media", "delete"), mediaController.deleteMedia);

export default media;
