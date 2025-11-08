# Sistema de Notificaciones del Panel de Administración

Este documento describe el nuevo sistema de notificaciones implementado en el panel de administración de LexCMS, inspirado en el template Spike Free Tailwind.

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Componentes](#componentes)
3. [Integración Backend](#integración-backend)
4. [Uso](#uso)
5. [Estilos Mejorados](#estilos-mejorados)
6. [Ejemplos](#ejemplos)

---

## 🎯 Descripción General

El sistema de notificaciones incluye:

- **Toast Notifications**: Mensajes temporales que aparecen en la esquina superior derecha
- **Notification Panel**: Panel dropdown que muestra las notificaciones del usuario
- **Notificaciones en Tiempo Real**: Polling automático cada 30 segundos para nuevas notificaciones
- **Estilos Modernos**: Inspirados en Spike Free Tailwind template con gradientes y animaciones

---

## 🧩 Componentes

### 1. Toast Component (`src/admin/components/Toast.tsx`)

Sistema de notificaciones toast para mensajes temporales.

**Características:**
- 4 tipos: success, error, warning, info
- Auto-dismiss configurable
- Barra de progreso animada
- Cierre manual
- Animaciones de entrada/salida

**API Global:**
```javascript
// Mostrar notificación de éxito
window.toast.success('Operación exitosa', 'Título opcional', 5000);

// Mostrar notificación de error
window.toast.error('Error al guardar', 'Error', 0); // 0 = no auto-dismiss

// Mostrar notificación de advertencia
window.toast.warning('Atención requerida', 'Advertencia');

// Mostrar notificación informativa
window.toast.info('Nueva actualización disponible');

// Uso avanzado
window.toastManager.show({
  type: 'success',
  title: 'Guardado',
  message: 'Los cambios se guardaron correctamente',
  duration: 3000,
  id: 'custom-id' // opcional
});

// Cerrar toast específico
window.toastManager.remove('custom-id');
```

### 2. Notification Panel (`src/admin/components/NotificationPanel.tsx`)

Panel dropdown que muestra las notificaciones del usuario.

**Características:**
- Muestra últimas 5 notificaciones no leídas
- Badge con contador de notificaciones no leídas
- Marca notificaciones como leídas al hacer clic
- Opción para marcar todas como leídas
- Timestamps relativos (hace X minutos/horas)
- Polling automático cada 30 segundos
- Tipos de notificación con iconos: comment, user, content, system

**Props:**
```typescript
interface NotificationPanelProps {
  adminPath: string;
  notifications?: NotificationItem[];
  unreadCount?: number;
}

interface NotificationItem {
  id: number;
  type: string; // 'comment', 'user', 'content', 'system'
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}
```

### 3. Admin Layout Actualizado

El `AdminLayout` ahora acepta notificaciones:

```typescript
AdminLayout({
  title: "Dashboard",
  children: content,
  activePage: "dashboard",
  user: {
    name: "Usuario",
    email: "user@example.com"
  },
  notifications: [...], // Array de notificaciones
  unreadNotificationCount: 5 // Contador de no leídas
})
```

---

## 🔌 Integración Backend

### Rutas API Existentes

El sistema utiliza las siguientes rutas de `/api/notifications`:

```typescript
// Obtener notificaciones del usuario
GET /api/notifications
  ?isRead=false    // Filtrar por leídas/no leídas
  &type=comment    // Filtrar por tipo
  &limit=20        // Límite de resultados
  &offset=0        // Paginación

// Obtener contador de no leídas
GET /api/notifications/unread-count
// Response: { success: true, count: 5 }

// Marcar notificación como leída
PATCH /api/notifications/:id/read
// Response: { success: true, message: "..." }

// Marcar todas como leídas
POST /api/notifications/read-all
// Response: { success: true, message: "..." }

// Eliminar notificación
DELETE /api/notifications/:id

// Obtener preferencias de notificaciones
GET /api/notifications/preferences
```

### Integración en Dashboard

En `src/routes/admin.ts`:

```typescript
// Importar servicio de notificaciones
import { notificationService } from "../lib/email/index.ts";

// En la ruta del dashboard
adminRouter.get("/", async (c) => {
  const user = c.get("user");

  // Obtener notificaciones
  let notifications = [];
  let unreadNotificationCount = 0;
  try {
    notifications = await notificationService.getForUser({
      userId: user.id,
      isRead: false,
      limit: 5,
      offset: 0,
    });
    unreadNotificationCount = await notificationService.getUnreadCount(user.id);
  } catch (error) {
    console.error("Error loading notifications:", error);
  }

  // Pasar al dashboard
  return c.html(
    DashboardPage({
      user,
      stats,
      recentPosts,
      notifications,
      unreadNotificationCount,
    })
  );
});
```

---

## 💻 Uso

### Reemplazar alert() con Toast

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

### Notificaciones de Éxito

```javascript
// Después de guardar un post
fetch('/api/posts', { method: 'POST', body: data })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.toast.success('Post guardado correctamente', 'Éxito');
      // Redirigir o actualizar UI
    }
  })
  .catch(err => {
    window.toast.error('Error al guardar el post', 'Error');
  });
```

### Crear Notificaciones desde el Backend

```typescript
// Crear notificación cuando se publica un comentario
await notificationService.create({
  userId: postAuthorId,
  type: 'comment',
  title: 'Nuevo comentario',
  message: `${commenterName} comentó en tu post "${postTitle}"`,
  actionUrl: `/admin/posts/${postId}#comments`,
  priority: 'medium'
});
```

---

## 🎨 Estilos Mejorados

### Nuevas Clases CSS Disponibles

Inspiradas en Spike Free Tailwind template:

#### Cards Mejoradas
```html
<!-- Card con gradiente -->
<div class="stats-card-enhanced">
  <h3>Título</h3>
  <p>Contenido</p>
</div>

<!-- Card moderna -->
<div class="modern-card">
  <div class="modern-card-header">Header</div>
  <div class="modern-card-body">Body</div>
  <div class="modern-card-footer">Footer</div>
</div>
```

#### Botones con Gradiente
```html
<!-- Botón principal con gradiente -->
<button class="btn-gradient">Guardar</button>

<!-- Botón de éxito -->
<button class="btn-gradient-success">Publicar</button>

<!-- Botón de peligro -->
<button class="btn-gradient-danger">Eliminar</button>
```

#### Badges Modernos
```html
<span class="badge-modern badge-modern-success">Activo</span>
<span class="badge-modern badge-modern-warning">Pendiente</span>
<span class="badge-modern badge-modern-danger">Cancelado</span>
<span class="badge-modern badge-modern-info">Info</span>
```

#### Contenedores de Iconos
```html
<div class="icon-container icon-container-purple">
  <svg>...</svg>
</div>

<div class="icon-container icon-container-blue">
  <svg>...</svg>
</div>
```

#### Inputs Mejorados
```html
<input type="text" class="form-input-enhanced" placeholder="Nombre">
```

#### Tablas Modernas
```html
<table class="modern-table">
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

#### Estados de Carga
```html
<!-- Skeleton loader -->
<div class="skeleton h-32 w-full"></div>
<div class="skeleton-text w-3/4"></div>

<!-- Spinner -->
<div class="spinner"></div>
```

#### Alertas
```html
<div class="alert alert-success">Operación exitosa</div>
<div class="alert alert-error">Error al procesar</div>
<div class="alert alert-warning">Atención requerida</div>
<div class="alert alert-info">Información importante</div>
```

#### Estados Vacíos
```html
<div class="empty-state">
  <svg class="empty-state-icon">...</svg>
  <h3 class="empty-state-title">No hay datos</h3>
  <p class="empty-state-description">Comienza creando tu primer item</p>
  <button class="btn-gradient">Crear Nuevo</button>
</div>
```

---

## 📝 Ejemplos

### Ejemplo 1: Form con Validación

```javascript
function savePost(formData) {
  // Mostrar loading
  const loadingToast = window.toast.info(
    'Guardando cambios...',
    'Procesando',
    0 // No auto-dismiss
  );

  fetch('/api/posts', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    // Cerrar loading
    window.toastManager.remove(loadingToast);

    if (data.success) {
      window.toast.success(
        'El post se guardó correctamente',
        'Guardado'
      );
      window.location.href = '/admin/posts';
    } else {
      window.toast.error(
        data.error || 'Error al guardar',
        'Error'
      );
    }
  })
  .catch(err => {
    window.toastManager.remove(loadingToast);
    window.toast.error(
      'Error de conexión. Intenta nuevamente.',
      'Error de red'
    );
  });
}
```

### Ejemplo 2: Eliminar con Confirmación

```javascript
function deletePost(postId) {
  if (!confirm('¿Estás seguro de eliminar este post?')) {
    return;
  }

  fetch(`/api/posts/${postId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.toast.success('Post eliminado correctamente', 'Eliminado');
      // Remover del DOM o recargar
      document.getElementById(`post-${postId}`).remove();
    } else {
      window.toast.error('No se pudo eliminar el post', 'Error');
    }
  });
}
```

### Ejemplo 3: Upload de Archivos con Progreso

```javascript
function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  window.toast.info(
    `Subiendo ${file.name}...`,
    'Upload',
    0
  );

  fetch('/api/media/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.toast.success(
        'Archivo subido correctamente',
        'Completado'
      );
    }
  })
  .catch(err => {
    window.toast.error(
      'Error al subir el archivo',
      'Error de upload'
    );
  });
}
```

---

## 🔄 Polling de Notificaciones

El sistema actualiza automáticamente el contador de notificaciones cada 30 segundos:

```javascript
// En NotificationPanel.tsx
setInterval(() => {
  updateNotificationBadge();
}, 30000);
```

Para cambiar la frecuencia, modifica el intervalo en:
- `src/admin/components/NotificationPanel.tsx` (línea ~343)

---

## 🎯 Mejoras Futuras

- [ ] WebSocket para notificaciones en tiempo real (sin polling)
- [ ] Sonido al recibir notificación
- [ ] Notificaciones push del navegador
- [ ] Filtros de notificaciones por tipo
- [ ] Configuración de preferencias de notificaciones
- [ ] Historial completo de notificaciones con paginación
- [ ] Notificaciones agrupadas por categoría

---

## 📚 Referencias

- **Spike Free Tailwind**: Template base para el diseño
- **Tailwind CSS**: Framework de estilos
- **Notification Service**: `/src/lib/email/index.ts`
- **API Routes**: `/src/routes/notifications.ts`

---

## 🐛 Solución de Problemas

### Toast no aparece

Verifica que:
1. El `ToastContainer` esté incluido en el layout
2. La consola del navegador no muestre errores
3. El script de inicialización se ejecute correctamente

### Notificaciones no cargan

Verifica que:
1. El usuario esté autenticado
2. Las rutas API estén funcionando (`/api/notifications`)
3. El servicio de notificaciones esté disponible
4. Hay notificaciones en la base de datos

### Estilos no se aplican

1. Compilar CSS: `deno task css:build:admin`
2. Limpiar caché del navegador
3. Verificar que admin-compiled.css esté actualizado

---

Desarrollado para LexCMS Admin Panel
Inspirado en Spike Free Tailwind Admin Template
