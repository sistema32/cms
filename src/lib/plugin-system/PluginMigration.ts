/**
 * Plugin Migration Runner
 * Handles database migrations for plugins
 */

import { ensureDir } from '@std/fs';
import { join } from '@std/path';
import { sql } from 'drizzle-orm';
import type { PluginManifest } from './types.ts';

export interface MigrationRecord {
    id: number;
    plugin_name: string;
    migration_name: string;
    batch: number;
    executed_at: string;
}

export class PluginMigrationRunner {
    private db: any; // Drizzle database instance
    private migrationsDir: string;

    constructor(db: any) {
        this.db = db;
        // Use a fixed path for migrations relative to the project root
        // In a real app, this might be configurable
        this.migrationsDir = join(Deno.cwd(), 'plugins');
    }

    /**
     * Ensure the plugin_migrations table exists
     */
    async ensureMigrationTable(): Promise<void> {
        // SQLite specific for now, can be adapted for other DBs
        await this.db.run(sql`
            CREATE TABLE IF NOT EXISTS plugin_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plugin_name TEXT NOT NULL,
                migration_name TEXT NOT NULL,
                batch INTEGER NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * Run migrations for a plugin
     */
    async runMigrations(pluginName: string, pluginPath: string): Promise<void> {
        await this.ensureMigrationTable();

        const migrationDir = join(pluginPath, 'migrations');

        try {
            // Check if migrations directory exists
            try {
                await Deno.stat(migrationDir);
            } catch (error) {
                if (error instanceof Deno.errors.NotFound) {
                    return; // No migrations dir, nothing to do
                }
                throw error;
            }

            // Get executed migrations
            const executedMigrations = await this.getExecutedMigrations(pluginName);
            const executedNames = new Set(executedMigrations.map((m: MigrationRecord) => m.migration_name));

            // Get available migrations
            const availableMigrations: string[] = [];
            for await (const entry of Deno.readDir(migrationDir)) {
                if (entry.isFile && entry.name.endsWith('.sql') && !entry.name.endsWith('.down.sql')) {
                    availableMigrations.push(entry.name);
                }
            }

            // Sort migrations to ensure order
            availableMigrations.sort();

            // Determine next batch number
            const lastBatch = executedMigrations.length > 0
                ? Math.max(...executedMigrations.map((m: MigrationRecord) => m.batch))
                : 0;
            const currentBatch = lastBatch + 1;

            // Run pending migrations
            for (const migration of availableMigrations) {
                if (!executedNames.has(migration)) {
                    console.log(`Running migration for ${pluginName}: ${migration}`);
                    const content = await Deno.readTextFile(join(migrationDir, migration));

                    // Run the migration in a transaction if possible, or just run it
                    // For simplicity here, we just run the SQL
                    // Note: Splitting by ; might be needed for multiple statements if the driver doesn't support it
                    await this.db.run(sql.raw(content));

                    // Record migration
                    await this.recordMigration(pluginName, migration, currentBatch);
                }
            }

        } catch (error) {
            console.error(`Error running migrations for ${pluginName}:`, error);
            throw error;
        }
    }

    /**
     * Revert migrations for a plugin (down)
     */
    async revertMigrations(pluginName: string, pluginPath: string): Promise<void> {
        await this.ensureMigrationTable();

        const migrationDir = join(pluginPath, 'migrations');

        try {
            // Check if migrations directory exists
            try {
                await Deno.stat(migrationDir);
            } catch (error) {
                if (error instanceof Deno.errors.NotFound) {
                    return; // No migrations dir, nothing to do
                }
                throw error;
            }

            // Get executed migrations in reverse order
            const executedMigrations = await this.getExecutedMigrations(pluginName);
            // Sort by id descending (latest first)
            executedMigrations.sort((a: MigrationRecord, b: MigrationRecord) => b.id - a.id);

            for (const migration of executedMigrations) {
                const migrationName = migration.migration_name;
                // Look for corresponding .down.sql
                const downFile = migrationName.replace('.sql', '.down.sql');
                const downPath = join(migrationDir, downFile);

                try {
                    await Deno.stat(downPath);
                    console.log(`Reverting migration for ${pluginName}: ${migrationName}`);

                    const content = await Deno.readTextFile(downPath);
                    await this.db.run(sql.raw(content));

                    // Remove record
                    await this.removeMigrationRecord(migration.id);

                } catch (error) {
                    if (error instanceof Deno.errors.NotFound) {
                        console.warn(`No down migration found for ${migrationName}, skipping revert but removing record.`);
                        // Optionally remove record anyway if we assume it's safe or manual intervention needed
                        // For now, let's keep the record if we can't revert? 
                        // Or maybe we should just delete the record if there is no down file?
                        // Let's assume if no down file, we can't revert the schema changes, but we might want to "forget" the migration if the plugin is gone.
                        // But if we reinstall, we might try to run up again and fail if schema exists.
                        // Best practice: always provide down migrations.
                        // Here: we'll remove the record so re-install tries to run up (and potentially fails if no IF NOT EXISTS).
                        await this.removeMigrationRecord(migration.id);
                    } else {
                        throw error;
                    }
                }
            }

        } catch (error) {
            console.error(`Error reverting migrations for ${pluginName}:`, error);
            // We don't throw here to allow uninstall to proceed even if migration revert fails
        }
    }

    private async getExecutedMigrations(pluginName: string): Promise<MigrationRecord[]> {
        const result = await this.db.all(sql`
            SELECT * FROM plugin_migrations WHERE plugin_name = ${pluginName}
        `);
        return result as MigrationRecord[];
    }

    private async recordMigration(pluginName: string, migrationName: string, batch: number): Promise<void> {
        await this.db.run(sql`
            INSERT INTO plugin_migrations (plugin_name, migration_name, batch)
            VALUES (${pluginName}, ${migrationName}, ${batch})
        `);
    }

    private async removeMigrationRecord(id: number): Promise<void> {
        await this.db.run(sql`
            DELETE FROM plugin_migrations WHERE id = ${id}
        `);
    }
}

export const pluginMigrationRunner = new PluginMigrationRunner(null as any); // Will be initialized with real DB in PluginManager
