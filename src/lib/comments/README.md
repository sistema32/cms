# Comments System

Sistema de comentarios completo para LexCMS. Proporciona hooks y funciones reutilizables para integrar comentarios en cualquier theme.

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

Los estilos base están en `styles.css` y siguen la metodología BEM:

- `.comment-box` - Contenedor del formulario
- `.comments` - Contenedor de la lista
- `.comments__item--depth-N` - Comentarios anidados

Los themes pueden sobrescribir estos estilos o importar directamente:

```css
/* En tu theme CSS */
@import url("/themes/base/assets/css/comments.css");
```

O incluir directamente en el HTML:

```html
<link rel="stylesheet" href="/lib/comments/styles.css">
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

## Moderación

Los comentarios pasan por moderación antes de ser visibles:

- `status: "pending"` - Pendiente de aprobación
- `status: "approved"` - Aprobado y visible
- `status: "spam"` - Marcado como spam
- `status: "deleted"` - Eliminado (soft delete)

## Seguridad

- Bad words filter automático
- Sanitización de HTML
- Validación de emails
- Rate limiting en API
- CSRF protection
