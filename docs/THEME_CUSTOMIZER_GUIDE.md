# Visual Theme Customizer Guide

Complete guide for the visual theme customizer system with live preview, undo/redo, and autosave.

## Overview

The Visual Theme Customizer provides a WYSIWYG interface for editing theme settings with:

- **Live Preview**: See changes instantly in a preview iframe
- **Undo/Redo**: Full history with up to 50 changes
- **Autosave**: Automatic draft saving every 30 seconds
- **Color Picker**: Integrated color selection with utilities
- **Typography**: Font family and size selectors
- **Drafts**: Save work-in-progress without publishing
- **Session Management**: Isolated sessions per user

## Architecture

### Backend Components

1. **ThemeCustomizerService** (`src/services/themeCustomizerService.ts`)
   - Session management
   - Change tracking
   - Undo/Redo stack
   - Autosave functionality

2. **API Endpoints** (`src/routes/admin.ts`)
   - 10 endpoints for full customizer control
   - Session CRUD operations
   - State management
   - History tracking

3. **Color Utilities**
   - Hex ↔ RGB conversion
   - Lighten/Darken operations
   - Contrast color calculation

### Frontend Components (To Be Implemented)

The customizer UI consists of:

```
┌─────────────────────────────────────────────┐
│  Theme Customizer: Corporate                │
├─────────────┬───────────────────────────────┤
│             │                               │
│ 🎨 Colors   │  LIVE PREVIEW                │
│ 📝 Typography│  ┌─────────────────────┐    │
│ 📐 Layout   │  │   [Header]          │    │
│ 🖼️  Images   │  │                     │    │
│ ⚙️  Advanced │  │   Hero Section      │    │
│             │  │                     │    │
│ Primary Color│  │   [Content]         │    │
│ ⬛ #2d6aff  │  │                     │    │
│             │  │   [Footer]          │    │
│ Font Family  │  └─────────────────────┘    │
│ ▼ Inter     │                               │
│             │  [Undo] [Redo] [Reset]       │
│ [Publish Changes]  [Save Draft]            │
└─────────────┴───────────────────────────────┘
```

## API Reference

### Session Management

#### Create Session

```http
POST /api/admin/themes/customizer/session
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "theme": "corporate"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "hasDraft": false,
  "draftChanges": 0
}
```

#### Get State

```http
GET /api/admin/themes/customizer/state/:sessionId
```

**Response:**
```json
{
  "settings": {
    "primary_color": "#2d6aff",
    "secondary_color": "#40ebd0",
    "font_family": "Inter",
    "font_size": "16px"
  },
  "pendingChanges": 5,
  "canUndo": true,
  "canRedo": false
}
```

#### End Session

```http
DELETE /api/admin/themes/customizer/session/:sessionId
```

### Making Changes

#### Apply Change

```http
POST /api/admin/themes/customizer/change
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "settingKey": "primary_color",
  "value": "#3d7aff",
  "description": "Changed primary color to blue"
}
```

**Response:**
```json
{
  "success": true,
  "state": {
    "settings": { /* updated settings */ },
    "pendingChanges": 6,
    "canUndo": true,
    "canRedo": false
  }
}
```

#### Undo

```http
POST /api/admin/themes/customizer/undo
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "state": {
    "settings": { /* reverted settings */ },
    "pendingChanges": 5,
    "canUndo": true,
    "canRedo": true
  }
}
```

#### Redo

