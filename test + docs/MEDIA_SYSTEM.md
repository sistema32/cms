# 📸 Sistema de Media - Documentación Completa

## ✅ Estado: IMPLEMENTADO

Sistema completo de gestión de archivos multimedia con procesamiento automático, sanitización y optimización.

## 🎯 Características Principales

### 1. Conversión Automática de Formatos
- **Imágenes** → WebP (optimizado para web)
- **Videos** → WebM VP9 (codec moderno)
- **Audio** → WebM Opus (alta calidad, bajo peso)
- **Documentos** → PDF (formato universal)

### 2. Sanitización Completa
✅ **Eliminación de metadatos**:
- EXIF de imágenes (ubicación, cámara, fecha, etc.)
- Metadatos de video/audio
- Metadatos de PDF
- Información sensible del sistema

✅ **Nombres de archivo seguros**:
- Hash SHA-256 para prevenir duplicados
- Nombres sanitizados (sin caracteres especiales)
- Timestamp para unicidad
- Formato: `{hash_16chars}_{timestamp}.{ext}`

### 3. Procesamiento Inteligente de Imágenes
✅ **Múltiples tamaños generados automáticamente**:
- **thumbnail**: 150x150px (crop centrado)
- **small**: 300px de ancho
- **medium**: 768px de ancho
- **large**: 1024px de ancho
- **xlarge**: 1920px de ancho
- **original**: Tamaño completo optimizado

✅ **Optimización**:
- Compresión WebP 85% (balance calidad/tamaño)
- Original a 90% de calidad
- Eliminación automática de metadatos EXIF

### 4. SEO Avanzado para Media
✅ **Campos SEO disponibles**:
- `alt`: Texto alternativo (crítico para accesibilidad)
- `title`: Título del archivo
- `caption`: Descripción corta
- `description`: Descripción larga
- `focusKeyword`: Palabra clave SEO
- `credits`: Atribución/autor
- `copyright`: Información de copyright

### 5. Seguridad
✅ **Validaciones**:
- Tipos MIME permitidos (whitelist)
- Límites de tamaño por tipo
- Hash para detectar duplicados
- Validación de archivos corruptos

✅ **Límites de tamaño**:
- Imágenes: 10MB
- Videos: 100MB
- Audio: 50MB
- Documentos: 20MB

## 📊 Estructura de Base de Datos

### Tabla: `media`
```sql
- id, filename, originalFilename
- mimeType, size, hash
- path, url, storageProvider
- type (image/video/audio/document)
- width, height, duration
- uploadedBy
- createdAt, updatedAt
```

### Tabla: `media_sizes`
```sql
- id, mediaId
- size (thumbnail/small/medium/large/xlarge/original)
- width, height
- path, url, fileSize
- createdAt
```

### Tabla: `media_seo`
```sql
- id, mediaId
- alt, title, caption, description
- focusKeyword, credits, copyright
- createdAt, updatedAt
```

## 🛣️ API Endpoints

### Upload de Media
```http
POST /api/media
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
  - file: (binary)
  - seo: { "alt": "Descripción", "title": "Título" } (JSON opcional)

Response 201:
{
  "media": {
    "media": {
      "id": 1,
      "filename": "abc123..._1234567890.webp",
      "originalFilename": "mi-imagen.png",
      "mimeType": "image/webp",
      "size": 45678,
      "hash": "abc123...",
      "url": "http://localhost:8000/uploads/2025/11/abc123..._1234567890.webp",
      "type": "image",
      "width": 1920,
      "height": 1080
    },
    "sizes": [
      {
        "size": "thumbnail",
        "width": 150,
        "height": 150,
        "url": "http://localhost:8000/uploads/2025/11/abc123..._1234567890-thumbnail.webp",
        "fileSize": 5678
      },
      // ... más tamaños
    ],
    "seo": {
      "alt": "Descripción",
      "title": "Título"
    }
  }
}
```

### Listar Media
```http
GET /api/media?limit=20&offset=0&type=image
Authorization: Bearer {token}

Response 200:
{
  "media": [...],
  "limit": 20,
  "offset": 0
}
```

### Ver Media por ID
```http
GET /api/media/:id
Authorization: Bearer {token}

Response 200:
{
  "media": {
    "media": {...},
    "sizes": [...],
    "seo": {...}
  }
}
```

### Actualizar SEO
```http
PATCH /api/media/:id/seo
Authorization: Bearer {token}
Content-Type: application/json

{
  "alt": "Nueva descripción",
  "title": "Nuevo título",
  "focusKeyword": "keyword"
}

Response 200:
{
  "media": {...}
}
```

### Eliminar Media
```http
DELETE /api/media/:id
Authorization: Bearer {token}

Response 200:
{
  "message": "Media eliminado exitosamente"
}
```

### Servir Archivos
```http
GET /uploads/{year}/{month}/{filename}

Response 200:
Content-Type: image/webp | video/webm | audio/webm | application/pdf
Cache-Control: public, max-age=31536000
```

## 🔧 Herramientas Requeridas

### Producción
Para que todas las funcionalidades trabajen correctamente, instala:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y ffmpeg libreoffice exiftool

