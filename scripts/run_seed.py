#!/usr/bin/env python3
"""
Script para ejecutar el seed de la base de datos incluyendo RBAC
"""

import sqlite3
import hashlib
import base64
import os

DB_PATH = "./lexcms.db"

def hash_password(password):
    """Simula el hash de bcrypt de forma simple (para desarrollo)"""
    # Nota: Esto es solo para el seed, en producción se usa bcrypt real
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def seed_rbac(conn):
    """Ejecuta el seed de RBAC"""
    print("\n🔐 Creando sistema RBAC...\n")

    cursor = conn.cursor()

    # Módulos del sistema
    modules = {
        "posts": "Artículos y publicaciones",
        "pages": "Páginas estáticas",
        "categories": "Categorías de contenido",
        "tags": "Etiquetas de contenido",
        "comments": "Comentarios",
        "media": "Biblioteca de medios",
        "users": "Usuarios del sistema",
        "roles": "Roles y permisos",
        "settings": "Configuración del sistema",
        "menus": "Menús de navegación",
        "plugins": "Plugins y extensiones",
        "backups": "Copias de seguridad",
        "audit": "Registros de auditoría",
        "webhooks": "Webhooks",
        "dashboard": "Panel de administración",
    }

    # Acciones CRUD
    actions = {
        "create": "Crear",
        "read": "Leer",
        "update": "Actualizar",
        "delete": "Eliminar",
    }

    # Permisos especiales
    special_permissions = [
        # Media
        ("media", "upload", "Subir archivos a la biblioteca"),
        ("media", "delete_others", "Eliminar archivos de otros usuarios"),
        # Comentarios
        ("comments", "moderate", "Moderar comentarios"),
        ("comments", "approve", "Aprobar comentarios"),
        # Usuarios
        ("users", "manage_roles", "Asignar roles a usuarios"),
        ("users", "manage_2fa", "Gestionar autenticación de dos factores"),
        # Settings
        ("settings", "manage", "Administrar toda la configuración"),
        # Plugins
        ("plugins", "install", "Instalar plugins"),
        ("plugins", "activate", "Activar/desactivar plugins"),
        ("plugins", "configure", "Configurar plugins"),
        # Backups
        ("backups", "create", "Crear copias de seguridad"),
        ("backups", "restore", "Restaurar desde copias de seguridad"),
        ("backups", "download", "Descargar copias de seguridad"),
        # Dashboard
        ("dashboard", "access", "Acceder al panel de administración"),
        ("dashboard", "view_stats", "Ver estadísticas del dashboard"),
        # Audit
        ("audit", "view", "Ver registros de auditoría"),
        # Webhooks
        ("webhooks", "test", "Probar webhooks"),
    ]

    print("📋 Creando permisos...")

    # Crear permisos CRUD para cada módulo
    permissions_created = 0
    for module, module_desc in modules.items():
        for action, action_name in actions.items():
            description = f"{action_name} {module_desc.lower()}"
            try:
                cursor.execute(
                    "INSERT INTO permissions (module, action, description) VALUES (?, ?, ?)",
                    (module, action, description)
                )
                permissions_created += 1
            except sqlite3.IntegrityError:
                pass  # Ya existe

    # Crear permisos especiales
    for module, action, description in special_permissions:
        try:
            cursor.execute(
                "INSERT INTO permissions (module, action, description) VALUES (?, ?, ?)",
                (module, action, description)
            )
            permissions_created += 1
        except sqlite3.IntegrityError:
            pass  # Ya existe

    print(f"   ✅ {permissions_created} permisos creados")

    # Crear rol de Superadministrador
    print("\n👥 Creando roles...")

    cursor.execute(
        "INSERT OR IGNORE INTO roles (name, description, is_system) VALUES (?, ?, ?)",
        ("superadmin", "Superadministrador con acceso total al sistema", 1)
    )

    cursor.execute("SELECT id FROM roles WHERE name = 'superadmin'")
    superadmin_role_id = cursor.fetchone()[0]
    print(f"   ✅ Rol 'superadmin' creado (ID: {superadmin_role_id})")

    # Crear rol de Usuario Público
    cursor.execute(
        "INSERT OR IGNORE INTO roles (name, description, is_system) VALUES (?, ?, ?)",
        ("public_user", "Usuario público con acceso solo a lectura de contenido público", 1)
    )

    cursor.execute("SELECT id FROM roles WHERE name = 'public_user'")
    public_role_id = cursor.fetchone()[0]
    print(f"   ✅ Rol 'public_user' creado (ID: {public_role_id})")

    # Asignar TODOS los permisos al superadmin
    print("\n🔗 Asignando permisos...")

    cursor.execute("SELECT id FROM permissions")
    all_permission_ids = [row[0] for row in cursor.fetchall()]

    for perm_id in all_permission_ids:
        try:
            cursor.execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                (superadmin_role_id, perm_id)
            )
        except sqlite3.IntegrityError:
            pass  # Ya existe

    print(f"   ✅ {len(all_permission_ids)} permisos asignados a superadmin")

    # Asignar permisos de lectura pública
    public_permissions = [
        ("posts", "read"),
        ("pages", "read"),
        ("categories", "read"),
        ("tags", "read"),
        ("media", "read"),
        ("comments", "read"),
        ("comments", "create"),
    ]

    public_count = 0
    for module, action in public_permissions:
        cursor.execute(
            "SELECT id FROM permissions WHERE module = ? AND action = ?",
            (module, action)
        )
        perm = cursor.fetchone()
        if perm:
            try:
                cursor.execute(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                    (public_role_id, perm[0])
                )
                public_count += 1
            except sqlite3.IntegrityError:
                pass

    print(f"   ✅ {public_count} permisos asignados a public_user")

    # Asignar rol de superadmin al usuario ID 1
    print("\n👤 Asignando rol al usuario administrador...")
    cursor.execute(
        "UPDATE users SET role_id = ? WHERE id = 1",
        (superadmin_role_id,)
    )
    print(f"   ✅ Usuario ID 1 ahora es superadministrador")

    conn.commit()

def main():
    print("🌱 Seeding database...\n")

    # Crear conexión a la base de datos
    conn = sqlite3.connect(DB_PATH)

    try:
        cursor = conn.cursor()

        # Verificar si ya existe el usuario admin
        cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'admin@example.com'")
        user_exists = cursor.fetchone()[0] > 0

        if not user_exists:
            print("📝 Creando usuario administrador...")
            # Crear usuario administrador
            # Nota: En producción, esto debería usar bcrypt real
            password_hash = "$2a$10$K7L/JLX8cCGVhvAQvgY5eO5VJZQnEVtCFNJ8kQVNFJ7YQ8cGVhvAQ"  # password123

            cursor.execute(
                "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
                ("admin@example.com", password_hash, "Admin User")
            )

            print("   ✅ Usuario administrador creado")
            print("      Email: admin@example.com")
            print("      Password: password123")
        else:
            print("ℹ️  Usuario administrador ya existe")

        # Ejecutar seed de RBAC
        seed_rbac(conn)

        print("\n✅ Database seeded successfully!")
        print("\n🎉 Sistema listo para usar:")
        print("   - Usuario: admin@example.com")
        print("   - Password: password123")
        print("   - Rol: superadmin (asignado automáticamente)")
        print("\n💡 Inicia el servidor con: deno task dev")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return 1

    finally:
        conn.close()

    return 0

if __name__ == "__main__":
    exit(main())
