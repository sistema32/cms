# LexSlider Plugin

**Version:** 1.0.0
**Author:** LexCMS Team
**License:** MIT

LexSlider is a professional, responsive slider plugin for LexCMS. It allows you to create beautiful, touch-friendly sliders using a visual drag-and-drop editor. It serves as the **reference implementation** for the new LexCMS Plugin System architecture.

## 🌟 Features

### 🖼️ Slide Types
*   **Image Slides**: High-performance image rendering with lazy loading and `srcset` support for responsive sizing.
*   **Video Slides**: Support for HTML5 video (MP4, WebM) and embedded players (YouTube, Vimeo) with autoplay and mute options.
*   **HTML/Text Layers**: Rich text editor for adding captions, buttons, and custom HTML overlays on top of slides.
*   **Solid Color**: Simple background color slides for text-heavy announcements.

### ✨ Animations & Transitions
*   **Transitions**: Fade, Slide (Horizontal/Vertical), Zoom In/Out, Cube, Flip.
*   **Ken Burns Effect**: Subtle pan and zoom effect for static images.
*   **Parallax**: Background moves slower than foreground content for depth perception.
*   **Layer Animations**: Animate individual text/button layers (Fade In, Slide Up, Bounce, etc.) with configurable delays.

### 🎛️ Customization & Controls
*   **Navigation**: Customizable arrows (style, color, position) and pagination dots.
*   **Autoplay**: Configurable interval, pause on hover, stop on interaction.
*   **Looping**: Infinite loop support.
*   **Full Width / Full Screen**: Options to stretch the slider to the container or viewport height.
*   **Thumbnails**: Optional thumbnail navigation strip.

### 📱 Mobile Optimized
*   **Touch Gestures**: Native-feeling swipe support (1:1 movement).
*   **Responsive Breakpoints**: Define different heights or hide specific layers based on screen size (Mobile, Tablet, Desktop).
*   **Performance**: Uses CSS3 hardware acceleration (GPU) for buttery smooth animations.

### 🧬 Smart Slider 3 Heritage
LexSlider is inspired by the industry-standard Smart Slider 3, inheriting its best workflow concepts:
*   **Layer-Based Editing**: Compose slides using independent layers (Heading, Text, Image, Button) just like in a design tool.
*   **Visual Builder**: What You See Is What You Get (WYSIWYG) editor with real-time preview.
*   **Device-Specific Styling**: Adjust font sizes, positions, and visibility per device (Desktop, Tablet, Mobile).
*   **Dynamic Height**: Slider height adjusts automatically based on content or screen width.

### 🔍 SEO & Performance
Built with Core Web Vitals in mind:
*   **Indexable Content**: All text layers are rendered as real HTML, making them fully readable by search engines (unlike text baked into images).
*   **Semantic HTML**: Uses proper HTML5 structure (`<article>`, `<figure>`, `<h1>-<h6>`).
*   **Smart Loading**:
    *   **Lazy Loading**: Images load only when near the viewport to boost LCP (Largest Contentful Paint).
    *   **Srcset Support**: Automatically serves smaller images for mobile devices.
*   **Accessibility (A11Y)**:
    *   Automatic `alt` attributes for images.
    *   ARIA labels for navigation arrows and bullets.
    *   Keyboard navigation support.

## 🛠️ Technical Details

This plugin is built on the **LexCMS v2 Plugin Architecture** and serves as a reference for:

*   **Worker Isolation**: All logic (slide management, rendering calculations) runs in a Web Worker.
*   **No-Build Admin**: The admin interface uses Preact + HTM via ES Modules, requiring no build step.
*   **Secure RPC**: Uses the `HostAPI` to interact with the database and register routes securely.

### Permissions
LexSlider requires the following permissions to operate:
*   `database:read`, `database:write`: To store sliders and slides in its own scoped tables.
*   `api:register`: To expose REST endpoints for the frontend renderer.
*   `hooks:register`: To inject the slider shortcode processor into the content stream.
*   `admin:menu`: To add the "LexSlider" item to the admin sidebar.
*   `network:external`: For fetching external assets (e.g., YouTube API) if needed.

### Architecture
*   **Entry Point**: `index.ts` (implements `IPlugin`).
*   **Loader**: `loader.ts` (registers routes and admin panel).
*   **API**:
    *   `GET /api/plugins/lexslider/sliders`: List sliders.
    *   `GET /api/plugins/lexslider/render/:id`: Render a slider HTML (Server-Side Rendering compatible).
*   **Admin Panel**: A No-Build Preact application served from `assets/admin/`.

## 💻 Developer API

You can extend LexSlider using hooks:

```typescript
// Example: Add a custom layer type
pluginAPI.hooks.addFilter('lexslider:layerTypes', (types) => {
    return [...types, { id: '3d-model', label: '3D Model' }];
});
```

## 🚀 Usage

### Shortcode
You can embed a slider in any page or post using the shortcode:

```
[lexslider id="1"]
```

Or using an alias:

```
[lexslider alias="homepage-hero"]
```

### Admin Panel
Go to the **LexSlider** section in the LexCMS Admin Control Panel to create and manage your sliders.

## 📦 Installation

(This plugin is pre-installed in the core distribution for testing purposes).

1.  Ensure the plugin files are in `plugins/lexslider`.
2.  Go to **Settings > Plugins**.
3.  Click **Activate** on LexSlider.