# Verificar instalación
ffmpeg -version
libreoffice --version
exiftool -ver
```

### Funcionalidad por Herramienta
- **FFmpeg**: Conversión de video y audio a WebM
- **LibreOffice**: Conversión de documentos Office a PDF
- **ExifTool**: Eliminación avanzada de metadatos PDF

**NOTA**: Las imágenes se procesan con ImageScript (puro TypeScript), no requiere dependencias externas.

## 📁 Estructura de Archivos

```
uploads/
├── 2025/
│   └── 11/
│       ├── abc123..._1234567890.webp (original)
│       ├── abc123..._1234567890-thumbnail.webp
│       ├── abc123..._1234567890-small.webp
│       ├── abc123..._1234567890-medium.webp
│       ├── abc123..._1234567890-large.webp
│       ├── abc123..._1234567890-xlarge.webp
│       └── abc123..._1234567890-original.webp
```

## 🔐 Permisos RBAC

### Módulo: `media`
- **create**: Subir archivos
- **read**: Ver archivos
- **update**: Actualizar metadata/SEO
- **delete**: Eliminar archivos

### Roles Predefinidos
- **superadmin**: Todos los permisos (35 totales, incluyendo media)
- **admin**: Permisos limitados
- **user**: Solo puede subir y ver sus propios archivos
- **guest**: Sin acceso a media

## 💡 Ejemplos de Uso

### 1. Subir una Imagen con SEO
```bash
curl -X POST http://localhost:8000/api/media \
  -H "Authorization: Bearer {token}" \
  -F "file=@foto.jpg" \
  -F 'seo={"alt":"Descripción de la foto","title":"Mi Foto","focusKeyword":"paisaje"}'
```

### 2. Subir un Video
```bash
curl -X POST http://localhost:8000/api/media \
  -H "Authorization: Bearer {token}" \
  -F "file=@video.mp4"
```

### 3. Subir un Documento
```bash
curl -X POST http://localhost:8000/api/media \
  -H "Authorization: Bearer {token}" \
  -F "file=@documento.docx"
```

## ⚡ Flujo de Procesamiento

### Para Imágenes:
1. Validar tipo MIME y tamaño
2. Calcular hash SHA-256
3. Verificar duplicados
4. Procesar imagen → WebP
5. Generar 6 tamaños diferentes
6. Guardar archivos en disco
7. Crear registros en BD
8. Guardar SEO si se proporcionó

### Para Videos:
1. Validar tipo MIME y tamaño
2. Calcular hash SHA-256
3. Guardar archivo temporal
4. Convertir a WebM VP9 con FFmpeg
5. Eliminar metadatos automáticamente
6. Obtener dimensiones y duración
7. Guardar archivo final
8. Limpiar temporales

### Para Audio:
1. Similar a video
2. Convertir a WebM Opus
3. No se guardan dimensiones

### Para Documentos:
1. Validar tipo MIME y tamaño
2. Si es PDF → limpiar metadatos con ExifTool
3. Si no es PDF → convertir con LibreOffice
4. Limpiar metadatos del PDF resultante
5. Guardar archivo final

## 🎨 Integración con Contenido

El campo `featuredImageId` en la tabla `content` se relaciona con `media.id`:

```typescript
// Al crear contenido
{
  title: "Mi Post",
  featuredImageId: 1, // ID del media
  // ... otros campos
}
```

## 🚀 Optimizaciones Implementadas

✅ **WebP para imágenes**:
- 25-35% más pequeño que JPEG
- Soporta transparencia (mejor que PNG)
- Amplio soporte en navegadores modernos

✅ **WebM para video/audio**:
- VP9: 50% mejor compresión que H.264
- Opus: Mejor calidad que MP3 a menor bitrate
- Código abierto, sin royalties

✅ **PDF para documentos**:
- Formato universal
- Compatible con todos los sistemas
- Mantiene el formato original

✅ **Cache de 1 año**:
- Headers HTTP con max-age
- Reducción de bandwidth
- Mejor performance

## 🛡️ Seguridad Implementada

✅ **Prevención de duplicados**: Hash SHA-256
✅ **Sanitización de nombres**: Regex estricto
✅ **Validación de tipos**: Whitelist MIME
✅ **Límites de tamaño**: Por tipo de archivo
✅ **Eliminación de metadatos**: EXIF, XMP, IPTC
✅ **Permisos RBAC**: Control de acceso
✅ **Validación de archivos**: Detecta corruptos

## 📈 Métricas

Por cada imagen subida:
- **1 archivo original** procesado
- **6 tamaños** generados automáticamente
- **Total: 7 archivos** WebP optimizados
- **Ahorro promedio**: 30-40% vs formatos originales

## 🔄 Próximas Mejoras Posibles

- [ ] Soporte para Cloud Storage (S3, Cloudinary)
- [ ] Procesamiento asíncrono con workers
- [ ] Generación de thumbnails para videos
- [ ] Watermarks automáticos
- [ ] Compresión de PDF
- [ ] OCR para extraer texto de imágenes
- [ ] Detección de contenido inapropiado
- [ ] CDN integration

## ✨ Resumen

Sistema de media **production-ready** con:
- ✅ 3 tablas de base de datos
- ✅ 4 tipos de media soportados
- ✅ Conversión automática de formatos
- ✅ Sanitización completa
- ✅ 6 tamaños de imagen automáticos
- ✅ SEO completo
- ✅ RBAC integrado
- ✅ 6 endpoints de API
- ✅ Servicio de archivos estáticos
- ✅ Optimización para web
- ✅ Seguridad avanzada

**Estado:** ✅ Listo para uso
