# SEO AI System Documentation

## Descripción General

Sistema de generación inteligente de metadatos SEO para LexCMS, que utiliza inteligencia artificial auto-hospedada (Ollama) para crear sugerencias optimizadas de SEO para contenido, categorías y medios.

**Características principales:**
- Generación de metadatos SEO bajo demanda (no automática)
- Modo preview: todas las sugerencias deben ser revisadas y aprobadas por el usuario
- Soporte para múltiples tipos de contenido (posts, páginas, categorías, media)
- Generación de etiquetas ALT para imágenes
- Generación de schema JSON-LD para SEO estructurado
- Modo simulación (mock) para testing sin AI
- Auto-hospedado con bajo consumo de recursos
- Validación automática de límites SEO

---

## Arquitectura del Sistema

### Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    REST API Endpoints                    │
│              (src/routes/seo.ts)                        │
│  POST /api/seo/suggest/content                          │
│  POST /api/seo/suggest/category                         │
│  POST /api/seo/suggest/media-alt                        │
│  POST /api/seo/suggest/schema                           │
│  POST /api/seo/regenerate-field                         │
│  GET  /api/seo/health                                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              SEO AI Service (Principal)                  │
│           (src/services/seoAiService.ts)                │
│  - Orquesta generación AI vs Mock                       │
│  - Maneja fallbacks y errores                           │
│  - Siempre retorna preview (nunca guarda)               │
└─────────────────────────────────────────────────────────┘
                   │                    │
         ┌─────────┴─────────┐         │
         ▼                   ▼         ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│  Ollama Client   │  │   Mock Service   │  │ Validators & │
│ (ollamaClient.ts)│  │(seoAiService     │  │  Formatters  │
│                  │  │     .mock.ts)    │  │              │
│ - HTTP client    │  │ - Simula AI      │  │ - Valida     │
│ - Retry logic    │  │ - Templates      │  │   límites    │
│ - Health checks  │  │ - Delays reales  │  │ - Trunca     │
└──────────────────┘  └──────────────────┘  └──────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│             Ollama Server (Externo)                      │
│          http://localhost:11434                         │
│  Modelos: qwen2.5:3b, llama3.2:3b, phi3:mini           │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Trabajo del Usuario

```
1. Usuario crea/edita Post/Página/Categoría
                │
                ▼
2. Usuario hace clic en "Generar SEO con AI" (botón)
                │
                ▼
3. Frontend envía POST a /api/seo/suggest/[tipo]
                │
                ▼
4. Backend genera sugerencias (AI o Mock)
                │
                ▼
5. Backend retorna { preview: true, suggestions, validation }
                │
                ▼
6. Frontend muestra PREVIEW editable
                │
                ▼
7. Usuario revisa, edita o rechaza
                │
         ┌──────┴──────┐
         ▼             ▼
    RECHAZA        APRUEBA
         │             │
         │             ▼
         │      Frontend guarda en BD
         │      (PUT/PATCH normal)
         │             │
         └─────────────┘
```

**IMPORTANTE**: El sistema SEO AI **NUNCA** guarda directamente en la base de datos. Solo genera sugerencias en modo preview.

---

## Instalación

### Requisitos

- Deno runtime (ya instalado en LexCMS)
- (Opcional) Ollama para AI real: https://ollama.com

### Opción 1: Modo Simulación (Sin AI)

Ideal para desarrollo y testing. No requiere instalación adicional.

**Configuración en `.env`:**
```env
OLLAMA_ENABLED=false
```

### Opción 2: Modo AI Real (Con Ollama)

#### Paso 1: Instalar Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS:**
```bash
brew install ollama
```

**Windows:**
Descargar instalador desde https://ollama.com

#### Paso 2: Descargar Modelo

Recomendamos **Qwen 2.5 3B** por su balance entre calidad y consumo:

```bash
ollama pull qwen2.5:3b
```

**Alternativas:**
```bash
ollama pull llama3.2:3b      # Más creativo
ollama pull phi3:mini         # Más rápido, menor calidad
```

