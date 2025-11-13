# Sistema de Paneles Personalizados para Plugins

## Resumen

Se ha implementado un sistema completo que permite a los plugins registrar paneles personalizados en el admin panel de LexCMS. Los paneles se integran automáticamente en la navegación y tienen acceso completo al sistema de layout del admin.

## 🎯 Características Implementadas

### 1. Tipos y Configuración (`src/lib/plugin-system/types.ts`)

Se agregaron nuevas interfaces:

- **`AdminPanelConfig`**: Define la configuración de un panel personalizado
  - `id`: Identificador único del panel
  - `title`: Título mostrado en la navegación
  - `description`: Descripción opcional
  - `icon`: Ícono opcional (Material Design Icons)
  - `path`: Ruta relativa al plugin
  - `requiredPermissions`: Permisos requeridos para ver el panel
  - `component`: Función de renderizado del panel
  - `order`: Orden en el menú (default: 10)
  - `showInMenu`: Mostrar en navegación (default: true)

- **`AdminPanelComponent`**: Tipo de función para componentes de panel
  - Recibe un `AdminPanelContext` con datos del usuario, query params, plugin API, etc.
  - Retorna JSX o HTML

- **`AdminPanelContext`**: Contexto pasado a los componentes de panel
  - `user`: Información del usuario actual
  - `query`: Parámetros de la URL
  - `pluginAPI`: Instancia del API del plugin
  - `settings`: Configuración del plugin
  - `request`: Objeto de request

### 2. API del Plugin (`src/lib/plugin-system/PluginAPI.ts`)

Se agregaron tres métodos nuevos:

```typescript
// Registrar un panel personalizado
api.registerAdminPanel(config: AdminPanelConfig): void

// Desregistrar un panel específico
api.unregisterAdminPanel(panelId: string): void

// Desregistrar todos los paneles del plugin
api.unregisterAllAdminPanels(): void
```

### 3. Registry de Paneles (`src/lib/plugin-system/AdminPanelRegistry.ts`)

Nuevo módulo que gestiona el registro centralizado de paneles:

**Métodos principales:**
- `registerPanel(pluginName, config)` - Registra un panel
- `unregisterPanel(pluginName, panelId)` - Elimina un panel
- `unregisterAllPanels(pluginName)` - Elimina todos los paneles de un plugin
- `getPanelsForPlugin(pluginName)` - Obtiene paneles de un plugin
- `getPanel(pluginName, panelId)` - Obtiene un panel específico
- `getPanelByPath(path)` - Busca panel por ruta completa
- `getAllPanels()` - Obtiene todos los paneles registrados
- `getPanelsByPlugin()` - Paneles agrupados por plugin

**Características:**
- Almacenamiento en memoria
- Detección de duplicados
- Normalización de rutas
- Limpieza automática

### 4. Plugin Manager (`src/lib/plugin-system/PluginManager.ts`)

Modificado para limpiar paneles automáticamente:
- Al desactivar un plugin, se eliminan todos sus paneles registrados
- Integración con `AdminPanelRegistry`

### 5. Router de Admin (`src/routes/admin.ts`)

**Función Helper:**
```typescript
async function getPluginPanels()
```
- Carga todos los paneles registrados
- Filtra por `showInMenu`
- Formatea datos para navegación

**Nueva Ruta Dinámica:**
```typescript
adminRouter.get("/plugins/:pluginName/*", async (c) => {
  // Busca el panel por ruta completa
  // Verifica que el plugin esté activo
  // Valida permisos (TODO)
  // Renderiza el componente del panel
})
```

Características:
- Validación de plugin activo
- Búsqueda de panel en registry
- Preparación de contexto para el componente
- Manejo de errores

### 6. Admin Layout (`src/admin/components/AdminLayout.tsx`)

**Nueva Prop:**
```typescript
interface AdminLayoutProps {
  // ... props existentes
  pluginPanels?: Array<{
    id: string;
    title: string;
    pluginName: string;
    path: string;
    icon?: string;
  }>;
}
```

**Modificaciones:**
- Construye items de navegación desde `pluginPanels`
- Los agrega automáticamente a la sección "Plugins"
- Mantiene consistencia con el diseño existente

## 📦 Plugin de Ejemplo: Analytics Dashboard

Se creó un plugin completo de demostración en `plugins/analytics-dashboard/`:

### Estructura
```
plugins/analytics-dashboard/
├── plugin.json         # Manifest del plugin
├── index.ts           # Lógica principal
└── README.md          # Documentación
```

### Funcionalidades
1. **Panel de Analíticas** (`/admin/plugins/analytics-dashboard/analytics`)
   - Métricas principales (visitas, visitantes, duración, rebote)
   - Gráfico de barras de últimos 7 días
   - Tabla de páginas más visitadas
   - Diseño responsivo con modo oscuro

2. **Panel de Reportes** (`/admin/plugins/analytics-dashboard/reports`)
   - Interfaz para generación de reportes
   - Placeholder para funcionalidad futura

### Código de Ejemplo

```typescript
export default class AnalyticsDashboardPlugin implements PluginClass {
  private api: PluginAPI;

  constructor(api: PluginAPI) {
    this.api = api;
  }

  async onActivate(): Promise<void> {
    // Registrar panel de analíticas
    this.api.registerAdminPanel({
      id: 'analytics',
      title: 'Analíticas',
      description: 'Panel de métricas y estadísticas del sitio',
      icon: 'chart-line',
      path: 'analytics',
      showInMenu: true,
      order: 1,
      component: this.renderAnalyticsPanel.bind(this),
    });

    // Registrar panel de reportes
    this.api.registerAdminPanel({
      id: 'reports',
      title: 'Reportes',
      description: 'Reportes detallados',
      icon: 'file-chart',
      path: 'reports',
      showInMenu: true,
      order: 2,
      component: this.renderReportsPanel.bind(this),
    });
  }

  async onDeactivate(): Promise<void> {
    // Los paneles se eliminan automáticamente
  }

  private async renderAnalyticsPanel(context: any) {
    const { user } = context;

    return html`${AdminLayout({
      title: 'Analíticas',
      activePage: 'plugin.analytics-dashboard.analytics',
      user,
      pluginPanels: await this.getPluginPanels(),
      children: html`
        <!-- Contenido del panel -->
      `,
    })}`;
  }
}
```

## 🚀 Cómo Usar

### Para Desarrolladores de Plugins

1. **Registrar un panel en `onActivate()`:**

```typescript
async onActivate(): Promise<void> {
  this.api.registerAdminPanel({
    id: 'mi-panel',
    title: 'Mi Panel',
    path: 'panel',
    component: this.renderPanel.bind(this),
  });
}
```

2. **Crear la función de renderizado:**

```typescript
private async renderPanel(context: AdminPanelContext) {
  const { user, query, settings } = context;

  return html`${AdminLayout({
    title: 'Mi Panel',
    activePage: 'plugin.mi-plugin.mi-panel',
    user,
    pluginPanels: await this.getPluginPanels(),
    children: html`
      <div class="px-4 sm:px-6 lg:px-8 py-8">
        <h1>Mi Panel Personalizado</h1>
        <!-- Tu contenido aquí -->
      </div>
    `,
  })}`;
}
```

3. **Helper para cargar paneles (necesario para navegación):**

```typescript
private async getPluginPanels() {
  const { AdminPanelRegistry } = await import('../../src/lib/plugin-system/index.ts');
  const allPanels = AdminPanelRegistry.getAllPanels();

  return allPanels
    .filter(panel => panel.showInMenu !== false)
    .map(panel => ({
      id: panel.id,
      title: panel.title,
      pluginName: panel.pluginName,
      path: panel.path,
      icon: panel.icon,
    }));
}
```

### Para Usuarios

1. Instalar plugin desde Admin > Plugins > Available
2. Activar el plugin
3. Los paneles aparecerán automáticamente en la sección "Plugins" del menú
4. Navegar a `/admin/plugins/nombre-plugin/ruta-panel`

## 📝 Archivos Modificados

### Nuevos Archivos
- ✅ `src/lib/plugin-system/AdminPanelRegistry.ts`
- ✅ `plugins/analytics-dashboard/plugin.json`
- ✅ `plugins/analytics-dashboard/index.ts`
- ✅ `plugins/analytics-dashboard/README.md`
- ✅ `ADMIN_PANELS_FEATURE.md` (este archivo)

