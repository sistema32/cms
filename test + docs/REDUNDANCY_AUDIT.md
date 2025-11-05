# Redundancy & Dead-Code Review

Fecha: 2025-11-01

Este documento resume las secciones del código que hoy no aportan valor funcional (parámetros ignorados, validaciones inefectivas o middleware sin efecto) y las acciones sugeridas para corregirlas.

## 1. `mediaService.listMedia` ignora el parámetro `type`
- **Archivo**: `src/services/mediaService.ts:232`
- **Lo que ocurre**: el servicio recibe `type?: string` desde `mediaController.listMedia`, pero nunca filtra por ese valor.
- **Impacto**: el API `/api/media?type=video` aparenta soportar filtros que en realidad no se aplican, lo que genera confusión y respuestas incorrectas.
- **Corrección sugerida**: añadir un `where` adicional en la consulta (y validar el valor recibido) o, si todavía no se soportará, eliminar el parámetro de ambos lados para evitar expectativas falsas.

## 2. `contentService.getContentList` no usa los filtros recibidos
- **Archivo**: `src/services/contentService.ts:155`
- **Lo que ocurre**: la función acepta múltiples criterios (`contentTypeId`, `status`, `authorId`, etc.), pero el bloque `// TODO: Aplicar filtros` nunca se implementó.
- **Impacto**: todo el bloque de filtros es un costo de mantenimiento innecesario y los controladores creen que existe filtrado avanzado.
- **Corrección sugerida**: implementar los filtros (usando `where` condicionales) o simplificar la API retirando esos parámetros hasta que haya soporte real.

## 3. Middleware `validateJSON` es efectivamente un no-op
- **Archivo**: `src/middleware/security.ts:58`
- **Lo que ocurre**: el middleware se describe como “Valida que el body sea JSON válido”, pero en la práctica sólo reenvía la petición sin ninguna verificación adicional.
- **Impacto**: añade complejidad al pipeline de middlewares sin beneficio; quien lea el código cree que hay validaciones globales cuando no es cierto.
- **Corrección sugerida**: o bien implementar la validación (por ejemplo, intentando `c.req.raw.json()` y capturando errores antes de pasar al controlador) o eliminar el middleware hasta que se necesite.

## 4. Validación “auto-padre” en `createMenuItem` nunca se cumple
- **Archivo**: `src/services/menuItemService.ts:134`
- **Lo que ocurre**: `createMenuItem` intenta impedir que un item sea su propio padre con `if (data.parentId && data.parentId === (data as any).id)`. En un `NewMenuItem` no existe `id`, así que la comparación siempre es falsa.
- **Impacto**: la lógica luce robusta pero no evita ningún caso real; además transmite una falsa sensación de seguridad.
- **Corrección sugerida**: eliminar el bloque o sustituirlo por una verificación en la ruta de actualización (donde sí se conoce el `id` real). Para la creación, la validación útil sería impedir que `parentId` refiera a un item de otro menú (ya se hace) o verificar que no se envíe el mismo `parentId` repetido en el lote.

---

### Próximos pasos recomendados
1. Decidir qué filtros y parámetros deben estar disponibles públicamente (media, contenido) e implementar la lógica correspondiente o documentar que aún no existe.
2. Definir si se quiere un middleware global de validación JSON; en caso afirmativo, implementarlo (lanzando 400 antes de que llegue al controlador).
3. Revisar otras validaciones similares en servicios de menús para asegurarse de que sólo se apliquen donde realmente hay datos suficientes (por ejemplo, en `updateMenuItem` ya existe una verificación efectiva).
