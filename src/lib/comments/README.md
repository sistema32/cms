# Comments System

Sistema de comentarios completo para LexCMS con moderación inteligente, censura automática y diseño adaptable. Proporciona hooks y funciones reutilizables para integrar comentarios en cualquier theme.

## ⚡ Mejoras Implementadas (v2.0)

### Seguridad
- ✅ Corrección de vulnerabilidad XSS en nombres de autor
- ✅ Uso de event delegation en lugar de onclick inline
- ✅ Sanitización HTML completa de todos los campos
- ✅ Escape de HTML en nombres de usuario

### Funcionalidad
- ✅ Threading de respuestas funcional (bug de parentId corregido)
- ✅ Moderación inteligente basada en historial del usuario
- ✅ Detección automática de spam
- ✅ Sistema de censura con comparación visual en admin
- ✅ Actualización mejorada del UI sin reload completo

### Diseño y UX
- ✅ Estilos adaptables usando CSS Custom Properties
- ✅ Los themes pueden personalizar colores y espaciado
- ✅ Dark mode automático
- ✅ Animaciones suaves y feedback visual
- ✅ Accesibilidad mejorada (ARIA labels, focus states)

### Código
- ✅ Eliminación de código duplicado (SDK → lib re-export)
- ✅ Reducción de ~1000 líneas de código duplicado
- ✅ Mejor organización y mantenibilidad

### Panel de Administración
- ✅ Vista mejorada con comparación original vs censurado
- ✅ Indicador visual de censura
- ✅ Corrección de endpoint de moderación
- ✅ Información detallada de metadata

## Ubicación

```
/src/lib/comments/
├── index.ts      # Funciones principales del sistema
├── styles.css    # Estilos base para comentarios
└── README.md     # Este archivo
```

## Uso

### Importar desde cualquier template

```typescript
import {
  renderCommentBox,
  renderComments,
  commentsScript,
  type CommentData,
  type CommentsStats,
} from "../../../lib/comments/index.ts";
```

### Importar desde Theme SDK

El Theme SDK re-exporta todas las funciones de comentarios:

```typescript
import {
  renderCommentBox,
  renderComments,
  commentsScript,
  type CommentData,
  type CommentsStats,
} from "../../sdk/index.ts";
```

## Funciones

### `renderCommentBox(contentId, options?)`

Renderiza el formulario para agregar comentarios.

**Opciones:**
- `className`: Clase CSS base (default: `"comment-box"`)
- `placeholder`: Texto placeholder del textarea
- `submitText`: Texto del botón submit
- `showWebsiteField`: Mostrar campo de website (default: `true`)
- `requireLogin`: Requiere login para comentar (default: `false`)
- `maxLength`: Máximo de caracteres (default: `2000`)

### `renderComments(comments, stats, options?)`

Renderiza la lista de comentarios con soporte para threading.

**Opciones:**
- `className`: Clase CSS base (default: `"comments"`)
- `showReplies`: Mostrar respuestas anidadas (default: `true`)
- `maxDepth`: Profundidad máxima de anidación (default: `3`)
- `enablePagination`: Habilitar paginación (default: `false`)
- `sortOrder`: Orden de comentarios `"asc" | "desc"` (default: `"desc"`)
- `showAvatar`: Mostrar avatares (default: `true`)
- `showTimestamp`: Mostrar fecha/hora (default: `true`)
- `dateFormat`: Formato de fecha `"short" | "long" | "relative"` (default: `"relative"`)

### `commentsScript`

Script global para manejar la funcionalidad de respuestas. Debe incluirse una vez por página.

## Ejemplo completo

