# Solución del Error: "no such table: ip_block_rules"

## Problema
El sistema de seguridad requiere las tablas `ip_block_rules` y `security_events` que fueron agregadas en la migración `0017_add_security.sql`.

## ✅ Solución Aplicada

La migración ha sido aplicada correctamente en `/home/user/cms/lexcms.db`.

## 📋 Si necesitas aplicarla en otro directorio

Si estás ejecutando el proyecto desde `/home/jano/lexcms/1/` o cualquier otro directorio:

### Opción 1: Usar el comando de migración del proyecto (Recomendado)
```bash
deno task db:migrate
```

### Opción 2: Usar el script independiente
```bash
deno run --allow-read --allow-write apply-security-migration.ts
```

### Opción 3: Copiar la base de datos ya migrada
```bash
# Desde el directorio donde está la base de datos migrada
cp /home/user/cms/lexcms.db /home/jano/lexcms/1/lexcms.db
```

## 🔍 Verificación

Después de aplicar la migración, verifica que las tablas existan:

```bash
# Con Deno
deno task dev
# El servidor debería iniciar sin errores
```

## 📝 Tablas creadas

La migración crea las siguientes tablas:

1. **ip_block_rules**: Reglas para bloquear IPs
   - Índices: ip, type, expires_at

2. **security_events**: Registro de eventos de seguridad
   - Índices: type, ip, severity, created_at

## ⚠️ Nota Importante

Este proyecto requiere **Deno** para ejecutarse. Si no lo tienes instalado:

```bash
# Instalar Deno (Linux/Mac)
curl -fsSL https://deno.land/install.sh | sh

# O con package manager
# Ubuntu/Debian
sudo snap install deno

# Mac
brew install deno
```