#### Paso 3: Iniciar Ollama

```bash
ollama serve
```

Ollama se ejecutará en `http://localhost:11434`

#### Paso 4: Configurar LexCMS

**En `.env`:**
```env
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_TIMEOUT=30000
```

#### Paso 5: Verificar Estado

```bash
curl http://localhost:8000/api/seo/health
```

Respuesta esperada:
```json
{
  "success": true,
  "enabled": true,
  "available": true,
  "model": "qwen2.5:3b",
  "mode": "ai",
  "message": "AI disponible: qwen2.5:3b"
}
```

---

## API Endpoints

### 1. Generar SEO para Contenido (Posts/Páginas)

**Endpoint:** `POST /api/seo/suggest/content`

**Request Body:**
```json
{
  "title": "Cómo Implementar SEO en tu CMS",
  "excerpt": "Guía completa para optimizar el SEO de tu sistema de gestión de contenidos",
  "body": "El SEO es fundamental para...",
  "categories": ["SEO", "Web Development"],
  "contentType": "post"
}
```

**Response:**
```json
{
  "success": true,
  "preview": true,
  "suggestions": {
    "metaTitle": "Cómo Implementar SEO en tu CMS - Guía 2024",
    "metaDescription": "Guía completa para optimizar el SEO de tu sistema de gestión de contenidos. Aprende las mejores prácticas y técnicas avanzadas.",
    "ogTitle": "Descubre Cómo Implementar SEO en tu CMS - Tutorial Completo",
    "ogDescription": "Guía completa para optimizar el SEO de tu sistema de gestión de contenidos. Aprende las mejores prácticas, técnicas avanzadas y ejemplos prácticos.",
    "twitterTitle": "Cómo Implementar SEO en tu CMS",
    "twitterDescription": "Guía completa para optimizar el SEO de tu sistema de gestión de contenidos con mejores prácticas.",
    "focusKeyword": "implementar SEO CMS"
  },
  "validation": {
    "metaTitle": { "valid": true, "length": 48, "severity": "success" },
    "metaDescription": { "valid": true, "length": 158, "severity": "success" },
    "ogTitle": { "valid": true, "length": 62, "severity": "success" },
    "ogDescription": { "valid": true, "length": 182, "severity": "success" },
    "twitterTitle": { "valid": true, "length": 32, "severity": "success" },
    "twitterDescription": { "valid": true, "length": 112, "severity": "success" },
    "focusKeyword": { "valid": true, "length": 18, "severity": "success" }
  },
  "source": "mock"
}
```

### 2. Generar SEO para Categoría

**Endpoint:** `POST /api/seo/suggest/category`

**Request Body:**
```json
{
  "name": "Desarrollo Web",
  "description": "Artículos sobre desarrollo web moderno",
  "contentCount": 42,
  "contentType": "post"
}
```

**Response:** Similar a `/suggest/content`

### 3. Generar ALT Text para Media

**Endpoint:** `POST /api/seo/suggest/media-alt`

**Request Body:**
```json
{
  "originalFilename": "screenshot-dashboard-2024.png",
  "title": "Dashboard Principal",
  "caption": "Vista del panel de control",
  "description": "Panel de administración del CMS",
  "context": "Tutorial sobre configuración del CMS"
}
```

**Response:**
```json
{
  "success": true,
  "preview": true,
  "altSuggestion": "Panel de control del CMS mostrando estadísticas y configuración del sistema",
  "validation": {
    "valid": true,
    "length": 78,
    "severity": "success"
  },
  "source": "mock"
}
```

### 4. Generar Schema JSON-LD

**Endpoint:** `POST /api/seo/suggest/schema`

**Request Body:**
```json
{
  "type": "BlogPosting",
  "title": "Cómo Implementar SEO en tu CMS",
  "description": "Guía completa para optimizar el SEO",
  "author": "Juan Pérez",
  "publishedDate": "2024-01-15T10:00:00Z",
  "modifiedDate": "2024-01-20T15:30:00Z",
  "imageUrl": "https://example.com/image.jpg",
  "url": "https://example.com/posts/como-implementar-seo",
  "siteName": "Mi Blog"
}
```

