# Guía de Prueba - Sistema de Notificaciones

Esta guía te ayudará a probar el nuevo sistema de notificaciones implementado en el admin panel.

## 🐛 Bug Fix Aplicado

**Problema resuelto:** Error `undefined cannot be passed as argument to the database`

**Causa:** El JWT payload contiene la propiedad `userId`, no `id`.

**Solución:** Actualizado el código para usar `user.userId` en lugar de `user.id`.

---

## ✅ Pre-requisitos

1. Base de datos configurada con tabla `notifications`
2. Usuario autenticado en el admin panel
3. Servidor corriendo: `deno task dev`

---

## 🧪 Pruebas Básicas

### 1. Probar Toast Notifications

Abre el admin panel y en la consola del navegador ejecuta:

```javascript
// Toast de éxito
window.toast.success('¡Operación exitosa!', 'Éxito');

// Toast de error
window.toast.error('Algo salió mal', 'Error');

// Toast de advertencia
window.toast.warning('Atención requerida', 'Advertencia');

// Toast de info
window.toast.info('Nueva información disponible', 'Info');

// Toast sin auto-dismiss
window.toast.success('Mensaje persistente', 'Permanente', 0);
```

**Resultado esperado:** Deberías ver notificaciones toast aparecer en la esquina superior derecha con animaciones suaves.

### 2. Verificar Panel de Notificaciones

1. Navega al dashboard del admin panel
2. Busca el icono de campana (🔔) en el header
3. Si hay notificaciones no leídas, deberías ver un badge rojo con el número
4. Haz clic en el icono para abrir el panel dropdown

**Resultado esperado:** Panel desplegable con notificaciones (o mensaje "No hay notificaciones").

### 3. Probar API de Notificaciones

En la consola del navegador:

```javascript
// Obtener contador de notificaciones no leídas
fetch('/api/notifications/unread-count')
  .then(r => r.json())
  .then(data => console.log('Unread count:', data));

// Obtener notificaciones
fetch('/api/notifications?limit=5&isRead=false')
  .then(r => r.json())
  .then(data => console.log('Notifications:', data));
```

**Resultado esperado:** Respuestas JSON con éxito (no errores 500).

---

## 📝 Crear Notificaciones de Prueba

### Opción 1: Desde la Consola de Deno

```typescript
// Ejecutar en deno repl o script
import { db } from "./src/config/db.ts";
import { notifications } from "./src/db/schema.ts";

// Insertar notificación de prueba
await db.insert(notifications).values({
  userId: 1, // Cambiar al ID de tu usuario
  type: 'system',
  title: 'Notificación de prueba',
  message: 'Esta es una notificación de prueba del sistema',
  isRead: false,
  priority: 'medium',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Opción 2: Desde SQL Directamente

```sql
INSERT INTO notifications (user_id, type, title, message, is_read, priority, created_at, updated_at)
VALUES (
  1, -- Tu user ID
  'comment',
  'Nuevo comentario',
  'Alguien comentó en tu post',
  0,
  'high',
  datetime('now'),
  datetime('now')
);
```

### Opción 3: Usar el Notification Service

Crear un endpoint temporal de prueba en `src/routes/admin.ts`:

```typescript
// Agregar esta ruta temporalmente
adminRouter.post("/test-notification", async (c) => {
  const user = c.get("user");

  await notificationService.create({
    userId: user.userId,
    type: 'system',
    title: 'Notificación de Prueba',
    message: 'Esta es una notificación de prueba generada desde el endpoint',
    priority: 'medium'
  });

  return c.json({ success: true, message: 'Notification created' });
});
```

Luego desde el navegador:

```javascript
fetch('/admin/test-notification', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
    console.log(data);
    window.toast.success('Notificación de prueba creada', 'Éxito');
  });
```

---

## 🎯 Pruebas de Interacción

### Marcar como Leída

1. Abre el panel de notificaciones
2. Haz clic en cualquier notificación no leída
3. Observa que el badge se actualiza

**Resultado esperado:**
- Toast "Notificación marcada como leída"
- Badge actualizado con nuevo contador
- Notificación cambia de apariencia (sin fondo morado)

### Marcar Todas como Leídas

1. Abre el panel de notificaciones (debe haber notificaciones no leídas)
2. Haz clic en "Marcar todas como leídas"
3. Observa el resultado

**Resultado esperado:**
- Página recarga
- Badge desaparece
- Todas las notificaciones están marcadas como leídas

### Polling Automático

1. Abre el panel del admin
2. Deja la pestaña abierta por 30 segundos
3. En otra pestaña, crea una nueva notificación (usando algún método anterior)
4. Espera hasta 30 segundos

**Resultado esperado:** El badge se actualiza automáticamente sin necesidad de recargar.

---

## 🎨 Probar Nuevos Estilos

### Botones con Gradiente

En cualquier página del admin, prueba estos botones en la consola:

```javascript
// Crear botón de prueba
const testBtn = document.createElement('button');
testBtn.className = 'btn-gradient';
testBtn.textContent = 'Botón Gradiente';
testBtn.onclick = () => window.toast.success('¡Funciona!');
document.body.appendChild(testBtn);
testBtn.style.position = 'fixed';
testBtn.style.bottom = '20px';
testBtn.style.right = '20px';
testBtn.style.zIndex = '9999';
```

### Cards Modernas

```javascript
// Crear card de prueba
const card = document.createElement('div');
card.className = 'modern-card';
card.style.position = 'fixed';
card.style.top = '100px';
card.style.right = '20px';
card.style.width = '300px';
card.style.zIndex = '9999';
card.innerHTML = `
  <div class="modern-card-header">
    <h3 class="text-lg font-semibold">Card de Prueba</h3>
  </div>
  <div class="modern-card-body">
    <p>Esta es una card moderna con el nuevo diseño</p>
  </div>
  <div class="modern-card-footer">
    <button class="btn-gradient" onclick="this.closest('.modern-card').remove()">
      Cerrar
    </button>
  </div>
`;
document.body.appendChild(card);
```

### Badges Modernos

```javascript
// Crear badges de prueba
const container = document.createElement('div');
container.style.position = 'fixed';
container.style.top = '50px';
container.style.left = '50%';
container.style.transform = 'translateX(-50%)';
container.style.zIndex = '9999';
container.style.display = 'flex';
container.style.gap = '10px';
container.innerHTML = `
  <span class="badge-modern badge-modern-success">Éxito</span>
  <span class="badge-modern badge-modern-warning">Advertencia</span>
  <span class="badge-modern badge-modern-danger">Peligro</span>
  <span class="badge-modern badge-modern-info">Info</span>
`;
document.body.appendChild(container);
setTimeout(() => container.remove(), 5000);
```

---

## 🔍 Verificar Logs

### Logs del Navegador

Abre DevTools (F12) y verifica:

```
Console > No errores relacionados con notificaciones
Network > GET /api/notifications/unread-count debe retornar 200 (no 500)
```

### Logs del Servidor

En la terminal donde corre `deno task dev`, busca:

```bash
# ✅ Correcto
<-- GET /api/notifications/unread-count 200

