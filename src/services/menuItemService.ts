import { db } from "../config/db.ts";
import { type MenuItem, menuItems, type NewMenuItem } from "../db/schema.ts";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

/**
 * ============================================
 * MENU ITEM SERVICE
 * ============================================
 * Servicio para gestionar items de menú con jerarquía ilimitada
 */

// ============= TIPOS =============

export interface MenuItemWithChildren extends MenuItem {
  children?: MenuItemWithChildren[];
  content?: any;
  category?: any;
  tag?: any;
}

export interface ReorderMenuItem {
  id: number;
  order: number;
}

// ============= CRUD BÁSICO =============

/**
 * Obtener todos los items de un menú (plano)
 */
export async function getMenuItems(menuId: number): Promise<MenuItem[]> {
  const items = await db.query.menuItems.findMany({
    where: eq(menuItems.menuId, menuId),
    with: {
      content: {
        columns: {
          id: true,
          title: true,
          slug: true,
        },
      },
      category: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tag: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: (menuItems, { asc }) => [asc(menuItems.order)],
  });

  return items;
}

/**
 * Obtener items de un menú en estructura jerárquica (árbol)
 */
export async function getMenuItemsHierarchy(
  menuId: number,
): Promise<MenuItemWithChildren[]> {
  const items = await getMenuItems(menuId);

  // Construir árbol
  const itemMap = new Map<number, MenuItemWithChildren>();
  const rootItems: MenuItemWithChildren[] = [];

  // Crear mapa de items
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Construir jerarquía
  items.forEach((item) => {
    const currentItem = itemMap.get(item.id)!;

    if (item.parentId === null) {
      rootItems.push(currentItem);
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(currentItem);
      } else {
        // Si no se encuentra el padre, agregar a raíz
        rootItems.push(currentItem);
      }
    }
  });

  return rootItems;
}

/**
 * Obtener un item de menú por ID
 */
export async function getMenuItemById(id: number): Promise<MenuItem | null> {
  const item = await db.query.menuItems.findFirst({
    where: eq(menuItems.id, id),
    with: {
      content: true,
      category: true,
      tag: true,
      children: true,
    },
  });

  return item || null;
}

/**
 * Crear un nuevo item de menú
 */
export async function createMenuItem(data: NewMenuItem): Promise<MenuItem> {
  // Validación: Debe tener exactamente un tipo de enlace
  const linkTypes = [data.url, data.contentId, data.categoryId, data.tagId]
    .filter(
      (v) => v !== null && v !== undefined,
    );

  if (linkTypes.length === 0) {
    throw new Error(
      "El item debe tener al menos un tipo de enlace (url, contentId, categoryId o tagId)",
    );
  }

  if (linkTypes.length > 1) {
    throw new Error("El item solo puede tener un tipo de enlace a la vez");
  }

  // Validación: No puede ser su propio padre
  if (data.parentId && data.parentId === (data as any).id) {
    throw new Error("Un item no puede ser su propio padre");
  }

  // Validación: Verificar que el menú existe
  const menu = await db.query.menus.findFirst({
    where: (menus, { eq }) => eq(menus.id, data.menuId),
  });

  if (!menu) {
    throw new Error(`El menú con ID ${data.menuId} no existe`);
  }

  // Validación: Verificar que el padre existe (si se proporciona)
  if (data.parentId) {
    const parent = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, data.parentId),
    });

    if (!parent) {
      throw new Error(`El item padre con ID ${data.parentId} no existe`);
    }

    // Verificar que el padre pertenece al mismo menú
    if (parent.menuId !== data.menuId) {
      throw new Error("El item padre debe pertenecer al mismo menú");
    }
  }

  const [item] = await db
    .insert(menuItems)
    .values(data)
    .returning();

  return item;
}

/**
 * Actualizar un item de menú
 */
export async function updateMenuItem(
  id: number,
  data: Partial<NewMenuItem>,
): Promise<MenuItem> {
  const existing = await db.query.menuItems.findFirst({
    where: eq(menuItems.id, id),
  });

  if (!existing) {
    throw new Error(`Item de menú con ID ${id} no encontrado`);
  }

  // Validación: Si se actualiza parentId, verificar que no cree referencia circular
  if (data.parentId !== undefined) {
    if (data.parentId === id) {
      throw new Error("Un item no puede ser su propio padre");
    }

    if (data.parentId !== null) {
      const isCircular = await checkCircularReference(id, data.parentId);
      if (isCircular) {
        throw new Error(
          "Esta actualización crearía una referencia circular en la jerarquía",
        );
      }
    }
  }

  // Validación: Si se actualizan los tipos de enlace, verificar que solo haya uno
  const updatedItem = { ...existing, ...data };
  const linkTypes = [
    updatedItem.url,
    updatedItem.contentId,
    updatedItem.categoryId,
    updatedItem.tagId,
  ].filter((v) => v !== null && v !== undefined);

  if (linkTypes.length === 0) {
    throw new Error("El item debe tener al menos un tipo de enlace");
  }

  if (linkTypes.length > 1) {
    throw new Error("El item solo puede tener un tipo de enlace a la vez");
  }

  const [updated] = await db
    .update(menuItems)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(menuItems.id, id))
    .returning();

  return updated;
}