**Response:**
```json
{
  "success": true,
  "preview": true,
  "schemaJson": "{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"BlogPosting\",\n  ...\n}",
  "schemaParsed": {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Cómo Implementar SEO en tu CMS",
    "description": "Guía completa para optimizar el SEO",
    "author": {
      "@type": "Person",
      "name": "Juan Pérez"
    },
    "datePublished": "2024-01-15T10:00:00.000Z",
    "dateModified": "2024-01-20T15:30:00.000Z",
    "image": "https://example.com/image.jpg",
    "url": "https://example.com/posts/como-implementar-seo",
    "publisher": {
      "@type": "Organization",
      "name": "Mi Blog",
      "logo": {
        "@type": "ImageObject",
        "url": "https://lexcms.com/logo.png"
      }
    }
  },
  "source": "mock"
}
```

### 5. Regenerar Campo Específico

**Endpoint:** `POST /api/seo/regenerate-field`

Útil cuando el usuario quiere regenerar solo un campo (ej: probar variaciones del metaTitle).

**Request Body:**
```json
{
  "field": "metaTitle",
  "originalValue": "Cómo Implementar SEO en tu CMS",
  "context": "Artículo sobre optimización SEO para sistemas de gestión de contenidos"
}
```

**Response:**
```json
{
  "success": true,
  "field": "metaTitle",
  "originalValue": "Cómo Implementar SEO en tu CMS",
  "newValue": "Guía: Cómo Implementar SEO en tu CMS - Tutorial 2024",
  "source": "mock"
}
```

**Campos soportados:** `metaTitle`, `metaDescription`, `ogTitle`, `ogDescription`, `twitterTitle`, `twitterDescription`, `focusKeyword`

### 6. Health Check

**Endpoint:** `GET /api/seo/health`

**Response (Mock mode):**
```json
{
  "success": true,
  "enabled": false,
  "available": false,
  "mode": "mock",
  "message": "Modo simulación activo (sin AI real)"
}
```

**Response (AI mode):**
```json
{
  "success": true,
  "enabled": true,
  "available": true,
  "model": "qwen2.5:3b",
  "mode": "ai",
  "message": "AI disponible: qwen2.5:3b"
}
```

### 7. Información del Servicio

**Endpoint:** `GET /api/seo/info`

**Response:**
```json
{
  "success": true,
  "service": "SEO AI Service",
  "version": "1.0.0",
  "endpoints": {
    "POST /api/seo/suggest/content": "Generar SEO para posts/páginas",
    "POST /api/seo/suggest/category": "Generar SEO para categorías",
    "POST /api/seo/suggest/media-alt": "Generar ALT text para imágenes",
    "POST /api/seo/suggest/schema": "Generar schema JSON-LD",
    "POST /api/seo/regenerate-field": "Regenerar un campo específico",
    "GET /api/seo/health": "Estado del servicio AI",
    "GET /api/seo/info": "Información del servicio"
  },
  "modes": {
    "ai": "Ollama con modelos LLM (requiere instalación)",
    "mock": "Simulación para testing/desarrollo sin AI"
  },
  "note": "Todas las respuestas son PREVIEW. El usuario debe revisar y aprobar antes de guardar."
}
```

---

## Testing

### Opción 1: Modo Simulación (Recomendado para inicio)

**Configurar en `.env`:**
```env
OLLAMA_ENABLED=false
```

**Probar endpoints:**

```bash
# 1. Verificar estado
curl http://localhost:8000/api/seo/health

# 2. Generar SEO para contenido
curl -X POST http://localhost:8000/api/seo/suggest/content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Primer Post con SEO AI",
    "excerpt": "Este es un post de prueba",
    "categories": ["Testing", "SEO"]
  }'

# 3. Generar ALT text
curl -X POST http://localhost:8000/api/seo/suggest/media-alt \
  -H "Content-Type: application/json" \
  -d '{
    "originalFilename": "test-image.jpg",
    "title": "Imagen de Prueba",
    "context": "Post sobre testing"
  }'

# 4. Regenerar campo
curl -X POST http://localhost:8000/api/seo/regenerate-field \
  -H "Content-Type: application/json" \
  -d '{
    "field": "metaTitle",
    "originalValue": "Mi Post",
    "context": "Post sobre testing de SEO"
  }'
```