# ❌ Error (ya resuelto)
Failed to get unread count: Error: ...undefined cannot be passed...
```

---

## 🚨 Solución de Problemas

### Error: "window.toast is not defined"

**Causa:** ToastContainer no está cargado.

**Solución:** Verifica que AdminLayout incluya `${ToastContainer()}` al final del body.

### Panel de notificaciones no abre

**Causa:** JavaScript no se ejecutó correctamente.

**Solución:**
1. Verifica errores en consola
2. Asegúrate de que NotificationPanel esté incluido en AdminLayout

### Badge no muestra número

**Causa:** No hay notificaciones no leídas O error en la API.

**Solución:**
1. Crea notificaciones de prueba
2. Verifica que `/api/notifications/unread-count` retorne un número > 0

### Estilos no se aplican

**Causa:** CSS no compilado.

**Solución:**
```bash
deno task css:build:admin
```

---

## ✅ Checklist de Pruebas Completas

- [ ] Toast notifications aparecen correctamente (success, error, warning, info)
- [ ] Toast se auto-cierra después del tiempo configurado
- [ ] Toast se puede cerrar manualmente
- [ ] Panel de notificaciones se abre/cierra al hacer clic
- [ ] Badge muestra el contador correcto
- [ ] Notificaciones se marcan como leídas al hacer clic
- [ ] "Marcar todas como leídas" funciona
- [ ] Polling automático actualiza el badge cada 30s
- [ ] Timestamps se muestran en formato relativo
- [ ] API /api/notifications/unread-count retorna 200
- [ ] API /api/notifications retorna lista de notificaciones
- [ ] Nuevos estilos CSS se aplican correctamente
- [ ] Dark mode funciona en todos los componentes
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs del servidor

---

## 📊 Casos de Uso para Probar

### Caso 1: Flujo Completo de Comentario

1. Usuario publica un comentario en un post
2. Sistema crea notificación para el autor del post
3. Autor ve badge con "1" en el header
4. Autor abre panel y ve "Nuevo comentario en tu post"
5. Autor hace clic y es redirigido al post
6. Notificación se marca como leída
7. Badge desaparece

### Caso 2: Múltiples Notificaciones

1. Crear 5 notificaciones de prueba
2. Verificar que badge muestre "5"
3. Abrir panel y ver las 5 notificaciones
4. Hacer clic en "Marcar todas como leídas"
5. Verificar que todas cambien de estado
6. Badge debe desaparecer

### Caso 3: Notificaciones en Tiempo Real

1. Abrir admin panel en 2 pestañas
2. En pestaña 1, crear una notificación para el usuario actual
3. Esperar 30 segundos o menos
4. Verificar que pestaña 2 muestre el nuevo badge automáticamente

---

## 🎓 Mejores Prácticas

### Reemplazar alert() Existentes

**Antes:**
```javascript
if (error) {
  alert('Error al guardar');
}
```

**Después:**
```javascript
if (error) {
  window.toast.error('Error al guardar los cambios', 'Error');
}
```

### Feedback en Operaciones CRUD

```javascript
// CREATE
fetch('/api/posts', { method: 'POST', body: data })
  .then(() => {
    window.toast.success('Post creado correctamente', 'Éxito');
    window.location.href = '/admin/posts';
  })
  .catch(() => {
    window.toast.error('No se pudo crear el post', 'Error');
  });

// UPDATE
fetch('/api/posts/1', { method: 'PUT', body: data })
  .then(() => {
    window.toast.success('Post actualizado', 'Guardado');
  });

// DELETE
fetch('/api/posts/1', { method: 'DELETE' })
  .then(() => {
    window.toast.success('Post eliminado', 'Eliminado');
  });
```

---

## 📝 Notas Finales

- El sistema está completamente funcional después del fix de `userId`
- Todas las notificaciones requieren autenticación
- El polling se ejecuta cada 30 segundos en background
- Los estilos son totalmente compatibles con dark mode
- La documentación completa está en `docs/ADMIN_NOTIFICATIONS_SYSTEM.md`

**¡Feliz testing!** 🎉
