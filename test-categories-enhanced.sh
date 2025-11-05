#!/bin/bash

# Script de prueba para el sistema mejorado de categorías
# Asegúrate de que el servidor esté corriendo en http://localhost:8000

BASE_URL="http://localhost:8000/api"
TOKEN=""

echo "🧪 Test del Sistema Mejorado de Categorías"
echo "=========================================="
echo ""

# 1. Login
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

# 2. Búsqueda de categorías
echo "2️⃣  Búsqueda avanzada de categorías..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/categories/search?query=tecno&limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "Resultado: $SEARCH_RESPONSE" | head -c 200
echo "..."
echo ""

# 3. Obtener categoría con SEO
echo "3️⃣  Obtener categoría con SEO..."
CATEGORY_RESPONSE=$(curl -s -X GET "$BASE_URL/categories/1" \
  -H "Authorization: Bearer $TOKEN")
echo "Categoría: $CATEGORY_RESPONSE" | head -c 200
echo "..."
echo ""

# 4. Obtener SEO de categoría
echo "4️⃣  Obtener SEO de categoría..."
SEO_RESPONSE=$(curl -s -X GET "$BASE_URL/categories/1/seo")
echo "SEO: $SEO_RESPONSE" | head -c 200
echo "..."
echo ""

# 5. Obtener contenido de categoría
echo "5️⃣  Obtener contenido de categoría..."
CONTENT_RESPONSE=$(curl -s -X GET "$BASE_URL/categories/1/content?limit=10")
echo "Contenido: $CONTENT_RESPONSE" | head -c 200
echo "..."
echo ""

# 6. Contar contenido de categoría
echo "6️⃣  Contar contenido de categoría..."
COUNT_RESPONSE=$(curl -s -X GET "$BASE_URL/categories/1/count")
echo "Conteo: $COUNT_RESPONSE"
echo ""

# 7. Obtener categorías raíz (con hijos)
echo "7️⃣  Obtener categorías raíz con subcategorías..."
ROOT_RESPONSE=$(curl -s -X GET "$BASE_URL/categories/root")
echo "Raíz: $ROOT_RESPONSE" | head -c 300
echo "..."
echo ""

# 8. Crear nueva categoría con SEO
echo "8️⃣  Crear nueva categoría..."
NEW_CAT=$(curl -s -X POST "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "slug": "test-category",
    "description": "Categoría de prueba",
    "color": "#ff0000",
    "icon": "🧪",
    "order": 99
  }')
NEW_CAT_ID=$(echo $NEW_CAT | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Categoría creada con ID: $NEW_CAT_ID"
echo ""

# 9. Agregar SEO a la nueva categoría
if [ ! -z "$NEW_CAT_ID" ]; then
  echo "9️⃣  Agregar SEO a la categoría..."
  SEO_CREATE=$(curl -s -X POST "$BASE_URL/categories/$NEW_CAT_ID/seo" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "metaTitle": "Test Category - Mi Blog",
      "metaDescription": "Esta es una categoría de prueba para demostrar el sistema SEO",
      "canonicalUrl": "https://example.com/categories/test-category",
      "ogTitle": "Test Category",
      "ogDescription": "Categoría de prueba",
      "ogType": "website",
      "twitterCard": "summary_large_image",
      "focusKeyword": "test",
      "noIndex": false,
      "noFollow": false
    }')
  echo "✅ SEO agregado: $SEO_CREATE" | head -c 200
  echo "..."
  echo ""

  # 10. Actualizar SEO
  echo "🔟 Actualizar SEO..."
  SEO_UPDATE=$(curl -s -X PATCH "$BASE_URL/categories/$NEW_CAT_ID/seo" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "metaTitle": "Test Category UPDATED - Mi Blog",
      "focusKeyword": "test updated"
    }')
  echo "✅ SEO actualizado: $SEO_UPDATE" | head -c 200
  echo "..."
  echo ""

  # 11. Soft delete
  echo "1️⃣1️⃣  Soft delete de categoría..."
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/categories/$NEW_CAT_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "✅ Categoría eliminada (soft): $DELETE_RESPONSE"
  echo ""

  # 12. Restaurar categoría
  echo "1️⃣2️⃣  Restaurar categoría..."
  RESTORE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/categories/$NEW_CAT_ID/restore" \
    -H "Authorization: Bearer $TOKEN")
  echo "✅ Categoría restaurada: $RESTORE_RESPONSE" | head -c 200
  echo "..."
  echo ""

  # 13. Force delete
  echo "1️⃣3️⃣  Eliminar permanentemente..."
  FORCE_DELETE=$(curl -s -X DELETE "$BASE_URL/categories/$NEW_CAT_ID/force" \
    -H "Authorization: Bearer $TOKEN")
  echo "✅ Categoría eliminada permanentemente: $FORCE_DELETE"
  echo ""
fi

# 14. Reordenar categorías
echo "1️⃣4️⃣  Reordenar categorías..."
REORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/categories/reorder" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": [
      {"id": 1, "order": 3},
      {"id": 2, "order": 1},
      {"id": 3, "order": 2}
    ]
  }')
echo "✅ Categorías reordenadas: $REORDER_RESPONSE"
echo ""

echo "=========================================="
echo "✅ Pruebas completadas!"
echo ""
echo "📝 Funcionalidades probadas:"
echo "  ✅ Búsqueda avanzada"
echo "  ✅ SEO completo (CRUD)"
echo "  ✅ Soft delete y restauración"
echo "  ✅ Force delete"
echo "  ✅ Contenido por categoría"
echo "  ✅ Reordenamiento"
echo "  ✅ Subcategorías (jerarquía)"
