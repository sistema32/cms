#!/bin/bash

BASE_URL="http://localhost:8000/api"

echo "🧪 Iniciando pruebas del CMS"
echo "================================"
echo ""

# 1. Registrar usuario
echo "1️⃣  Registrando usuario..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Error: No se pudo obtener el token"
  exit 1
fi

echo "✅ Usuario registrado, token obtenido"
echo ""

# 2. Obtener tipos de contenido
echo "2️⃣  Obteniendo tipos de contenido..."
curl -s -X GET "$BASE_URL/content-types" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 3. Obtener categorías (público)
echo "3️⃣  Obteniendo categorías (público)..."
curl -s -X GET "$BASE_URL/categories" | jq '.'
echo ""

# 4. Obtener tags (público)
echo "4️⃣  Obteniendo tags (público)..."
curl -s -X GET "$BASE_URL/tags" | jq '.'
echo ""

# 5. Crear un nuevo post
echo "5️⃣  Creando un nuevo post..."
CREATE_POST_RESPONSE=$(curl -s -X POST "$BASE_URL/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "contentTypeId": 1,
    "title": "Mi Primer Post",
    "slug": "mi-primer-post",
    "excerpt": "Este es un extracto del post",
    "body": "# Mi Primer Post\n\nEste es el contenido completo del post.",
    "status": "published",
    "visibility": "public",
    "publishedAt": "2025-11-01T00:00:00Z",
    "categoryIds": [1],
    "tagIds": [1, 2],
    "seo": {
      "metaTitle": "Mi Primer Post - Blog",
      "metaDescription": "Descripción SEO del post",
      "ogTitle": "Mi Primer Post",
      "ogDescription": "Post de prueba",
      "ogType": "article",
      "focusKeyword": "primer post"
    }
  }')

echo "$CREATE_POST_RESPONSE" | jq '.'
CONTENT_ID=$(echo "$CREATE_POST_RESPONSE" | jq -r '.content.id')
echo ""

# 6. Obtener el post creado por ID
echo "6️⃣  Obteniendo post por ID..."
curl -s -X GET "$BASE_URL/content/$CONTENT_ID" | jq '.'
echo ""

# 7. Obtener el post por slug (público)
echo "7️⃣  Obteniendo post por slug (público)..."
curl -s -X GET "$BASE_URL/content/slug/mi-primer-post" | jq '.'
echo ""

# 8. Listar todo el contenido
echo "8️⃣  Listando todo el contenido..."
curl -s -X GET "$BASE_URL/content" | jq '.'
echo ""

# 9. Crear una nueva categoría
echo "9️⃣  Creando una nueva categoría..."
curl -s -X POST "$BASE_URL/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Tutorial",
    "slug": "tutorial",
    "description": "Tutoriales paso a paso",
    "contentTypeId": 1,
    "color": "#ff6b6b",
    "icon": "📖"
  }' | jq '.'
echo ""

# 10. Crear un nuevo tag
echo "🔟 Creando un nuevo tag..."
curl -s -X POST "$BASE_URL/tags" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "CMS",
    "slug": "cms",
    "description": "Content Management System",
    "color": "#4ecdc4"
  }' | jq '.'
echo ""

echo "================================"
echo "✅ Todas las pruebas completadas!"
echo ""
echo "📊 Resumen:"
echo "  - Usuario registrado y autenticado"
echo "  - Tipos de contenido leídos"
echo "  - Categorías leídas (público)"
echo "  - Tags leídos (público)"
echo "  - Post creado con SEO y taxonomías"
echo "  - Post leído por ID y slug"
echo "  - Nueva categoría creada"
echo "  - Nuevo tag creado"
echo ""
