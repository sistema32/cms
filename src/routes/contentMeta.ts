import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission } from "@/middleware/permission.ts";
import { createContentMetaEntry } from "@/controllers/contentController.ts";

const contentMetaRouter = new Hono();

contentMetaRouter.use("*", authMiddleware);

contentMetaRouter.post(
  "/",
  requirePermission("content", "update"),
  createContentMetaEntry,
);

export default contentMetaRouter;
