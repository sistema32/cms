# 🔍 Corporate Theme - Guía de Diagnóstico y Solución

## ✅ Estado de los Archivos

- ✅ CSS: `src/themes/corporate/assets/css/corporate.css` (396 líneas)
- ✅ JS: `src/themes/corporate/assets/js/corporate.js` (259 líneas)
- ✅ Layout: `src/themes/corporate/templates/Layout.tsx`
- ✅ Home: `src/themes/corporate/templates/home.tsx`
- ✅ CSP: Actualizado para permitir Tailwind CDN y Google Fonts

## 🚨 Pasos de Diagnóstico

### Paso 1: Verificar que el Servidor Está Actualizado

```bash
# 1. Detener el servidor (Ctrl+C)

# 2. Asegurarse de estar en la branch correcta
git status
# Debe decir: On branch claude/code-review-011CUqCVnX8xUPa2gqRZYdMt

# 3. Pull de los últimos cambios
git pull origin claude/code-review-011CUqCVnX8xUPa2gqRZYdMt

# 4. Reiniciar el servidor
deno task dev
```

### Paso 2: Limpiar Cache COMPLETAMENTE

**⚠️ IMPORTANTE:** El navegador cachea agresivamente las políticas de CSP y los assets.

**Opción A - Chrome/Edge DevTools:**
1. Abrir DevTools (F12)
2. Click derecho en el botón de refresh (⟳)
3. Seleccionar "Empty Cache and Hard Reload"

**Opción B - Limpiar datos del sitio:**
1. Chrome: `chrome://settings/siteData`
2. Buscar "localhost"
3. Click en icono de basura para eliminar todo
4. Cerrar y reabrir el navegador

**Opción C - Usar Incógnito/Privado:**
1. Abrir ventana de incógnito (Ctrl+Shift+N)
2. Ir a `http://localhost:8000/`

### Paso 3: Verificar en DevTools

**Abrir DevTools (F12) y verificar:**

#### A. Console Tab

**DEBE ESTAR VACÍA** - Sin errores. Si ves:

```
❌ Content-Security-Policy blocked...
   → El CSP aún está cacheado. Limpia cache y recarga.

❌ Failed to load resource: /themes/corporate/assets/...
   → El servidor no está sirviendo los assets. Ver Paso 5.

❌ Uncaught ReferenceError: tailwind is not defined
   → Tailwind CDN está bloqueado. Ver CSP.
```

#### B. Network Tab

Filtrar por "corporate" y verificar:

```
✅ /themes/corporate/assets/css/corporate.css - Status: 200 OK
✅ /themes/corporate/assets/js/corporate.js - Status: 200 OK
✅ cdn.tailwindcss.com - Status: 200 OK
✅ fonts.googleapis.com - Status: 200 OK
✅ fonts.gstatic.com - Status: 200 OK
```

Si alguno muestra:
- `Status: 404` → El servidor no encuentra el archivo
- `Status: (blocked:csp)` → CSP aún bloqueando
- `Status: (failed)` → Error de red

#### C. Elements Tab

1. Inspeccionar el `<body>` tag
2. Debe tener clases: `home front-page corporate-theme light-mode`
3. Buscar el `<link>` tag del CSS:
   ```html
   <link rel="stylesheet" href="/themes/corporate/assets/css/corporate.css">
   ```
4. Click derecho > "Open in new tab"
5. Debe mostrar el contenido del CSS

### Paso 4: Verificar CSS Aplicado

En DevTools > Elements > Styles:

1. Seleccionar el `<body>` tag
2. En el panel "Styles", deberías ver:
   ```css
   body {
     font-family: Inter, system-ui, -apple-system, sans-serif;
     color: #f1f5f9;
     line-height: 1.7;
     background: #020617;
   }
   ```

Si **NO** ves estos estilos:
- ❌ El CSS no se está cargando
- ❌ El CSS está bloqueado por CSP
- ❌ Hay un problema con la ruta del archivo

### Paso 5: Verificar Archivos Manualmente

```bash
# En la terminal del proyecto:

# 1. Verificar que los archivos existen
ls -lah src/themes/corporate/assets/css/corporate.css
ls -lah src/themes/corporate/assets/js/corporate.js

# 2. Ver primeras líneas
head -20 src/themes/corporate/assets/css/corporate.css

# 3. Verificar ruta completa
pwd
# Debe ser: /home/user/cms (o donde tengas el proyecto)
```

### Paso 6: Probar Acceso Directo a Assets

Mientras el servidor está corriendo, abrir en el navegador:

