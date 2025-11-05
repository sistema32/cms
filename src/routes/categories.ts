import { Hono } from "hono";
import * as categoryController from "../controllers/categoryController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission, allowPublic, requireSuperAdmin } from "../middleware/permission.ts";

const categories = new Hono();

// ==================== RUTAS PÚBLICAS ====================

// Búsqueda avanzada (pública)
categories.get("/search", allowPublic("categories", "read"), categoryController.searchCategoriesController);

// Listar categorías (pública)
categories.get("/", allowPublic("categories", "read"), categoryController.getAllCategories);

// Categorías raíz (pública)
categories.get("/root", allowPublic("categories", "read"), categoryController.getRootCategories);
categories.get("/tree", allowPublic("categories", "read"), categoryController.getCategoryTree);

// Ver categoría por ID (pública)
categories.get("/:id", allowPublic("categories", "read"), categoryController.getCategoryById);

// Obtener contenido de una categoría (pública)
categories.get("/:id/content", allowPublic("categories", "read"), categoryController.getCategoryContentController);

// Contar contenido de una categoría (pública)
categories.get("/:id/count", allowPublic("categories", "read"), categoryController.getCategoryContentCountController);

// Ver SEO de categoría (pública)
categories.get("/:id/seo", allowPublic("categories", "read"), categoryController.getCategorySeo);

// ==================== RUTAS PROTEGIDAS ====================

// Aplicar middleware de autenticación para las siguientes rutas
categories.use("*", authMiddleware);

// Reordenar categorías (batch)
categories.post("/reorder", requirePermission("categories", "update"), categoryController.reorderCategoriesController);

// Crear categoría
categories.post("/", requirePermission("categories", "create"), categoryController.createCategory);

// Actualizar categoría
categories.patch("/:id", requirePermission("categories", "update"), categoryController.updateCategory);

// Eliminar categoría (soft delete)
categories.delete("/:id", requirePermission("categories", "delete"), categoryController.deleteCategory);

// Restaurar categoría (soft delete)
categories.patch("/:id/restore", requirePermission("categories", "update"), categoryController.restoreCategory);

// Eliminar permanentemente (solo superadmin)
categories.delete("/:id/force", requireSuperAdmin(), categoryController.forceDeleteCategory);

// Crear SEO para categoría
categories.post("/:id/seo", requirePermission("categories", "create"), categoryController.createCategorySeo);

// Actualizar SEO de categoría
categories.patch("/:id/seo", requirePermission("categories", "update"), categoryController.updateCategorySeo);

// Eliminar SEO de categoría
categories.delete("/:id/seo", requirePermission("categories", "delete"), categoryController.deleteCategorySeo);

// Merge/Unificar categorías
categories.post("/:id/merge", requirePermission("categories", "delete"), categoryController.mergeCategoriesController);

export default categories;
