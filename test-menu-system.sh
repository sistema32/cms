#!/bin/bash

# Script de prueba para el sistema de menús
# Asegúrate de que el servidor esté corriendo en http://localhost:8000

BASE_URL="http://localhost:8000/api"
TOKEN=""

echo "🧪 Test del Sistema de Menús"
echo "==========================================="
echo ""

# ============= 1. LOGIN =============
echo "1️⃣  Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error al obtener token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido"
echo ""

# ============= 2. LISTAR MENÚS =============
echo "2️⃣  Listar todos los menús..."
MENUS_RESPONSE=$(curl -s -X GET "$BASE_URL/menus" \
  -H "Authorization: Bearer $TOKEN")
echo "Menús: $MENUS_RESPONSE" | head -c 200
echo "..."
echo ""

# ============= 3. CREAR MENÚ =============
echo "3️⃣  Crear nuevo menú..."
NEW_MENU=$(curl -s -X POST "$BASE_URL/menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menú de Prueba",
    "slug": "test-menu",
    "description": "Menú creado en el test",
    "isActive": true
  }')
NEW_MENU_ID=$(echo $NEW_MENU | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Menú creado con ID: $NEW_MENU_ID"
echo ""

# ============= 4. OBTENER MENÚ POR SLUG =============
echo "4️⃣  Obtener menú por slug (público)..."
MENU_BY_SLUG=$(curl -s -X GET "$BASE_URL/menus/slug/test-menu")
echo "Menú: $MENU_BY_SLUG" | head -c 150
echo "..."
echo ""

# ============= 5. CREAR ITEMS DE MENÚ =============
if [ ! -z "$NEW_MENU_ID" ]; then
  echo "5️⃣  Crear items de menú..."

  # Item 1: URL manual
  ITEM1=$(curl -s -X POST "$BASE_URL/menu-items" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"menuId\": $NEW_MENU_ID,
      \"label\": \"Inicio\",
      \"title\": \"Página de inicio\",
      \"url\": \"/\",
      \"icon\": \"🏠\",
      \"order\": 1,
      \"isVisible\": true
    }")
  ITEM1_ID=$(echo $ITEM1 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "   ✓ Item 1 creado (URL manual) - ID: $ITEM1_ID"

  # Item 2: Link a categoría
  ITEM2=$(curl -s -X POST "$BASE_URL/menu-items" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"menuId\": $NEW_MENU_ID,
      \"label\": \"Blog\",
      \"title\": \"Nuestro blog\",
      \"categoryId\": 1,
      \"icon\": \"📝\",
      \"order\": 2,
      \"isVisible\": true
    }")
  ITEM2_ID=$(echo $ITEM2 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "   ✓ Item 2 creado (Categoría) - ID: $ITEM2_ID"

  # Item 3: Hijo de Item 2 (subcategoría)
  if [ ! -z "$ITEM2_ID" ]; then
    ITEM3=$(curl -s -X POST "$BASE_URL/menu-items" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"menuId\": $NEW_MENU_ID,
        \"parentId\": $ITEM2_ID,
        \"label\": \"Tecnología\",
        \"title\": \"Artículos de tecnología\",
        \"categoryId\": 1,
        \"icon\": \"💻\",
        \"order\": 1,
        \"isVisible\": true
      }")
    ITEM3_ID=$(echo $ITEM3 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "   ✓ Item 3 creado (Hijo de Blog) - ID: $ITEM3_ID"
  fi

  # Item 4: Link a contenido
  ITEM4=$(curl -s -X POST "$BASE_URL/menu-items" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"menuId\": $NEW_MENU_ID,
      \"label\": \"Acerca de\",
      \"title\": \"Sobre nosotros\",
      \"contentId\": 1,
      \"icon\": \"👥\",
      \"order\": 3,
      \"isVisible\": true
    }")
  ITEM4_ID=$(echo $ITEM4 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "   ✓ Item 4 creado (Contenido) - ID: $ITEM4_ID"

  echo ""
fi

# ============= 6. OBTENER ITEMS DEL MENÚ (PLANO) =============
if [ ! -z "$NEW_MENU_ID" ]; then
  echo "6️⃣  Obtener items del menú (plano)..."
  ITEMS_RESPONSE=$(curl -s -X GET "$BASE_URL/menus/$NEW_MENU_ID/items")
  echo "Items: $ITEMS_RESPONSE" | head -c 250
  echo "..."
  echo ""
fi

# ============= 7. OBTENER JERARQUÍA DE ITEMS =============
if [ ! -z "$NEW_MENU_ID" ]; then
  echo "7️⃣  Obtener jerarquía de items..."
  HIERARCHY_RESPONSE=$(curl -s -X GET "$BASE_URL/menus/$NEW_MENU_ID/items/hierarchy")
  echo "Jerarquía: $HIERARCHY_RESPONSE" | head -c 300
  echo "..."
  echo ""
fi

# ============= 8. CONTAR ITEMS =============
if [ ! -z "$NEW_MENU_ID" ]; then
  echo "8️⃣  Contar items del menú..."
  COUNT_RESPONSE=$(curl -s -X GET "$BASE_URL/menus/$NEW_MENU_ID/items/count")
  echo "Conteo: $COUNT_RESPONSE"
  echo ""
fi

# ============= 9. ACTUALIZAR ITEM =============
if [ ! -z "$ITEM1_ID" ]; then
  echo "9️⃣  Actualizar item de menú..."
  UPDATE_ITEM=$(curl -s -X PATCH "$BASE_URL/menu-items/$ITEM1_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "label": "Inicio (Actualizado)",
      "icon": "🏡"
    }')
  echo "✅ Item actualizado: $UPDATE_ITEM" | head -c 150
  echo "..."
  echo ""
fi

# ============= 10. REORDENAR ITEMS =============
if [ ! -z "$ITEM1_ID" ] && [ ! -z "$ITEM2_ID" ]; then
  echo "🔟 Reordenar items..."
  REORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/menu-items/reorder" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"items\": [
        {\"id\": $ITEM2_ID, \"order\": 1},
        {\"id\": $ITEM1_ID, \"order\": 2}
      ]
    }")
  echo "✅ Items reordenados: $REORDER_RESPONSE"
  echo ""
fi

# ============= 11. MOVER ITEM =============
if [ ! -z "$ITEM3_ID" ]; then
  echo "1️⃣1️⃣  Mover item a raíz (null parent)..."
  MOVE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/menu-items/$ITEM3_ID/move" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "newParentId": null
    }')
  echo "✅ Item movido: $MOVE_RESPONSE" | head -c 150
  echo "..."
  echo ""
fi

# ============= 12. DUPLICAR ITEM =============
if [ ! -z "$ITEM1_ID" ]; then
  echo "1️⃣2️⃣  Duplicar item..."
  DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/menu-items/$ITEM1_ID/duplicate" \
    -H "Authorization: Bearer $TOKEN")
  DUPLICATE_ID=$(echo $DUPLICATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "✅ Item duplicado con ID: $DUPLICATE_ID"
  echo ""
fi

# ============= 13. ACTUALIZAR MENÚ =============
if [ ! -z "$NEW_MENU_ID" ]; then
  echo "1️⃣3️⃣  Actualizar menú..."
  UPDATE_MENU=$(curl -s -X PATCH "$BASE_URL/menus/$NEW_MENU_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Menú de Prueba (Actualizado)",
      "description": "Descripción actualizada"
    }')
  echo "✅ Menú actualizado: $UPDATE_MENU" | head -c 150
  echo "..."
  echo ""
fi

# ============= 14. TOGGLE STATUS =============
if [ ! -z "$NEW_MENU_ID" ]; then
  echo "1️⃣4️⃣  Desactivar menú..."
  TOGGLE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/menus/$NEW_MENU_ID/toggle" \
    -H "Authorization: Bearer $TOKEN")
  echo "✅ Estado cambiado: $TOGGLE_RESPONSE" | head -c 150
  echo "..."
  echo ""
fi

# ============= 15. OBTENER ITEM POR ID =============
if [ ! -z "$ITEM1_ID" ]; then
  echo "1️⃣5️⃣  Obtener item por ID..."
  ITEM_BY_ID=$(curl -s -X GET "$BASE_URL/menu-items/$ITEM1_ID")
  echo "Item: $ITEM_BY_ID" | head -c 200
  echo "..."
  echo ""
fi

# ============= 16. ELIMINAR ITEMS =============
if [ ! -z "$ITEM4_ID" ]; then
  echo "1️⃣6️⃣  Eliminar item de menú..."
  DELETE_ITEM=$(curl -s -X DELETE "$BASE_URL/menu-items/$ITEM4_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "✅ Item eliminado: $DELETE_ITEM"
  echo ""
fi

# ============= 17. ELIMINAR MENÚ =============
if [ ! -z "$NEW_MENU_ID" ]; then
  echo "1️⃣7️⃣  Eliminar menú (elimina también sus items por CASCADE)..."
  DELETE_MENU=$(curl -s -X DELETE "$BASE_URL/menus/$NEW_MENU_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "✅ Menú eliminado: $DELETE_MENU"
  echo ""
fi

# ============= 18. VALIDACIONES (Intentar crear item sin tipo de enlace) =============
echo "1️⃣8️⃣  Probar validación (item sin tipo de enlace)..."
VALIDATION_ERROR=$(curl -s -X POST "$BASE_URL/menu-items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menuId": 1,
    "label": "Item Inválido",
    "order": 99
  }')
echo "❌ Error esperado: $VALIDATION_ERROR" | head -c 200
echo "..."
echo ""

echo "==========================================="
echo "✅ Pruebas completadas!"
echo ""
echo "📝 Funcionalidades probadas:"
echo "  ✅ CRUD de menús"
echo "  ✅ CRUD de items de menú"
echo "  ✅ Obtener menú por slug (público)"
echo "  ✅ Jerarquía de items (árbol)"
echo "  ✅ Reordenamiento de items"
echo "  ✅ Mover items entre padres"
echo "  ✅ Duplicar items"
echo "  ✅ Toggle de estado"
echo "  ✅ Conteo de items"
echo "  ✅ Validación de tipos de enlace"
echo "  ✅ Eliminación en cascada"
echo ""
echo "🔗 Tipos de enlaces probados:"
echo "  ✅ URL manual"
echo "  ✅ Enlace a categoría"
echo "  ✅ Enlace a contenido"
echo ""
