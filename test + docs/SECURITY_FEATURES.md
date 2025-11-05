# 🔐 Funcionalidades de Seguridad - LexCMS

## ✅ Estado: IMPLEMENTADO

Sistema de seguridad completo con protecciones contra OWASP Top 10, autenticación de dos factores (2FA) opcional y logging de eventos de seguridad.

---

## 📋 Tabla de Contenidos

1. [Headers de Seguridad HTTP](#headers-de-seguridad-http)
2. [Autenticación de Dos Factores (2FA)](#autenticación-de-dos-factores-2fa)
3. [Validación de Contraseñas](#validación-de-contraseñas)
4. [Rate Limiting](#rate-limiting)
5. [Logging de Seguridad](#logging-de-seguridad)
6. [CORS Dinámico](#cors-dinámico)
7. [Protecciones HTTP](#protecciones-http)
8. [SQL Injection Prevention](#sql-injection-prevention)
9. [Variables de Entorno](#variables-de-entorno)

---

## 🛡️ Headers de Seguridad HTTP

### Implementados Automáticamente

```typescript
// src/middleware/security.ts
```

| Header | Valor | Protección |
|--------|-------|------------|
| `X-Content-Type-Options` | `nosniff` | Previene MIME sniffing attacks |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS protection (legacy browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla información del referrer |
| `Content-Security-Policy` | `default-src 'self'...` | Previene XSS y data injection |
| `Strict-Transport-Security` | `max-age=31536000` | HTTPS only (solo producción) |
| `Permissions-Policy` | `geolocation=()...` | Desactiva APIs peligrosas |
| `Cache-Control` | `no-store` | No cachear datos sensibles (API) |

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self';
frame-ancestors 'none';
```

**Beneficio**: Previene ataques XSS, clickjacking y code injection.

---

## 🔑 Autenticación de Dos Factores (2FA)

### Configuración

Controlado por variable de entorno:

```bash
# .env
ENABLE_2FA=false  # Desarrollo/Testing
ENABLE_2FA=true   # Producción
```

### Características

- ✅ **TOTP** (Time-based One-Time Password)
- ✅ Compatible con **Google Authenticator**, **Authy**, **1Password**, etc.
- ✅ **Códigos de respaldo** (10 códigos de 8 caracteres)
- ✅ **QR Code** para configuración fácil
- ✅ **Ventana de tolerancia** de ±30 segundos
- ✅ **Logging** de todos los eventos 2FA

### Flujo de Activación

1. **Setup** - Usuario inicia configuración
   ```bash
   POST /api/auth/2fa/setup
   Authorization: Bearer {token}

   Response:
   {
     "qrCodeUrl": "otpauth://totp/LexCMS:user@example.com?secret=...",
     "secret": "ABC123...",
     "backupCodes": ["12345678", "87654321", ...]
   }
   ```

2. **Enable** - Usuario verifica código
   ```bash
   POST /api/auth/2fa/enable
   {
     "token": "123456"
   }
   ```

3. **Login con 2FA**
   ```bash
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "password"
   }

   Response (si tiene 2FA):
   {
     "requires2FA": true,
     "token": "temp_token_...",
     "user": {...}
   }
   ```

4. **Verificar 2FA**
   ```bash
   POST /api/auth/2fa/verify
   {
     "token": "123456"
   }
   ```

### Endpoints 2FA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/2fa/setup` | Iniciar configuración |
| POST | `/api/auth/2fa/enable` | Habilitar 2FA |
| POST | `/api/auth/2fa/disable` | Deshabilitar 2FA |
| POST | `/api/auth/2fa/verify` | Verificar código |
| POST | `/api/auth/2fa/backup-codes` | Regenerar códigos |
| GET  | `/api/auth/2fa/status` | Ver estado |

### Códigos de Respaldo

- 10 códigos de 8 caracteres
- Hasheados con bcrypt antes de guardar
- **Un solo uso** cada uno
- Se eliminan después de usarse
- Regenerables con código 2FA válido

**Uso**:
```bash
POST /api/auth/2fa/verify
{
  "token": "12345678"  # Código de respaldo
}
```

---

## 🔒 Validación de Contraseñas

### Requisitos (OWASP Compliant)

```typescript
// src/utils/validation.ts

✅ Mínimo 8 caracteres
✅ Al menos una mayúscula (A-Z)
✅ Al menos una minúscula (a-z)
✅ Al menos un número (0-9)
✅ Al menos un símbolo (!@#$%^&*...)
```

### Ejemplos

| Contraseña | Válida | Razón |
|------------|--------|-------|
| `Pass123!` | ✅ | Cumple todos los requisitos |
| `password` | ❌ | Sin mayúsculas, números ni símbolos |
| `Pass1234` | ❌ | Sin símbolos especiales |
| `PASS123!` | ❌ | Sin minúsculas |
| `Pass!@#$` | ❌ | Sin números |

### Hashing

- **Algoritmo**: `bcrypt`
- **Salt rounds**: 10 (configuración de Deno)
- **Almacenamiento**: Solo el hash, nunca la contraseña en texto plano

---

## ⏱️ Rate Limiting

### Configuración Actual

```typescript
// src/main.ts
app.use("/api/auth/*", rateLimit(10, 60000));
// 10 requests por minuto en endpoints de auth
```

### Características

- ✅ **En memoria** (desarrollo)
- ✅ **Por IP** (x-forwarded-for o x-real-ip)
- ✅ **Ventana deslizante** (sliding window)
- ✅ **Headers estándar**:
  - `X-RateLimit-Limit`: Límite máximo
  - `X-RateLimit-Remaining`: Requests restantes
  - `Retry-After`: Segundos para reintentar
- ✅ **Logging automático** de rate limit exceeded
- ✅ **Limpieza automática** de entradas expiradas

### Respuesta cuando se excede

```json
HTTP 429 Too Many Requests
{
  "error": "Demasiadas solicitudes",
  "message": "Límite de 10 solicitudes por 60 segundos excedido"
}

Headers:
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
Retry-After: 45
```

### ⚠️ Nota para Producción

**Implementación actual** es en memoria (Map). Para producción con múltiples instancias, usar **Redis**:

```typescript
// Ejemplo con Redis (para futuro)
import { Redis } from "ioredis";
const redis = new Redis(process.env.REDIS_URL);

// Usar Redis en lugar de Map
const key = `ratelimit:${ip}`;
const current = await redis.incr(key);
if (current === 1) {
  await redis.expire(key, windowMs / 1000);
}
```

---

## 📊 Logging de Seguridad

### Eventos Logueados

```typescript
// src/utils/securityLogger.ts

enum SecurityEventType {
  LOGIN_FAILED              // Intento de login fallido
  LOGIN_SUCCESS             // Login exitoso
  UNAUTHORIZED_ACCESS       // Acceso sin autenticación
  RATE_LIMIT_EXCEEDED       // Rate limit superado
  PASSWORD_CHANGED          // Cambio de contraseña
  TWO_FACTOR_ENABLED        // 2FA activado
  TWO_FACTOR_DISABLED       // 2FA desactivado
  TWO_FACTOR_FAILED         // Código 2FA inválido
  TWO_FACTOR_SUCCESS        // 2FA verificado
  BACKUP_CODE_USED          // Código de respaldo usado
  INVALID_TOKEN             // Token JWT inválido
  PERMISSION_DENIED         // Permiso denegado (RBAC)
}
```

### Formato de Logs

**Ubicación**: `./logs/security/security-YYYY-MM-DD.log`

**Formato**: JSON (una línea por evento)

```json
{
  "type": "LOGIN_FAILED",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-11-01T14:30:00.000Z",
  "details": { "reason": "Invalid credentials" }
}
```

### Análisis de Logs

```typescript
// Leer logs de un día específico
import { readSecurityLogs, getSecurityStats } from "./src/utils/securityLogger.ts";

const events = await readSecurityLogs(new Date());
const stats = await getSecurityStats(new Date());

console.log(stats);
// Output:
// {
//   "LOGIN_FAILED": 15,
//   "LOGIN_SUCCESS": 234,
//   "RATE_LIMIT_EXCEEDED": 5,
//   ...
// }
```

### Rotación de Logs

- **Automática**: Un archivo por día
- **Nombre**: `security-YYYY-MM-DD.log`
- **Formato**: JSON Lines (JSONL)
- **Retención**: Manual (implementar limpieza según políticas)

### Uso en Producción

```bash
# Ver logs de hoy
cat logs/security/security-2025-11-01.log | jq

# Contar intentos fallidos de login
cat logs/security/security-*.log | jq 'select(.type == "LOGIN_FAILED")' | wc -l

# IPs con más intentos fallidos
cat logs/security/security-*.log | jq -r 'select(.type == "LOGIN_FAILED") | .ip' | sort | uniq -c | sort -rn

# Buscar eventos de un usuario específico
cat logs/security/security-*.log | jq 'select(.email == "user@example.com")'
```

---

## 🌐 CORS Dinámico

### Configuración

```bash
# .env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://example.com
```

### Comportamiento

| Entorno | Configuración | Resultado |
|---------|---------------|-----------|
| **Development** | Sin `CORS_ALLOWED_ORIGINS` | Permite `*` (wildcard) |
| **Development** | `CORS_ALLOWED_ORIGINS=*` | Permite `*` |
| **Production** | Sin `CORS_ALLOWED_ORIGINS` | Bloquea todo |
| **Production** | Lista específica | Solo orígenes listados |

### Ejemplo

```typescript
// src/main.ts

cors({
  origin: (origin) => {
    if (isDevelopment && !origin) return "*";
    if (allowedOrigins.includes(origin)) return origin;
    return undefined; // Bloqueado
  },
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
})
```

---

## 🚫 Protecciones HTTP

### Métodos Bloqueados

```typescript
// src/middleware/security.ts

BLOQUEADOS: TRACE, TRACK, CONNECT
```

**Razón**: Previene ataques de **Cross-Site Tracing (XST)**.

### Parameter Pollution Prevention

```typescript
// Detecta parámetros duplicados en URL
GET /api/users?id=1&id=2  ❌ Bloqueado
GET /api/users?id=1       ✅ Permitido
```

### Validación de JSON

- Valida JSON antes de procesarlo
- No consume el body original
- Retorna error 400 si JSON es inválido

---

## 💉 SQL Injection Prevention

### Drizzle ORM

Todas las queries usan **Drizzle ORM** con queries parametrizadas:

```typescript
// ✅ SEGURO - Drizzle parametriza automáticamente
const user = await db.query.users.findFirst({
  where: eq(users.email, userEmail)
});

// ❌ NUNCA HACER - Raw SQL sin sanitizar
const user = await db.execute(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### Validación con Zod

Todos los inputs se validan con **Zod schemas**:

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const data = loginSchema.parse(body); // Throw si inválido
```

---

## ⚙️ Variables de Entorno

### Archivo `.env`

```bash
# Entorno
DENO_ENV=development  # development | production | test

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Base de datos
DATABASE_URL=file:./data/db.sqlite

# Servidor
PORT=8000
BASE_URL=http://localhost:8000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Seguridad - 2FA
ENABLE_2FA=false  # true en producción
```

### Validación de Variables

```typescript
// src/config/env.ts

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, "Mínimo 32 caracteres"),
  ENABLE_2FA: z.string().transform(val => val === "true"),
  // ...
});

export const env = envSchema.parse({ ... });
```

**Error en startup** si las variables no cumplen requisitos.

---

## 📚 Resumen de Protecciones OWASP Top 10

| OWASP | Protección | Implementación |
|-------|-----------|----------------|
| **A01 - Broken Access Control** | ✅ RBAC + Permisos | middleware/permission.ts |
| **A02 - Cryptographic Failures** | ✅ Bcrypt + JWT + 2FA | utils/password.ts, twoFactorService.ts |
| **A03 - Injection** | ✅ Drizzle ORM + Zod | Todas las queries parametrizadas |
| **A04 - Insecure Design** | ✅ 2FA opcional + Rate limiting | twoFactorService.ts, security.ts |
| **A05 - Security Misconfiguration** | ✅ Headers + CSP + HSTS | security.ts |
| **A06 - Vulnerable Components** | ✅ Deno + Deps actualizadas | deno.json |
| **A07 - Identification Failures** | ✅ JWT + 2FA + Logs | authService.ts, securityLogger.ts |
| **A08 - Data Integrity Failures** | ✅ JWT signature verification | utils/jwt.ts |
| **A09 - Logging Failures** | ✅ Security Logger completo | securityLogger.ts |
| **A10 - SSRF** | ✅ Validación URLs + CSP | Zod validation |

---

## 🚀 Checklist para Producción

### Antes de Deploy

- [ ] `DENO_ENV=production` en .env
- [ ] `ENABLE_2FA=true` en .env
- [ ] `JWT_SECRET` de al menos 64 caracteres aleatorios
- [ ] `CORS_ALLOWED_ORIGINS` lista específica (sin wildcard)
- [ ] HTTPS configurado (para HSTS)
- [ ] Rate limiting con Redis (si múltiples instancias)
- [ ] Logs de seguridad monitoreados
- [ ] Backup de códigos 2FA documentado para usuarios
- [ ] CSP ajustado a necesidades de la app

### Monitoreo

- Revisar logs de seguridad diariamente
- Alertas para múltiples `LOGIN_FAILED` de misma IP
- Alertas para `RATE_LIMIT_EXCEEDED` frecuentes
- Dashboard con `getSecurityStats()`

---

## 🎉 Conclusión

**LexCMS** implementa seguridad de nivel enterprise con:

✅ Headers HTTP completos (OWASP)
✅ 2FA con TOTP (opcional por entorno)
✅ Validación robusta de contraseñas
✅ Rate limiting con logging
✅ Security logging completo
✅ CORS dinámico
✅ SQL injection prevention
✅ XSS prevention (CSP)
✅ Clickjacking prevention
✅ RBAC con permisos granulares

**Estado**: 🔒 **PRODUCTION-READY**
