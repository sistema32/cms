# LexSlider Phase 2 TODO List

## 1. Timeline Enhancements (RevSlider Inspired)
- [x] **Implement Snapping (Magnetism)**
    - [x] Add "Snap to Grid" toggle button in Timeline Toolbar.
    - [x] Add "Snap to Layers" toggle button in Timeline Toolbar (Implicit in current snap logic).
    - [x] Update `TimelineManager.js`: Implement `calculateSnap` function in `onBarDrag`.
    - [x] Visual feedback: Show a vertical line when snapping occurs.
- [x] **Layer Grouping & Filtering**
    - [x] Update `LayerManager.js`: Add `parentId` and `children` properties to Layer model.
    - [x] Update `TimelineManager.js`: Render nested tree structure for groups.
    - [x] Implement "Group" button in Sidebar to group selected layers.
    - [x] Implement "Expand/Collapse" logic for groups in Timeline.
- [x] **Global Speed Factor**
    - [x] Add "Speed Multiplier" input (0.5x, 1x, 2x) in Timeline Toolbar.
    - [x] Update `TimelineManager.js`: Apply multiplier to `currentTime` increment in playback loop.

## 2. Advanced Animation Engine
- [x] **True Keyframe System**
    - [x] Update Layer Model: Ensure `keyframes` array supports property objects.
    - [x] Update `CanvasRenderer.js`: Implement `interpolate` logic.
    - [x] Update `CanvasRenderer.js`: Calculate current layer properties based on `currentTime` and keyframes.
    - [x] UI: Add "Add Keyframe" button/click interaction in Timeline track.
    - [x] UI: Create "Keyframe Inspector" panel (Implemented as Property Inspector mode).
- [x] **Easing Functions**
    - [x] Create `EasingFunctions.js` utility (Linear, EaseInQuad, EaseOutBounce, etc.).
    - [x] Update `PropertyInspector.js`: Add "Easing" dropdown in Animation tab (Keyframe mode).
    - [x] Integrate Easing into `CanvasRenderer.js` interpolation logic.
- [x] **Background Animations**
    - [x] Update `PropertyInspector.js` (Slide Mode): Add "Background Animation" section (Ken Burns toggle exists).
    - [x] Implement CSS Keyframe generation for Ken Burns effects (Zoom/Pan) in `CanvasRenderer.js` or `main.js`.
    - [x] Apply animation class to Slide Background element in `CanvasRenderer.js`.

## 3. UI/UX Refinements (Smart Slider 3 Inspired)
- [x] **Tabbed Property Inspector**
    - [x] Refactor `PropertyInspector.js` HTML structure.
    - [x] Create Tabs: `Content`, `Style`, `Animation`, `Settings`.
    - [x] Implement tab switching logic.
- [x] **Animation Presets Library**
    - [x] Define preset configuration object (name, css properties).
    - [x] Add "Preset" dropdown in Animation tab.
    - [x] Implement "Hover Preview" (temporarily apply animation when hovering option).

## 4. System & Integration
- [x] **Update Preview Mechanism**
    - [x] Ensure `main.js` preview function generates CSS `@keyframes` for all custom keyframe animations.
    - [ ] Test preview with complex nested groups and timing.
- [ ] **Performance Optimization**
    - [ ] Optimize `renderCanvas` to only update changed properties during playback (avoid full DOM reconstruction if possible).

## 5. CMS Core Improvements (Global)
- [x] **Global Media Library Component**
    - [x] Create `/src/admin/assets/js/media-picker.js` - Standalone reusable component
    - [x] Features:
        - Modal con grid de imágenes del CMS (`/api/media`)
        - Uploader integrado con drag & drop
        - Búsqueda y filtrado por tipo
        - Callback `onSelect(mediaItem)` para uso en plugins
    - [x] API: `window.CMS.MediaPicker.open({ onSelect, filter, multiple })`
    - [x] Integrar en LexSlider (reemplazar asset manager actual)
    - [ ] Integrar en CKEditor (reemplazar picker actual)
    - [ ] Integrar en Widget Settings (campos tipo `image`)
    - [x] Beneficio: Código centralizado, UX consistente en todo el admin panel

## 6. Mejoras Futuras
- [ ] **Sistema Undo/Redo**
    - [ ] Crear `HistoryManager.js` con stack de estados
    - [ ] Ctrl+Z / Ctrl+Y shortcuts
    - [ ] Botones visuales en toolbar
    - [ ] Agrupar acciones rápidas (drag = 1 acción)