```http
POST /api/admin/themes/customizer/redo
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Reset All

```http
POST /api/admin/themes/customizer/reset
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "state": {
    "settings": { /* original settings */ },
    "pendingChanges": 0,
    "canUndo": false,
    "canRedo": false
  }
}
```

### Saving and Publishing

#### Save Draft

```http
POST /api/admin/themes/customizer/save-draft
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Draft saved successfully"
}
```

Drafts are:
- Saved automatically every 30 seconds
- Persisted to database
- User-specific (each user has their own draft)
- Restored when reopening customizer

#### Publish Changes

```http
POST /api/admin/themes/customizer/publish
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Changes published successfully"
}
```

Publishing:
- Applies all changes permanently
- Clears draft
- Updates live theme settings
- Changes visible to all site visitors

### History

#### Get Change History

```http
GET /api/admin/themes/customizer/history/:sessionId
```

**Response:**
```json
{
  "history": [
    {
      "id": "change-1",
      "timestamp": "2024-01-15T10:30:00Z",
      "settingKey": "primary_color",
      "oldValue": "#2d6aff",
      "newValue": "#3d7aff",
      "description": "Changed primary color to blue"
    },
    {
      "id": "change-2",
      "timestamp": "2024-01-15T10:31:00Z",
      "settingKey": "font_family",
      "oldValue": "Arial",
      "newValue": "Inter",
      "description": "Changed font family to Inter"
    }
  ]
}
```

## Client Integration Example

### React/TypeScript Example

```typescript
import { useState, useEffect } from "react";

interface CustomizerState {
  settings: Record<string, any>;
  pendingChanges: number;
  canUndo: boolean;
  canRedo: boolean;
}

export function ThemeCustomizer({ theme }: { theme: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<CustomizerState | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize session
  useEffect(() => {
    async function initSession() {
      const response = await fetch('/api/admin/themes/customizer/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ theme })
      });

      const data = await response.json();
      setSessionId(data.sessionId);

      if (data.hasDraft) {
        alert(`You have ${data.draftChanges} unsaved changes. Continue editing?`);
      }

      // Load initial state
      await loadState(data.sessionId);
    }

    initSession();
  }, [theme]);

  // Load state
  async function loadState(sid: string) {
    const response = await fetch(`/api/admin/themes/customizer/state/${sid}`);
    const data = await response.json();
    setState(data);
  }

  // Apply change
  async function applyChange(settingKey: string, value: any, description?: string) {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/themes/customizer/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          settingKey,
          value,
          description
        })
      });

      const data = await response.json();
      setState(data.state);
    } finally {
      setLoading(false);
    }
  }

  // Undo
  async function undo() {
    if (!state?.canUndo) return;

    const response = await fetch('/api/admin/themes/customizer/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();
    setState(data.state);
  }

  // Redo
  async function redo() {
    if (!state?.canRedo) return;

    const response = await fetch('/api/admin/themes/customizer/redo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();
    setState(data.state);
  }

  // Publish
  async function publish() {
    if (!confirm('Publish changes? This will make them live.')) return;

    await fetch('/api/admin/themes/customizer/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    alert('Changes published successfully!');
  }

  // Save draft
  async function saveDraft() {
    await fetch('/api/admin/themes/customizer/save-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    alert('Draft saved!');
  }

  if (!state) return <div>Loading...</div>;

  return (
    <div className="customizer">
      <div className="customizer-sidebar">
        <h2>Customize: {theme}</h2>

        <section>
          <h3>🎨 Colors</h3>
          <label>
            Primary Color:
            <input
              type="color"
              value={state.settings.primary_color || '#2d6aff'}
              onChange={(e) => applyChange('primary_color', e.target.value, 'Changed primary color')}
              disabled={loading}
            />
          </label>
        </section>

        <section>
          <h3>📝 Typography</h3>
          <label>
            Font Family:
            <select
              value={state.settings.font_family || 'Inter'}
              onChange={(e) => applyChange('font_family', e.target.value, 'Changed font family')}
              disabled={loading}
            >
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
            </select>
          </label>
        </section>

        <div className="customizer-actions">
          <button onClick={undo} disabled={!state.canUndo || loading}>
            Undo
          </button>
          <button onClick={redo} disabled={!state.canRedo || loading}>
            Redo
          </button>
          <button onClick={saveDraft} disabled={loading}>
            Save Draft
          </button>
          <button onClick={publish} disabled={state.pendingChanges === 0 || loading}>
            Publish ({state.pendingChanges} changes)
          </button>
        </div>
      </div>

      <div className="customizer-preview">
        <iframe
          src={`/?theme_preview=1&customizer_session=${sessionId}`}
          title="Live Preview"
        />
      </div>
    </div>
  );
}
```

### Vanilla JavaScript Example

```javascript
class ThemeCustomizer {
  constructor(theme) {
    this.theme = theme;
    this.sessionId = null;
    this.state = null;
  }

  async init() {
    // Create session
    const response = await fetch('/api/admin/themes/customizer/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ theme: this.theme })
    });

    const data = await response.json();
    this.sessionId = data.sessionId;

    // Load state
    await this.loadState();

    // Setup autosave indicator
    if (data.hasDraft) {
      this.showDraftNotification(data.draftChanges);
    }
  }

  async loadState() {
    const response = await fetch(
      `/api/admin/themes/customizer/state/${this.sessionId}`
    );
    this.state = await response.json();
    this.render();
  }

  async applyChange(settingKey, value, description) {
    const response = await fetch('/api/admin/themes/customizer/change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        settingKey,
        value,
        description
      })
    });

    const data = await response.json();
    this.state = data.state;
    this.render();
    this.updatePreview();
  }

  async undo() {
    const response = await fetch('/api/admin/themes/customizer/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId })
    });

    const data = await response.json();
    this.state = data.state;
    this.render();
    this.updatePreview();
  }

  async redo() {
    const response = await fetch('/api/admin/themes/customizer/redo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId })
    });

    const data = await response.json();
    this.state = data.state;
    this.render();
    this.updatePreview();
  }

  async publish() {
    if (!confirm('Publish changes? This will make them live.')) return;

    await fetch('/api/admin/themes/customizer/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId })
    });

    alert('Changes published successfully!');
    window.location.href = '/admin/appearance/themes';
  }

  updatePreview() {
    const iframe = document.getElementById('preview-iframe');
    if (iframe) {
      iframe.contentWindow.postMessage({
        type: 'customizer-update',
        settings: this.state.settings
      }, '*');
    }
  }

  render() {
    // Update UI based on state
    document.getElementById('undo-btn').disabled = !this.state.canUndo;
    document.getElementById('redo-btn').disabled = !this.state.canRedo;
    document.getElementById('publish-btn').textContent =
      `Publish (${this.state.pendingChanges} changes)`;
  }
}

