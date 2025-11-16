# Tests de Seguridad - Admin Panel Nexus

Tests unitarios para verificar las correcciones de seguridad implementadas en las páginas Nexus del admin panel.

## Requisitos

- Deno 1.x o superior

## Ejecutar Tests

### Todos los tests de seguridad

```bash
deno test tests/security/ --allow-read
```

### Solo tests de protección XSS

```bash
deno test tests/security/xss-protection.test.ts --allow-read
```

### Solo tests de seguridad general

```bash
deno test tests/security/general-security.test.ts --allow-read
```

## Cobertura de Tests

### XSS Protection (`xss-protection.test.ts`)

✅ **RolesNexus**
- Verifica que no existan onclick handlers con string interpolation vulnerable
- Verifica uso de data attributes en lugar de onclick inline
- Verifica uso de DOM API (createElement + textContent) en lugar de innerHTML
- Verifica configuración de event listeners con DOMContentLoaded
- Verifica event delegation con closest()

✅ **UsersNexus**
- Verifica que no existan onclick handlers vulnerables en botones de editar/eliminar
- Verifica uso de data attributes (data-user-id, data-user-name, data-user-email, etc.)
- Verifica configuración de event listeners
- Verifica event delegation para edit y delete buttons

✅ **Otras páginas Nexus**
- Verifica que no tengan patrones peligrosos de innerHTML
- Verifica que no usen eval()
- Verifica checks de autorización (hasPermission, canCreate, canUpdate, canDelete)

### General Security (`general-security.test.ts`)

✅ **SQL Injection Protection**
- Verifica que no haya concatenación de SQL
- Verifica uso de Drizzle ORM con queries parametrizadas

✅ **Sensitive Data Protection**
- Verifica que campos de password usen type="password"
- Verifica que no haya credenciales hardcoded
- Verifica que no se logueen passwords

✅ **HTTPS & Network Security**
- Verifica uso de ADMIN_BASE_PATH en fetch calls
- Verifica que no haya URLs absolutas inseguras

✅ **CSP Compliance**
- Verifica que no haya inline event handlers con template literals
- Verifica uso de raw() blocks para scripts

✅ **Authorization**
- Verifica que rutas destructivas tengan checks de permisos
- Verifica uso de userHasPermission, isSuperAdmin, etc.

✅ **Code Quality**
- Verifica que no haya imports redundantes
- Verifica validación de inputs (parseInt, Number.isFinite)

## Resultados Esperados

Todos los tests deberían pasar (✓) si las correcciones de seguridad están correctamente implementadas.

### Ejemplo de salida exitosa

```
test RolesNexus: should not have inline onclick handlers ... ok (5ms)
test RolesNexus: should use DOM API instead of innerHTML ... ok (3ms)
test RolesNexus: should have event listeners setup ... ok (2ms)
test UsersNexus: should not have inline onclick handlers ... ok (4ms)
test UsersNexus: should have event listeners setup ... ok (2ms)
test Security: verify no eval() usage in Nexus pages ... ok (8ms)
test Security: verify authorization checks in Nexus pages ... ok (6ms)

ok | 7 passed | 0 failed (30ms)
```

## Vulnerabilidades Corregidas

### 1. XSS via innerHTML (ALTA PRIORIDAD)
**Antes:**
```javascript
content += '<div>' + module + '</div>';
document.getElementById('content').innerHTML = content;
```

**Después:**
```javascript
const div = document.createElement('div');
div.textContent = module; // XSS safe
container.appendChild(div);
```

### 2. XSS via onclick handlers (ALTA PRIORIDAD)
**Antes:**
```html
<button onclick="deleteRole(${id}, '${name.replace(/'/g, "\\'")}')">
```

**Después:**
```html
<button data-role-id="${id}" data-role-name="${name}" class="btn-delete-role">
```
```javascript
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-delete-role');
  if (btn) deleteRole(btn.dataset.roleId, btn.dataset.roleName);
});
```

### 3. Imports Redundantes
**Antes:**
```typescript
import { LoginPage } from "./Login.tsx";
import { LoginNexusPage } from "./LoginNexus.tsx";
// Ambos importados pero solo se usa LoginNexusPage
```

**Después:**
```typescript
import { LoginNexusPage } from "./LoginNexus.tsx";
// Solo el necesario
```

## Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Análisis Completo

Ver `SECURITY_ANALYSIS.md` en la raíz del proyecto para el análisis completo de seguridad OWASP.
