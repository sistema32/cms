import { Hono } from "hono";
import * as tagController from "@/controllers/tagController.ts";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission, allowPublic } from "@/middleware/permission.ts";

const tags = new Hono();

// Rutas públicas
tags.get("/", allowPublic("tags", "read"), tagController.getAllTags);
tags.get("/search", allowPublic("tags", "read"), tagController.searchTags);
tags.get("/:id/content", allowPublic("tags", "read"), tagController.getTagContent);
tags.get("/:id", allowPublic("tags", "read"), tagController.getTagById);

// Rutas protegidas
tags.use("*", authMiddleware);

tags.post("/", requirePermission("tags", "create"), tagController.createTag);
tags.patch("/:id", requirePermission("tags", "update"), tagController.updateTag);
tags.delete("/:id", requirePermission("tags", "delete"), tagController.deleteTag);

export default tags;
