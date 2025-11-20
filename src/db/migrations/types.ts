import type { DatabaseType } from "../config/database-type.ts";
// Importamos el tipo de la base de datos desde drizzle-orm
// Usamos un tipo genérico para la DB ya que puede ser SQLite, Postgres o MySQL
// En tiempo de ejecución, el usuario debe castear o usar helpers si necesita métodos específicos
export type Database = any;

export interface CustomMigration {
    id: string;
    name?: string;
    /**
     * Ejecuta la migración.
     * @param db Instancia de la base de datos (Drizzle)
     * @param dbType Tipo de base de datos detectado ('sqlite', 'postgresql', 'mysql')
     */
    up: (db: Database, dbType: DatabaseType) => Promise<void>;

    /**
     * Revierte la migración (opcional).
     */
    down?: (db: Database, dbType: DatabaseType) => Promise<void>;
}

export interface MigrationRecord {
    id: string;
    type: "drizzle" | "custom";
    appliedAt: Date;
}
