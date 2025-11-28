import { Hono } from "hono";
import * as registry from "../services/pluginRegistry.ts";
import * as reconciler from "../services/pluginReconciler.ts";

export const pluginsNewRouter = new Hono();

pluginsNewRouter.get("/", async (c) => {
  const list = await registry.listPlugins();
  return c.json({ success: true, data: list });
});

pluginsNewRouter.get("/:name", async (c) => {
  const name = c.req.param("name");
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  return c.json({ success: true, data: plugin });
});

pluginsNewRouter.post("/:name/activate", async (c) => {
  const name = c.req.param("name");
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  await reconciler.activate(name);
  return c.json({ success: true, message: `Plugin ${name} activated` });
});

pluginsNewRouter.post("/:name/deactivate", async (c) => {
  const name = c.req.param("name");
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  if (plugin.isSystem) return c.json({ success: false, error: "System plugin cannot be deactivated" }, 400);
  await reconciler.deactivate(name);
  return c.json({ success: true, message: `Plugin ${name} deactivated` });
});

pluginsNewRouter.patch("/:name/settings", async (c) => {
  const name = c.req.param("name");
  const body = await c.req.json().catch(() => ({}));
  const plugin = await registry.getPluginByName(name);
  if (!plugin) return c.json({ success: false, error: "Plugin not found" }, 404);
  await registry.saveSettings(name, body?.settings ?? {});
  return c.json({ success: true, message: "Settings updated" });
});

export default pluginsNewRouter;
