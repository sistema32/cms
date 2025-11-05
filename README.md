# LexCMS - Sistema de Gestión de Contenidos

CMS moderno construido con Deno, Hono, Drizzle ORM y Tailwind CSS.

## 🚀 Características

- ✅ **Panel de Administración** con diseño Windmill Dashboard
- ✅ **Autenticación JWT** con soporte 2FA (TOTP)
- ✅ **Gestión de Contenido** (posts, páginas, artículos)
- ✅ **Categorías y Tags** para organización
- ✅ **Gestión de Usuarios** con roles y permisos
- ✅ **Tipos de Contenido** personalizables
- ✅ **Configuración del Sitio** centralizada
- ✅ **Frontend Público** con rutas dinámicas
- ✅ **Tailwind CSS** para estilos
- ✅ **TypeScript** con tipos estrictos
- ✅ **SQLite** (desarrollo) y **PostgreSQL** (producción)
- ✅ **Drizzle ORM** con migraciones

## 📍 URLs de Acceso

Una vez iniciado el servidor en `http://localhost:8000`:

- **Frontend Público**: `http://localhost:8000/` (raíz del sitio)
  - Inicio: `/`
  - Contenido individual: `/content/:slug`
  - Categorías: `/category/:slug`
  - Tags: `/tag/:slug`
  - API REST: `/api/*`

- **Panel de Administración**: `http://localhost:8000/admincp` (configurable en .env)
  - Login: `/admincp/login`
  - Dashboard: `/admincp`
  - Contenido: `/admincp/content`
  - Categorías: `/admincp/categories`
  - Tags: `/admincp/tags`
  - Usuarios: `/admincp/users`
  - Configuración: `/admincp/settings`

> **Nota**: La ruta del admin es configurable mediante la variable `ADMIN_PATH` en el archivo `.env`

## 📁 Estructura del Proyecto

```
.
├── src/
│   ├── admin/            # Panel de administración
│   │   ├── components/   # Componentes reutilizables (AdminLayout)
│   │   └── pages/        # Páginas del admin (Login, Dashboard, etc.)
│   ├── config/           # Configuración (DB, env)
│   ├── db/               # Esquema Drizzle y migraciones
│   ├── middleware/       # Middlewares (auth, errors)
│   ├── routes/           # Rutas (admin, api, frontend)
│   ├── controllers/      # Controladores HTTP
│   ├── services/         # Lógica de negocio (2FA, auth, etc.)
│   ├── utils/            # Utilidades (JWT, password, validation)
│   ├── types/            # Tipos TypeScript
│   └── main.ts           # Entry point
├── static/               # Archivos estáticos (CSS compilado)
├── data/                 # Base de datos SQLite
├── deno.json             # Configuración de Deno y tareas
├── drizzle.config.ts     # Configuración de Drizzle ORM
├── tailwind.config.ts    # Configuración de Tailwind CSS
└── .env                  # Variables de entorno
```

## 🛠️ Instalación desde Cero

### Requisitos Previos

