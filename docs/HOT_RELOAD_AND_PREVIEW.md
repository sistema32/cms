# Hot Reload & Live Theme Preview

Complete guide for theme development workflow with hot reload and live preview features.

## Overview

LexCMS provides two powerful features for theme development:

1. **Hot Reload**: Automatically reload themes during development without manual refresh
2. **Live Theme Preview**: Preview themes before activation with secure preview sessions

## Hot Reload System

### What is Hot Reload?

Hot reload automatically detects file changes in your theme and reloads the browser for you. It provides instant feedback during development:

- **CSS Changes**: Reload stylesheets without full page reload (ultra-fast)
- **Template Changes**: Full page reload to show updated templates
- **Asset Changes**: Reload when images, JS, or other assets change

### How It Works

1. **File Watcher**: Monitors theme and asset directories for changes
2. **WebSocket Server**: Maintains real-time connection with browser
3. **Smart Reload**: CSS-only reload for `.css` files, full reload for everything else
4. **Auto-reconnect**: Reconnects automatically if connection is lost

### Configuration

Hot reload is **automatically enabled in development mode** (`DENO_ENV=development`).

**Default Configuration:**
```typescript
{
  port: 3001,                    // WebSocket server port
  watchPaths: [
    './src/themes',              // Watch all themes
    './src/admin/assets'         // Watch admin assets
  ],
  debounceMs: 100                // Debounce rapid file changes
}
```

### Development Workflow

1. **Start the server** in development mode:
   ```bash
   DENO_ENV=development deno task dev
   ```

2. **Open your site** in the browser:
   ```
   http://localhost:8000
   ```

3. **Edit theme files** - changes are detected automatically:
   ```
   src/themes/my-theme/templates/blog.tsx  → Full page reload
   src/themes/my-theme/assets/style.css   → CSS-only reload (faster)
   src/themes/my-theme/assets/script.js   → Full page reload
   ```

4. **See changes instantly** - no manual refresh needed!

### What Gets Watched?

Hot reload watches these file types:

**Templates:**
- `.tsx` - TypeScript JSX templates
- `.ts` - TypeScript modules

**Assets:**
- `.css` - Stylesheets (CSS-only reload)
- `.js` - JavaScript files
- `.svg`, `.png`, `.jpg`, `.gif` - Images
- `.woff`, `.woff2`, `.ttf` - Fonts

**Configuration:**
- `theme.json` - Theme manifest
- `*.json` - Locale files

### Browser Console Output

When hot reload is active, you'll see:

```
🔥 Hot Reload connected
🔄 CSS reloaded (style.css changed)
🔄 Page reloaded (blog.tsx changed)
⚠️  Hot Reload disconnected - reconnecting...
✅ Hot Reload reconnected
```

### Disabling Hot Reload

Hot reload only runs in development mode. To disable it:

```bash
# Production mode (hot reload disabled)
DENO_ENV=production deno task start
```

### Performance

- **Debouncing**: 100ms debounce prevents reload storms during rapid saves
- **Efficient**: Only watches specified directories
- **Smart**: CSS changes reload instantly without losing page state
- **Lightweight**: Minimal overhead, ~10KB WebSocket client

---

## Live Theme Preview System

### What is Live Preview?

Live preview lets you test themes **before activation** without affecting your live site:

- **Safe Testing**: Preview themes without changing active theme
- **Preview Banner**: Visual indicator showing you're in preview mode
- **One-Click Activation**: Activate directly from preview
- **Secure Sessions**: JWT-based tokens with 1-hour expiration
- **Multi-User**: Each user gets their own preview session

### Creating a Preview Session

#### Via API

```typescript
// POST /api/admin/themes/preview/create
const response = await fetch('/api/admin/themes/preview/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    theme: 'elegant-blog'
  })
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "session": {
//     "token": "eyJhbGc...",
//     "theme": "elegant-blog",
//     "expiresAt": "2024-01-15T15:30:00Z"
//   },
//   "previewUrl": "http://localhost:8000/?theme_preview=1&preview_token=eyJhbGc..."
// }
```