/**
 * Eliminar un item de menú (también elimina sus hijos si los tiene)
 */
export async function deleteMenuItem(id: number): Promise<void> {
  const idsToDelete = await getItemDescendants(id);
  idsToDelete.push(id);

  await db.delete(menuItems).where(inArray(menuItems.id, idsToDelete));
}

/**
 * Reordenar items de menú (batch update)
 */
export async function reorderMenuItems(
  items: ReorderMenuItem[],
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  // Validar que todos los items existen
  const ids = items.map((item) => item.id);
  const existingItems = await db.query.menuItems.findMany({
    where: inArray(menuItems.id, ids),
  });

  if (existingItems.length !== ids.length) {
    throw new Error("Uno o más items no existen");
  }

  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error("La lista de items contiene IDs duplicados");
  }

  const orderCases = items.map(({ id, order }) =>
    sql`WHEN ${id} THEN ${order}`
  );

  const orderExpression = sql`CASE ${menuItems.id} ${
    sql.join(orderCases, sql` `)
  } ELSE ${menuItems.order} END`;

  await db
    .update(menuItems)
    .set({
      order: orderExpression,
      updatedAt: new Date(),
    })
    .where(inArray(menuItems.id, ids));
}

/**
 * Mover item a otro padre (cambiar parentId)
 */
export async function moveMenuItem(
  id: number,
  newParentId: number | null,
): Promise<MenuItem> {
  const existing = await db.query.menuItems.findFirst({
    where: eq(menuItems.id, id),
  });

  if (!existing) {
    throw new Error(`Item de menú con ID ${id} no encontrado`);
  }

  // Validación de referencia circular
  if (newParentId !== null) {
    if (newParentId === id) {
      throw new Error("Un item no puede ser su propio padre");
    }

    const isCircular = await checkCircularReference(id, newParentId);
    if (isCircular) {
      throw new Error("Este movimiento crearía una referencia circular");
    }

    // Verificar que el nuevo padre existe y pertenece al mismo menú
    const parent = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, newParentId),
    });

    if (!parent) {
      throw new Error(`El nuevo padre con ID ${newParentId} no existe`);
    }

    if (parent.menuId !== existing.menuId) {
      throw new Error("El item padre debe pertenecer al mismo menú");
    }
  }

  const [updated] = await db
    .update(menuItems)
    .set({
      parentId: newParentId,
      updatedAt: new Date(),
    })
    .where(eq(menuItems.id, id))
    .returning();

  return updated;
}

/**
 * Duplicar un item de menú (sin sus hijos)
 */
export async function duplicateMenuItem(id: number): Promise<MenuItem> {
  const existing = await db.query.menuItems.findFirst({
    where: eq(menuItems.id, id),
  });

  if (!existing) {
    throw new Error(`Item de menú con ID ${id} no encontrado`);
  }

  // Crear copia con label modificado
  const newItem: NewMenuItem = {
    menuId: existing.menuId,
    parentId: existing.parentId,
    label: `${existing.label} (copia)`,
    title: existing.title,
    url: existing.url,
    contentId: existing.contentId,
    categoryId: existing.categoryId,
    tagId: existing.tagId,
    icon: existing.icon,
    cssClass: existing.cssClass,
    target: existing.target,
    order: existing.order + 1,
    isVisible: existing.isVisible,
    requiredPermission: existing.requiredPermission,
  };

  const [duplicate] = await db
    .insert(menuItems)
    .values(newItem)
    .returning();

  return duplicate;
}

// ============= HELPERS =============

/**
 * Verificar si crear/actualizar un parentId crearía referencia circular
 */
async function checkCircularReference(
  itemId: number,
  newParentId: number,
): Promise<boolean> {
  if (newParentId === itemId) {
    return true;
  }

  const descendants = await getItemDescendants(itemId);
  return descendants.includes(newParentId);
}

/**
 * Obtener todos los descendientes de un item (recursivo)
 */
export async function getItemDescendants(itemId: number): Promise<number[]> {
  const [root] = await db
    .select({
      id: menuItems.id,
      menuId: menuItems.menuId,
    })
    .from(menuItems)
    .where(eq(menuItems.id, itemId))
    .limit(1);

  if (!root) {
    return [];
  }

  const rows = await db
    .select({
      id: menuItems.id,
      parentId: menuItems.parentId,
    })
    .from(menuItems)
    .where(eq(menuItems.menuId, root.menuId));

  if (rows.length === 0) {
    return [];
  }

  const childrenMap = new Map<number, number[]>();

  for (const row of rows) {
    if (row.parentId === null) continue;
    if (!childrenMap.has(row.parentId)) {
      childrenMap.set(row.parentId, []);
    }
    childrenMap.get(row.parentId)!.push(row.id);
  }

  const descendants: number[] = [];
  const stack = childrenMap.get(itemId)?.slice() ?? [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    descendants.push(current);
    const children = childrenMap.get(current);
    if (children && children.length) {
      stack.push(...children);
    }
  }

  return descendants;
}

/**
 * Contar items de un menú
 */
export async function countMenuItems(menuId: number): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(menuItems)
    .where(eq(menuItems.menuId, menuId));

  return Number(result[0]?.count || 0);
}