### Opción 2: Con AI Real

**Configurar en `.env`:**
```env
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

**Asegurar que Ollama esté ejecutándose:**
```bash
ollama serve
```

**Ejecutar los mismos tests de arriba** - ahora usarán AI real.

---

## Límites SEO

El sistema valida automáticamente estos límites:

| Campo | Mínimo | Óptimo | Máximo | Notas |
|-------|--------|--------|--------|-------|
| `metaTitle` | 30 | 50-60 | 60 | Truncado por Google después de 60 |
| `metaDescription` | 70 | 150-160 | 160 | Truncado por Google después de 160 |
| `ogTitle` | 30 | 60-90 | 90 | Más flexibilidad que metaTitle |
| `ogDescription` | 70 | 200-300 | 300 | Más espacio que metaDescription |
| `twitterTitle` | 30 | 50-70 | 70 | Similar a metaTitle |
| `twitterDescription` | 70 | 150-200 | 200 | Similar a metaDescription |
| `altText` | 10 | 80-100 | 125 | Accesibilidad y SEO |
| `focusKeyword` | 3 | 10-30 | 50 | 1-3 palabras idealmente |

**Severidades:**
- `success`: Dentro del rango óptimo
- `warning`: Fuera del óptimo pero aceptable
- `error`: Excede límites o muy corto

---

## Configuración de Variables de Entorno

Todas las configuraciones en `.env`:

```env
# =========================================
# SEO AI - Sistema de generación automática de metadatos SEO
# =========================================

# Habilitar/deshabilitar AI real (false = modo simulación/mock)
OLLAMA_ENABLED=false

# URL del servidor Ollama
OLLAMA_BASE_URL=http://localhost:11434

# Modelo a usar (debe estar descargado con: ollama pull qwen2.5:3b)
OLLAMA_MODEL=qwen2.5:3b

# Timeout en milisegundos (30000 = 30 segundos)
OLLAMA_TIMEOUT=30000
```

### Variables Explicadas

- **`OLLAMA_ENABLED`**: Cambia entre modo AI real y simulación
  - `false`: Usa mock (no requiere Ollama)
  - `true`: Usa AI real (requiere Ollama ejecutándose)

- **`OLLAMA_BASE_URL`**: URL del servidor Ollama
  - Default: `http://localhost:11434`
  - Cambiar si Ollama está en otro servidor

- **`OLLAMA_MODEL`**: Modelo a usar
  - Recomendado: `qwen2.5:3b` (balance calidad/velocidad)
  - Alternativas: `llama3.2:3b`, `phi3:mini`
  - Debe estar descargado: `ollama pull <modelo>`

- **`OLLAMA_TIMEOUT`**: Timeout en milisegundos
  - Default: `30000` (30 segundos)
  - Aumentar si modelos más grandes son lentos
  - Disminuir para fallar más rápido

---

## Troubleshooting

### Problema: "Ollama no disponible"

**Síntomas:**
```json
{
  "success": false,
  "enabled": true,
  "available": false,
  "mode": "mock"
}
```

**Soluciones:**
1. Verificar que Ollama esté ejecutándose:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Iniciar Ollama si no está corriendo:
   ```bash
   ollama serve
   ```

3. Verificar firewall/puertos

4. Cambiar temporalmente a modo mock:
   ```env
   OLLAMA_ENABLED=false
   ```

### Problema: "No se pudo parsear la respuesta de AI"

**Síntomas:** Errores en logs sobre JSON parsing

**Causas comunes:**
- Modelo no descargado correctamente
- Modelo pequeño con respuestas inconsistentes
- Timeout muy corto

