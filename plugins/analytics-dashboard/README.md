# Analytics Dashboard Plugin

Plugin de demostración que muestra cómo crear paneles personalizados en el admin de LexCMS.

## Características

- ✅ Registro de múltiples paneles personalizados
- ✅ Integración completa con el admin layout
- ✅ Navegación automática en el sidebar
- ✅ Diseño responsivo con modo oscuro
- ✅ Datos de analíticas simulados

## Paneles Incluidos

### 1. Panel de Analíticas (`/admin/plugins/analytics-dashboard/analytics`)
- Métricas principales del sitio
- Gráfico de visitas de los últimos 7 días
- Tabla de páginas más visitadas
- Estadísticas de visitantes únicos y tasa de rebote

### 2. Panel de Reportes (`/admin/plugins/analytics-dashboard/reports`)
- Interfaz para generación de reportes (en desarrollo)
- Exportación de datos

## Instalación

```bash
# El plugin ya está en el directorio plugins/
# Solo necesitas instalarlo desde el admin panel
```

1. Ve a Admin > Plugins > Available
2. Busca "Analytics Dashboard"
3. Click en "Instalar"
4. Click en "Activar"

## Uso para Desarrolladores

Este plugin es un ejemplo perfecto de cómo usar el nuevo sistema de paneles personalizados:

```typescript
// En tu método onActivate()
this.api.registerAdminPanel({
  id: 'analytics',              // ID único
  title: 'Analíticas',          // Título en navegación
  description: 'Panel de métricas',
  icon: 'chart-line',           // Ícono (opcional)
  path: 'analytics',            // Ruta relativa
  showInMenu: true,             // Mostrar en menú
  order: 1,                     // Orden en menú
  component: this.renderPanel,  // Función de render
});
```

## Permisos Requeridos

- `content:read` - Leer contenido
- `users:read` - Leer usuarios
- `database:read` - Consultar base de datos

## Personalización

Puedes modificar los datos de analíticas editando el método `getAnalyticsData()` para conectar con tu sistema de analíticas real (Google Analytics, Matomo, etc.).

## Desarrollo

El plugin demuestra:
- Uso de AdminLayout para mantener consistencia
- Carga de plugin panels para navegación
- Renderizado de componentes TSX
- Estilos con Tailwind CSS
- Modo oscuro automático
