# Análisis de Seguridad OWASP - Admin Panel Nexus

**Fecha**: 2025-11-15
**Scope**: Páginas Nexus del Admin Panel (DashboardNexus, LoginNexus, ContentListNexus, SettingsNexus, UsersNexus, RolesNexus)

## Resumen Ejecutivo

Análisis basado en OWASP Top 10 2021 aplicado a las páginas del admin panel implementadas con diseño Nexus.

## Vulnerabilidades Encontradas

### 🔴 ALTA PRIORIDAD

#### 1. XSS (Cross-Site Scripting) - A03:2021

**Archivo**: `src/admin/pages/RolesNexus.tsx`
**Línea**: 906, 909, 914
**Descripción**: Uso de `innerHTML` con concatenación de strings sin escape adecuado.

```javascript
// VULNERABLE
content += '<div class="permission-group-header">' + module + ' <span class="permission-count">(' + actions.length + ')</span></div>';
document.getElementById('viewPermissionsContent').innerHTML = content;
```

**Riesgo**: Si `module` o `action` contienen caracteres especiales o scripts, podrían ejecutarse en el navegador.

**Solución**:
- Opción 1: Crear elementos DOM directamente con `createElement` y `textContent`
- Opción 2: Usar una función de escape HTML
- Opción 3: Usar template literals con escape automático

**Prioridad**: ALTA - Aunque los datos vienen de la base de datos, un administrador malicioso podría inyectar código.

---

#### 2. Injection via onclick handlers - A03:2021

**Archivos**:
- `src/admin/pages/RolesNexus.tsx:614`
- `src/admin/pages/UsersNexus.tsx:643`

**Descripción**: Uso de string interpolation en atributos `onclick` con escape manual.

```typescript
onclick="deleteRole(${role.id}, '${role.name.replace(/'/g, "\\'")}')"
onclick="editUser(${u.id}, '${(u.name || "").replace(/'/g, "\\'")}', ...)"
```

**Riesgo**: El escape manual de comillas simples no protege contra todos los vectores de XSS. Por ejemplo:
- Nombres con caracteres como `\` podrían escapar el escape
- Inyección de código JavaScript válido

**Solución**: Usar data attributes y event listeners:
```typescript
// En lugar de onclick="deleteRole(1, 'name')"
data-role-id="${role.id}" data-role-name="${role.name}"
// Y luego: element.addEventListener('click', () => deleteRole(element.dataset.roleId, element.dataset.roleName))
```

**Prioridad**: ALTA

---

### 🟡 MEDIA PRIORIDAD

#### 3. CSRF Protection - A01:2021

**Archivos**: Todos los formularios en páginas Nexus
**Descripción**: Los formularios POST no incluyen tokens CSRF visibles.

**Estado**: ⚠️ REQUIERE VERIFICACIÓN
- Necesita verificarse si Hono/middleware ya implementa CSRF protection
- Los formularios deberían incluir un token CSRF hidden

**Ejemplo Esperado**:
```html
<form method="POST" action="/admincp/settings/save">
  <input type="hidden" name="_csrf" value="${csrfToken}" />
  ...
