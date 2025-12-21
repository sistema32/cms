/**
 * GridLayout.js - Row/Column grid layout for layers
 * Organize layers in responsive grid structures
 */

// Grid presets
export const GRID_PRESETS = {
    '1-col': { label: '1 Column', columns: 1, icon: 'view_stream' },
    '2-col': { label: '2 Columns', columns: 2, icon: 'view_column' },
    '3-col': { label: '3 Columns', columns: 3, icon: 'grid_view' },
    '4-col': { label: '4 Columns', columns: 4, icon: 'view_module' },
    '2-1': { label: '2/1 Split', template: '2fr 1fr', icon: 'view_sidebar' },
    '1-2': { label: '1/2 Split', template: '1fr 2fr', icon: 'view_sidebar' },
    '1-1-1': { label: '3 Equal', template: '1fr 1fr 1fr', icon: 'view_week' },
    '2-1-1': { label: '2/1/1 Split', template: '2fr 1fr 1fr', icon: 'dashboard' },
    '1-2-1': { label: '1/2/1 Split', template: '1fr 2fr 1fr', icon: 'dashboard' },
    'featured': { label: 'Featured', template: '2fr 1fr / 1fr 1fr', rows: 2, icon: 'featured_play_list' }
};

// Gap sizes
export const GAP_SIZES = {
    none: 0,
    xs: 5,
    sm: 10,
    md: 20,
    lg: 30,
    xl: 50
};

/**
 * Create a grid container
 */
export function createGridContainer(config = {}) {
    const {
        preset = '2-col',
        gap = 'md',
        padding = 20,
        align = 'stretch',
        justify = 'start',
        responsive = true
    } = config;

    const presetConfig = GRID_PRESETS[preset] || GRID_PRESETS['2-col'];
    const gapValue = GAP_SIZES[gap] ?? gap;

    return {
        type: 'grid',
        config: {
            preset,
            columns: presetConfig.columns,
            template: presetConfig.template,
            rows: presetConfig.rows,
            gap: gapValue,
            padding,
            align,
            justify,
            responsive
        },
        children: []
    };
}

/**
 * Create a row container
 */
export function createRow(config = {}) {
    const {
        gap = 'md',
        align = 'center',
        justify = 'start',
        wrap = true,
        reverse = false
    } = config;

    return {
        type: 'row',
        config: {
            gap: GAP_SIZES[gap] ?? gap,
            align,
            justify,
            wrap,
            reverse
        },
        children: []
    };
}

/**
 * Create a column container
 */
export function createColumn(config = {}) {
    const {
        width = 'auto',
        minWidth = null,
        maxWidth = null,
        grow = 0,
        shrink = 1,
        align = 'stretch'
    } = config;

    return {
        type: 'column',
        config: {
            width,
            minWidth,
            maxWidth,
            grow,
            shrink,
            align
        },
        children: []
    };
}

/**
 * Generate CSS for grid container
 */
