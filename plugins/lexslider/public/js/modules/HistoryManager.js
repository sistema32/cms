/**
 * HistoryManager.js - Undo/Redo System for LexSlider
 * 
 * Provides state history management with:
 * - Undo/Redo stacks
 * - Batch operations (group rapid changes)
 * - Deep cloning of state snapshots
 */

import { state } from './EditorCore.js?v=3.0.28';
import { renderCanvas, selectLayer } from './CanvasRenderer.js?v=3.0.28';
import { renderTimelineTracks } from './TimelineManager.js?v=3.0.28';
import { renderProperties } from './PropertyInspector.js?v=3.0.28';

const MAX_HISTORY = 50;
const BATCH_DELAY_MS = 300; // Group changes within this window

let undoStack = [];
let redoStack = [];
let isBatching = false;
let batchTimeout = null;
let lastSnapshot = null;

/**
 * Create a deep clone of the current relevant state
 */
function createSnapshot() {
    return {
        currentSlide: state.currentSlide ? JSON.parse(JSON.stringify(state.currentSlide)) : null,
        globalLayers: state.globalLayers ? JSON.parse(JSON.stringify(state.globalLayers)) : [],
        selectedLayerId: state.selectedLayer?.id || null,
        mode: state.mode
    };
}

/**
 * Restore state from a snapshot
 */
function restoreSnapshot(snapshot) {
    if (!snapshot) return;

    // Restore slide data
    if (snapshot.currentSlide && state.currentSlide) {
        Object.assign(state.currentSlide, snapshot.currentSlide);
    }

    // Restore global layers
    if (snapshot.globalLayers) {
        state.globalLayers = JSON.parse(JSON.stringify(snapshot.globalLayers));
    }

    // Restore selection
    if (snapshot.selectedLayerId) {
        const layers = state.mode === 'global' ? state.globalLayers : (state.currentSlide?.layers || []);
        const layer = findLayerById(layers, snapshot.selectedLayerId);
        if (layer) {
            state.selectedLayer = layer;
        }
    } else {
        state.selectedLayer = null;
    }

    // Re-render everything
    renderCanvas();
    renderTimelineTracks();
    renderProperties();
}

/**
 * Find layer by ID (supports nested groups)
 */
function findLayerById(layers, id) {
    for (const layer of layers) {
        if (layer.id === id) return layer;
        if (layer.children && layer.children.length > 0) {
            const found = findLayerById(layer.children, id);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Push current state to undo stack
 * Call this BEFORE making changes
 */
export function pushState(actionName = 'action') {
    // If batching, extend the timeout
    if (isBatching) {
        if (batchTimeout) clearTimeout(batchTimeout);
        batchTimeout = setTimeout(endBatch, BATCH_DELAY_MS);
        return;
    }

    const snapshot = createSnapshot();

    // Don't push if state hasn't changed
    if (lastSnapshot && JSON.stringify(snapshot) === JSON.stringify(lastSnapshot)) {
        return;
    }

    undoStack.push(snapshot);
    lastSnapshot = snapshot;

    // Clear redo stack on new action
    redoStack = [];

    // Limit history size
    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }

    console.log(`[History] Pushed: ${actionName} (stack: ${undoStack.length})`);
}

/**
 * Begin batch operation - groups multiple changes into one undo step
 */
export function beginBatch() {
    if (!isBatching) {
        pushState('batch-start');
        isBatching = true;
    }
}

/**
 * End batch operation
 */
export function endBatch() {
    isBatching = false;
    if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
    }
}

/**
 * Undo last action
 */
export function undo() {
    if (undoStack.length === 0) {
        console.log('[History] Nothing to undo');
        return false;
    }

    // Save current state to redo stack
    const currentSnapshot = createSnapshot();
    redoStack.push(currentSnapshot);

    // Pop and restore previous state
    const previousSnapshot = undoStack.pop();
    restoreSnapshot(previousSnapshot);
    lastSnapshot = previousSnapshot;

    console.log(`[History] Undo (undo: ${undoStack.length}, redo: ${redoStack.length})`);
    return true;
}

/**
 * Redo last undone action
 */
export function redo() {
    if (redoStack.length === 0) {
        console.log('[History] Nothing to redo');
        return false;
    }

    // Save current state to undo stack
    const currentSnapshot = createSnapshot();
    undoStack.push(currentSnapshot);

    // Pop and restore redo state
    const redoSnapshot = redoStack.pop();
    restoreSnapshot(redoSnapshot);
    lastSnapshot = redoSnapshot;

    console.log(`[History] Redo (undo: ${undoStack.length}, redo: ${redoStack.length})`);
    return true;
}

/**
 * Check if undo is available
 */
export function canUndo() {
    return undoStack.length > 0;
}

/**
 * Check if redo is available
 */
export function canRedo() {
    return redoStack.length > 0;
}

/**
 * Clear all history (call when switching sliders)
 */
export function clearHistory() {
    undoStack = [];
    redoStack = [];
    lastSnapshot = null;
    isBatching = false;
    if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
    }
    console.log('[History] Cleared');
}

/**
 * Get history status for UI
 */
export function getHistoryStatus() {
    return {
        canUndo: canUndo(),
        canRedo: canRedo(),
        undoCount: undoStack.length,
        redoCount: redoStack.length
    };
}
