# 🚀 Guía Rápida: Solución de Errores al Iniciar

## 📋 Resumen de Problemas y Soluciones

### ✅ Problema 1: "no such table: ip_block_rules" - RESUELTO

**Estado:** ✅ Corregido
**Solución aplicada:** Migración de base de datos ejecutada
**Archivo:** `lexcms.db` actualizado con tablas de seguridad

---

### ⚠️ Problema 2: "createHash not exported from std/crypto"

**Estado:** 🔧 Requiere acción manual
**Error:**
```
error: Uncaught SyntaxError: The requested module
'https://deno.land/std@0.224.0/crypto/mod.ts'
does not provide an export named 'createHash'
```

**Causa:** Deno std 0.224.0+ no exporta `createHash` desde `std/crypto/mod.ts`

## 🛠️ Solución Rápida (3 pasos)

### Paso 1: Verificar archivos problemáticos

```bash
./check-createhash-usage.sh
```

### Paso 2: Aplicar corrección automática

**Opción A - Automático (Recomendado):**
```bash
deno run --allow-read --allow-write fix-createhash-imports.ts
```

**Opción B - Manual:**
Edita `src/services/themeCacheService.ts` (y otros archivos reportados):

```typescript
// ❌ ANTES
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// ✅ DESPUÉS
import { createHash } from "node:crypto";
```

### Paso 3: Verificar y ejecutar

```bash
# Verificar sintaxis
deno check src/services/themeCacheService.ts

# Ejecutar el proyecto
deno task dev
```

## 📁 Archivos de Ayuda Incluidos

| Archivo | Descripción |
|---------|-------------|
| `FIX_CREATEHASH_ERROR.md` | Documentación detallada del problema |
| `fix-createhash-imports.ts` | Script de corrección automática |
| `check-createhash-usage.sh` | Verificador de archivos problemáticos |
| `themeCacheService.example.ts` | Ejemplo de código corregido |
| `MIGRATION_INSTRUCTIONS.md` | Instrucciones de migración de BD |
| `apply-security-migration.ts` | Script de migración de seguridad |

## 🎯 Comando Todo-en-Uno

Si estás en `/home/jano/lexcms/1/` y quieres copiar todos los fixes:

```bash
# 1. Copiar base de datos migrada (si no la tienes)
cp /home/user/cms/lexcms.db ./lexcms.db

# 2. Copiar archivos de solución
cp /home/user/cms/fix-createhash-imports.ts ./
cp /home/user/cms/check-createhash-usage.sh ./

# 3. Verificar problemas
./check-createhash-usage.sh

# 4. Aplicar corrección
deno run --allow-read --allow-write fix-createhash-imports.ts

# 5. Ejecutar proyecto
deno task dev
```

## 🔍 Verificación Final

Después de aplicar las correcciones, ejecuta:

```bash
# Verificar no hay errores de sintaxis
deno check src/**/*.ts

# Ejecutar el servidor
deno task dev
```

Deberías ver algo como:

```
✅ Email provider verified
💾 Initializing backup system...
🔒 Initializing security system...
✅ Loaded 0 IP block rules
✅ Security system initialized
🚀 Server running on http://localhost:3000
```

## ❓ Preguntas Frecuentes

**P: ¿Por qué no funciona createHash?**
R: Deno std cambió su API. Ahora debes usar `node:crypto` o Web Crypto API.

**P: ¿Es seguro usar node:crypto en Deno?**
R: Sí, Deno tiene compatibilidad completa con Node.js APIs.

**P: ¿Debo cambiar a Web Crypto API?**
R: Es recomendado para nuevos proyectos, pero `node:crypto` funciona bien.

**P: ¿Qué hago si tengo más errores?**
R: Comparte el error y lo revisamos.

## 📚 Referencias

- [Deno Node.js Compatibility](https://docs.deno.com/api/node/crypto/)
- [Web Crypto API](https://docs.deno.com/api/web/crypto)
- [Deno std on JSR](https://deno.com/blog/std-on-jsr)