// Usage
const customizer = new ThemeCustomizer('corporate');
customizer.init();
```

## Color Utilities

The service includes color manipulation utilities:

```typescript
import { ColorUtils } from "../services/themeCustomizerService.ts";

// Convert hex to RGB
const rgb = ColorUtils.hexToRgb("#2d6aff");
// { r: 45, g: 106, b: 255 }

// Convert RGB to hex
const hex = ColorUtils.rgbToHex(45, 106, 255);
// "#2d6aff"

// Lighten a color
const lighter = ColorUtils.lighten("#2d6aff", 0.2);
// "#5f88ff"

// Darken a color
const darker = ColorUtils.darken("#2d6aff", 0.2);
// "#1d4adf"

// Get contrast color (black or white)
const contrast = ColorUtils.getContrastColor("#2d6aff");
// "#ffffff" (white for dark blue)
```

## Features

### Undo/Redo

- **Stack Size**: Up to 50 changes
- **Granular**: Each setting change is tracked individually
- **Efficient**: Only stores deltas (old value → new value)
- **Keyboard Shortcuts**: Ctrl+Z / Ctrl+Y (implement in UI)

**Example:**
```
1. Change primary_color: #2d6aff → #3d7aff
2. Change font_family: Arial → Inter
3. Undo → Reverts to Arial
4. Undo → Reverts to #2d6aff
5. Redo → Back to #3d7aff
6. Redo → Back to Inter
```

### Autosave

- **Interval**: 30 seconds
- **Automatic**: No user action required
- **Draft Storage**: Saved to database
- **Restoration**: Auto-loaded when reopening customizer
- **User-Specific**: Each user has their own draft

**Draft Workflow:**
```
1. User opens customizer
2. Makes 5 changes
3. After 30s → Autosave to draft
4. User closes browser
5. Returns next day
6. Opens customizer → "You have 5 unsaved changes"
7. Can continue editing or discard
```

### Session Management

- **Isolation**: Each user gets independent session
- **Cleanup**: Sessions auto-deleted when ended
- **Concurrent**: Multiple users can customize simultaneously
- **Memory**: In-memory storage for active sessions
- **Persistence**: Drafts persisted to database

### Live Preview

The preview iframe should:

1. **Load with session parameter**:
   ```
   /?theme_preview=1&customizer_session=SESSION_ID
   ```

2. **Listen for updates**:
   ```javascript
   window.addEventListener('message', (event) => {
     if (event.data.type === 'customizer-update') {
       applySettings(event.data.settings);
     }
   });
   ```

3. **Apply settings dynamically**:
   ```javascript
   function applySettings(settings) {
     document.documentElement.style.setProperty(
       '--primary-color',
       settings.primary_color
     );
     document.documentElement.style.setProperty(
       '--font-family',
       settings.font_family
     );
   }
   ```

## Best Practices

### 1. Descriptive Change Messages

```typescript
// ✅ Good
await applyChange('primary_color', '#3d7aff', 'Changed primary color to match brand');

