import { getDbType } from '../config/database-type.ts';
import * as sqliteSchema from './sqlite/index.ts';

// Por ahora, si se detecta otro DB, lanzamos advertencia o usamos fallback
const dbType = getDbType();

if (dbType !== 'sqlite') {
    console.warn(`⚠️ Schema for ${dbType} not implemented yet. Using SQLite schema types (may cause issues).`);
}

// En el futuro, aquí importaremos y seleccionaremos los otros schemas
// En el futuro, aquí importaremos y seleccionaremos los otros schemas
// export const schema = sqliteSchema;

// Re-exportar todo del schema seleccionado
export * from './sqlite/index.ts';
