
import { Hono } from "hono";
import { adminMenuController } from "@/controllers/admin/menuController.ts";

export const menusRouter = new Hono();

// Base path: /admincp/menus (implied by mounting)

menusRouter.get("/", adminMenuController.list);
menusRouter.post("/", adminMenuController.create);
menusRouter.get("/:id", adminMenuController.edit);
menusRouter.post("/:id", adminMenuController.update);
menusRouter.delete("/:id", adminMenuController.delete);
menusRouter.post("/:id/items", adminMenuController.saveItems);
