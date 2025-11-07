# Guía de Migración: Web Crypto API Nativa

## 🎯 Objetivo

Esta migración convierte el código del proyecto para usar **Web Crypto API nativa** de Deno en lugar de imports externos de `std/crypto`, eliminando dependencias innecesarias y asegurando compatibilidad futura.

## ✅ Cambios Realizados

### 1. BackupManager.ts - Migrado a Web Crypto API Nativa

**Antes:**
```typescript
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

private async calculateChecksum(filePath: string): Promise<string> {
  const data = await Deno.readFile(filePath);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hashBuffer));
}
```

**Después:**
```typescript
// No imports necesarios - crypto es global en Deno

function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

private async calculateChecksum(filePath: string): Promise<string> {
  const data = await Deno.readFile(filePath);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}
```

**Beneficios:**
- ❌ Elimina dependencia de std@0.208.0
- ✅ Usa Web Crypto API estándar (disponible en todos los navegadores y Deno)
- ✅ Código más portable y mantenible
- ✅ Sin imports externos para operaciones criptográficas básicas

### 2. Nuevo Módulo: src/lib/utils/crypto.ts

Se creó un módulo de utilidades crypto completo con:

#### Funciones Principales

**hashString(data, algorithm?)** - Hash de strings
```typescript
const hash = await hashString("Hello World");
// "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
```

**hashBytes(data, algorithm?)** - Hash de Uint8Array
```typescript
const data = new TextEncoder().encode("Hello World");
const hash = await hashBytes(data);
```

**hashFile(filePath, algorithm?)** - Hash de archivos
```typescript
const hash = await hashFile("./myfile.txt");
```

**createHash(algorithm)** - API compatible con Node.js
```typescript
const hash = createHash("SHA-256");
hash.update("Hello ");
hash.update("World");
const result = await hash.digest("hex");
```

**randomHex(length)** - Genera strings hex aleatorios
```typescript
const token = randomHex(32); // 64 caracteres hex
```

**bufferToHex(buffer)** - Convierte ArrayBuffer a hex
```typescript
const hex = bufferToHex(buffer);
```

**hexToBuffer(hex)** - Convierte hex a ArrayBuffer
```typescript
const buffer = hexToBuffer("deadbeef");
```

**constantTimeCompare(a, b)** - Comparación segura contra timing attacks
```typescript
const isValid = constantTimeCompare(userToken, storedToken);
```

#### Algoritmos Soportados

- SHA-1
- SHA-256 (default)
- SHA-384
- SHA-512

## 🔄 Cómo Migrar Código Existente

### Si usabas createHash de Node.js o std/crypto:

```typescript
// ❌ ANTES
import { createHash } from "node:crypto";
// o
import { createHash } from "https://deno.land/std@X.X.X/crypto/mod.ts";

const hash = createHash("sha256");
hash.update("data");
const result = hash.digest("hex");

// ✅ DESPUÉS - Opción 1: Función directa (recomendado)
import { hashString } from "./lib/utils/crypto.ts";
const result = await hashString("data");

// ✅ DESPUÉS - Opción 2: API compatible (si prefieres)
import { createHash } from "./lib/utils/crypto.ts";
const hash = createHash("SHA-256");
hash.update("data");
const result = await hash.digest("hex");
```

### Si necesitas hash de archivos:

```typescript
// ❌ ANTES
import { crypto } from "https://deno.land/std@X.X.X/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@X.X.X/encoding/hex.ts";

const data = await Deno.readFile(path);
const hash = await crypto.subtle.digest("SHA-256", data);
const hex = encodeHex(new Uint8Array(hash));

// ✅ DESPUÉS
import { hashFile } from "./lib/utils/crypto.ts";
const hex = await hashFile(path);
```

### Si necesitas generar tokens aleatorios:

```typescript
// ❌ ANTES
import { crypto } from "https://deno.land/std@X.X.X/crypto/mod.ts";
const bytes = new Uint8Array(32);
crypto.getRandomValues(bytes);
const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

// ✅ DESPUÉS
import { randomHex } from "./lib/utils/crypto.ts";
const token = randomHex(32);
```

## 🧪 Testing

Se incluye un script de prueba:

```bash
deno run --allow-read test-crypto-fix.ts
```

El script verifica:
- ✅ hashString funciona correctamente
- ✅ createHash (legacy API) produce resultados idénticos
- ✅ randomHex genera valores válidos
- ✅ bufferToHex convierte correctamente

## 📋 Checklist de Migración

- [x] Eliminar imports de `std/crypto`
- [x] Eliminar imports de `std/encoding/hex`
- [x] Usar Web Crypto API nativa (`crypto` global)
- [x] Crear utilidades reutilizables en `src/lib/utils/crypto.ts`
- [x] Actualizar `BackupManager.ts`
- [x] Crear tests de verificación
- [x] Documentar la migración

## ⚠️ Notas Importantes

1. **crypto es global en Deno**: No necesitas importarlo, está disponible globalmente
2. **Web Crypto API es asíncrono**: Todas las operaciones de hash retornan Promises
3. **Algoritmos en mayúsculas**: Web Crypto API usa "SHA-256" no "sha256"
4. **Compatible con navegadores**: El mismo código funciona en Deno y navegadores modernos

## 🔗 Referencias

- [Deno Web Crypto API](https://docs.deno.com/api/web/crypto)
- [MDN Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [SubtleCrypto.digest()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)

## 📝 Archivos Modificados

```
src/lib/backup/BackupManager.ts        # Migrado a Web Crypto nativo
src/lib/utils/crypto.ts                # Nuevo módulo de utilidades
test-crypto-fix.ts                     # Script de pruebas
CRYPTO_MIGRATION_GUIDE.md              # Esta guía
```

## 🚀 Próximos Pasos

Si encuentras otros archivos usando imports de `std/crypto` o `node:crypto`:

1. Importa las utilidades necesarias de `src/lib/utils/crypto.ts`
2. Reemplaza `createHash` con `hashString`, `hashBytes`, o `hashFile`
3. Ejecuta los tests para verificar
4. Documenta los cambios

---

**Fecha de migración:** 2025-11-07
**Versión Deno std anterior:** 0.208.0, 0.224.0
**Nueva implementación:** Web Crypto API nativa + utilidades custom
