import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permission.ts";
import {
  upsertContentSeo,
  getContentSeoByContentId,
} from "../controllers/contentController.ts";

const contentSeoRouter = new Hono();

contentSeoRouter.use("*", authMiddleware);

contentSeoRouter.post(
  "/",
  requirePermission("content", "update"),
  upsertContentSeo,
);

contentSeoRouter.get(
  "/:id",
  requirePermission("content", "read"),
  getContentSeoByContentId,
);

export default contentSeoRouter;
