/**
 * LayerGroups.js - Layer grouping with parent-child relationships
 * Allows grouping layers for easier management and synchronized transforms
 */

/**
 * Create a new layer group
 */
export function createGroup(name = 'Group') {
    return {
        id: `group_${Date.now()}`,
        type: 'group',
        name,
        children: [],
        style: {
            left: '0%',
            top: '0%',
            width: 'auto',
            height: 'auto',
            zIndex: 1
        },
        collapsed: false,
        locked: false,
        hidden: false
    };
}

/**
 * Add layer to group
 */
export function addToGroup(group, layer) {
    if (!group.children) group.children = [];

    // Store original position for offset calculation
    layer.groupOffset = {
        left: layer.style.left,
        top: layer.style.top
    };
    layer.parentGroup = group.id;

    group.children.push(layer);
    return group;
}

/**
 * Remove layer from group
 */
export function removeFromGroup(group, layerId) {
    if (!group.children) return group;

    const index = group.children.findIndex(l => l.id === layerId);
    if (index !== -1) {
        const layer = group.children[index];
        delete layer.parentGroup;
        delete layer.groupOffset;
        group.children.splice(index, 1);
    }

    return group;
}

/**
 * Ungroup all layers
 */
export function ungroup(group, layers) {
    const ungroupedLayers = [];

    group.children?.forEach(layer => {
        delete layer.parentGroup;
        delete layer.groupOffset;
        ungroupedLayers.push(layer);
    });

    // Remove group from layers array
    const groupIndex = layers.findIndex(l => l.id === group.id);
    if (groupIndex !== -1) {
        layers.splice(groupIndex, 1, ...ungroupedLayers);
    }

    return layers;
}

/**
 * Get all layers in a group (recursive)
 */
export function getGroupLayers(group) {
    const allLayers = [];

    function collect(item) {
        if (item.type === 'group' && item.children) {
            item.children.forEach(collect);
        } else {
            allLayers.push(item);
        }
    }

    collect(group);
    return allLayers;
}

/**
 * Apply transform to all group children
 */
export function transformGroup(group, transform) {
    if (!group.children) return;

    group.children.forEach(layer => {
        // Apply group transform
        if (transform.x !== undefined) {
            const currentLeft = parseFloat(layer.style.left) || 0;
            layer.style.left = `${currentLeft + transform.x}%`;
        }
        if (transform.y !== undefined) {
            const currentTop = parseFloat(layer.style.top) || 0;
            layer.style.top = `${currentTop + transform.y}%`;
        }
        if (transform.scale !== undefined) {
            const currentScale = parseFloat(layer.style.transform?.match(/scale\(([\d.]+)\)/)?.[1]) || 1;
            layer.style.transform = `scale(${currentScale * transform.scale})`;
        }
        if (transform.rotate !== undefined) {
            const currentRotate = parseFloat(layer.style.transform?.match(/rotate\(([\d.]+)deg\)/)?.[1]) || 0;
            layer.style.transform = (layer.style.transform || '') + ` rotate(${currentRotate + transform.rotate}deg)`;
        }

        // Recurse for nested groups
        if (layer.type === 'group') {
            transformGroup(layer, transform);
        }
    });
}

/**
 * Toggle group visibility
 */
export function toggleGroupVisibility(group, hidden) {
    group.hidden = hidden;

    group.children?.forEach(layer => {
        layer.hidden = hidden;
        if (layer.type === 'group') {
            toggleGroupVisibility(layer, hidden);
        }
    });
}

/**
 * Toggle group lock
 */
export function toggleGroupLock(group, locked) {
    group.locked = locked;

    group.children?.forEach(layer => {
        layer.locked = locked;
        if (layer.type === 'group') {
            toggleGroupLock(layer, locked);
        }
    });
}

/**
 * Get group bounding box
 */
