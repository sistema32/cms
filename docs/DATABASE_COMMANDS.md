# Database Commands

## Setup & Migration

### `deno task db:setup`
Complete database setup with essential data (production-ready).

```bash
# Production setup (minimal data)
deno task db:setup

# Development setup (with demo content)
deno task db:setup --demo

# Show help
deno task db:setup --help
```

**What gets installed:**
- ✅ **Essential (always)**:
  - Database schema (46 tables)
  - Roles and permissions (5 roles, 46 permissions)
  - Content types (Post, Page)
  - Categories (3) and Tags (7)
  - Default settings (19)
  - Default menus (2 menus, 4 items)
  - Admin user (`admin@lexcms.local` / `admin123`)

- 📝 **Demo data (with `--demo` flag)**:
  - 3 sample blog posts
  - 4 test comments

### `deno task db:migrate`
Run pending migrations (both Drizzle DDL and custom DML).

```bash
deno task db:migrate
```

### `deno task db:generate`
Generate new Drizzle migrations from schema changes.

```bash
deno task db:generate
```

## Development Tools

### `deno task db:studio`
Open Drizzle Studio (visual database browser).

```bash
deno task db:studio
```

### `deno task db:push`
Push schema changes directly to database (development only).

```bash
deno task db:push
```

### `deno task db:translate-schema`
Translate SQLite schema to PostgreSQL and MySQL.

```bash
deno task db:translate-schema
```

## Environment Variables

### `DATABASE_TYPE`
Database type to use: `sqlite`, `postgresql`, or `mysql`.

```bash
# .env
DATABASE_TYPE=sqlite
```

### `DATABASE_URL`
Connection string for the database.

```bash
# SQLite/Turso
DATABASE_URL=file:local.db
DATABASE_URL=libsql://your-db.turso.io

# PostgreSQL
DATABASE_URL=postgres://user:pass@localhost:5432/dbname

# MySQL
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
```

### `LOAD_OPTIONAL_MIGRATIONS`
Load optional demo data migrations (used internally by `db:setup --demo`).

```bash
# Manually set (not recommended, use db:setup --demo instead)
export LOAD_OPTIONAL_MIGRATIONS=true
deno task db:migrate
```

## Migration Structure

```
src/db/migrations/
├── drizzle/           # Auto-generated DDL migrations
└── custom/
    ├── essential/     # Essential data (always loaded)
    │   ├── 0001_initial_roles.ts
    │   ├── 0002_rbac_permissions.ts
    │   ├── 0003_cms_basics.ts
    │   ├── 0004_default_settings.ts
    │   ├── 0005_role_permissions.ts
    │   ├── 0006_default_menus.ts
    │   ├── 0007_security_permissions.ts
    │   └── 0008_admin_user.ts
    └── optional/      # Demo data (loaded with --demo)
        ├── 0009_test_content.ts
        └── 0010_test_comments.ts
```

## Common Workflows

### Fresh Installation (Production)
```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 2. Setup database
deno task db:setup

# 3. Start server
deno task dev
```

### Fresh Installation (Development)
```bash
# 1. Configure environment
cp .env.example .env

# 2. Setup database with demo data
deno task db:setup --demo

# 3. Start server
deno task dev
```

### Schema Changes
```bash
# 1. Modify schema files in src/db/schema/sqlite/

# 2. Generate migration
deno task db:generate

# 3. Review generated migration in migrations/drizzle/

# 4. Apply migration
deno task db:migrate
```

### Switch Database Type
```bash
# 1. Update .env
DATABASE_TYPE=postgresql
DATABASE_URL=postgres://user:pass@localhost:5432/dbname

# 2. Translate schema (if needed)
deno task db:translate-schema

# 3. Run migrations
deno task db:migrate
```
