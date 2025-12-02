## Sistema de Aprobación de Plugins desde el Panel Web

### ✅ **Implementación Completa**

Ahora los administradores pueden aprobar nuevos plugins directamente desde el panel web en lugar de usar la consola.

---

### **Flujo de Aprobación**

**Antes** (Auto-registro):
```
1. Plugin copiado a /plugins/my-plugin/
2. ✅ Auto-descubierto
3. ✅ Auto-registrado
4. ✅ Permisos auto-grant
5. ✅ Listo para activar
```

**Ahora** (Aprobación Manual):
```
1. Plugin copiado a /plugins/my-plugin/
2. 🔍 Auto-descubierto
3. ⏸️  Queda en "Pendiente de Aprobación"
4. 👤 Admin revisa en panel web
5. ✅ Admin aprueba con permisos seleccionados
6. ✅ Plugin registrado y listo
```

---

### **Endpoints API Creados**

**1. Listar Plugins Pendientes**
```http
GET /api/plugins/pending/list
```
Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "name": "my-plugin",
      "displayName": "My Plugin",
      "version": "1.0.0",
      "description": "Plugin description",
      "permissions": ["route:GET:/api/data", "ui:slot:sidebar"],
      "capabilities": { "db": ["read"], "fs": [], "http": [] },
      "discoveredAt": "2025-12-01T18:30:00Z"
    }
  ]
}
```

**2. Aprobar Plugin**
```http
POST /api/plugins/pending/my-plugin/approve
```
Respuesta:
```json
{
  "success": true,
  "message": "Plugin approved and registered successfully",
  "plugin": { "name": "my-plugin", "displayName": "My Plugin" }
}
```

**3. Rechazar Plugin**
```http
POST /api/plugins/pending/my-plugin/reject
```

**4. Escanear Nuevos Plugins**
```http
POST /api/plugins/discover
```
Respuesta:
```json
{
  "success": true,
  "message": "Discovery complete. 2 plugins found.",
  "pending": 2
}
```

---

### **Próximo Paso: UI en el Admin Panel**

Para completar el flujo, necesitas agregar una sección en el panel de administración que muestre:

1. **Lista de Plugins Pendientes**
   - Nombre, versión, descripción
   - Lista de permisos requeridos
   - Botones: "Aprobar" y "Rechazar"

2. **Botón "Buscar Nuevos Plugins"**
   - Llama a `/api/plugins/discover`
   - Muestra cantidad de plugins encontrados

3. **Modal de Confirmación**
   - Al hacer clic en "Aprobar"
   - Muestra permisos que se van a otorgar
   - Con checkboxes (usando el modal que ya creamos)

¿Quieres que cree la interfaz de usuario en el admin panel para gestionar los plugins pendientes?