#### Via Admin UI

1. Go to **Appearance > Themes**
2. Find the theme you want to preview
3. Click **"Preview"** button
4. New tab opens with preview session

### Preview Mode Features

#### Preview Banner

When in preview mode, a banner appears at the top of the page:

```
🎨 Preview Mode: elegant-blog
   This is a preview. Changes are not saved.
   [Exit Preview] [Activate Theme]
```

**Banner Features:**
- **Theme Name**: Shows which theme is being previewed
- **Exit Preview**: Return to normal mode (removes `?theme_preview=1`)
- **Activate Theme**: One-click activation with confirmation

#### URL Format

Preview sessions use query parameters:

```
http://localhost:8000/blog?theme_preview=1&preview_token=eyJhbGc...
```

**Parameters:**
- `theme_preview=1`: Indicates preview mode
- `preview_token`: JWT token for session verification

### Activating a Preview

#### From Preview Banner

Click the **"Activate Theme"** button in the preview banner:

1. Confirmation dialog appears
2. Click "OK" to confirm
3. Theme is activated
4. Redirected to Appearance > Themes

#### Via API

```typescript
// POST /api/admin/themes/preview/activate
const response = await fetch('/api/admin/themes/preview/activate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: 'eyJhbGc...'  // Preview token from URL
  })
});

const data = await response.json();
// {
//   "success": true,
//   "theme": "elegant-blog",
//   "message": "Theme activated successfully"
// }
```

### Ending a Preview Session

#### Exit Preview Button

Click **"Exit Preview"** in the banner - removes query parameters and returns to normal mode.

#### Via API

```typescript
// DELETE /api/admin/themes/preview/:token
await fetch(`/api/admin/themes/preview/${token}`, {
  method: 'DELETE'
});
```

#### Automatic Expiration

Sessions automatically expire after **1 hour**. After expiration:
- Preview mode stops working
- User sees normal site with active theme
- Old tokens are automatically cleaned up

### Security

#### JWT-Based Tokens

Preview sessions use JSON Web Tokens (JWT):

```typescript
{
  type: "theme_preview",
  theme: "elegant-blog",
  userId: 42,
  exp: 1705330800  // 1 hour from creation
}
```

**Benefits:**
- **Stateless**: No server-side session storage required
- **Secure**: Cryptographically signed with JWT_SECRET
- **Expiring**: Automatic 1-hour timeout
- **User-Specific**: Each user gets their own session

#### Authorization

- Preview creation requires authentication (JWT token)
- Preview activation requires valid preview token
- Expired tokens are rejected automatically

### Multiple Previews

Users can have multiple preview sessions:

```typescript
// User A previews "minimal-blog"
http://localhost:8000/?theme_preview=1&preview_token=TOKEN_A

// User B previews "elegant-blog"
http://localhost:8000/?theme_preview=1&preview_token=TOKEN_B
```

Each session is independent and secure.

---

## Complete Development Workflow

### Scenario: Developing a New Theme

1. **Create theme** using the generator:
   ```bash
   deno task theme:create my-awesome-theme
   ```

2. **Start development server** with hot reload:
   ```bash
   DENO_ENV=development deno task dev
   ```

3. **Create preview session** for your theme:
   ```bash
   curl -X POST http://localhost:8000/api/admin/themes/preview/create \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"theme": "my-awesome-theme"}'
   ```

4. **Open preview URL** in browser:
   ```
   http://localhost:8000/?theme_preview=1&preview_token=eyJhbGc...
   ```

5. **Edit theme files** - hot reload updates instantly:
   ```typescript
   // src/themes/my-awesome-theme/templates/blog.tsx
   export const BlogTemplate = (props) => {
     return html`
       <div class="blog">
         <h1>My Awesome Blog</h1>  <!-- Edit this -->
         ${props.posts.map(post => html`...`)}
       </div>
     `;
   };
   ```
   → Save file → Browser reloads automatically