export function getGroupBounds(group, containerWidth, containerHeight) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    const layers = getGroupLayers(group);

    layers.forEach(layer => {
        const left = parseFloat(layer.style.left) / 100 * containerWidth;
        const top = parseFloat(layer.style.top) / 100 * containerHeight;
        const width = parseFloat(layer.style.width) || 100;
        const height = parseFloat(layer.style.height) || 100;

        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + width);
        maxY = Math.max(maxY, top + height);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Generate layer list HTML with groups
 */
export function generateLayerListHTML(layers) {
    function renderLayer(layer, depth = 0) {
        const indent = depth * 20;
        const isGroup = layer.type === 'group';

        if (isGroup) {
            return `
                <div class="layer-group ${layer.collapsed ? 'collapsed' : ''}" data-id="${layer.id}" style="padding-left: ${indent}px;">
                    <div class="layer-group-header">
                        <button class="group-toggle">
                            <span class="material-icons-round">${layer.collapsed ? 'chevron_right' : 'expand_more'}</span>
                        </button>
                        <span class="material-icons-round group-icon">folder</span>
                        <span class="group-name">${layer.name}</span>
                        <div class="layer-actions">
                            <button class="layer-lock ${layer.locked ? 'active' : ''}" title="Lock">
                                <span class="material-icons-round">${layer.locked ? 'lock' : 'lock_open'}</span>
                            </button>
                            <button class="layer-visibility ${layer.hidden ? 'active' : ''}" title="Visibility">
                                <span class="material-icons-round">${layer.hidden ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>
                    <div class="layer-group-children">
                        ${layer.children?.map(child => renderLayer(child, depth + 1)).join('') || ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="layer-item" data-id="${layer.id}" style="padding-left: ${indent}px;">
                <span class="material-icons-round layer-type-icon">${getLayerIcon(layer.type)}</span>
                <span class="layer-name">${layer.content?.text || layer.type}</span>
                <div class="layer-actions">
                    <button class="layer-lock ${layer.locked ? 'active' : ''}" title="Lock">
                        <span class="material-icons-round">${layer.locked ? 'lock' : 'lock_open'}</span>
                    </button>
                    <button class="layer-visibility ${layer.hidden ? 'active' : ''}" title="Visibility">
                        <span class="material-icons-round">${layer.hidden ? 'visibility_off' : 'visibility'}</span>
                    </button>
                </div>
            </div>
        `;
    }

    return layers.map(layer => renderLayer(layer)).join('');
}

function getLayerIcon(type) {
    const icons = {
        heading: 'title',
        text: 'text_fields',
        button: 'smart_button',
        image: 'image',
        video: 'videocam',
        icon: 'emoji_emotions',
        shape: 'category',
        group: 'folder'
    };
    return icons[type] || 'layers';
}

/**
 * Generate group CSS
 */
export function generateGroupCSS() {
    return `
        .layer-group {
            border-left: 2px solid #333;
            margin-left: 10px;
        }
        
        .layer-group-header {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 10px;
            background: #1a1a1a;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .layer-group-header:hover {
            background: #222;
        }
        
        .layer-group.selected > .layer-group-header {
            background: rgba(132, 112, 255, 0.2);
            border-left: 2px solid #8470ff;
        }
        
        .group-toggle {
            background: none;
            border: none;
            color: #666;
            padding: 0;
            cursor: pointer;
            display: flex;
        }
        
        .group-icon {
            color: #f5a623;
            font-size: 18px;
        }
        
        .group-name {
            flex: 1;
            font-size: 13px;
            color: #ddd;
        }
        
        .layer-group-children {
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .layer-group.collapsed .layer-group-children {
            max-height: 0;
        }
        
        .layer-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 10px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .layer-item:hover {
            background: #1a1a1a;
        }
        
        .layer-item.selected {
            background: rgba(132, 112, 255, 0.2);
            border-left: 2px solid #8470ff;
        }
        
        .layer-type-icon {
            font-size: 16px;
            color: #666;
        }
        
        .layer-name {
            flex: 1;
            font-size: 12px;
            color: #aaa;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .layer-actions {
            display: flex;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .layer-item:hover .layer-actions,
        .layer-group-header:hover .layer-actions {
            opacity: 1;
        }
        
        .layer-lock,
        .layer-visibility {
            background: none;
            border: none;
            color: #666;
            padding: 2px;
            cursor: pointer;
            display: flex;
        }
        
        .layer-lock:hover,
        .layer-visibility:hover {
            color: #8470ff;
        }
        
        .layer-lock.active,
        .layer-visibility.active {
            color: #ff6b6b;
        }
    `;
}

export default {
    createGroup,
    addToGroup,
    removeFromGroup,
    ungroup,
    getGroupLayers,
    transformGroup,
    toggleGroupVisibility,
    toggleGroupLock,
    getGroupBounds,
    generateLayerListHTML,
    generateGroupCSS
};