</form>
```

**Prioridad**: MEDIA - Depende de si existe middleware de protección

---

#### 4. Autenticación y Autorización - A07:2021

**Estado**: ✅ IMPLEMENTADO CORRECTAMENTE

**Verificaciones encontradas**:
- Uso de `userPermissions` para verificar permisos antes de mostrar acciones
- Funciones `hasPermission()`, `canCreate`, `canUpdate`, `canDelete`
- Verificación server-side en admin.ts (verificado en rutas)

**Ejemplo**:
```typescript
const canCreate = hasPermission("roles:create");
${canCreate ? html`<button>Crear</button>` : ""}
```

**Nota**: Es CRÍTICO que estas validaciones también existan en el servidor (ya verificado en admin.ts).

---

### 🟢 BAJA PRIORIDAD / INFORMATIVO

#### 5. Imports Redundantes - Code Quality

**Archivo**: `src/routes/admin.ts` (YA CORREGIDO)
**Descripción**: Imports duplicados y no usados eliminados:
- ✅ Removido: `LoginPage`, `UsersPageImproved`, `RolesPageImproved`, `SettingsPage`
- ✅ Corregido: Import duplicado de `ContentListNexusPage`

---

#### 6. SQL Injection - A03:2021

**Estado**: ✅ PROTEGIDO

**Análisis**: El código usa Drizzle ORM que previene SQL injection mediante:
- Prepared statements
- Query builders parametrizados
- No se encontró concatenación directa de SQL

**Ejemplo seguro**:
```typescript
await db.query.users.findMany({
  where: eq(users.id, userId)  // Parametrizado ✓
})
```

---

#### 7. Sensitive Data Exposure - A02:2021

**Estado**: ✅ MANEJADO CORRECTAMENTE

**Observaciones**:
- Passwords usan type="password"
- No se exponen passwords en JavaScript
- Los tokens de autenticación usan httpOnly cookies (verificado en código de auth)

---

#### 8. Security Misconfiguration - A05:2021

**Áreas a verificar** (fuera del scope de este análisis):
- ⚠️ Headers de seguridad (CSP, X-Frame-Options, etc.)
- ⚠️ HTTPS enforcement
- ⚠️ Rate limiting en endpoints de auth
- ⚠️ Session timeout

---

## Recomendaciones de Remediación

### Inmediatas (Alta Prioridad)

1. **Arreglar XSS en RolesNexus.tsx**
   ```javascript
   // Crear helper de escape
   function escapeHtml(unsafe) {
     return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
   }

   // O mejor, usar createElement
   function createPermissionView(permsByModule) {
     const container = document.createElement('div');
     for (const [module, actions] of Object.entries(permsByModule)) {
       const group = document.createElement('div');
       group.className = 'permission-group';

       const header = document.createElement('div');
       header.className = 'permission-group-header';
       header.textContent = module; // Seguro ✓

       // ... etc
       container.appendChild(group);
     }
     return container;
   }
   ```

2. **Reemplazar onclick inline handlers**
   - Usar data attributes
   - Añadir event listeners en JavaScript
   - Eliminar string interpolation en HTML attributes

### Corto Plazo (Media Prioridad)

3. **Verificar CSRF Protection**
   - Revisar middleware de Hono
   - Añadir tokens CSRF si no existen

4. **Content Security Policy**
   - Implementar CSP headers
   - Prohibir inline scripts (requiere mover todo JS a archivos externos)

### Largo Plazo (Mejoras)

5. **Security Headers**
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Strict-Transport-Security
   - Referrer-Policy

6. **Rate Limiting**
   - Implementar en rutas de autenticación
   - Limitar intentos de login

## Tests de Seguridad Recomendados

```typescript
// Test 1: XSS Protection
describe('XSS Protection', () => {
  it('should escape HTML in role names', () => {
    const maliciousName = '<script>alert("XSS")</script>';
    const result = renderRoleName(maliciousName);
    expect(result).not.toContain('<script>');
  });
});

// Test 2: Authorization
describe('Authorization', () => {
  it('should not show delete button without permission', () => {
    const userWithoutPerms = { permissions: [] };
    const html = renderRoleActions(role, userWithoutPerms);
    expect(html).not.toContain('deleteRole');
  });
});

// Test 3: CSRF
describe('CSRF Protection', () => {
  it('should include CSRF token in forms', () => {
    const form = renderForm();
    expect(form).toContain('name="_csrf"');
  });
});
```

## Puntuación de Seguridad

**Score Actual**: 7.5/10

### Breakdown:
- ✅ SQL Injection Protection: 10/10
- ✅ Authentication/Authorization: 9/10
- ⚠️ XSS Protection: 5/10 (vulnerabilidades encontradas)
- ⚠️ CSRF Protection: 7/10 (requiere verificación)
- ✅ Sensitive Data: 9/10
- ⚠️ Security Headers: 6/10 (no verificado)

## Conclusión

El código tiene una base de seguridad sólida con buena autenticación y uso de ORM. Las vulnerabilidades XSS encontradas son de prioridad ALTA y deben corregirse inmediatamente. El escape manual en onclick handlers también debe reemplazarse con un enfoque más seguro.

**Siguiente paso**: Implementar las correcciones de Alta Prioridad y crear tests de seguridad.
