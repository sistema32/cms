# Performance Optimization Report

Fecha: 2025-11-01  
Se listan los principales puntos que generaban cuellos de botella y las mejoras aplicadas para mitigarlos. Cada sección indica el riesgo original, el fix implementado y las acciones pendientes si corresponden.

---

## 1. `uploadMedia` recalculaba tamaños de imagen dos veces
- **Antes**: `src/services/mediaService.ts` invocaba `generateImageSizes` al guardar archivos y otra vez al registrar metadatos, duplicando CPU/memoria.
- **Fix**:
  ```ts
  let generatedImageSizes: Map<string, ProcessedImage> | undefined;
  ...
  generatedImageSizes = sizes;
  ...
  const sizes = generatedImageSizes ?? await imageProcessor.generateImageSizes(input.data);
  ```
  Ahora se reutiliza un solo `Map`, evitando recomputos.
- **Resultado**: menor latencia y consumo de recursos en subidas de imágenes.

## 2. `mergeCategories` hacía N+1 queries
- **Antes**: iteraba contenido y subcategorías moviendo cada fila individualmente, con múltiples `findFirst`, `update` y `delete`.
- **Fix**: refactor a transacción única (`db.transaction`). Se agrupan IDs, se usa `inArray` para `UPDATE/DELETE` en bloque y se contabilizan los registros movidos.
- **Resultado**: operación proporcional al número de filas, con un solo roundtrip por acción masiva.

## 3. Jerarquía de menú (helpers recursivos)
- **`deleteMenuItem`**: antes llamaba recursivamente y ejecutaba consultas por nodo; ahora obtiene todos los descendientes (`getItemDescendants`) y ejecuta un `DELETE ... WHERE id IN (...)`.
- **`getItemDescendants`**: pasó de recursión con múltiples queries a cargar el árbol completo y construir un mapa en memoria.
- **`countMenuItems`**: cambió de contar en memoria a `SELECT count(*)`.
- **Resultado**: menos roundtrips para jerarquías profundas y mejoras en operaciones masivas (duplicados, reordenamiento, borrado).

## 4. `getContentList` ignoraba filtros
- **Antes**: el servicio devolvía siempre el mismo set paginado, ignorando parámetros (`contentTypeId`, `status`, `authorId`).
- **Fix**: genera `conditions` dinámicos y los aplica con `and(...)` en la consulta Drizzle. El resultado respeta los filtros originales.
- **Resultado**: menos transferencia de datos y paginación coherente.

## 5. `reorderCategories` actualizaba fila por fila
- **Antes**: `SELECT` + `UPDATE` por cada elemento.
- **Fix**: validación inicial de existencia y transacción donde se ejecutan los updates (`tx.update(...)`). *Nota*: todavía se recorre la lista dentro de la transacción; se puede optimizar más (por ejemplo, `UPDATE ... CASE`), pero ya se evita múltiples roundtrips fuera de transacción.

## 6. `updateContent` reescribía enlaces Many-to-Many
- **Antes**: se borraban todas las categorías/tags y se volvía a insertar, aunque no hubiera cambios.
- **Fix**: cálculo de diferencias (`toInsert`/`toDelete`) y operación selectiva con `inArray`. Se reduce carga de escritura.

## 7. `serveMedia` cargaba el archivo completo en memoria
- **Fix**: se usa `Deno.open` y `c.body(file.readable, ...)` para servir en streaming.

## 8. Otras mejoras menores
- `menuItemService.countMenuItems`: usa `count(*)`.
- `menuItemService.getItemDescendants`: se reescribe para evitar múltiples lecturas.
- Refactors varios (`getErrorMessage`, `validateJSON`, tipado Drizzle) para limpiar errores que también impactaban rendimiento al permitir validaciones tempranas.

---

### Siguientes pasos sugeridos
1. `reorderCategories`: podría optimizarse aún más usando `UPDATE ... CASE` para aplicar todos los cambios en una sola sentencia.
2. `duplicateMenuItem`: actualmente inserta la copia con `order = original + 1`, pero no desplaza hermanos; convendría reutilizar la lógica de `reorder` para mantener consistencia.
3. Procesamiento de video/audio: evaluar mover conversiones WebM a una cola externa cuando la carga crezca (actualmente sigue siendo un proceso CPU intensivo).
4. Monitoreo: instrumentar métricas (tiempo medio de `uploadMedia`, `mergeCategories`, jerarquía de menús) para verificar las mejoras y detectar nuevos picos.
