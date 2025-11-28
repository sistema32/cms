/**
 * DEPRECATED: Shim del HookManager de plugins.
 * Delegamos en la nueva librería global de hooks (src/lib/hooks) para compatibilidad temporal.
 * No usa workers; las funciones deben registrarse directamente en el host.
 */
import { applyFilters, doAction, registerAction, registerFilter, removeHook, resetHooks } from "../hooks/index.ts";

class HookManagerShim {
    // Compat: pluginName y callbackId se mapean a handlers registrados previamente en host.
    setPluginManager(_manager: any) {
        // noop en shim
    }

    registerAction(hook: string, callbackId: string, priority: number, _pluginName: string) {
        // callbackId debe estar resuelto en el host; aquí asumimos que es una función global exportada.
        const handler = (globalThis as any)[callbackId];
        if (typeof handler !== "function") {
            console.warn(`[HookManagerShim] Handler ${callbackId} no encontrado para ${hook}`);
            return;
        }
        registerAction(hook, handler, priority, callbackId);
    }

    registerFilter(hook: string, callbackId: string, priority: number, _pluginName: string) {
        const handler = (globalThis as any)[callbackId];
        if (typeof handler !== "function") {
            console.warn(`[HookManagerShim] Handler ${callbackId} no encontrado para ${hook}`);
            return;
        }
        registerFilter(hook, handler, priority, callbackId);
    }

    async doAction(hook: string, ...args: any[]) {
        await doAction(hook, ...args);
    }

    async applyFilters(hook: string, value: any, ...args: any[]) {
        return await applyFilters(hook, value, ...args);
    }

    removePluginHooks(pluginName: string) {
        // No tenemos tracking por plugin en el shim. Se podría extender con map si se necesita.
        console.warn(`[HookManagerShim] removePluginHooks ignora plugin=${pluginName}. Considerar migrar a API nueva.`);
    }

    reset() {
        resetHooks();
    }

    remove(hook: string) {
        removeHook(hook);
    }
}

export const hookManager = new HookManagerShim();
