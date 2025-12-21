import { isDevelopment } from "@/config/env.ts";

/**
 * Un "Higher-Order Component" (HOC) que envuelve un componente de página del admin.
 * Su única responsabilidad es registrar la ruta del archivo del componente en la consola
 * cuando la aplicación está en modo de desarrollo.
 *
 * @param PageComponent El componente de página a envolver (ej. ThemesPage).
 * @param componentPath La ruta del módulo, obtenida con `import.meta.url`.
 * @returns Un nuevo componente que, al ser renderizado, primero imprime su ruta y luego renderiza el original.
 */
export function withAdminPageLogging<T extends (props: any) => any>(
  PageComponent: T,
  componentPath: string,
): T {
  if (!isDevelopment) {
    return PageComponent; // En producción, devuelve el componente original sin cambios.
  }

  // En desarrollo, devuelve una nueva función que hace el logging.
  return ((props: any) => {
    const relativePath = componentPath.split('/src/').pop() || componentPath;
    console.log(`   \x1b[34m> Rendering page:\x1b[0m \x1b[36msrc/${relativePath}\x1b[0m`);
    return PageComponent(props);
  }) as T;
}