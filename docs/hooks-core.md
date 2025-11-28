# Hooks core (prefijo `cms_`)

Tabla de hooks reservados y su propósito. Todos requieren prefijo `cms_`; se recomienda mantenerlos cortos y específicos.

- `cms_system:init`: Se dispara al iniciar la aplicación (equivalente a “app boot”). Uso: registrar tasks globales, warming caches.
- `cms_admin:init`: Se dispara al entrar al panel admin (tras auth). Uso: preparar datos/admin widgets.
- `cms_admin:head`: Filtros para inyectar contenido en `<head>` del panel.
- `cms_admin:footer`: Filtros para inyectar scripts al final del panel.
- `cms_admin:enqueueScripts`: Acción para registrar/enqueue scripts/estilos del admin.
- `cms_theme:head`: Filtros para inyectar contenido en `<head>` del tema público.
- `cms_theme:footer`: Filtros para inyectar scripts al final del tema público.
- `cms_theme:bodyClass`: Filtros para modificar la clase del body en el tema público.
- `cms_theme:template`: Filtros para sobreescribir el path del template a usar (string path).
- `cms_theme:pageTemplate`: Filtros para sobreescribir el template de páginas (string path).
- `cms_content:created`: Acción al crear contenido (payload: contenido creado).
- `cms_content:beforeDelete`: Acción antes de eliminar contenido (payload: contenido existente).
- `cms_media:afterUpload`: Acción después de subir media (payload: objeto media).
- `cms_media:getUrl`: Filtro para modificar la URL de media (payload: url/string y objeto media).
- `cms_media:beforeDelete`: Acción antes de eliminar media (payload: objeto media).

Notas:
- Se pueden definir hooks adicionales, siempre con prefijo `cms_`. Los core listados arriba son reservados y deben mantener semántica estable.
- Los plugins deben pasar por la nueva librería global (`src/lib/hooks`) y no usar directamente el shim legacy.
- Alias tipo WordPress:
  - Acciones: `src/lib/hooks/actions.ts` expone `registerAction` y `doAction`.
  - Filtros: `src/lib/hooks/filters.ts` expone `registerFilter` y `applyFilters`.
  - Compat nombres WP: usa `registerWpAction`/`doWpAction` y `registerWpFilter`/`applyWpFilters` (mapean a prefijo `cms_`). Ejemplo:
    ```ts
    import { registerWpFilter, applyWpFilters } from "../lib/hooks/filters.ts";
    registerWpFilter("the_title", (t) => `**${t}**`);
    const title = await applyWpFilters("the_title", "Hola");
    ```
