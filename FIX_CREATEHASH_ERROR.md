# Fix: createHash Import Error en Deno std 0.224.0

## 🔴 Error
```
error: Uncaught SyntaxError: The requested module 'https://deno.land/std@0.224.0/crypto/mod.ts'
does not provide an export named 'createHash'
```

## 🔍 Causa
En Deno std 0.224.0+, `createHash` no está exportado desde `std/crypto/mod.ts`. Esto es porque Deno favorece el uso del Web Crypto API nativo.

## ✅ Soluciones

### Opción 1: Usar Node.js Compatibility Layer (Recomendado si migras desde Node.js)

```typescript
// ❌ ANTES (No funciona en Deno std 0.224.0+)
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// ✅ DESPUÉS (Usar compatibilidad con Node.js)
import { createHash } from "node:crypto";

// Uso igual que antes
const hash = createHash("sha256");
hash.update("Hello World");
const hex = hash.digest("hex");
```

### Opción 2: Usar Web Crypto API (Recomendado para nuevos proyectos)

```typescript
// ❌ ANTES
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const hash = createHash("sha256");
hash.update("Hello World");
const hex = hash.digest("hex");

// ✅ DESPUÉS (Web Crypto API)
async function createHash256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

  // Convertir a hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hex;
}

// Uso
const hex = await createHash256("Hello World");
```

### Opción 3: Usar versión anterior de std (Temporal)

```typescript
// ⚠️ TEMPORAL - No recomendado a largo plazo
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const hash = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode("Hello World")
);
const hex = encodeHex(hash);
```

## 🛠️ Aplicar el Fix

### Para `themeCacheService.ts`:

**Ubicación:** `src/services/themeCacheService.ts`

```typescript
// Cambiar la línea 6 de:
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// A (Opción 1 - Más simple):
import { createHash } from "node:crypto";

// O (Opción 2 - Más moderno):
// Eliminar el import y usar función helper
async function hashString(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## 📝 Script de Migración Automática

Para buscar y reemplazar automáticamente en todo el proyecto:

```bash
# Buscar archivos con el import problemático
grep -r "createHash.*from.*std.*crypto" src/

# Reemplazar automáticamente (usa con cuidado)
find src/ -type f -name "*.ts" -exec sed -i \
  's|import { createHash } from "https://deno.land/std@[0-9.]\+/crypto/mod.ts";|import { createHash } from "node:crypto";|g' {} +
```

## ✅ Verificación

Después de aplicar el fix:

```bash
# Ejecutar el proyecto
deno task dev

# Verificar que no hay errores de importación
deno check src/services/themeCacheService.ts
```

## 📚 Referencias

- [Deno Web Crypto API](https://docs.deno.com/api/web/crypto)
- [Deno Node.js Compatibility](https://docs.deno.com/api/node/crypto/)
- [Deno std Migration to JSR](https://deno.com/blog/std-on-jsr)