export function generateGridCSS(grid, className = 'ss3-grid') {
    const { config } = grid;

    let gridTemplate = '';
    if (config.template) {
        gridTemplate = config.template;
    } else if (config.columns) {
        gridTemplate = `repeat(${config.columns}, 1fr)`;
    }

    let css = `
        .${className} {
            display: grid;
            grid-template-columns: ${gridTemplate};
            ${config.rows ? `grid-template-rows: repeat(${config.rows}, 1fr);` : ''}
            gap: ${config.gap}px;
            padding: ${config.padding}px;
            align-items: ${config.align};
            justify-content: ${config.justify};
            width: 100%;
            box-sizing: border-box;
        }
    `;

    // Responsive breakpoints
    if (config.responsive) {
        css += `
            @media (max-width: 991px) {
                .${className} {
                    grid-template-columns: repeat(${Math.min(config.columns || 2, 2)}, 1fr);
                }
            }
            
            @media (max-width: 767px) {
                .${className} {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    return css;
}

/**
 * Generate CSS for row
 */
export function generateRowCSS(row, className = 'ss3-row') {
    const { config } = row;

    return `
        .${className} {
            display: flex;
            flex-direction: ${config.reverse ? 'row-reverse' : 'row'};
            flex-wrap: ${config.wrap ? 'wrap' : 'nowrap'};
            gap: ${config.gap}px;
            align-items: ${config.align};
            justify-content: ${config.justify};
            width: 100%;
            box-sizing: border-box;
        }
        
        @media (max-width: 767px) {
            .${className} {
                flex-direction: column;
            }
        }
    `;
}

/**
 * Generate CSS for column
 */
export function generateColumnCSS(column, className = 'ss3-col') {
    const { config } = column;

    let widthCSS = '';
    if (config.width === 'auto') {
        widthCSS = 'flex: 1 1 auto;';
    } else if (typeof config.width === 'number') {
        widthCSS = `flex: 0 0 ${config.width}%;`;
    } else {
        widthCSS = `flex: ${config.grow} ${config.shrink} ${config.width};`;
    }

    return `
        .${className} {
            ${widthCSS}
            ${config.minWidth ? `min-width: ${config.minWidth};` : ''}
            ${config.maxWidth ? `max-width: ${config.maxWidth};` : ''}
            align-self: ${config.align};
            box-sizing: border-box;
        }
    `;
}

/**
 * Generate grid HTML
 */
export function generateGridHTML(grid, layersHTML = '') {
    const className = `ss3-grid ss3-grid-${grid.config.preset}`;

    return `
        <div class="${className}" 
             data-grid-preset="${grid.config.preset}"
             data-grid-gap="${grid.config.gap}">
            ${layersHTML}
        </div>
    `;
}

/**
 * Generate row HTML
 */
export function generateRowHTML(row, columnsHTML = '') {
    return `
        <div class="ss3-row" 
             data-row-gap="${row.config.gap}"
             data-row-align="${row.config.align}">
            ${columnsHTML}
        </div>
    `;
}

/**
 * Generate column HTML
 */
export function generateColumnHTML(column, contentHTML = '', index = 0) {
    return `
        <div class="ss3-col ss3-col-${index}" 
             data-col-width="${column.config.width}">
            ${contentHTML}
        </div>
    `;
}

/**
 * Convert layers to grid layout
 */
export function layersToGrid(layers, options = {}) {
    const {
        columns = 2,
        gap = 20,
        assignToColumns = true
    } = options;

    const grid = createGridContainer({ preset: `${columns}-col`, gap });

    if (assignToColumns) {
        // Create columns and distribute layers
        const colCount = columns;
        const layersPerCol = Math.ceil(layers.length / colCount);

        for (let i = 0; i < colCount; i++) {
            const col = createColumn();
            col.children = layers.slice(i * layersPerCol, (i + 1) * layersPerCol);
            grid.children.push(col);
        }
    } else {
        // Layers directly in grid (CSS Grid items)
        grid.children = layers;
    }

    return grid;
}

/**
 * Generate all grid layout CSS
 */
export function generateAllGridCSS() {
    let css = `
        /* Base grid styles */
        .ss3-grid {
            display: grid;
            width: 100%;
            box-sizing: border-box;
        }
        
        .ss3-row {
            display: flex;
            width: 100%;
            box-sizing: border-box;
        }
        
        .ss3-col {
            box-sizing: border-box;
        }
        
        /* Grid presets */
        .ss3-grid-1-col { grid-template-columns: 1fr; }
        .ss3-grid-2-col { grid-template-columns: repeat(2, 1fr); }
        .ss3-grid-3-col { grid-template-columns: repeat(3, 1fr); }
        .ss3-grid-4-col { grid-template-columns: repeat(4, 1fr); }
        .ss3-grid-2-1 { grid-template-columns: 2fr 1fr; }
        .ss3-grid-1-2 { grid-template-columns: 1fr 2fr; }
        .ss3-grid-1-1-1 { grid-template-columns: 1fr 1fr 1fr; }
        .ss3-grid-2-1-1 { grid-template-columns: 2fr 1fr 1fr; }
        .ss3-grid-1-2-1 { grid-template-columns: 1fr 2fr 1fr; }
        
        .ss3-grid-featured {
            grid-template-columns: 2fr 1fr;
            grid-template-rows: 1fr 1fr;
        }
        
        .ss3-grid-featured > *:first-child {
            grid-row: span 2;
        }
        
        /* Gap sizes */
        .ss3-grid[data-grid-gap="0"] { gap: 0; }
        .ss3-grid[data-grid-gap="5"] { gap: 5px; }
        .ss3-grid[data-grid-gap="10"] { gap: 10px; }
        .ss3-grid[data-grid-gap="20"] { gap: 20px; }
        .ss3-grid[data-grid-gap="30"] { gap: 30px; }
        .ss3-grid[data-grid-gap="50"] { gap: 50px; }
        
        .ss3-row[data-row-gap="0"] { gap: 0; }
        .ss3-row[data-row-gap="5"] { gap: 5px; }
        .ss3-row[data-row-gap="10"] { gap: 10px; }
        .ss3-row[data-row-gap="20"] { gap: 20px; }
        .ss3-row[data-row-gap="30"] { gap: 30px; }
        .ss3-row[data-row-gap="50"] { gap: 50px; }
        
        /* Row alignment */
        .ss3-row[data-row-align="start"] { align-items: flex-start; }
        .ss3-row[data-row-align="center"] { align-items: center; }
        .ss3-row[data-row-align="end"] { align-items: flex-end; }
        .ss3-row[data-row-align="stretch"] { align-items: stretch; }
        
        /* Column widths */
        .ss3-col[data-col-width="auto"] { flex: 1 1 auto; }
        .ss3-col[data-col-width="25"] { flex: 0 0 25%; }
        .ss3-col[data-col-width="33"] { flex: 0 0 33.333%; }
        .ss3-col[data-col-width="50"] { flex: 0 0 50%; }
        .ss3-col[data-col-width="66"] { flex: 0 0 66.666%; }
        .ss3-col[data-col-width="75"] { flex: 0 0 75%; }
        .ss3-col[data-col-width="100"] { flex: 0 0 100%; }
        
        /* Responsive */
        @media (max-width: 991px) {
            .ss3-grid-3-col,
            .ss3-grid-4-col,
            .ss3-grid-2-1-1,
            .ss3-grid-1-2-1 {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .ss3-grid-featured {
                grid-template-columns: 1fr;
                grid-template-rows: auto;
            }
            
            .ss3-grid-featured > *:first-child {
                grid-row: auto;
            }
        }
        
        @media (max-width: 767px) {
            .ss3-grid-2-col,
            .ss3-grid-3-col,
            .ss3-grid-4-col,
            .ss3-grid-2-1,
            .ss3-grid-1-2,
            .ss3-grid-1-1-1,
            .ss3-grid-2-1-1,
            .ss3-grid-1-2-1 {
                grid-template-columns: 1fr;
            }
            
            .ss3-row {
                flex-direction: column;
            }
            
            .ss3-col[data-col-width] {
                flex: 0 0 100%;
            }
        }
    `;

    return css;
}

/**
 * Grid layout picker HTML
 */
export function generateGridPickerHTML(selected = '2-col') {
    const presetsHTML = Object.entries(GRID_PRESETS).map(([key, preset]) => `
        <button class="grid-preset-btn ${key === selected ? 'active' : ''}" 
                data-preset="${key}"
                title="${preset.label}">
            <span class="material-icons-round">${preset.icon}</span>
        </button>
    `).join('');

    return `
        <div class="grid-layout-picker">
            <label>Grid Layout</label>
            <div class="grid-presets">${presetsHTML}</div>
            <div class="grid-options">
                <div class="form-group">
                    <label>Gap</label>
                    <select class="grid-gap-select">
                        ${Object.entries(GAP_SIZES).map(([k, v]) =>
        `<option value="${k}">${k} (${v}px)</option>`
    ).join('')}
                    </select>
                </div>
            </div>
        </div>
    `;
}

/**
 * Grid picker CSS
 */
export function generateGridPickerCSS() {
    return `
        .grid-layout-picker label {
            display: block;
            margin-bottom: 8px;
            font-size: 12px;
            color: #888;
        }
        
        .grid-presets {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }
        
        .grid-preset-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 6px;
            color: #666;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .grid-preset-btn:hover {
            border-color: #8470ff;
            color: #8470ff;
        }
        
        .grid-preset-btn.active {
            background: #8470ff;
            border-color: #8470ff;
            color: white;
        }
        
        .grid-options {
            border-top: 1px solid #333;
            padding-top: 12px;
        }
        
        .grid-gap-select {
            width: 100%;
            padding: 8px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 6px;
            color: #ddd;
        }
    `;
}

export default {
    GRID_PRESETS,
    GAP_SIZES,
    createGridContainer,
    createRow,
    createColumn,
    generateGridCSS,
    generateRowCSS,
    generateColumnCSS,
    generateGridHTML,
    generateRowHTML,
    generateColumnHTML,
    layersToGrid,
    generateAllGridCSS,
    generateGridPickerHTML,
    generateGridPickerCSS
};
