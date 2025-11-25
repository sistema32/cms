/**
 * LexSlider Editor Utilities
 * Undo/Redo, Snap-to-Grid, and other editor helpers
 */

export class UndoRedoManager {
    private history: any[] = [];
    private currentIndex: number = -1;
    private maxHistory: number = 50;

    push(state: any) {
        // Remove any states after current index
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add new state
        this.history.push(JSON.parse(JSON.stringify(state)));
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    undo(): any | null {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }

    redo(): any | null {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }

    canUndo(): boolean {
        return this.currentIndex > 0;
    }

    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
}

export interface SnapToGridOptions {
    enabled: boolean;
    gridSize: number;
}

export function snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
}

export function snapPositionToGrid(
    position: { x: number; y: number },
    options: SnapToGridOptions
): { x: number; y: number } {
    if (!options.enabled) return position;

    return {
        x: snapToGrid(position.x, options.gridSize),
        y: snapToGrid(position.y, options.gridSize)
    };
}

export function snapSizeToGrid(
    size: { width: number; height: number },
    options: SnapToGridOptions
): { width: number; height: number } {
    if (!options.enabled) return size;

    return {
        width: snapToGrid(size.width, options.gridSize),
        height: snapToGrid(size.height, options.gridSize)
    };
}

export interface KeyboardShortcuts {
    undo: string;
    redo: string;
    delete: string;
    duplicate: string;
    selectAll: string;
    deselect: string;
    save: string;
}

export const defaultShortcuts: KeyboardShortcuts = {
    undo: 'ctrl+z',
    redo: 'ctrl+shift+z',
    delete: 'delete',
    duplicate: 'ctrl+d',
    selectAll: 'ctrl+a',
    deselect: 'escape',
    save: 'ctrl+s'
};

export function parseShortcut(shortcut: string): {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    key: string;
} {
    const parts = shortcut.toLowerCase().split('+');
    return {
        ctrl: parts.includes('ctrl'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
        key: parts[parts.length - 1]
    };
}

export function matchesShortcut(
    event: KeyboardEvent,
    shortcut: string
): boolean {
    const parsed = parseShortcut(shortcut);

    return (
        event.ctrlKey === parsed.ctrl &&
        event.shiftKey === parsed.shift &&
        event.altKey === parsed.alt &&
        event.key.toLowerCase() === parsed.key
    );
}

export interface ResizeHandle {
    position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
    cursor: string;
}

export const resizeHandles: ResizeHandle[] = [
    { position: 'nw', cursor: 'nw-resize' },
    { position: 'n', cursor: 'n-resize' },
    { position: 'ne', cursor: 'ne-resize' },
    { position: 'e', cursor: 'e-resize' },
    { position: 'se', cursor: 'se-resize' },
    { position: 's', cursor: 's-resize' },
    { position: 'sw', cursor: 'sw-resize' },
    { position: 'w', cursor: 'w-resize' }
];

export function calculateResizePosition(
    handle: string,
    startPos: { x: number; y: number; width: number; height: number },
    delta: { x: number; y: number }
): { x: number; y: number; width: number; height: number } {
    let { x, y, width, height } = startPos;

    switch (handle) {
        case 'nw':
            x += delta.x;
            y += delta.y;
            width -= delta.x;
            height -= delta.y;
            break;
        case 'n':
            y += delta.y;
            height -= delta.y;
            break;
        case 'ne':
            y += delta.y;
            width += delta.x;
            height -= delta.y;
            break;
        case 'e':
            width += delta.x;
            break;
        case 'se':
            width += delta.x;
            height += delta.y;
            break;
        case 's':
            height += delta.y;
            break;
        case 'sw':
            x += delta.x;
            width -= delta.x;
            height += delta.y;
            break;
        case 'w':
            x += delta.x;
            width -= delta.x;
            break;
    }

    // Ensure minimum size
    const minSize = 20;
    if (width < minSize) {
        if (handle.includes('w')) x -= minSize - width;
        width = minSize;
    }
    if (height < minSize) {
        if (handle.includes('n')) y -= minSize - height;
        height = minSize;
    }

    return { x, y, width, height };
}
