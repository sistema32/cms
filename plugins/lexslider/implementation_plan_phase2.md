# LexSlider Implementation Plan - Phase 2: Advanced Animation & Timeline

This plan outlines the integration of advanced features inspired by RevSlider and Smart Slider 3 into the existing LexSlider architecture.

## 1. Enhanced Timeline (RevSlider Inspired)
The current timeline is functional but lacks precision tools. We will add:

### A. Magnetism & Snapping (Sticky Layers)
*   **Goal:** Allow timeline bars (layers) to "snap" to the grid lines or to the start/end of other layers.
*   **Implementation:**
    *   Add a "Snap" toggle in the timeline toolbar.
    *   In `TimelineManager.js` (`onBarDrag`), calculate distance to nearest grid line or neighbor layer edge.
    *   If within threshold (e.g., 10px), force `startTime` or `duration` to match.

### B. Layer Grouping & Filtering
*   **Goal:** Manage complex slides with many layers.
*   **Implementation:**
    *   **UI:** Add "Eye" icons to filter visibility in the timeline (not just canvas).
    *   **Groups:** Allow creating "Layer Groups" (folders) in the timeline tree.
    *   **Logic:** `LayerManager.js` needs to support a `parentId` for layers. `TimelineManager.js` renders nested trees.

### C. Global Speed Factor
*   **Goal:** Quickly adjust the pacing of the entire slide.
*   **Implementation:**
    *   Add a "Speed Multiplier" input (default 1.0x) in the Timeline Toolbar.
    *   Affects the playback rate in `TimelineManager.js` loop.

## 2. Advanced Animation Engine (Hybrid Approach)
Combining RevSlider's visual keyframes with Smart Slider 3's form-based simplicity.

### A. True Keyframe System
*   **Goal:** Interpolate properties between keyframes, not just "Entrance" animations.
*   **Implementation:**
    *   **Data Structure:** Extend `layer.keyframes` to store specific properties (e.g., `{ time: 500, x: 100, opacity: 1 }`).
    *   **UI:** Clicking a keyframe diamond in the timeline opens a specific "Keyframe Properties" panel in the Inspector.
    *   **Engine:** Update `CanvasRenderer.js` to calculate intermediate values based on `currentTime` relative to keyframes.

### B. Easing Functions (Smart Slider 3 Inspired)
*   **Goal:** Smooth, professional-looking movements.
*   **Implementation:**
    *   Add an "Easing" dropdown to the Animation section in `PropertyInspector.js`.
    *   Options: `Linear`, `EaseIn`, `EaseOut`, `EaseInOut`, `Bounce`, `Elastic`.
    *   Apply these CSS `transition-timing-function` or JS-based interpolation.

### C. Background Animations (Ken Burns / Parallax)
*   **Goal:** Dynamic backgrounds.
*   **Implementation:**
    *   Add a "Background Animation" section to Slide Properties.
    *   **Presets:** "Zoom In (Ken Burns)", "Pan Left", "Pan Right".
    *   Render these as CSS animations on the slide background container.

## 3. UI/UX Refinements

### A. Tabbed Property Inspector (Smart Slider 3 Style)
*   **Goal:** Reduce clutter in the sidebar.
*   **Implementation:**
    *   Split `PropertyInspector.js` into tabs: `Content`, `Style`, `Animation`, `Settings`.
    *   Show only relevant fields for the active tab.

### B. Animation Presets Library
*   **Goal:** Quick setup for users.
*   **Implementation:**
    *   Create a library of CSS animations (Animate.css style).
    *   Visual preview of the animation when hovering over the option in the dropdown.

## 4. Technical Integration Steps

1.  **Refactor `TimelineManager.js`**: Implement Snapping and Grouping logic.
2.  **Update `CanvasRenderer.js`**: Implement the interpolation engine for Keyframes.
3.  **Update `PropertyInspector.js`**: Implement Tabs and Easing controls.
4.  **Update `main.js`**: Ensure `preview` function respects the new Keyframe/Easing logic (likely requires generating complex `@keyframes` CSS dynamically).
