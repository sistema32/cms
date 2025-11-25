/**
 * SlideEditor - Main Visual Editor Component
 * Provides drag-and-drop canvas for editing slides
 */

import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useRef } from 'https://esm.sh/preact/hooks';
import { currentSlide, layers, selectedLayer, uiState, actions } from '../services/state.js';
import { getLayerPosition, isVisibleOnDevice } from '../utils/responsive.js';

export function SlideEditor() {
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizing, setResizing] = useState(null);

    // Canvas dimensions based on device
    const getCanvasDimensions = () => {
        const device = uiState.value.device;
        const zoom = uiState.value.zoom / 100;

        const baseDimensions = {
            desktop: { width: 1200, height: 600 },
            tablet: { width: 768, height: 400 },
            mobile: { width: 375, height: 667 },
        };

        const base = baseDimensions[device];
        return {
            width: base.width * zoom,
            height: base.height * zoom,
            scale: zoom,
        };
    };

    const dimensions = getCanvasDimensions();

    // Handle layer click
    const handleLayerClick = (e, layer) => {
        e.stopPropagation();
        actions.selectLayer(layer);
    };

    // Handle layer drag start
    const handleDragStart = (e, layer) => {
        if (resizing) return;

        e.stopPropagation();
        setIsDragging(true);
        actions.selectLayer(layer);

        const rect = e.currentTarget.getBoundingClientRect();
        setDragStart({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    // Handle layer drag
    const handleDrag = (e) => {
        if (!isDragging || !selectedLayer.value) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const scale = dimensions.scale;

        let x = (e.clientX - canvasRect.left - dragStart.x) / scale;
        let y = (e.clientY - canvasRect.top - dragStart.y) / scale;

        // Snap to grid if enabled
        if (uiState.value.snapToGrid) {
            const gridSize = uiState.value.gridSize;
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        // Update layer position
        const currentPosition = selectedLayer.value.position || {};
        actions.updateLayer(selectedLayer.value.id, {
            position: {
                ...currentPosition,
                x: Math.max(0, x),
                y: Math.max(0, y),
            },
        });
    };

    // Handle drag end
    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Handle resize start
    const handleResizeStart = (e, layer, handle) => {
        e.stopPropagation();
        setResizing({ layer, handle, startX: e.clientX, startY: e.clientY });
        actions.selectLayer(layer);
    };

    // Handle resize
    const handleResize = (e) => {
        if (!resizing) return;

        const { layer, handle, startX, startY } = resizing;
        const deltaX = (e.clientX - startX) / dimensions.scale;
        const deltaY = (e.clientY - startY) / dimensions.scale;

        const currentPosition = layer.position || {};
        const newPosition = { ...currentPosition };

        // Calculate new dimensions based on handle
        if (handle.includes('e')) newPosition.width = Math.max(50, currentPosition.width + deltaX);
        if (handle.includes('w')) {
            newPosition.width = Math.max(50, currentPosition.width - deltaX);
            newPosition.x = currentPosition.x + deltaX;
        }
        if (handle.includes('s')) newPosition.height = Math.max(30, currentPosition.height + deltaY);
        if (handle.includes('n')) {
            newPosition.height = Math.max(30, currentPosition.height - deltaY);
            newPosition.y = currentPosition.y + deltaY;
        }

        actions.updateLayer(layer.id, { position: newPosition });
        setResizing({ ...resizing, startX: e.clientX, startY: e.clientY });
    };

    // Handle resize end
    const handleResizeEnd = () => {
        setResizing(null);
    };

    // Mouse move handler
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) handleDrag(e);
            if (resizing) handleResize(e);
        };

        const handleMouseUp = () => {
            handleDragEnd();
            handleResizeEnd();
        };

        if (isDragging || resizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, resizing, dragStart]);

    // Render layer on canvas
    const renderLayer = (layer) => {
        const device = uiState.value.device;

        // Check visibility
        if (!isVisibleOnDevice(layer, device)) return null;

        // Get position for current device
        const position = getLayerPosition(layer, device);
        const isSelected = selectedLayer.value?.id === layer.id;

        const style = {
            position: 'absolute',
            left: `${position.x * dimensions.scale}px`,
            top: `${position.y * dimensions.scale}px`,
            width: `${position.width * dimensions.scale}px`,
            height: `${position.height * dimensions.scale}px`,
            zIndex: position.zIndex || 1,
            cursor: isDragging ? 'grabbing' : 'grab',
            border: isSelected ? '2px solid #3B82F6' : '1px dashed transparent',
            boxSizing: 'border-box',
        };

        return html`
            <div
                key=${layer.id}
                class="layer"
                style=${style}
                onClick=${(e) => handleLayerClick(e, layer)}
                onMouseDown=${(e) => handleDragStart(e, layer)}
            >
                ${renderLayerContent(layer)}
                ${isSelected && renderResizeHandles(layer)}
            </div>
        `;
    };

    // Render layer content based on type
    const renderLayerContent = (layer) => {
        const settings = layer.settings || {};

        const contentStyle = {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: settings.align === 'center' ? 'center' : settings.align === 'bottom' ? 'flex-end' : 'flex-start',
            justifyContent: settings.textAlign === 'center' ? 'center' : settings.textAlign === 'right' ? 'flex-end' : 'flex-start',
            fontSize: `${(settings.fontSize || 16) * dimensions.scale}px`,
            fontFamily: settings.fontFamily || 'Inter, sans-serif',
            fontWeight: settings.fontWeight || 400,
            color: settings.color || '#000000',
            backgroundColor: settings.backgroundColor || 'transparent',
            padding: `${(settings.padding || 0) * dimensions.scale}px`,
        };

        switch (layer.type) {
            case 'heading':
                return html`<div style=${contentStyle}><strong>${layer.content || 'Heading'}</strong></div>`;
            case 'text':
                return html`<div style=${contentStyle}>${layer.content || 'Text'}</div>`;
            case 'button':
                return html`
                    <div style=${{ ...contentStyle, border: '2px solid #3B82F6', borderRadius: '4px', cursor: 'pointer' }}>
                        ${layer.content || 'Button'}
                    </div>
                `;
            case 'image':
                return html`<img src=${layer.content || 'https://via.placeholder.com/300x200'} style=${{ width: '100%', height: '100%', objectFit: 'cover' }} />`;
            default:
                return html`<div style=${contentStyle}>${layer.content || layer.type}</div>`;
        }
    };

    // Render resize handles
    const renderResizeHandles = (layer) => {
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

        return handles.map(handle => {
            const handleStyle = {
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: '#3B82F6',
                border: '1px solid white',
                borderRadius: '50%',
                cursor: `${handle}-resize`,
                ...getHandlePosition(handle),
            };

            return html`
                <div
                    key=${handle}
                    class="resize-handle"
                    style=${handleStyle}
                    onMouseDown=${(e) => handleResizeStart(e, layer, handle)}
                />
            `;
        });
    };

    // Get handle position
    const getHandlePosition = (handle) => {
        const positions = {
            nw: { top: '-4px', left: '-4px' },
            n: { top: '-4px', left: 'calc(50% - 4px)' },
            ne: { top: '-4px', right: '-4px' },
            e: { top: 'calc(50% - 4px)', right: '-4px' },
            se: { bottom: '-4px', right: '-4px' },
            s: { bottom: '-4px', left: 'calc(50% - 4px)' },
            sw: { bottom: '-4px', left: '-4px' },
            w: { top: 'calc(50% - 4px)', left: '-4px' },
        };
        return positions[handle];
    };

    if (!currentSlide.value) {
        return html`
            <div class="slide-editor-empty">
                <p>Select a slide to start editing</p>
            </div>
        `;
    }

    return html`
        <div class="slide-editor">
            <!-- Toolbar -->
            <div class="editor-toolbar">
                <button onClick=${() => actions.addLayer('heading')} title="Add Heading">
                    <span>H</span> Heading
                </button>
                <button onClick=${() => actions.addLayer('text')} title="Add Text">
                    <span>T</span> Text
                </button>
                <button onClick=${() => actions.addLayer('button')} title="Add Button">
                    <span>B</span> Button
                </button>
                <button onClick=${() => actions.addLayer('image')} title="Add Image">
                    <span>📷</span> Image
                </button>
                <div class="toolbar-separator"></div>
                <button 
                    onClick=${actions.toggleGrid} 
                    class=${uiState.value.showGrid ? 'active' : ''}
                    title="Toggle Grid"
                >
                    <span>⊞</span> Grid
                </button>
                <button 
                    onClick=${actions.toggleSnap} 
                    class=${uiState.value.snapToGrid ? 'active' : ''}
                    title="Snap to Grid"
                >
                    <span>⊡</span> Snap
                </button>
            </div>

            <!-- Canvas -->
            <div class="canvas-container">
                <div
                    ref=${canvasRef}
                    class="canvas"
                    style=${{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            position: 'relative',
            backgroundColor: '#ffffff',
            backgroundImage: uiState.value.showGrid
                ? `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`
                : 'none',
            backgroundSize: uiState.value.showGrid
                ? `${uiState.value.gridSize * dimensions.scale}px ${uiState.value.gridSize * dimensions.scale}px`
                : 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
                    onClick=${() => actions.selectLayer(null)}
                >
                    ${layers.value.map(renderLayer)}
                </div>
                
                <div class="canvas-info">
                    Device: ${uiState.value.device} | 
                    Zoom: ${uiState.value.zoom}% | 
                    Layers: ${layers.value.length}
                </div>
            </div>
        </div>
    `;
}
