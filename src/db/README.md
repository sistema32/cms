# Database Module

## Structure

This directory contains all database-related code for the CMS.

### Files

- **`index.ts`** - Main database module. Contains the database connection logic and exports the `db` instance.
  - This is the **single source of truth** for database configuration
  - Supports both SQLite (development) and PostgreSQL (production)
  - All database logic is centralized here

- **`schema.ts`** - Database schema definitions using Drizzle ORM
  - Contains all table definitions
  - Exports types for TypeScript

- **`migrate.ts`** - Database migration runner
- **`migrate-rbac.ts`** - RBAC-specific migrations
- **`seed.ts`** - Main seeding entry point
- **`seed-*.ts`** - Individual seed files for different data sets
- **`setup.ts`** - Database setup utilities
- **`verify.ts`** - Database verification utilities

### Importing the Database

**Recommended (for new code):**
```typescript
import { db } from "../db/index.ts";
```

**Legacy (still supported):**
```typescript
import { db } from "../config/db.ts";
```

> Note: `src/config/db.ts` now just re-exports from `src/db/index.ts` for backwards compatibility.

## Architecture Decisions

### Why is the DB logic in `src/db/` instead of `src/config/`?

Database configuration belongs logically with other database code (schema, migrations, seeds).
The `config/` directory should contain application configuration, not implementation details.

### Why maintain `src/config/db.ts`?

For backwards compatibility. Many existing files import from `config/db.ts`, and we maintain
this as a re-export to avoid breaking changes across the entire codebase.

Future refactors should gradually migrate imports to use `src/db/index.ts` directly.