```
http://localhost:8000/themes/corporate/assets/css/corporate.css
http://localhost:8000/themes/corporate/assets/js/corporate.js
```

**Debe mostrar el contenido de los archivos.**

Si muestra `404`:
- ❌ El servidor estático no está configurado correctamente
- ❌ La ruta es incorrecta

## 🔧 Soluciones Comunes

### Problema 1: "El tema se activa pero no cambia nada"

**Solución:**
```bash
# 1. Detener servidor
# 2. Limpiar cache de Deno
deno cache --reload src/main.ts
# 3. Reiniciar
deno task dev
# 4. Hard refresh en navegador (Ctrl+Shift+R)
```

### Problema 2: "Error de CSP en consola"

**Verificar que CSP está actualizado:**
```bash
grep -A 10 "CSP para el sitio público" src/middleware/security.ts
```

Debe contener:
```javascript
script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
```

### Problema 3: "CSS/JS no se cargan (404)"

**Verificar configuración de serveStatic:**
```bash
grep "serveStatic" src/routes/frontend.ts
```

Debe mostrar:
```javascript
frontendRouter.get("/themes/*", serveStatic({ root: "./src" }));
```

### Problema 4: "Tailwind no funciona"

**Si las clases de Tailwind no aplican estilos:**

1. Verificar que Tailwind CDN se carga en Network tab
2. Verificar que no hay error `tailwind is not defined` en consola
3. El script de configuración debe estar DESPUÉS del CDN:
   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   <script>
     tailwind.config = { ... }
   </script>
   ```

### Problema 5: "Google Fonts no cargan"

1. Verificar Network tab: `fonts.googleapis.com` debe ser 200
2. Si está bloqueado, el CSP necesita actualización
3. Si es 403, hay problema de conectividad

## 📸 Cómo Debe Verse el Tema Corporate

### Light Mode (Por defecto)

- ✅ Fondo: Gradientes sutiles azul/turquesa sobre gris claro (#f1f5f9)
- ✅ Texto: Negro/gris oscuro (#0f172a)
- ✅ Cards: Glassmorphism con fondo blanco/transparente
- ✅ Header: Sticky con backdrop blur, fondo blanco
- ✅ Aurora: Efectos animados sutiles en el fondo
- ✅ Botones: Azul primario con sombras
- ✅ Toggle: Icono de sol (☀️) en el header

### Dark Mode

- ✅ Fondo: Negro/azul muy oscuro (#020617)
- ✅ Texto: Blanco/gris claro (#f1f5f9)
- ✅ Cards: Glassmorphism con fondo oscuro/transparente
- ✅ Header: Sticky con backdrop blur, fondo oscuro
- ✅ Aurora: Efectos más intensos y vibrantes
- ✅ Toggle: Icono de luna (🌙) en el header

### Efectos Interactivos

- ✅ Aurora sigue el mouse (mover cursor debe mover gradientes)
- ✅ Scroll reveal (elementos aparecen al hacer scroll)
- ✅ Hover en cards (sombra y borde brillante)
- ✅ Mobile menu funcional
- ✅ Smooth scroll en links de ancla

## 🆘 Si Nada Funciona

**Resetear todo desde cero:**

```bash
# 1. Detener servidor

# 2. Limpiar cache de Deno
rm -rf ~/.cache/deno

# 3. Reinstalar dependencias
npm install

# 4. Verificar branch
git status
git log --oneline -5

# 5. Reiniciar
deno task dev

# 6. En navegador:
#    - Limpiar todos los datos de localhost
#    - Cerrar y reabrir navegador
#    - Abrir en modo incógnito
#    - Ir a http://localhost:8000/
```

## 📊 Checklist Final

Antes de reportar problema, verificar:

- [ ] Estoy en la branch correcta (`claude/code-review-011CUqCVnX8xUPa2gqRZYdMt`)
- [ ] Hice `git pull` de los últimos cambios
- [ ] Reinicié el servidor Deno
- [ ] Limpié el cache del navegador completamente
- [ ] No hay errores en Console (F12)
- [ ] Los assets tienen status 200 en Network tab
- [ ] Tailwind CDN se carga (200)
- [ ] Google Fonts se cargan (200)
- [ ] Abrí en modo incógnito para probar

## 🔎 Información para Debug

Si el problema persiste, proporciona:

1. **Screenshot del tema** (cómo se ve mal)
2. **Console errors** (DevTools > Console)
3. **Network tab filtered by "corporate"** (qué assets fallan)
4. **Output del comando:**
   ```bash
   git log --oneline -3
   git status
   deno --version
   ```

---

**Última actualización:** Commit `1c3dcc4` - CSP fix applied
