# Database Migrations

## Overview

This directory contains the database migration files for LexCMS. All migrations have been unified into a single file for easier management and deployment.

## Unified Migration Approach

The migrations have been consolidated into `0000_initial_schema.sql`, which contains:

- All core tables (users, roles, permissions)
- Content management tables
- Media management
- SEO tables
- Comments system
- Plugins system
- Audit logs
- Webhooks
- Email and notifications
- Backup system
- Security features
- API keys
- Background jobs
- Internationalization (i18n)
- Workflow system
- Forms builder
- Initial data (email templates, languages)

## Key Features

- **IF NOT EXISTS clauses**: The unified migration uses `IF NOT EXISTS` for all CREATE TABLE and CREATE INDEX statements, making it safe to run on existing databases
- **Error handling**: The migration system gracefully handles existing tables and indexes
- **Single source of truth**: One file contains the complete schema, making it easier to understand and maintain

## Usage

### Fresh Installation

For a new installation, simply run:

```bash
deno task db:setup
```

This will:
1. Run all migrations (including the unified schema)
2. Seed the database with initial data

### Existing Installation

If you have an existing database and need to reset migration tracking:

```bash
deno task db:reset-migrations
```

This will:
- Clear the migration tracking table
- Mark the unified migration as applied
- Preserve all existing data

### Running Migrations

To run migrations:

```bash
deno task db:migrate
```

### Adding New Migrations

When adding new features, create new migration files with incrementing numbers:

```
0001_add_new_feature.sql
0002_add_another_feature.sql
```

Follow these guidelines:
- Use descriptive names
- Add comments explaining the changes
- Use `IF NOT EXISTS` where appropriate
- Include rollback instructions in comments if needed

## Migration System

The migration system (`src/db/migrate.ts`) features:

- Automatic migration tracking in `__drizzle_migrations` table
- Graceful handling of existing tables/indexes
- Detailed logging of migration progress
- Error recovery for "already exists" errors

## Files

- `0000_initial_schema.sql` - Complete unified database schema
- `meta/` - Drizzle Kit metadata directory
- `README.md` - This file

## Troubleshooting

### "Table already exists" errors

The system now handles these automatically. If you see warnings about existing tables, that's normal and expected.

### Migration tracking issues

If migrations aren't being tracked correctly, run:

```bash
deno task db:reset-migrations
```

### Database corruption

If you need to completely reset the database:

1. Backup your data
2. Delete the database file
3. Run `deno task db:setup`

## Best Practices

1. Always backup before running migrations in production
2. Test migrations in development first
3. Review the unified schema to understand table relationships
4. Use foreign keys appropriately
5. Add indexes for frequently queried columns
6. Keep migrations atomic and reversible when possible
