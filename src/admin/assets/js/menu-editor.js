/**
 * Menu Editor Script
 * Modernised drag & drop experience for adding and organising menu items.
 * Depends on jQuery and Nestable2 (already loaded by the page).
 */

$(document).ready(function () {
    if (window.__MENU_EDITOR_INITIALIZED__) return;
    window.__MENU_EDITOR_INITIALIZED__ = true;

    const typeBadge = (type) => {
        switch (type) {
            case 'custom': return 'Enlace';
            case 'page': return 'Página';
            case 'post': return 'Entrada';
            case 'category': return 'Categoría';
            default: return type || 'Elemento';
        }
    };

    const renderItem = (item) => {
        const safeId = item.id || 'new-' + Date.now() + Math.random();
        const badge = typeBadge(item.type);
        const cssId = item.cssId || '';
        const cssClass = item.cssClass || '';
        const target = item.target || '_self';
        const title = item.title || '';
        return `
            <li class="dd-item" 
                data-id="${safeId}" 
                data-label="${item.label}" 
                data-url="${item.url}"
                data-type="${item.type}"
                data-content-id="${item.contentId || ''}"
                data-category-id="${item.categoryId || ''}"
                data-css-id="${cssId}"
                data-css-class="${cssClass}"
                data-target="${target}"
                data-title="${title}"
            >
                <div class="item-card">
                    <div class="drag-handle dd-handle" aria-label="Arrastrar">
                        <span class="grip-dots" aria-hidden="true">⋮⋮</span>
                    </div>
                    <div class="item-main">
                        <div class="item-title">
                            <span class="item-label">${item.label}</span>
                            <span class="item-type-badge">${badge}</span>
                        </div>
                        <div class="item-actions dd-nodrag">
                            <button type="button" class="pill-btn ghost edit-item dd-nodrag" aria-label="Editar elemento">Opciones</button>
                            <button type="button" class="remove-item dd-nodrag" aria-label="Eliminar elemento">&times;</button>
                        </div>
                    </div>
                </div>
                <div class="item-settings dd-nodrag" hidden>
                    <div class="form-row">
                        <label>Etiqueta</label>
                        <input type="text" class="item-input item-label-input" value="${item.label}">
                    </div>
                    <div class="form-row">
                        <label>URL</label>
                        <input type="text" class="item-input item-url-input" value="${item.url}">
                    </div>
                    <div class="form-row">
                        <label>Título (tooltip)</label>
                        <input type="text" class="item-input item-title-input" value="${title}">
                    </div>
                    <div class="form-row two-col">
                        <div>
                            <label>CSS id</label>
                            <input type="text" class="item-input item-css-id-input" value="${cssId}">
                        </div>
                        <div>
                            <label>CSS class</label>
                            <input type="text" class="item-input item-css-class-input" value="${cssClass}">
                        </div>
                    </div>
                    <div class="form-row">
                        <label>Destino</label>
                        <select class="item-input item-target-input">
                            <option value="_self"${target === "_self" ? " selected" : ""}>Misma pestaña</option>
                            <option value="_blank"${target === "_blank" ? " selected" : ""}>Nueva pestaña</option>
                        </select>
                    </div>
                </div>
            </li>
        `;
    };

    const $menuRoot = $('#menu-root');
    const $nestable = $('#menu-nestable');
    const $dropHelper = $('#menu-drop-helper');
    const $stage = $('.menu-stage');

    const reinitNestable = () => {
        try { $nestable.nestable('destroy'); } catch (_e) { /* ignore */ }
        $nestable.nestable({ group: 1, maxDepth: 5, handleClass: 'drag-handle', noDragClass: 'dd-nodrag' });
        $nestable.find('.dd-empty').remove(); // clean default placeholder
    };

    const inferType = (item) => item.type || (item.contentId ? 'page' : (item.categoryId ? 'category' : 'custom'));

    // Hydrate initial tree
    if (window.INITIAL_MENU_ITEMS && window.INITIAL_MENU_ITEMS.length > 0) {
        const buildHtml = (items, parentId = null) => {
            return items
                .filter(i => (i.parentId ?? null) === parentId)
                .map((child) => {
                    const type = inferType(child);
                    const childrenHtml = buildHtml(items, child.id);
                    return `
                        <li class="dd-item" 
                            data-id="${child.id}" 
                            data-label="${child.label}" 
                            data-url="${child.url}"
                            data-type="${type}" 
                            data-content-id="${child.contentId || ''}"
                            data-category-id="${child.categoryId || ''}"
                            data-css-id="${child.cssId || ''}"
                            data-css-class="${child.cssClass || ''}"
                            data-target="${child.target || '_self'}"
                            data-title="${child.title || ''}"
                        >
                            <div class="item-card">
                                <div class="drag-handle dd-handle" aria-label="Arrastrar">
                                    <span class="grip-dots" aria-hidden="true">⋮⋮</span>
                                </div>
                                <div class="item-main">
                                    <div class="item-title">
                                        <span class="item-label">${child.label}</span>
                                        <span class="item-type-badge">${typeBadge(type)}</span>
                                    </div>
                                    <div class="item-actions dd-nodrag">
                                        <button type="button" class="pill-btn ghost edit-item dd-nodrag" aria-label="Editar elemento">Opciones</button>
                                        <button type="button" class="remove-item dd-nodrag" aria-label="Eliminar elemento">&times;</button>
                                    </div>
                                </div>
                            </div>
                            <div class="item-settings dd-nodrag" hidden>
                                <div class="form-row">
                                    <label>Etiqueta</label>
                                    <input type="text" class="item-input item-label-input" value="${child.label}">
                                </div>
                                <div class="form-row">
                                    <label>URL</label>
                                    <input type="text" class="item-input item-url-input" value="${child.url}">
                                </div>
                                <div class="form-row">
                                    <label>Título (tooltip)</label>
                                    <input type="text" class="item-input item-title-input" value="${child.title || ""}">
                                </div>
                                <div class="form-row two-col">
                                    <div>
                                        <label>CSS id</label>
                                        <input type="text" class="item-input item-css-id-input" value="${child.cssId || ""}">
                                    </div>
                                    <div>
                                        <label>CSS class</label>
                                        <input type="text" class="item-input item-css-class-input" value="${child.cssClass || ""}">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <label>Destino</label>
                                    <select class="item-input item-target-input">
                                        <option value="_self"${(child.target || "_self") === "_self" ? " selected" : ""}>Misma pestaña</option>
                                        <option value="_blank"${(child.target || "_self") === "_blank" ? " selected" : ""}>Nueva pestaña</option>
                                    </select>
                                </div>
                            </div>
                            ${childrenHtml ? `<ol class="dd-list">${childrenHtml}</ol>` : ''}
                        </li>
                    `;
                }).join('');
        };

        $menuRoot.html(buildHtml(window.INITIAL_MENU_ITEMS, null));
    }

    reinitNestable();

    // Remove item
    $(document).on('click', '.remove-item', function (e) {
        e.preventDefault();
        if (confirm('¿Eliminar elemento?')) {
            $(this).closest('.dd-item').remove();
            reinitNestable();
        }
    });

    // Toggle item settings
    $(document).on('click', '.edit-item', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const $item = $(this).closest('.dd-item');
        const $panel = $item.children('.item-settings');
        const isHidden = $panel.attr('hidden') !== undefined;
        if (isHidden) {
            $panel.removeAttr('hidden');
        } else {
            $panel.attr('hidden', true);
        }
    });

    // Evitar que botones/inputs internos disparen drag
    $(document).on('mousedown', '.edit-item, .item-settings input, .item-settings select, .item-settings button', function (e) {
        e.stopPropagation();
    });

    // Sync inputs to dataset and handle label
    $(document).on('input change', '.item-settings .item-input', function () {
        const $item = $(this).closest('.dd-item');
        const label = $item.find('.item-label-input').val() || '';
        const url = $item.find('.item-url-input').val() || '';
        const title = $item.find('.item-title-input').val() || '';
        const cssId = $item.find('.item-css-id-input').val() || '';
        const cssClass = $item.find('.item-css-class-input').val() || '';
        const target = $item.find('.item-target-input').val() || '_self';

        $item.attr('data-label', label);
        $item.attr('data-url', url);
        $item.attr('data-title', title);
        $item.attr('data-css-id', cssId);
        $item.attr('data-css-class', cssClass);
        $item.attr('data-target', target);

        $item.find('.item-label').text(label || 'Elemento');
    });

    const buildItemFromElement = (el) => {
        const node = el instanceof HTMLElement ? el : el.currentTarget;
        return {
            label: node.getAttribute('data-title') || 'Elemento',
            url: node.getAttribute('data-url') || '#',
            type: node.getAttribute('data-type') || 'custom',
            contentId: node.getAttribute('data-content-id') || '',
            categoryId: node.getAttribute('data-category-id') || ''
        };
    };

    const appendItem = (item) => {
        $menuRoot.append(renderItem(item));
        reinitNestable();
    };

    // Quick add buttons
    $(document).on('click', '.add-item-btn', function (e) {
        e.preventDefault();
        appendItem(buildItemFromElement(e.currentTarget));
    });

    // Custom link form helpers
    const customPayload = () => ({
        label: ($('#custom-label').val() || '').toString().trim() || 'Nuevo enlace',
        url: ($('#custom-url').val() || '').toString().trim() || '#',
        type: 'custom',
        contentId: '',
        categoryId: ''
    });

    const addCustomLink = () => {
        const payload = customPayload();
        if (!payload.url || !payload.label) {
            alert("URL y texto del enlace son obligatorios");
            return;
        }
        appendItem(payload);
        $('#custom-url').val('http://');
        $('#custom-label').val('');
    };

    $(document).on('click', '#btn-add-custom', function (e) {
        e.preventDefault();
        addCustomLink();
    });

    // Drag & drop from palette into canvas
    $(document).on('dragstart', '.palette-item[draggable="true"]', function (e) {
        const data = buildItemFromElement(this);
        const dt = e.originalEvent.dataTransfer;
        if (!dt) return;
        dt.effectAllowed = 'copy';
        dt.setData('application/json', JSON.stringify(data));
        dt.setData('text/plain', data.label);
        $dropHelper.addClass('active');
        $nestable.addClass('drop-highlight');
    });

    $(document).on('dragend', '.palette-item[draggable="true"]', function () {
        $dropHelper.removeClass('active');
        $nestable.removeClass('drop-highlight');
    });

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        $nestable.addClass('drop-highlight');
        $dropHelper.addClass('active');
        const dt = e.originalEvent?.dataTransfer;
        if (dt) dt.dropEffect = 'copy';
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        $nestable.removeClass('drop-highlight');
        $dropHelper.removeClass('active');
    };

    let dropLocked = false;
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropLocked) return;
        dropLocked = true;
        setTimeout(() => { dropLocked = false; }, 35);
        handleDragLeave(e);
        const payload = e.originalEvent?.dataTransfer?.getData('application/json');
        if (payload) {
            try {
                appendItem(JSON.parse(payload));
            } catch (err) {
                console.error('No se pudo agregar elemento arrastrado', err);
            }
        }
    };

    // Solo escuchar en el contenedor interactivo y el helper para evitar duplicados por burbujeo.
    [$nestable, $dropHelper].forEach(($el) => {
        $el.on('dragover', handleDragOver);
        $el.on('dragleave', handleDragLeave);
        $el.on('drop', handleDrop);
    });

    // Allow dragging the custom button with current values
    $('#btn-add-custom').attr('draggable', 'true');
    $(document).on('dragstart', '#btn-add-custom', function (e) {
        const data = customPayload();
        const dt = e.originalEvent.dataTransfer;
        if (!dt) return;
        dt.effectAllowed = 'copy';
        dt.setData('application/json', JSON.stringify(data));
        dt.setData('text/plain', data.label);
        $dropHelper.addClass('active');
    });

    // Canvas controls
    $('#expandAllBtn').on('click', function () {
        $nestable.nestable('expandAll');
    });
    $('#collapseAllBtn').on('click', function () {
        $nestable.nestable('collapseAll');
    });
    $('#clearMenuBtn').on('click', function () {
        if (confirm('Esto eliminará todos los elementos del menú. ¿Continuar?')) {
            $menuRoot.empty();
            reinitNestable();
        }
    });

    // Save Menu (metadata first, then items)
    $('#saveMenuBtn').on('click', async function () {
        const saveSettings = async () => {
            const form = document.getElementById('menuSettingsForm');
            if (!form) return true;
            const action = form.getAttribute('action') || '';
            const method = (form.getAttribute('method') || 'POST').toUpperCase();
            const body = new FormData(form);
            try {
                const res = await fetch(action, { method, body, redirect: 'follow' });
                if (!res.ok) throw new Error(res.statusText);
                return true;
            } catch (err) {
                alert('Error al guardar ajustes: ' + (err?.message || ''));
                return false;
            }
        };

        const settingsOk = await saveSettings();
        if (!settingsOk) return;

        const flatList = [];
        const process = ($list, parentTempId = null) => {
            $list.children('.dd-item').each(function (index) {
                const $el = $(this);
                const tempId = 'temp-' + Date.now() + '-' + Math.random();

                flatList.push({
                    tempId: tempId,
                    parentId: parentTempId,
                    order: index,
                    label: $el.data('label'),
                    url: $el.data('url'),
                    type: $el.data('type'),
                    contentId: $el.data('content-id'),
                    categoryId: $el.data('category-id'),
                    title: $el.data('title'),
                    cssId: $el.data('css-id'),
                    cssClass: $el.data('css-class'),
                    target: $el.data('target') || '_self'
                });

                const $sublist = $el.children('.dd-list');
                if ($sublist.length) {
                    process($sublist, tempId);
                }
            });
        };

        process($menuRoot);

        $.ajax({
            url: window.ADMIN_PATH + '/appearance/menus/' + window.MENU_ID + '/items',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ items: flatList }),
            success: function () {
                alert('Menú guardado exitosamente');
                window.location.reload();
            },
            error: function (err) {
                alert('Error al guardar: ' + err.statusText);
            }
        });
    });

});
