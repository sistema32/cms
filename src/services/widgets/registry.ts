import type { WidgetClass } from './types.ts';

class WidgetRegistry {
  private registry = new Map<string, WidgetClass>();

  register(type: string, widget: WidgetClass) {
    this.registry.set(type, widget);
  }

  has(type: string) {
    return this.registry.has(type);
  }

  get(type: string) {
    return this.registry.get(type);
  }

  getAll() {
    return Array.from(this.registry.values());
  }
}

export const widgetRegistry = new WidgetRegistry();

export function registerWidget(type: string, widget: WidgetClass) {
  widgetRegistry.register(type, widget);
}

export function registerBuiltInWidgets() {
  // Placeholder: built-in widgets can be registered here
}

export function getWidget(type: string) {
  return widgetRegistry.get(type);
}