```typescript
export const PostTemplate = (props: PostProps) => {
  const { post, comments, commentsStats } = props;

  return Layout({
    children: html`
      <article>
        <h1>${post.title}</h1>
        <div>${html([post.body] as any)}</div>
      </article>

      <section id="comments">
        <!-- Comentarios existentes -->
        ${renderComments(comments, commentsStats, {
          showReplies: true,
          maxDepth: 3,
          dateFormat: "relative",
        })}

        <!-- Formulario para nuevos comentarios -->
        ${renderCommentBox(post.id, {
          showWebsiteField: true,
          maxLength: 2000,
        })}
      </section>

      <!-- Script de respuestas (solo una vez) -->
      ${commentsScript}
    `,
  });
};
```

## Estilos

Los estilos base usan **CSS Custom Properties** (variables) para adaptarse a cualquier theme.

### Importar estilos

```css
/* En tu theme CSS */
@import url("/lib/comments/styles.css");
```

### Personalizar colores y espaciado

Sobrescribe las variables CSS en tu theme:

```css
:root {
  /* Colores del formulario */
  --comment-box-bg: #ffffff;
  --comment-box-border: #e2e8f0;
  --comment-box-input-focus: #3b82f6;
  --comment-box-btn-bg: #1e40af;

  /* Colores de la lista */
  --comments-item-bg: #f8fafc;
  --comments-author-link: #2563eb;

  /* Espaciado */
  --comment-spacing: 1.25rem;
  --comment-border-radius: 0.75rem;

  /* Typography */
  --comment-font-family: 'Inter', sans-serif;
  --comment-line-height: 1.7;
}
```

### Variables disponibles

Ver `src/lib/comments/styles.css` para la lista completa de variables CSS que puedes personalizar.

### Metodología BEM

Las clases siguen BEM para fácil sobrescritura:

- `.comment-box` - Contenedor del formulario
- `.comments` - Contenedor de la lista
- `.comments__item--depth-N` - Comentarios anidados
- `.comment-box__submit` - Botón de envío
- etc.

### Dark Mode

El dark mode se activa automáticamente con `prefers-color-scheme: dark`. También puedes sobrescribir las variables en tu theme:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --comment-box-bg: #1e293b;
    --comments-item-bg: #0f172a;
  }
}
```

## Características

- ✅ Comentarios anidados con threading
- ✅ Validación de formularios
- ✅ Contador de caracteres
- ✅ Avatares automáticos (UI Avatars)
- ✅ Formato de fechas relativo
- ✅ Soporte para moderación
- ✅ Paginación opcional
- ✅ Dark mode
- ✅ Responsive design
- ✅ XSS protection
- ✅ Accesibilidad (ARIA)

## API Endpoints

El sistema se conecta a estos endpoints:

- `POST /api/comments` - Crear nuevo comentario
- `GET /api/comments/:id` - Obtener comentario por ID
- `GET /api/comments/content/:contentId` - Obtener comentarios de un post

## Moderación Inteligente

El sistema determina automáticamente si un comentario debe ser aprobado o requerir moderación:

### Estados de Moderación

- `status: "pending"` - Pendiente de aprobación (requiere moderación manual)
- `status: "approved"` - Aprobado y visible públicamente
- `status: "spam"` - Marcado como spam
- `status: "deleted"` - Eliminado (soft delete)

### Reglas de Moderación Automática

1. **Usuarios de confianza** (3+ comentarios aprobados) → Auto-aprobado ✅
2. **Contenido censurado** (>20% modificado por filtros) → Requiere moderación ⚠️
3. **Comentarios muy cortos** (<3 palabras) o muy largos (>500 palabras) → Requiere moderación ⚠️
4. **Patrones de spam** (buy now, click here, etc.) → Requiere moderación ⚠️
5. **Usuarios invitados** (sin autenticación) → Requiere moderación ⚠️
6. **Por defecto** (usuarios autenticados nuevos) → Auto-aprobado ✅

### Personalizar Reglas

Las reglas se pueden ajustar en `src/services/commentService.ts` en la función `determineInitialStatus()`.

## Seguridad

- Bad words filter automático
- Sanitización de HTML
- Validación de emails
- Rate limiting en API
- CSRF protection