6. **Style with CSS** - instant updates:
   ```css
   /* src/themes/my-awesome-theme/assets/style.css */
   .blog h1 {
     color: #333;  /* Change color */
   }
   ```
   → Save file → CSS reloads without page refresh

7. **Test thoroughly** in preview mode:
   - Navigate to different pages
   - Test responsive design
   - Check all templates
   - Verify functionality

8. **Activate theme** when ready:
   - Click "Activate Theme" in preview banner
   - Or use API endpoint
   - Theme goes live immediately

### Scenario: Quick CSS Tweaks

1. **Preview active theme** to test changes safely:
   ```bash
   # Create preview of currently active theme
   curl -X POST /api/admin/themes/preview/create \
     -d '{"theme": "current-theme"}'
   ```

2. **Edit CSS** with instant feedback:
   ```css
   /* Tweak color */
   .header { background: blue; }  → Save → Instant CSS reload

   /* Adjust spacing */
   .content { padding: 20px; }    → Save → Instant CSS reload
   ```

3. **No page state loss** - forms, scrolls, modals stay as-is

4. **Activate** when satisfied with changes

### Scenario: Testing Across Devices

1. **Start preview session** on desktop
2. **Copy preview URL**:
   ```
   http://192.168.1.100:8000/?theme_preview=1&preview_token=eyJhbGc...
   ```
3. **Open same URL** on mobile/tablet
4. **Edit theme files** on desktop
5. **All devices** reload automatically via hot reload
6. **Test responsive design** in real-time

---

## API Reference

### Hot Reload

#### WebSocket Connection

```javascript
// Client-side (injected automatically)
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('🔥 Hot Reload connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'reload') {
    if (data.reloadType === 'css') {
      // Reload CSS only
      reloadCSS();
    } else {
      // Full page reload
      location.reload();
    }
  }
};

ws.onclose = () => {
  console.log('⚠️  Hot Reload disconnected');
  // Auto-reconnect after 1 second
  setTimeout(() => connectWebSocket(), 1000);
};
```

#### Server-Side Configuration

```typescript
import { HotReloadServer } from "./dev/hotReload.ts";

const hotReloadServer = new HotReloadServer({
  port: 3001,
  watchPaths: ['./src/themes', './src/admin/assets'],
  debounceMs: 100,
  cssExtensions: ['.css', '.scss', '.sass'],
  excludePatterns: [
    /node_modules/,
    /\.git/,
    /dist/,
    /\.DS_Store/
  ]
});

await hotReloadServer.start();
```

### Theme Preview

#### Create Preview Session

```http
POST /api/admin/themes/preview/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "theme": "elegant-blog"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "theme": "elegant-blog",
    "expiresAt": "2024-01-15T15:30:00.000Z"
  },
  "previewUrl": "http://localhost:8000/?theme_preview=1&preview_token=eyJhbGc..."
}
```

#### Activate Preview

```http
POST /api/admin/themes/preview/activate
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "theme": "elegant-blog",
  "message": "Theme activated successfully"
}
```

#### End Preview Session

```http
DELETE /api/admin/themes/preview/:token
```

**Response:**
```json
{
  "success": true
}
```

---

## Troubleshooting

### Hot Reload Not Working

**1. Check development mode:**
```bash
echo $DENO_ENV
# Should output: development
```

**2. Check WebSocket connection:**
- Open browser console
- Look for: `🔥 Hot Reload connected`
- If missing, check if port 3001 is available

**3. Check server logs:**
```
🔥 Initializing hot reload server...
✅ Hot reload server started on port 3001
```

**4. Firewall blocking WebSocket:**
- Allow port 3001 for local connections
- Check browser console for connection errors

**5. Files not being watched:**
- Verify file is in `./src/themes` or `./src/admin/assets`
- Check file extension is supported
- Look for console warnings about excluded patterns

### Preview Mode Not Working

**1. Invalid or expired token:**
```json
{
  "error": "Invalid or expired preview token"
}
```
→ Create new preview session (tokens expire after 1 hour)

