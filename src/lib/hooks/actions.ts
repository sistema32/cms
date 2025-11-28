/**
 * Convenience exports for actions (WordPress-like).
 */
import { registerAction, doAction } from "./index.ts";
import { toCmsFilterName } from "./filters.ts";

export { registerAction, doAction };

/**
 * Registra una acción usando el nombre WP original; se mapea a prefijo cms_.
 */
export function registerWpAction(hook: string, handler: (...args: any[]) => any, priority = 10, name?: string) {
  const cmsName = toCmsFilterName(hook);
  registerAction(cmsName, handler, priority, name ?? hook);
}

/**
 * Ejecuta acción usando nombre WP original; se mapea a prefijo cms_.
 */
export async function doWpAction(hook: string, ...args: any[]) {
  const cmsName = toCmsFilterName(hook);
  await doAction(cmsName, ...args);
}
