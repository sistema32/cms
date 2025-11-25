/**
 * Keyboard Shortcuts Handler
 */

import { selectedLayer, actions } from '../services/state.js';

let undoStack = [];
let redoStack = [];
const MAX_UNDO_STACK = 50;

export function initKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyDown);
}

export function cleanupKeyboardShortcuts() {
    document.removeEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
    // Ignore if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    // Delete layer (Delete or Backspace)
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayer.value) {
        e.preventDefault();
        if (confirm('Delete this layer?')) {
            actions.deleteLayer(selectedLayer.value.id);
        }
        return;
    }

    // Duplicate layer (Ctrl/Cmd + D)
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedLayer.value) {
        e.preventDefault();
        actions.duplicateLayer(selectedLayer.value.id);
        return;
    }

    // Undo (Ctrl/Cmd + Z)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }

    // Redo (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y)
    if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
    }

    // Select all (Ctrl/Cmd + A)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        // TODO: Implement select all
        return;
    }

    // Deselect (Escape)
    if (e.key === 'Escape') {
        e.preventDefault();
        actions.selectLayer(null);
        return;
    }
}

export function pushToUndoStack(action) {
    undoStack.push(action);
    if (undoStack.length > MAX_UNDO_STACK) {
        undoStack.shift();
    }
    redoStack = []; // Clear redo stack on new action
}

function undo() {
    if (undoStack.length === 0) {
        console.log('Nothing to undo');
        return;
    }

    const action = undoStack.pop();
    redoStack.push(action);

    // Execute undo action
    if (action.type === 'update') {
        actions.updateLayer(action.layerId, action.previousState);
    } else if (action.type === 'delete') {
        // TODO: Restore deleted layer
    } else if (action.type === 'create') {
        actions.deleteLayer(action.layerId);
    }
}

function redo() {
    if (redoStack.length === 0) {
        console.log('Nothing to redo');
        return;
    }

    const action = redoStack.pop();
    undoStack.push(action);

    // Execute redo action
    if (action.type === 'update') {
        actions.updateLayer(action.layerId, action.newState);
    } else if (action.type === 'create') {
        // TODO: Recreate layer
    } else if (action.type === 'delete') {
        actions.deleteLayer(action.layerId);
    }
}