**2. Preview banner not showing:**
- Check URL has both `theme_preview=1` and `preview_token=...`
- Verify response is HTML (banner only injected in HTML responses)
- Check browser console for errors

**3. Theme not switching:**
- Verify theme name is correct (case-sensitive)
- Check theme exists in `./src/themes/`
- Look for theme loading errors in server logs

**4. Activation fails:**
```json
{
  "error": "Theme activation failed"
}
```
→ Check theme validator: `deno task theme:validate <theme-name>`

### Hot Reload + Preview Together

**Issue**: Hot reload not working in preview mode

**Solution**: Both systems work together automatically:

1. Create preview session
2. Open preview URL
3. Hot reload WebSocket connects
4. Edit theme files
5. Both preview mode AND hot reload work

**Verify:**
```javascript
// Browser console should show:
🎨 Preview mode: elegant-blog (user: 42)
🔥 Hot Reload connected
```

---

## Best Practices

### Development

1. **Always use development mode** for theme development:
   ```bash
   DENO_ENV=development deno task dev
   ```

2. **Use preview mode** for testing before activation:
   - Prevents breaking live site
   - Test thoroughly in preview
   - Activate only when confident

3. **Organize CSS changes**:
   - Small CSS tweaks → CSS-only reload (instant)
   - Template changes → Full reload (slower)
   - Minimize template edits during styling

4. **Watch console output**:
   - Hot reload messages
   - Preview mode status
   - Theme loading errors
   - Validation warnings

### Production

1. **Disable hot reload** in production:
   ```bash
   DENO_ENV=production deno task start
   ```

2. **Validate themes** before deployment:
   ```bash
   deno task theme:validate <theme-name>
   ```

3. **Test preview sessions** work correctly:
   - Verify tokens expire
   - Check activation flow
   - Test on production-like environment

4. **Monitor performance**:
   - Preview sessions should be lightweight
   - No hot reload overhead in production
   - Clean up expired sessions automatically

---

## Advanced Usage

### Custom Hot Reload Port

```typescript
// src/main.ts
const hotReloadServer = new HotReloadServer({
  port: Number(Deno.env.get('HOT_RELOAD_PORT')) || 3001,
  // ... other options
});
```

```bash
# .env
HOT_RELOAD_PORT=3002
```

### Excluding Paths from Watch

```typescript
const hotReloadServer = new HotReloadServer({
  watchPaths: ['./src/themes'],
  excludePatterns: [
    /node_modules/,
    /\.git/,
    /dist/,
    /\.test\.ts$/,        // Exclude test files
    /\/drafts\//,         // Exclude drafts folder
  ],
});
```

### Custom Preview Expiration

```typescript
// src/services/themePreviewService.ts
async createPreviewSession(theme: string, userId: number): Promise<PreviewSession> {
  const token = await generateToken({
    type: "theme_preview",
    theme,
    userId
  }, "2h");  // Change expiration (default: "1h")

  // ...
}
```

### Programmatic Preview

```typescript
import { themePreviewService } from "./services/themePreviewService.ts";

// Create session programmatically
const session = await themePreviewService.createPreviewSession(
  "my-theme",
  userId
);

console.log(`Preview URL: /?theme_preview=1&preview_token=${session.token}`);

// Verify token later
const verified = await themePreviewService.verifyPreviewToken(session.token);
if (verified) {
  console.log(`Previewing: ${verified.theme}`);
}

// End session manually
await themePreviewService.endPreviewSession(session.token);
```

---

## Performance Metrics

### Hot Reload

- **WebSocket Connection**: ~10KB client overhead
- **File Change Detection**: <50ms average
- **CSS Reload**: 50-200ms (instant)
- **Full Page Reload**: 500-2000ms (depends on page complexity)
- **Debounce Delay**: 100ms (configurable)

### Preview Mode

- **Session Creation**: <100ms
- **Token Verification**: <10ms (JWT validation)
- **Banner Injection**: <50ms (HTML modification)
- **Theme Override**: <10ms (context variable)
- **Session Memory**: ~200 bytes per session

---

## License

MIT
