#!/usr/bin/env python3
"""
Script para verificar el sistema RBAC en la base de datos
"""

import sqlite3
import os

# Cargar variables de entorno desde .env
def load_env():
    """Carga variables de entorno desde el archivo .env"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if not os.path.exists(env_path):
        print("⚠️  Archivo .env no encontrado, usando valor por defecto")
        return {"DATABASE_URL": "./lexcms.db"}

    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()

    return env_vars

# Cargar configuración
env = load_env()
DB_PATH = env.get("DATABASE_URL", "./lexcms.db")

def main():
    print("🔍 Verificando sistema RBAC...\n")

    # Mostrar configuración
    print(f"📝 Base de datos: {DB_PATH}\n")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Verificar roles
    print("👥 ROLES:")
    cursor.execute("SELECT id, name, description, is_system FROM roles ORDER BY id")
    roles = cursor.fetchall()
    for role_id, name, desc, is_system in roles:
        system_tag = " [SISTEMA]" if is_system else ""
        print(f"   {role_id}. {name}{system_tag}")
        print(f"      {desc}")

    # Contar permisos por rol
    print("\n📊 PERMISOS POR ROL:")
    for role_id, name, _, _ in roles:
        cursor.execute(
            "SELECT COUNT(*) FROM role_permissions WHERE role_id = ?",
            (role_id,)
        )
        perm_count = cursor.fetchone()[0]
        print(f"   {name}: {perm_count} permisos")

    # Verificar usuario administrador
    print("\n👤 USUARIO ADMINISTRADOR:")
    cursor.execute("""
        SELECT u.id, u.email, u.name, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = 1
    """)
    user = cursor.fetchone()
    if user:
        user_id, email, name, role_name = user
        print(f"   ID: {user_id}")
        print(f"   Email: {email}")
        print(f"   Nombre: {name}")
        print(f"   Rol: {role_name}")
    else:
        print("   ⚠️  Usuario ID 1 no encontrado")

    # Mostrar algunos permisos
    print("\n🔐 PERMISOS DEL SISTEMA (primeros 20):")
    cursor.execute("""
        SELECT module, action, description
        FROM permissions
        ORDER BY module, action
        LIMIT 20
    """)
    permissions = cursor.fetchall()
    for module, action, desc in permissions:
        print(f"   {module}.{action}: {desc}")

    # Contar total de permisos
    cursor.execute("SELECT COUNT(*) FROM permissions")
    total_perms = cursor.fetchone()[0]
    print(f"\n   ... y {total_perms - 20} permisos más")

    # Estadísticas
    print("\n📈 ESTADÍSTICAS:")
    cursor.execute("SELECT COUNT(*) FROM roles")
    print(f"   Total de roles: {cursor.fetchone()[0]}")

    cursor.execute("SELECT COUNT(*) FROM permissions")
    print(f"   Total de permisos: {cursor.fetchone()[0]}")

    cursor.execute("SELECT COUNT(*) FROM role_permissions")
    print(f"   Total de asignaciones: {cursor.fetchone()[0]}")

    cursor.execute("SELECT COUNT(*) FROM users")
    print(f"   Total de usuarios: {cursor.fetchone()[0]}")

    # Verificar módulos únicos
    print("\n📦 MÓDULOS DEL SISTEMA:")
    cursor.execute("SELECT DISTINCT module FROM permissions ORDER BY module")
    modules = cursor.fetchall()
    for (module,) in modules:
        cursor.execute("SELECT COUNT(*) FROM permissions WHERE module = ?", (module,))
        count = cursor.fetchone()[0]
        print(f"   {module}: {count} permisos")

    print("\n✅ Sistema RBAC verificado correctamente!")

    conn.close()

if __name__ == "__main__":
    main()