- **Deno** 1.40+ ([Instalar Deno](https://deno.land/manual/getting_started/installation))
- **PostgreSQL** (opcional, para producción)

### 1. Instalar Deno

```bash
# Linux/macOS
curl -fsSL https://deno.land/x/install/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex
```

### 2. Clonar y Configurar

```bash
# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus valores
nano .env
```

**Variables importantes en `.env`:**
```env
# Entorno (development | production)
DENO_ENV=development

# Puerto del servidor
PORT=8000

# Ruta del panel admin (sin barra final)
ADMIN_PATH=/admincp

# JWT Secret (cambiar en producción)
JWT_SECRET=your-secret-key-change-in-production

# Base de datos
DATABASE_URL=./data/db.sqlite  # SQLite para dev
# DATABASE_URL=postgresql://user:password@host:5432/db  # PostgreSQL para prod
```

### 3. (Opcional) Limpiar Base de Datos

Si necesitas empezar desde cero, elimina la base de datos existente:

**Para SQLite:**
```bash
rm -f data/db.sqlite
rm -f data/db.sqlite-shm
rm -f data/db.sqlite-wal
```

**Para PostgreSQL:**
```bash
# Conectar a PostgreSQL y ejecutar:
psql -U postgres
DROP DATABASE IF EXISTS lexcms;
CREATE DATABASE lexcms;
\q
```

### 4. Configurar Base de Datos

```bash
# Generar archivos de migración desde el esquema
deno task db:generate

# Aplicar las migraciones a la base de datos
deno task db:migrate

# (Opcional) Insertar datos de prueba
deno task db:seed
```

> **Nota**: Para SQLite local, usa `db:migrate` en lugar de `db:push`. El comando `db:push` solo funciona con PostgreSQL.

**Credenciales de administrador por defecto** (después de ejecutar `db:seed`):
- **Email**: `admin@lexcms.com`
- **Password**: `Admin123!`

> ⚠️ **Importante**: Cambia estas credenciales inmediatamente después del primer login.

### 5. Compilar Tailwind CSS

```bash
# Compilar estilos (una vez)
deno task css:build

# O en modo watch para desarrollo
deno task css:watch
```

## 🏃 Modo Desarrollo

```bash
# Iniciar servidor con hot reload
deno task dev
```

En desarrollo, necesitarás **dos terminales**:

**Terminal 1 - Servidor:**
```bash
deno task dev
```

**Terminal 2 - Tailwind CSS (watch mode):**
```bash
deno task css:watch
```

El servidor estará disponible en:
- Frontend: `http://localhost:8000`
- Admin: `http://localhost:8000/admincp`

## 🚀 Modo Producción

### Preparación

1. **Compilar CSS para producción:**
```bash
deno task css:build
```

2. **Configurar variables de entorno:**
```env
DENO_ENV=production
PORT=8000
JWT_SECRET=your-production-secret-key-very-long-and-secure
DATABASE_URL=postgresql://user:password@host:5432/lexcms
ADMIN_PATH=/admincp
```

3. **Migrar base de datos PostgreSQL:**
```bash
deno task db:generate
deno task db:migrate
deno task db:seed
```

### Opción 1: Servidor Directo (VPS/Servidor)

```bash
# Iniciar en modo producción
deno task start
```

### Opción 2: Con Process Manager (PM2)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar con PM2
pm2 start "deno task start" --name lexcms

# Ver logs
pm2 logs lexcms

# Reiniciar
pm2 restart lexcms

# Auto-inicio en reboot
pm2 startup
pm2 save
```

### Opción 3: Como Servicio Systemd (Linux)

Crear archivo `/etc/systemd/system/lexcms.service`:

```ini
[Unit]
Description=LexCMS Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lexcms
ExecStart=/home/user/.deno/bin/deno task start
Restart=on-failure
Environment="DENO_ENV=production"

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar e iniciar servicio
sudo systemctl enable lexcms
sudo systemctl start lexcms

# Ver estado
sudo systemctl status lexcms

# Ver logs
sudo journalctl -u lexcms -f
```

### Configurar Nginx (Reverse Proxy)

Crear `/etc/nginx/sites-available/lexcms`:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # Certificados SSL (usar certbot)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Archivos estáticos
    location /static/ {
        alias /var/www/lexcms/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy a Deno
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/lexcms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL con Certbot
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### Configurar Caddy (Alternativa más simple)

Crear `Caddyfile`:

```caddy
tudominio.com {
    reverse_proxy localhost:8000
    encode gzip

    handle /static/* {
        root * /var/www/lexcms/static
        file_server
    }
}
```

```bash
# Iniciar Caddy
sudo caddy start
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
deno task dev              # Servidor con hot reload
deno task css:watch        # Tailwind en modo watch

# Producción
deno task start            # Servidor en modo producción
deno task css:build        # Compilar CSS minificado

# Base de Datos
deno task db:generate      # Generar archivos SQL de migración desde el schema
deno task db:migrate       # Aplicar migraciones a la base de datos
deno task db:push          # Push directo del schema (solo PostgreSQL, no usar con SQLite)
deno task db:studio        # Abrir Drizzle Studio (GUI visual de la DB)
deno task db:seed          # Insertar datos de prueba y usuario admin

# Testing
deno task test             # Ejecutar tests
deno task test:watch       # Tests en modo watch
```

## 📡 API REST Endpoints

### Autenticación Pública

**Registro**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "Juan Pérez"
}
```

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Respuesta:
```json
{
  "token": "eyJhbGc...",
  "requires2FA": false
}
```

**Login con 2FA** (si está habilitado):
```bash
POST /api/auth/verify-2fa
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Obtener Perfil** (requiere token)
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

### Contenido Público

**Listar Contenido**
```bash
GET /api/content
GET /api/content?status=published
GET /api/content?type=post
```

**Obtener Contenido por Slug**
```bash
GET /api/content/:slug
```

### Admin Panel (Cookie-based Auth)

Las rutas del admin panel usan autenticación basada en cookies (httpOnly):

- `GET /admincp/login` - Página de login
- `POST /admincp/login` - Procesar login
- `POST /admincp/logout` - Cerrar sesión
- `GET /admincp` - Dashboard principal
- `GET /admincp/content` - Listar contenido
- `POST /admincp/content/new` - Crear contenido
- `POST /admincp/content/edit/:id` - Editar contenido
- `POST /admincp/content/delete/:id` - Eliminar contenido
- Similar para `/categories`, `/tags`, `/users`, `/settings`

## 🗄️ Base de Datos

### SQLite (Desarrollo)

Por defecto usa SQLite en `./data/db.sqlite`. Ideal para desarrollo local.

**Ventajas:**
- Sin instalación adicional
- Archivo único
- Fácil de respaldar (copiar archivo)

**Limitaciones:**
- No recomendado para producción con alto tráfico
- Sin replicación nativa

### PostgreSQL (Producción)

Recomendado para producción.

1. **Instalar PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql
```

2. **Crear base de datos:**
```bash
sudo -u postgres psql
CREATE DATABASE lexcms;
CREATE USER lexcms_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE lexcms TO lexcms_user;
\q
```

3. **Configurar en `.env`:**
```env
DENO_ENV=production
DATABASE_URL=postgresql://lexcms_user:secure_password@localhost:5432/lexcms
```

4. **Migrar:**
```bash
deno task db:generate
deno task db:migrate
deno task db:seed
```

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ JWT con expiración configurable (7 días default)
- ✅ Cookies httpOnly para sesiones admin
- ✅ 2FA con TOTP (Google Authenticator, Authy compatible)
- ✅ Validación de entrada con Zod
- ✅ Variables de entorno para secretos
- ✅ CORS configurado
- ✅ SQL injection prevenido por Drizzle ORM
- ✅ XSS protection en templates

**Recomendaciones de Seguridad:**

1. Cambiar `JWT_SECRET` en producción (usar generador de contraseñas)
2. Habilitar HTTPS (usar Certbot o Caddy)
3. Cambiar credenciales admin por defecto
4. Habilitar 2FA para todos los usuarios admin
5. Usar PostgreSQL en producción
6. Configurar backups automáticos
7. Limitar intentos de login (rate limiting)

## 🔄 Gestión de 2FA

### Habilitar 2FA para un Usuario

1. Ir a "Perfil" en el admin
2. Hacer clic en "Habilitar 2FA"
3. Escanear código QR con Google Authenticator o Authy
4. Ingresar código de verificación
5. Guardar códigos de recuperación

### Deshabilitar 2FA

```sql
-- En caso de emergencia (acceso a DB)
UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE email = 'admin@lexcms.com';
```

## 🔧 Troubleshooting

### Error: "Module not found"

```bash
# Limpiar caché de Deno
deno cache --reload src/main.ts
```

### Error: "Database locked" (SQLite)

SQLite no soporta múltiples escrituras simultáneas. Usa PostgreSQL para producción.

### Error: "URL_SCHEME_NOT_SUPPORTED" al ejecutar `db:push`

Este error ocurre al intentar usar `deno task db:push` con SQLite local. El comando `db:push` solo funciona con PostgreSQL.

**Solución:**
```bash
# Usar el flujo correcto para SQLite:
deno task db:generate  # Generar migraciones
deno task db:migrate   # Aplicar migraciones
```

Para desarrollo rápido con PostgreSQL sí puedes usar `db:push`.

### Error: "Permission denied" al compilar CSS

```bash
chmod +x node_modules/.bin/tailwindcss
```

### El CSS no se aplica

```bash
# Asegúrate de compilar CSS primero
deno task css:build

# Verificar que existe static/output.css
ls -la static/output.css
```

### Error al ejecutar migraciones

```bash
# Regenerar migraciones
rm -rf src/db/migrations/
deno task db:generate
deno task db:migrate
```

### Puerto 8000 ya en uso

```bash
# Cambiar puerto en .env
PORT=3000

# O matar proceso en puerto 8000
lsof -ti:8000 | xargs kill -9
```

## 📦 Despliegue en la Nube

### Deno Deploy

```bash
# Instalar deployctl
deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts

# Deploy
deployctl deploy --project=lexcms src/main.ts
```

### Railway

1. Crear cuenta en [Railway.app](https://railway.app)
2. Conectar repositorio GitHub
3. Agregar PostgreSQL addon
4. Configurar variables de entorno
5. Deploy automático

### Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Inicializar
fly launch

# Configurar PostgreSQL
fly postgres create

# Deploy
fly deploy
```

### Render

1. Crear cuenta en [Render.com](https://render.com)
2. Nuevo "Web Service"
3. Conectar repositorio
4. Build command: `deno task css:build`
5. Start command: `deno task start`
6. Agregar PostgreSQL database
7. Deploy

## 💾 Backup y Restauración

### SQLite

```bash
# Backup
cp data/db.sqlite backups/db-$(date +%Y%m%d).sqlite

# Restaurar
cp backups/db-20240115.sqlite data/db.sqlite
```

### PostgreSQL

```bash
# Backup
pg_dump -U lexcms_user lexcms > backup.sql

# Restaurar
psql -U lexcms_user lexcms < backup.sql

# Backup automático (cron)
# Agregar a crontab -e:
0 2 * * * pg_dump -U lexcms_user lexcms > /backups/lexcms-$(date +\%Y\%m\%d).sql
```

## 🎨 Personalización

### Cambiar Colores del Admin

Editar `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f5f3ff',
        // ... tus colores
      }
    }
  }
}
```

Recompilar CSS:
```bash
deno task css:build
```

### Agregar Nuevos Tipos de Contenido

1. Editar `src/db/schema.ts`
2. Agregar nuevo tipo en `contentTypes` table
3. Generar migración: `deno task db:generate`
4. Aplicar: `deno task db:push`
5. O insertar vía SQL/admin panel

## 📝 Licencia

MIT

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📞 Soporte

- 📖 [Documentación de Deno](https://deno.land/manual)
- 📖 [Documentación de Hono](https://hono.dev)
- 📖 [Documentación de Drizzle](https://orm.drizzle.team)
- 📖 [Tailwind CSS](https://tailwindcss.com)

---

Hecho con ❤️ usando Deno y tecnologías modernas