### Archivos Modificados
- ✅ `src/lib/plugin-system/types.ts` - Nuevas interfaces
- ✅ `src/lib/plugin-system/PluginAPI.ts` - Métodos de registro
- ✅ `src/lib/plugin-system/PluginManager.ts` - Limpieza de paneles
- ✅ `src/lib/plugin-system/index.ts` - Nuevas exportaciones
- ✅ `src/routes/admin.ts` - Ruta dinámica y helper
- ✅ `src/admin/components/AdminLayout.tsx` - Prop para paneles

## 🔄 Flujo de Funcionamiento

1. **Activación del Plugin:**
   ```
   Plugin.onActivate()
   → api.registerAdminPanel(config)
   → AdminPanelRegistry.registerPanel()
   ```

2. **Renderizado del Admin:**
   ```
   Admin Route Handler
   → getPluginPanels()
   → AdminLayout({ pluginPanels })
   → Navbar con items de plugins
   ```

3. **Navegación a Panel:**
   ```
   User clicks panel link
   → GET /admin/plugins/plugin-name/panel-path
   → Find panel in registry
   → Verify plugin is active
   → Render panel.component(context)
   ```

4. **Desactivación del Plugin:**
   ```
   Plugin.onDeactivate()
   → PluginManager.deactivate()
   → AdminPanelRegistry.unregisterAllPanels()
   ```

## 🎨 Ejemplo de Panel Completo

Ver `plugins/analytics-dashboard/index.ts` para un ejemplo completo con:
- Múltiples paneles
- Datos dinámicos
- Gráficos y tablas
- Diseño responsivo
- Modo oscuro
- Integración con AdminLayout

## ⚠️ Consideraciones

### Seguridad
- [ ] TODO: Implementar validación de permisos en ruta dinámica
- ✅ Validación de plugin activo
- ✅ Limpieza automática al desactivar

### Rendimiento
- ✅ Registry en memoria (rápido)
- ✅ Lazy loading de componentes
- ✅ Carga bajo demanda de paneles

### UX
- ✅ Navegación automática
- ✅ Consistencia visual
- ✅ Modo oscuro
- ✅ Responsive design

## 🔮 Futuras Mejoras

1. **Validación de Permisos:**
   - Integrar con sistema de roles/permisos
   - Verificar `requiredPermissions` en la ruta

2. **Persistencia:**
   - Guardar estado de paneles en DB
   - Recordar orden personalizado

3. **API Extensions:**
   - `api.getAdminUrl(path)` - Helper para URLs
   - `api.addAdminWidget(config)` - Widgets en dashboard
   - `api.addAdminMenuItem(config)` - Items personalizados

4. **Developer Tools:**
   - Hot reload de paneles en desarrollo
   - Validación de componentes
   - Debug mode con logs detallados

## 📚 Referencias

- Sistema de plugins: `PLUGIN_SYSTEM.md`
- Arquitectura admin: `ADMIN_PANEL_ARCHITECTURE.md`
- Plugin de ejemplo: `plugins/analytics-dashboard/README.md`

## ✅ Tests Manuales Recomendados

1. **Instalación y Activación:**
   - [ ] Instalar Analytics Dashboard desde admin
   - [ ] Activar el plugin
   - [ ] Verificar que aparecen "Analíticas" y "Reportes" en menú

2. **Navegación:**
   - [ ] Hacer click en "Analíticas"
   - [ ] Verificar que carga el panel correctamente
   - [ ] Verificar que la navegación se mantiene
   - [ ] Cambiar entre paneles

3. **Desactivación:**
   - [ ] Desactivar el plugin
   - [ ] Verificar que los paneles desaparecen del menú
   - [ ] Verificar que las rutas retornan 404

4. **Múltiples Plugins:**
   - [ ] Activar múltiples plugins con paneles
   - [ ] Verificar que todos aparecen en orden
   - [ ] Verificar navegación entre paneles de diferentes plugins

5. **Modo Oscuro:**
   - [ ] Toggle dark mode
   - [ ] Verificar estilos en ambos modos

## 🎉 Conclusión

El sistema de paneles personalizados está completamente implementado y documentado. Los plugins ahora pueden:

- Registrar paneles ilimitados
- Integrarse perfectamente con el admin
- Mantener consistencia visual
- Acceder a toda la funcionalidad del PluginAPI
- Aparecer automáticamente en navegación

El plugin Analytics Dashboard sirve como ejemplo completo y punto de partida para desarrolladores.
