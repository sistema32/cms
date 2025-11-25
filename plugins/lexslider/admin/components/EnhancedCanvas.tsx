import { html } from "https://esm.sh/htm@3.1.1/preact";
import { useState, useEffect, useRef } from "https://esm.sh/preact@10.19.3/hooks";
import {
    UndoRedoManager,
    snapPositionToGrid,
    snapSizeToGrid,
    matchesShortcut,
    defaultShortcuts,
    resizeHandles,
    calculateResizePosition
} from "../../lib/editorUtils.ts";

/**
 * Enhanced Slide Canvas with Resize Handles and Snap-to-Grid
 */

export function EnhancedSlideCanvas({ slide, slider, onLayerSelect, selectedLayer, onUpdateSlide }) {
    const [dragging, setDragging] = useState(null);
    const [resizing, setResizing] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [snapToGrid, setSnapToGrid] = useState({ enabled: true, gridSize: 10 });
    const [showGrid, setShowGrid] = useState(false);
    const undoManager = useRef(new UndoRedoManager());
    const canvasRef = useRef(null);

    // Save state to undo history
    useEffect(() => {
        if (slide) {
            undoManager.current.push(slide);
        }
    }, [slide]);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyboard(e) {
            if (matchesShortcut(e, defaultShortcuts.undo)) {
                e.preventDefault();
                handleUndo();
            } else if (matchesShortcut(e, defaultShortcuts.redo)) {
                e.preventDefault();
                handleRedo();
            } else if (matchesShortcut(e, defaultShortcuts.delete) && selectedLayer) {
                e.preventDefault();
                handleDeleteLayer();
            } else if (matchesShortcut(e, defaultShortcuts.duplicate) && selectedLayer) {
                e.preventDefault();
                handleDuplicateLayer();
            } else if (matchesShortcut(e, 'g')) {
                e.preventDefault();
                setShowGrid(!showGrid);
            }
        }

        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    }, [selectedLayer, showGrid]);

    function handleUndo() {
        const previousState = undoManager.current.undo();
        if (previousState) {
            onUpdateSlide(previousState);
        }
    }

    function handleRedo() {
        const nextState = undoManager.current.redo();
        if (nextState) {
            onUpdateSlide(nextState);
        }
    }

    function handleDeleteLayer() {
        const updatedLayers = slide.layers.filter(l => l.id !== selectedLayer.id);
        onUpdateSlide({ layers: updatedLayers });
        onLayerSelect(null);
    }

    function handleDuplicateLayer() {
        const newLayer = {
            ...selectedLayer,
            id: `layer-${Date.now()}`,
            position: {
                ...selectedLayer.position,
                x: selectedLayer.position.x + 20,
                y: selectedLayer.position.y + 20
            }
        };
        const updatedLayers = [...slide.layers, newLayer];
        onUpdateSlide({ layers: updatedLayers });
        onLayerSelect(newLayer);
    }

    function handleLayerMouseDown(e, layer) {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setDragging(layer);
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        onLayerSelect(layer);
    }

    function handleResizeMouseDown(e, layer, handle) {
        e.preventDefault();
        e.stopPropagation();
        setResizing({ layer, handle, startPos: layer.position, startMouse: { x: e.clientX, y: e.clientY } });
        onLayerSelect(layer);
    }

    function handleMouseMove(e) {
        if (dragging) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left - dragOffset.x;
            let y = e.clientY - rect.top - dragOffset.y;

            const snapped = snapPositionToGrid({ x, y }, snapToGrid);

            const updatedLayers = slide.layers.map(l =>
                l.id === dragging.id ? { ...l, position: { ...l.position, x: snapped.x, y: snapped.y } } : l
            );

            onUpdateSlide({ layers: updatedLayers });
        } else if (resizing) {
            const delta = {
                x: e.clientX - resizing.startMouse.x,
                y: e.clientY - resizing.startMouse.y
            };

            let newPos = calculateResizePosition(resizing.handle, resizing.startPos, delta);

            if (snapToGrid.enabled) {
                newPos = {
                    x: snapPositionToGrid({ x: newPos.x, y: newPos.y }, snapToGrid).x,
                    y: snapPositionToGrid({ x: newPos.x, y: newPos.y }, snapToGrid).y,
                    ...snapSizeToGrid({ width: newPos.width, height: newPos.height }, snapToGrid)
                };
            }

            const updatedLayers = slide.layers.map(l =>
                l.id === resizing.layer.id ? { ...l, position: newPos } : l
            );

            onUpdateSlide({ layers: updatedLayers });
        }
    }

    function handleMouseUp() {
        setDragging(null);
        setResizing(null);
    }

    const backgroundStyle = slide.background?.type === 'color'
        ? { backgroundColor: slide.background.value }
        : slide.background?.type === 'image'
            ? { backgroundImage: `url(${slide.background.value})`, backgroundSize: 'cover' }
            : slide.background?.type === 'gradient'
                ? { background: slide.background.value }
                : {};

    return html`
    <div class="canvas-wrapper">
      <div class="canvas-toolbar">
        <button 
          onClick=${handleUndo} 
          disabled=${!undoManager.current.canUndo()}
          class="toolbar-btn"
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
          </svg>
        </button>
        <button 
          onClick=${handleRedo} 
          disabled=${!undoManager.current.canRedo()}
          class="toolbar-btn"
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
          </svg>
        </button>
        <div class="toolbar-divider"></div>
        <label class="toolbar-checkbox">
          <input 
            type="checkbox" 
            checked=${showGrid}
            onChange=${(e) => setShowGrid(e.target.checked)}
          />
          Grid (G)
        </label>
        <label class="toolbar-checkbox">
          <input 
            type="checkbox" 
            checked=${snapToGrid.enabled}
            onChange=${(e) => setSnapToGrid({ ...snapToGrid, enabled: e.target.checked })}
          />
          Snap
        </label>
        <input 
          type="number" 
          value=${snapToGrid.gridSize}
          onChange=${(e) => setSnapToGrid({ ...snapToGrid, gridSize: parseInt(e.target.value) })}
          min="5"
          max="50"
          step="5"
          class="grid-size-input"
          title="Grid size"
        />
      </div>

      <div 
        ref=${canvasRef}
        class="canvas-container ${showGrid ? 'show-grid' : ''}"
        style=${{
            width: `${slider.width}px`,
            height: `${slider.height}px`,
            maxWidth: '100%',
            '--grid-size': `${snapToGrid.gridSize}px`
        }}
        onMouseMove=${handleMouseMove}
        onMouseUp=${handleMouseUp}
        onMouseLeave=${handleMouseUp}
      >
        <div class="canvas-slide" style=${backgroundStyle}>
          ${slide.layers?.map(layer => html`
            <div
              key=${layer.id}
              class=${`canvas-layer ${selectedLayer?.id === layer.id ? 'selected' : ''}`}
              style=${{
                position: 'absolute',
                left: `${layer.position.x}px`,
                top: `${layer.position.y}px`,
                width: `${layer.position.width}px`,
                height: `${layer.position.height}px`,
                cursor: dragging?.id === layer.id ? 'grabbing' : 'grab',
                ...layer.style
            }}
              onMouseDown=${(e) => handleLayerMouseDown(e, layer)}
            >
              ${renderLayerContent(layer)}
              
              ${selectedLayer?.id === layer.id && html`
                <div class="resize-handles">
                  ${resizeHandles.map(handle => html`
                    <div
                      key=${handle.position}
                      class=${`resize-handle resize-handle-${handle.position}`}
                      style=${{ cursor: handle.cursor }}
                      onMouseDown=${(e) => handleResizeMouseDown(e, layer, handle.position)}
                    ></div>
                  `)}
                </div>
              `}
            </div>
          `)}
        </div>
      </div>

      <div class="canvas-shortcuts">
        <small>
          <strong>Shortcuts:</strong> 
          Ctrl+Z: Undo | Ctrl+Shift+Z: Redo | Del: Delete | Ctrl+D: Duplicate | G: Toggle Grid
        </small>
      </div>
    </div>

    <style>
      .canvas-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .canvas-toolbar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #fff;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .toolbar-btn {
        padding: 0.5rem;
        border: 1px solid #e5e7eb;
        background: #fff;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .toolbar-btn:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #167bff;
      }

      .toolbar-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .toolbar-divider {
        width: 1px;
        height: 24px;
        background: #e5e7eb;
        margin: 0 0.25rem;
      }

      .toolbar-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        cursor: pointer;
      }

      .grid-size-input {
        width: 60px;
        padding: 0.375rem 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .canvas-container {
        position: relative;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        overflow: hidden;
      }

      .canvas-container.show-grid {
        background-image: 
          linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
        background-size: var(--grid-size) var(--grid-size);
      }

      .canvas-slide {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .canvas-layer {
        border: 2px dashed transparent;
        transition: border-color 0.2s;
        user-select: none;
      }

      .canvas-layer:hover {
        border-color: rgba(22, 123, 255, 0.5);
      }

      .canvas-layer.selected {
        border-color: #167bff;
        border-style: solid;
      }

      .resize-handles {
        position: absolute;
        inset: -4px;
        pointer-events: none;
      }

      .resize-handle {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #167bff;
        border: 2px solid #fff;
        border-radius: 50%;
        pointer-events: all;
      }

      .resize-handle-nw { top: -4px; left: -4px; }
      .resize-handle-n { top: -4px; left: 50%; transform: translateX(-50%); }
      .resize-handle-ne { top: -4px; right: -4px; }
      .resize-handle-e { top: 50%; right: -4px; transform: translateY(-50%); }
      .resize-handle-se { bottom: -4px; right: -4px; }
      .resize-handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); }
      .resize-handle-sw { bottom: -4px; left: -4px; }
      .resize-handle-w { top: 50%; left: -4px; transform: translateY(-50%); }

      .canvas-shortcuts {
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 6px;
        text-align: center;
      }

      .canvas-shortcuts small {
        color: #6b7280;
        font-size: 0.8125rem;
      }
    </style>
  `;
}

function renderLayerContent(layer) {
    switch (layer.type) {
        case 'heading':
            return html`<h2 style="margin: 0; pointer-events: none;">${layer.content}</h2>`;
        case 'text':
            return html`<p style="margin: 0; pointer-events: none;">${layer.content}</p>`;
        case 'button':
            return html`<button style="pointer-events: none;">${layer.content}</button>`;
        case 'image':
            return html`<img src=${layer.content.src} alt=${layer.content.alt} style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" />`;
        default:
            return null;
    }
}
