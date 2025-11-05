-- Mejoras en la tabla de usuarios
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN last_login_at INTEGER;

-- Mejoras en la tabla de roles
ALTER TABLE roles ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0;

-- Actualizar roles del sistema existentes
UPDATE roles SET is_system = 1 WHERE name IN ('superadmin', 'admin', 'user', 'guest');
