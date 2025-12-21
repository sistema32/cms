/**
 * HistoryPanel.js - Visual History Panel for LexSlider
 * Adobe Photoshop/Illustrator style history with visible action list
 */

import { state } from './EditorCore.js?v=3.0.28';
import { renderCanvas, selectLayer } from './CanvasRenderer.js?v=3.0.28';
import { renderTimelineTracks } from './TimelineManager.js?v=3.0.28';
import { renderProperties } from './PropertyInspector.js?v=3.0.28';

// Configuration
const MAX_HISTORY = 100;
const BATCH_DELAY_MS = 300;

// History state
let historyStates = [];  // All states (past + future relative to current)
let currentIndex = -1;   // Current position in history
let isBatching = false;
let batchTimeout = null;
let panelElement = null;

// Action icons mapping
const ACTION_ICONS = {
    'initial': 'flag',
    'add-layer': 'add_box',
    'delete-layer': 'delete',
    'move-layer': 'open_with',
    'resize-layer': 'aspect_ratio',
    'rotate-layer': 'rotate_right',
    'edit-text': 'text_fields',
    'change-style': 'palette',
    'change-animation': 'animation',
    'duplicate-layer': 'content_copy',
    'group-layers': 'folder',
    'ungroup-layers': 'folder_off',
    'reorder-layers': 'swap_vert',
    'edit-slide': 'slideshow',
    'change-background': 'image',
    'add-slide': 'add_to_queue',
    'delete-slide': 'remove_from_queue',
    'paste': 'content_paste',
    'cut': 'content_cut',
    'transform': 'transform',
    'align': 'format_align_center',
    'distribute': 'view_week',
    'lock-layer': 'lock',
    'unlock-layer': 'lock_open',
    'visibility': 'visibility',
    'batch': 'dynamic_feed',
    'default': 'history'
};

/**
 * Create a deep clone of the current state
 */
function createSnapshot(actionName = 'action', actionType = 'default') {
    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actionName,
        actionType,
        data: {
            currentSlide: state.currentSlide ? JSON.parse(JSON.stringify(state.currentSlide)) : null,
            globalLayers: state.globalLayers ? JSON.parse(JSON.stringify(state.globalLayers)) : [],
            selectedLayerId: state.selectedLayer?.id || null,
            mode: state.mode
        }
    };
}

/**
 * Restore state from a snapshot
 */
