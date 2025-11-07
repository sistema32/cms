#!/usr/bin/env python3
"""
Script para crear la base de datos y ejecutar migraciones cuando deno no está disponible
"""

import sqlite3
import os
import sys

# Ruta a la base de datos
DB_PATH = "./lexcms.db"
MIGRATIONS_DIR = "./src/db/migrations"

def run_migration(conn, migration_file):
    """Ejecuta un archivo de migración SQL"""
    print(f"  Ejecutando: {os.path.basename(migration_file)}")

    with open(migration_file, 'r') as f:
        sql = f.read()

    # Dividir por statement-breakpoint si existe
    statements = sql.split('--> statement-breakpoint')

    for statement in statements:
        statement = statement.strip()
        if statement:
            try:
                conn.executescript(statement)
            except sqlite3.Error as e:
                print(f"    ⚠️  Error (puede ser ignorado si la tabla ya existe): {e}")

    conn.commit()

def main():
    print("🚀 Configurando base de datos...\n")

    # Crear conexión a la base de datos
    print(f"📁 Creando base de datos: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)

    try:
        # Obtener lista de migraciones
        migrations = sorted([
            os.path.join(MIGRATIONS_DIR, f)
            for f in os.listdir(MIGRATIONS_DIR)
            if f.endswith('.sql')
        ])

        print(f"\n📝 Ejecutando {len(migrations)} migraciones...\n")

        # Ejecutar cada migración
        for migration in migrations:
            run_migration(conn, migration)

        print("\n✅ Migraciones completadas exitosamente!")
        print("\n🎯 Próximo paso:")
        print("   Ejecuta el seed con: python3 scripts/run_seed.py")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

    finally:
        conn.close()

if __name__ == "__main__":
    main()