// ❌ Bad
await applyChange('primary_color', '#3d7aff');
```

### 2. Batch Related Changes

```typescript
// If multiple settings are logically grouped, apply them in sequence
await applyChange('primary_color', '#3d7aff', 'Updated color scheme');
await applyChange('secondary_color', '#40ebd0', 'Updated color scheme');
await applyChange('accent_color', '#ff6b6b', 'Updated color scheme');
```

### 3. Confirm Before Publish

```typescript
// Always confirm before publishing
if (confirm(`Publish ${state.pendingChanges} changes?`)) {
  await publish();
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  await applyChange('setting', value);
} catch (error) {
  alert('Failed to apply change: ' + error.message);
  // Optionally reload state
  await loadState();
}
```

### 5. Debounce Rapid Changes

```typescript
// For inputs that change rapidly (like sliders)
let timeout;
function handleSliderChange(value) {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyChange('font_size', value, 'Adjusted font size');
  }, 300);
}
```

## Troubleshooting

### Changes Not Appearing

**Problem**: Changes applied but not visible in preview

**Solutions**:
1. Check theme CSS uses custom properties:
   ```css
   body {
     color: var(--primary-color);
     font-family: var(--font-family);
   }
   ```

2. Verify iframe message passing:
   ```javascript
   // In preview iframe
   window.addEventListener('message', (e) => {
     console.log('Received:', e.data);
   });
   ```

3. Ensure settings are being applied:
   ```javascript
   // Check state after change
   const state = await loadState();
   console.log('Current settings:', state.settings);
   ```

### Undo/Redo Not Working

**Problem**: Undo/Redo buttons disabled

**Check**:
```javascript
console.log('Can undo?', state.canUndo);
console.log('Can redo?', state.canRedo);
console.log('Current index:', session.currentIndex);
console.log('Changes:', session.changes.length);
```

**Common cause**: No changes applied yet, or at beginning/end of history.

### Autosave Failing

**Problem**: Draft not saving automatically

**Check server logs**:
```
Autosave failed: Error message
```

**Verify**:
1. Session exists: `GET /api/admin/themes/customizer/state/:sessionId`
2. Session has changes: `state.pendingChanges > 0`
3. Database connection working

### Session Lost

**Problem**: Session ID becomes invalid

**Recovery**:
```typescript
try {
  await loadState(sessionId);
} catch (error) {
  // Session expired, create new one
  const newSession = await createSession(theme);
  setSessionId(newSession.sessionId);
}
```

## Performance Considerations

- **History Limit**: 50 changes max (configurable in service)
- **Autosave Interval**: 30 seconds (configurable)
- **Memory Usage**: ~200 bytes per change in history
- **Database Writes**: Only on autosave/publish (not every change)
- **Preview Updates**: Debounce rapid changes (recommended 300ms)

## Security

- **Authentication Required**: All endpoints require JWT token
- **User Isolation**: Users can only access their own sessions
- **Draft Privacy**: Drafts are user-specific
- **Input Validation**: Validate setting keys and values
- **XSS Prevention**: Sanitize color/font values before rendering

## License

MIT