function restoreSnapshot(snapshot) {
    if (!snapshot || !snapshot.data) return;
    const data = snapshot.data;

    if (data.currentSlide && state.currentSlide) {
        Object.assign(state.currentSlide, data.currentSlide);
    }

    if (data.globalLayers) {
        state.globalLayers = JSON.parse(JSON.stringify(data.globalLayers));
    }

    if (data.selectedLayerId) {
        const layers = data.mode === 'global' ? state.globalLayers : (state.currentSlide?.layers || []);
        const layer = findLayerById(layers, data.selectedLayerId);
        if (layer) {
            state.selectedLayer = layer;
        }
    } else {
        state.selectedLayer = null;
    }

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
 * Push current state to history
 */
export function pushState(actionName = 'Action', actionType = 'default') {
    if (isBatching) {
        if (batchTimeout) clearTimeout(batchTimeout);
        batchTimeout = setTimeout(endBatch, BATCH_DELAY_MS);
        // Update the batch action name
        if (historyStates[currentIndex]) {
            historyStates[currentIndex].actionName = actionName;
            historyStates[currentIndex].actionType = actionType;
            updatePanel();
        }
        return;
    }

    const snapshot = createSnapshot(actionName, actionType);

    // Remove any "future" states when new action is taken
    if (currentIndex < historyStates.length - 1) {
        historyStates = historyStates.slice(0, currentIndex + 1);
    }

    historyStates.push(snapshot);
    currentIndex = historyStates.length - 1;

    // Limit history size
    if (historyStates.length > MAX_HISTORY) {
        historyStates.shift();
        currentIndex--;
    }

    updatePanel();
    console.log(`[History] Pushed: ${actionName} (${currentIndex + 1}/${historyStates.length})`);
}

/**
 * Initialize history with initial state
 */
export function initHistory() {
    historyStates = [];
    currentIndex = -1;
    pushState('Initial State', 'initial');
}

/**
 * Begin batch operation
 */
export function beginBatch(actionName = 'Batch Edit') {
    if (!isBatching) {
        pushState(actionName, 'batch');
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
 * Go to specific history index
 */
export function goToState(index) {
    if (index < 0 || index >= historyStates.length) return false;
    if (index === currentIndex) return true;

    // Save current state if at the end
    if (currentIndex === historyStates.length - 1) {
        const currentSnapshot = createSnapshot('Current', 'default');
        historyStates[currentIndex] = currentSnapshot;
    }

    currentIndex = index;
    restoreSnapshot(historyStates[currentIndex]);
    updatePanel();

    console.log(`[History] Jump to state ${index + 1}/${historyStates.length}`);
    return true;
}

/**
 * Undo last action
 */
export function undo() {
    if (currentIndex <= 0) {
        console.log('[History] Nothing to undo');
        return false;
    }
    return goToState(currentIndex - 1);
}

/**
 * Redo last undone action
 */
export function redo() {
    if (currentIndex >= historyStates.length - 1) {
        console.log('[History] Nothing to redo');
        return false;
    }
    return goToState(currentIndex + 1);
}

/**
 * Check if undo is available
 */
export function canUndo() {
    return currentIndex > 0;
}

/**
 * Check if redo is available
 */
export function canRedo() {
    return currentIndex < historyStates.length - 1;
}

/**
 * Clear all history
 */
export function clearHistory() {
    historyStates = [];
    currentIndex = -1;
    isBatching = false;
    if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
    }
    updatePanel();
    console.log('[History] Cleared');
}

/**
 * Get history status
 */
export function getHistoryStatus() {
    return {
        canUndo: canUndo(),
        canRedo: canRedo(),
        currentIndex,
        totalStates: historyStates.length,
        states: historyStates.map((s, i) => ({
            id: s.id,
            actionName: s.actionName,
            actionType: s.actionType,
            timestamp: s.timestamp,
            isCurrent: i === currentIndex
        }))
    };
}

/**
 * Get action icon
 */
function getActionIcon(actionType) {
    return ACTION_ICONS[actionType] || ACTION_ICONS.default;
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Update the history panel UI
 */
function updatePanel() {
    if (!panelElement) return;

    const listEl = panelElement.querySelector('.history-list');
    if (!listEl) return;

    listEl.innerHTML = historyStates.map((s, i) => `
        <div class="history-item ${i === currentIndex ? 'current' : ''} ${i > currentIndex ? 'future' : ''}" 
             data-index="${i}">
            <span class="history-icon material-icons-round">${getActionIcon(s.actionType)}</span>
            <div class="history-info">
                <span class="history-name">${s.actionName}</span>
                <span class="history-time">${formatTime(s.timestamp)}</span>
            </div>
        </div>
    `).join('');

    // Scroll to current
    const currentItem = listEl.querySelector('.history-item.current');
    if (currentItem) {
        currentItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // Update buttons
    const undoBtn = panelElement.querySelector('.history-undo');
    const redoBtn = panelElement.querySelector('.history-redo');
    if (undoBtn) undoBtn.disabled = !canUndo();
    if (redoBtn) redoBtn.disabled = !canRedo();

    // Update counter
    const counter = panelElement.querySelector('.history-counter');
    if (counter) {
        counter.textContent = `${currentIndex + 1} / ${historyStates.length}`;
    }
}

/**
 * Generate History Panel HTML
 */
export function generateHistoryPanelHTML() {
    return `
        <div class="history-panel" id="historyPanel">
            <div class="history-header">
                <span class="material-icons-round">history</span>
                <span class="history-title">History</span>
                <span class="history-counter">0 / 0</span>
            </div>
            <div class="history-toolbar">
                <button class="history-undo" title="Undo (Ctrl+Z)" disabled>
                    <span class="material-icons-round">undo</span>
                </button>
                <button class="history-redo" title="Redo (Ctrl+Y)" disabled>
                    <span class="material-icons-round">redo</span>
                </button>
                <button class="history-clear" title="Clear History">
                    <span class="material-icons-round">delete_sweep</span>
                </button>
            </div>
            <div class="history-list"></div>
        </div>
    `;
}

/**
 * Generate History Panel CSS
 */
export function generateHistoryPanelCSS() {
    return `
        .history-panel {
            display: flex;
            flex-direction: column;
            background: #1a1a1a;
            border-radius: 8px;
            overflow: hidden;
            height: 100%;
            max-height: 400px;
        }
        
        .history-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 15px;
            background: #222;
            border-bottom: 1px solid #333;
        }
        
        .history-header .material-icons-round {
            font-size: 18px;
            color: #8470ff;
        }
        
        .history-title {
            font-weight: 600;
            font-size: 13px;
            color: #ddd;
            flex: 1;
        }
        
        .history-counter {
            font-size: 11px;
            color: #666;
            font-family: monospace;
        }
        
        .history-toolbar {
            display: flex;
            gap: 4px;
            padding: 8px 10px;
            background: #1d1d1d;
            border-bottom: 1px solid #2a2a2a;
        }
        
        .history-toolbar button {
            flex: 1;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #252525;
            border: 1px solid #333;
            border-radius: 6px;
            color: #999;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .history-toolbar button:hover:not(:disabled) {
            background: #2a2a2a;
            border-color: #8470ff;
            color: #8470ff;
        }
        
        .history-toolbar button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        .history-toolbar button .material-icons-round {
            font-size: 18px;
        }
        
        .history-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }
        
        .history-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            margin-bottom: 2px;
            background: #222;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
            border: 1px solid transparent;
        }
        
        .history-item:hover {
            background: #282828;
            border-color: #3a3a3a;
        }
        
        .history-item.current {
            background: linear-gradient(135deg, rgba(132,112,255,0.15), rgba(132,112,255,0.05));
            border-color: #8470ff;
        }
        
        .history-item.current::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #8470ff;
            border-radius: 3px 0 0 3px;
        }
        
        .history-item.future {
            opacity: 0.5;
        }
        
        .history-item.future:hover {
            opacity: 0.8;
        }
        
        .history-icon {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #2a2a2a;
            border-radius: 6px;
            font-size: 16px;
            color: #888;
        }
        
        .history-item.current .history-icon {
            background: rgba(132,112,255,0.2);
            color: #8470ff;
        }
        
        .history-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .history-name {
            font-size: 12px;
            color: #ccc;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .history-item.current .history-name {
            color: #fff;
            font-weight: 500;
        }
        
        .history-time {
            font-size: 10px;
            color: #555;
            font-family: monospace;
        }
        
        /* Scrollbar */
        .history-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .history-list::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .history-list::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 3px;
        }
        
        .history-list::-webkit-scrollbar-thumb:hover {
            background: #444;
        }
    `;
}

/**
 * Initialize the history panel
 */
export function initHistoryPanel(container) {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }

    if (!container) {
        console.warn('[HistoryPanel] Container not found');
        return;
    }

    // Inject CSS if not present
    if (!document.querySelector('style[data-history-panel]')) {
        const style = document.createElement('style');
        style.dataset.historyPanel = 'true';
        style.textContent = generateHistoryPanelCSS();
        document.head.appendChild(style);
    }

    // Create panel
    container.innerHTML = generateHistoryPanelHTML();
    panelElement = container.querySelector('.history-panel');

    // Event listeners
    panelElement.querySelector('.history-undo').addEventListener('click', undo);
    panelElement.querySelector('.history-redo').addEventListener('click', redo);
    panelElement.querySelector('.history-clear').addEventListener('click', () => {
        if (confirm('Clear all history?')) {
            clearHistory();
            initHistory();
        }
    });

    // Click on history item to jump
    panelElement.querySelector('.history-list').addEventListener('click', (e) => {
        const item = e.target.closest('.history-item');
        if (item) {
            const index = parseInt(item.dataset.index, 10);
            goToState(index);
        }
    });

    // Initialize with first state
    if (historyStates.length === 0) {
        initHistory();
    } else {
        updatePanel();
    }

    console.log('[HistoryPanel] Initialized');
}

/**
 * Setup keyboard shortcuts
 */
export function setupHistoryKeyboard() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Z = Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }

        // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z = Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        }
    });
}

// Default export with all functions
export default {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    beginBatch,
    endBatch,
    goToState,
    getHistoryStatus,
    initHistory,
    initHistoryPanel,
    setupHistoryKeyboard,
    generateHistoryPanelHTML,
    generateHistoryPanelCSS
};
