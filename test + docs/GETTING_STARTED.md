# 🚀 Getting Started

Tu API está lista para usar! Aquí está todo lo que necesitas saber:

## ✅ Lo que ya está configurado

1. **Base de datos SQLite** con tabla `users`
2. **Migraciones aplicadas** y verificadas
3. **Usuario de prueba** creado:
   - Email: `admin@example.com`
   - Password: `password123`

## 🏃 Iniciar el servidor

```bash
deno task dev
```

El servidor estará disponible en `http://localhost:8000`

## 📡 Probar la API

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. Registrar nuevo usuario
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "test@example.com",
      "name": "Test User",
      "createdAt": "2025-10-31T...",
      "updatedAt": "2025-10-31T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Usuario registrado exitosamente"
}
```

### 3. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 4. Obtener perfil (requiere token)
```bash
# Guarda el token de la respuesta anterior
TOKEN="tu-token-aqui"

curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Listar usuarios (requiere token)
```bash
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Obtener usuario por ID
```bash
curl http://localhost:8000/api/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Actualizar usuario
```bash
curl -X PUT http://localhost:8000/api/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Nombre"
  }'
```

### 8. Eliminar usuario
```bash
curl -X DELETE http://localhost:8000/api/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 🔧 Comandos útiles

```bash
# Desarrollo con hot reload
deno task dev

# Producción
deno task start

# Generar nuevas migraciones (después de cambiar schema.ts)
deno task db:generate

# Aplicar migraciones
deno task db:migrate

# Insertar datos de prueba
deno task db:seed

# Ver base de datos con Drizzle Studio (requiere Node.js)
deno task db:studio
```

## 📁 Estructura de archivos importantes

```
src/
├── main.ts              # Entry point
├── config/
│   ├── db.ts           # Configuración de base de datos
│   └── env.ts          # Variables de entorno validadas
├── db/
│   ├── schema.ts       # Esquema de Drizzle (tablas)
│   ├── migrate.ts      # Script de migración
│   ├── seed.ts         # Datos de prueba
│   └── migrations/     # Migraciones SQL generadas
├── middleware/
│   ├── auth.ts         # Middleware JWT
│   └── errorHandler.ts # Manejo de errores
├── routes/             # Definición de rutas
├── controllers/        # Controladores HTTP
├── services/           # Lógica de negocio
└── utils/              # Utilidades (JWT, password, validación)
```

## 🔐 Seguridad

- Las contraseñas deben tener:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número

- Los tokens JWT expiran en 7 días

## 🗄️ Base de datos

### SQLite (Desarrollo - actual)
- Ubicación: `data/db.sqlite`
- Se crea automáticamente al ejecutar migraciones

### PostgreSQL (Producción)
1. Actualiza `.env`:
   ```
   DENO_ENV=production
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

2. Actualiza `src/db/schema.ts` (descomenta la versión PostgreSQL)

3. Ejecuta migraciones:
   ```bash
   deno task db:generate
   deno task db:migrate
   ```

## 🐛 Troubleshooting

### Error: "MODULE_NOT_FOUND"
```bash
deno install
```

### Error: "URL_SCHEME_NOT_SUPPORTED"
Asegúrate de tener `"nodeModulesDir": "auto"` en `deno.json`

### Base de datos corrupta
```bash
rm data/db.sqlite
deno task db:migrate
deno task db:seed
```

## 📚 Próximos pasos

1. Agregar más tablas en `src/db/schema.ts`
2. Crear nuevos endpoints en `src/routes/`
3. Implementar relaciones entre tablas
4. Agregar tests unitarios e integración
5. Configurar CI/CD
6. Desplegar a producción

## 🚢 Despliegue

### Deno Deploy
```bash
deployctl deploy --project=tu-proyecto src/main.ts
```

### Fly.io / Railway / Render
1. Configura PostgreSQL
2. Configura variables de entorno
3. Ejecuta migraciones
4. Despliega

¡Disfruta tu API! 🎉