**Soluciones:**
1. Re-descargar modelo:
   ```bash
   ollama pull qwen2.5:3b
   ```

2. Probar modelo más grande:
   ```env
   OLLAMA_MODEL=qwen2.5:7b
   ```

3. Aumentar timeout:
   ```env
   OLLAMA_TIMEOUT=60000
   ```

4. Verificar logs de Ollama:
   ```bash
   ollama logs
   ```

### Problema: Respuestas lentas

**Causas:**
- Modelo grande para el hardware
- Primera llamada (carga modelo)
- CPU limitada

**Soluciones:**
1. Usar modelo más pequeño:
   ```env
   OLLAMA_MODEL=phi3:mini
   ```

2. Pre-cargar modelo:
   ```bash
   ollama run qwen2.5:3b "test"
   ```

3. Aumentar timeout pero usar fallback:
   ```env
   OLLAMA_TIMEOUT=45000
   ```

### Problema: Mock siempre retorna mismos datos

**Esto es esperado** - Mock usa templates con variación aleatoria limitada.

**Soluciones:**
- Para testing: usar datos de entrada variados
- Para producción: cambiar a modo AI real (`OLLAMA_ENABLED=true`)

### Problema: Validación falla (campos muy largos)

**Síntomas:**
```json
{
  "metaTitle": {
    "valid": false,
    "length": 75,
    "severity": "error",
    "warning": "Demasiado largo..."
  }
}
```

**Esto es informativo, no un error** - el sistema ya trunca automáticamente.

**Si persiste con AI real:**
1. El sistema ya aplica truncado automático
2. Revisar prompts en `src/utils/seo/prompts.ts`
3. Ajustar temperature (menor = más preciso):
   ```typescript
   temperature: 0.5  // En vez de 0.7
   ```

---

## Consideraciones de Rendimiento

### Recursos del Sistema

**Modo Mock:**
- RAM: Insignificante (~10 MB)
- CPU: Mínima
- Latencia: 200-500ms (simulada)

**Modo AI (Qwen 2.5 3B Q4):**
- RAM: ~2.5 GB (modelo cargado)
- CPU: Media-Alta durante generación
- Latencia: 2-10 segundos (primera vez: 10-20s para cargar)
- Disco: ~2 GB (modelo descargado)

### Optimización

1. **Pre-cargar modelo** al iniciar servidor:
   ```bash
   ollama run qwen2.5:3b "warmup"
   ```

2. **Cachear respuestas** (futuro):
   - Implementar cache de sugerencias por hash de contenido

3. **Limitar concurrencia**:
   - Ollama puede manejar 1-2 requests simultáneos
   - Implementar cola si se esperan muchos requests

4. **Usar GPU** si disponible:
   - Ollama detecta GPU automáticamente
   - Reduce latencia de 10s → 2s

---

## Extensiones Futuras

Posibles mejoras al sistema:

1. **Cache de sugerencias**
   - Evitar regenerar para contenido similar
   - Redis o cache en memoria

2. **Batch processing**
   - Generar SEO para múltiples posts de una vez
   - Útil para migración de contenido antiguo

3. **A/B testing de variantes**
   - Generar múltiples opciones
   - Tracking de rendimiento SEO

4. **Análisis de competencia**
   - Analizar SEO de URLs competidoras
   - Sugerencias basadas en mejores prácticas de la industria

5. **Integración con analytics**
   - Feedback de CTR en SERPs
   - Mejora continua de prompts

6. **Modelos especializados**
   - Modelos fine-tuned para SEO español
   - Modelos por industria/nicho

7. **API de traducción**
   - Generar SEO en múltiples idiomas
   - Mantener consistencia entre traducciones

---

## Soporte

Para reportar problemas o sugerencias:
- Revisar logs del servidor: `deno task dev`
- Verificar logs de Ollama: `ollama logs`
- Revisar estado: `GET /api/seo/health`
- Consultar esta documentación

## Licencia

Parte de LexCMS - Sistema de Gestión de Contenidos
