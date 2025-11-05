# Performance Audit – Menú

Fecha: 2025-02-14

Se identificaron y corrigieron cuellos de botella que impactaban el consumo de memoria y las escrituras a base de datos dentro del servicio de menús.

## 1. `getItemDescendants` cargaba toda la tabla en memoria
- **Ubicación:** `src/services/menuItemService.ts` (`getItemDescendants` y `checkCircularReference`).
- **Problema:** `getItemDescendants` realizaba `findMany()` sin filtros, lo que trasladaba **todos** los registros de `menu_items` a memoria, incluso aunque solo se necesitara el subárbol de un menú. En instalaciones con miles de items se observaba un pico de RAM y CPU por el montaje del mapa en memoria. Además, `checkCircularReference` recorría la cadena de padres lanzando un `findFirst` por salto, multiplicando roundtrips a la base.
- **Fix aplicado:** Ahora se obtiene solo el `menuId` del nodo raíz y se consulta una lista reducida (`id` y `parentId`) limitada a ese menú antes de construir el árbol en memoria. `checkCircularReference` reutiliza el resultado preprocesado en vez de volver a consultar fila por fila.
- **Impacto:** Menor consumo de memoria y CPU en eliminaciones/movimientos de items. En un menú de 5000 nodos se evita cargar ~5000+ filas ajenas y se elimina la cascada de consultas ad-hoc de la verificación de ciclos.

## 2. `reorderMenuItems` hacía un UPDATE por fila
- **Ubicación:** `src/services/menuItemService.ts` (`reorderMenuItems`).
- **Problema:** El reordenamiento iteraba la colección y ejecutaba un `UPDATE` individual por item. En reordenamientos masivos (drag & drop de muchos nodos) generaba una ráfaga lineal de escrituras, saturando I/O.
- **Fix aplicado:** Se valida que no existan IDs duplicados y se utiliza un único `UPDATE ... CASE` para persistir todos los cambios de orden en bloque, actualizando a la vez la marca de `updatedAt`.
- **Impacto:** Las operaciones de reordenamiento ahora implican un solo roundtrip a la base (en lugar de *n*). Esto reduce el tiempo total de la operación y el uso de disco cuando se reordena una gran cantidad de elementos.

---

Ambos cambios mantienen la API pública intacta y están listos para probarse a través de `test-menu-system.sh` o los flujos de UI que consumen el servicio de menús.
