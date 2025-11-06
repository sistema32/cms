# 🚀 Guía de Inicio - LexCMS

## ✅ Pre-verificación completada

Todos los archivos y dependencias necesarias están en su lugar:

- ✅ Archivo `.env` configurado
- ✅ Estructura de directorios correcta
- ✅ Todos los módulos principales presentes
- ✅ Sistema de migraciones restaurado (13 archivos)
- ✅ Configuración de Deno lista

## 📋 Pasos para iniciar el CMS

### 1. Configurar la base de datos

```bash
# Ejecutar migraciones y seed
deno task db:setup
```

**Esto hará:**
- Crear la base de datos SQLite (`lexcms.db`)
- Aplicar las 13 migraciones en orden
- Insertar datos iniciales (roles, permisos, usuario admin)

**Credenciales por defecto:**
- Email: `admin@example.com`
- Password: `admin123`

### 2. Iniciar el servidor de desarrollo

```bash
# Opción 1: Solo el servidor
deno task dev

# Opción 2: Servidor + compilación de CSS
deno task dev:all
```

### 3. Verificar que el servidor inició correctamente

Deberías ver algo como:

```
🚀 Servidor iniciado exitosamente

📍 Entorno: development
🌐 URL: http://localhost:3000
🏥 Health: http://localhost:3000/health

📚 Endpoints:
   POST   /api/auth/register
   POST   /api/auth/login
   GET    /api/auth/me (protegido)
   ...
```

### 4. Probar el servidor

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

## 🔧 Comandos útiles

### Base de datos

```bash
deno task db:migrate    # Solo migraciones
deno task db:seed       # Solo seed
deno task db:setup      # Migraciones + Seed
deno task db:studio     # Abrir Drizzle Studio
```

### Desarrollo

```bash
deno task dev           # Servidor con hot-reload
deno task start         # Servidor en producción
deno task css:build     # Compilar CSS
deno task css:watch     # Watch CSS
```

### Tests

```bash
deno task test                  # Todos los tests
deno task test:unit            # Tests unitarios
deno task test:integration     # Tests de integración
deno task test:security        # Tests de seguridad
```

## ⚠️ Posibles problemas y soluciones

### Error: "Table already exists"

**Causa:** La base de datos ya tiene tablas de una ejecución anterior.

**Solución 1 - Limpiar y reiniciar:**
```bash
rm lexcms.db
deno task db:setup
```

**Solución 2 - El sistema ya maneja esto:**
El sistema de migraciones mejorado detecta tablas existentes y las marca como advertencias, no como errores. Simplemente continúa.

### Error: "DENO_ENV validation failed"

**Causa:** Falta configuración en `.env`

**Solución:**
```bash
# Verificar que .env existe
ls -la .env

# Si no existe, crear desde ejemplo
cp .env.example .env
```

### Error: "JWT_SECRET must be at least 32 characters"

**Causa:** El JWT_SECRET en `.env` es muy corto.

**Solución:**
Edita `.env` y cambia:
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Error: "Cannot find module"

**Causa:** Imports o dependencias no resueltas.

**Solución:**
```bash
# Limpiar cache de Deno
deno cache --reload src/main.ts

# O reinstalar dependencias
rm -rf node_modules
deno cache src/main.ts
```

### Puerto 3000 en uso

**Causa:** Otro proceso está usando el puerto 3000.

**Solución:**
Edita `.env` y cambia:
```
PORT=3001
```

## 🔍 Verificación del sistema

Ejecuta este script para verificar que todo está en orden:

```bash
./check-imports.sh
```

## 📊 Estructura del proyecto

```
cms/
├── src/
│   ├── main.ts              # Punto de entrada
│   ├── app.ts               # Configuración de Hono
│   ├── config/              # Configuración (env, db)
│   ├── controllers/         # Controladores
│   ├── middleware/          # Middleware básico
│   ├── middlewares/         # Middleware avanzado
│   ├── routes/              # Rutas de la API
│   ├── services/            # Lógica de negocio
│   ├── lib/                 # Librerías y utilidades
│   │   ├── cache/           # Sistema de caché
│   │   ├── email/           # Sistema de email
│   │   ├── backup/          # Sistema de backups
│   │   ├── security/        # Sistema de seguridad
│   │   ├── jobs/            # Jobs en background
│   │   └── plugin-system/   # Sistema de plugins
│   └── db/
│       ├── schema.ts        # Esquema de la DB
│       ├── migrate.ts       # Sistema de migraciones
│       ├── seed.ts          # Datos iniciales
│       └── migrations/      # 13 archivos de migración
├── .env                     # Variables de entorno
├── deno.json               # Configuración de Deno
└── lexcms.db               # Base de datos SQLite (se crea automáticamente)
```

## 🎯 Siguientes pasos

1. ✅ Ejecutar `deno task db:setup`
2. ✅ Ejecutar `deno task dev`
3. ✅ Probar http://localhost:3000/health
4. ✅ Login con admin@example.com / admin123
5. 🚀 Empezar a desarrollar!

## 📚 Recursos

- **Documentación de Deno:** https://deno.land/manual
- **Hono Framework:** https://hono.dev/
- **Drizzle ORM:** https://orm.drizzle.team/

## 🆘 Soporte

Si encuentras problemas:
1. Verifica los logs del servidor
2. Revisa el archivo `.env`
3. Ejecuta `./check-imports.sh`
4. Revisa la sección de "Posibles problemas" arriba

---

✨ **¡El CMS está listo para usar!**
