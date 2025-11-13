# 📄 Sistema de Homepage Configurable

Sistema flexible de homepage inspirado en WordPress que permite controlar qué contenido se muestra en la portada del sitio, independiente del theme activo.

## 🎯 Características

- ✅ **Homepage dinámica** - Elige entre lista de posts o página estática
- ✅ **Independiente del theme** - Funciona con cualquier theme instalado
- ✅ **Redirecciones automáticas** - Evita contenido duplicado (SEO-friendly)
- ✅ **Compatible con paginación** - Maneja correctamente todas las URLs
- ✅ **Configuración desde admin** - Sin tocar código

---

## 📊 Escenarios de Uso

### Escenario 1: Blog en la Homepage

**Configuración:**
```
Configuración → Lectura
├─ Página de inicio: "Entradas recientes"
└─ Base del blog: "blog"
```

**Resultado:**
```
/          → Lista de posts (blog.tsx)
/page/2    → Página 2 de posts
/page/3    → Página 3 de posts
/blog      → Redirige a /
/blog/page/2 → Redirige a /page/2
```

**Caso de uso:** Blog tradicional, sitio de noticias, portfolio de artículos.

---

### Escenario 2: Página Estática + Blog Separado

**Configuración:**
```
Configuración → Lectura
├─ Página de inicio: "Una página estática"
├─ Página estática: ID 5 (ej: "Bienvenida")
└─ Base del blog: "blog"
```

**Resultado:**
```
/                → Página estática ID 5
/blog            → Lista de posts
/blog/page/2     → Página 2 de posts
/blog/mi-articulo → Post individual
```

**Caso de uso:** Sitio corporativo, landing page + blog, sitio de servicios.

---

### Escenario 3: Homepage Personalizada + Noticias

**Configuración:**
```
Configuración → Lectura
├─ Página de inicio: "Una página estática"
├─ Página estática: ID 5
└─ Base del blog: "noticias"
```

**Resultado:**
```
/                      → Página estática ID 5
/noticias              → Lista de posts
/noticias/page/2       → Página 2
/noticias/nueva-sede   → Post individual
```

**Caso de uso:** Sitio institucional, portal de noticias, sitio educativo.

---

## ⚙️ Configuración

### Desde el Admin Panel

1. **Ve a**: `Configuración → Lectura`

2. **Configura "Página de inicio":**
   - **Entradas recientes**: Muestra el blog en `/`
   - **Una página estática**: Selecciona una página por ID

3. **Configura "Base del blog"** (opcional):
   - Por defecto: `blog`
   - Puedes cambiarlo a: `noticias`, `articulos`, `posts`, etc.

4. **Guarda los cambios**

¡Listo! Los cambios se aplican inmediatamente.

---

## 🔀 Tabla de Redirecciones

Dependiendo de la configuración, las URLs se redirigen automáticamente:

| Configuración | URL Solicitada | Redirección | Contenido Final |
|--------------|----------------|-------------|-----------------|
| `posts` en homepage | `/blog` | → `/` | Lista de posts |
| `posts` en homepage | `/blog/page/2` | → `/page/2` | Página 2 de posts |
| `posts` en homepage | `/page/1` | → `/` | Lista de posts |
| `page` en homepage | `/page/2` | → `/blog/page/2` | Página 2 de posts |
| Cualquiera | `/blog/page/1` | → `/blog` | Lista de posts |

---

## 🏗️ Arquitectura Técnica

### Funciones Auxiliares

```typescript
// src/routes/frontend.ts

renderBlogTemplate(c, page)
// Renderiza la lista de posts con paginación

renderPageById(c, pageId)
// Renderiza una página estática por ID

renderHomeTemplate(c)
// Renderiza el template home.tsx tradicional
```

### Lógica de Decisión

```typescript
frontendRouter.get("/", async (c) => {
  const frontPageType = await getSetting("front_page_type", "posts");
  const frontPageId = await getSetting("front_page_id", null);

  if (frontPageType === "posts") {
    return await renderBlogTemplate(c, 1);
  }

  if (frontPageType === "page" && frontPageId) {
    return await renderPageById(c, frontPageId);
  }

  return await renderHomeTemplate(c);
});
```

---

## 🎨 Compatibilidad con Themes

**Todos los themes son compatibles** sin necesidad de modificaciones:

- ✅ **base**
- ✅ **corporate**
- ✅ **magazine**
- ✅ **minimalist**
- ✅ **modern**
- ✅ **default**
- ✅ Cualquier theme personalizado

El sistema usa los templates estándar de cada theme:
- `blog.tsx` - Lista de posts
- `page.tsx` - Páginas estáticas
- `home.tsx` - Homepage tradicional (fallback)

---

## 📝 Settings Usados

| Setting | Tipo | Descripción | Valor por defecto |
|---------|------|-------------|-------------------|
| `front_page_type` | select | Tipo de homepage | `"posts"` |
| `front_page_id` | number | ID de página estática | `null` |
| `posts_page_id` | number | ID de página de posts (reservado) | `null` |
| `blog_base` | string | Ruta base del blog | `"blog"` |

---

## 🚀 Casos de Uso Avanzados

### 1. Múltiples Secciones de Posts

**Problema:** Necesitas `/blog` y `/noticias` separados.

**Solución:**
- Usa la configuración actual para uno
- Crea rutas personalizadas para el otro
- Usa categorías/tags para filtrar

### 2. Homepage con Posts + Widgets

**Problema:** Quieres mostrar posts pero con contenido personalizado arriba.

**Solución:**
- Usa `front_page_type = "posts"`
- Personaliza `blog.tsx` para agregar hero/widgets en el theme

### 3. Landing Page Temporal

**Problema:** Promoción temporal, luego volver al blog.

**Solución:**
1. Cambia a `"page"` y selecciona la landing
2. Cuando termine, vuelve a `"posts"`

---

## 🔧 Troubleshooting

### "La homepage muestra 404"
- **Causa:** `front_page_id` apunta a una página que no existe
- **Solución:** Verifica que la página con ese ID existe en la DB

### "Los posts no aparecen en ningún lado"
- **Causa:** `front_page_type = "page"` pero no hay ruta de blog
- **Solución:** Asegúrate de que `blog_base` está configurado

### "Redirección infinita"
- **Causa:** Conflicto entre `blog_base` y rutas personalizadas
- **Solución:** Cambia `blog_base` a una ruta única

### "El template no carga los estilos"
- **Causa:** Theme sin `main.css` o `main.js`
- **Solución:** Asegúrate de que el theme tenga estos archivos

---

## 📚 Ejemplos Reales

### Blog Personal
```
front_page_type = "posts"
blog_base = "blog"
```
Resultado: Blog clásico con posts en `/`

### Sitio Corporativo
```
front_page_type = "page"
front_page_id = 1 (página "Inicio")
blog_base = "noticias"
```
Resultado: Landing corporativa + sección de noticias

### Portal de Contenido
```
front_page_type = "posts"
blog_base = "articulos"
```
Resultado: Feed de contenido en la homepage

---

## 🎯 Próximas Mejoras

- [ ] Soporte para `posts_page_id` (personalizar configuración del blog)
- [ ] Múltiples áreas de posts (`/blog`, `/noticias`, `/tutoriales`)
- [ ] Templates personalizados por página
- [ ] Preview de cambios antes de aplicar

---

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:
1. Revisa esta documentación
2. Verifica los logs del servidor (busca `📄` y `🔄`)
3. Comprueba la configuración en Admin Panel
4. Reporta issues en GitHub

---

**Documentación creada:** 2025-01-13
**Versión:** 1.0.0
**Compatible con:** LexCMS 1.x
