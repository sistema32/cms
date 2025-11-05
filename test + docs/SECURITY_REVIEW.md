# Security Review Findings

## [P0] Path traversal in media serving endpoint
- **Ubicación**: `src/controllers/mediaController.ts:162`
- **Impacto**: `serveMedia` toma el comodín de la ruta (`c.req.param("*")`) y lo pasa directamente a `Deno.readFile`. Un atacante puede solicitar `/uploads/serve/../../../../etc/passwd` (u otra ruta arbitraria) y obtener cualquier archivo legible por el proceso, exponiendo información sensible del host.
- **Cómo explotar**: Basta con invocar la ruta pública con segmentos `../` para escapar del directorio de uploads.
- **Solución recomendada**:
  1. Fijar un directorio base (por ejemplo `uploads` o el que se utilice en `fileUtils`).
  2. Normalizar la ruta solicitada con `std/path` (`join`, `normalize`, `resolve`) combinándola con el directorio base.
  3. Verificar que el resultado permanezca dentro del directorio permitido (`startsWith` o `common` path).
  4. Rechazar la solicitud (403/404) si detectas rutas fuera del árbol permitido o segmentos `..`.
  5. Leer el archivo únicamente cuando la ruta validada sea segura.

### Ejemplo de corrección
```ts
import { join, normalize, resolve } from "@std/path";

export async function serveMedia(c: Context) {
  const baseDir = resolve("uploads");
  const requested = c.req.param("*") ?? "";
  const normalized = normalize(requested);
  const fullPath = resolve(join(baseDir, normalized));

  if (!fullPath.startsWith(baseDir)) {
    return c.json({ error: "Ruta no permitida" }, 403);
  }

  // ... leer archivo y responder
}
```

## Otros hallazgos
- Se revisaron controladores y servicios principales (auth, users, content, categories, menus) sin encontrar vulnerabilidades críticas adicionales. Aun así, mantener pruebas y revisiones periódicas conforme evolucione la base de código.
