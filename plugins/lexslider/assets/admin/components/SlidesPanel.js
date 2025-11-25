/**
 * SlidesPanel - Left panel showing slide thumbnails
 */

import { html } from 'https://esm.sh/htm/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import { currentSlide, actions } from '../services/state.js';

export function SlidesPanel({ slides, onSlideSelect }) {
    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = (e, slide) => {
        e.preventDefault();
        setContextMenu({ slide, x: e.clientX, y: e.clientY });
    };

    const closeContextMenu = () => setContextMenu(null);

    const handleDuplicate = async (slide) => {
        // TODO: Implement slide duplication
        console.log('Duplicate slide:', slide.id);
        closeContextMenu();
    };

    const handleDelete = async (slide) => {
        if (confirm('Delete this slide?')) {
            // TODO: Implement slide deletion
            console.log('Delete slide:', slide.id);
        }
        closeContextMenu();
    };

    return html`
        <div class="slides-panel" onClick=${closeContextMenu}>
            <div class="panel-header">
                <h3>Slides</h3>
            </div>

            <div class="slides-list">
                ${slides.map((slide, index) => html`
                    <div
                        key=${slide.id}
                        class=${`slide-item ${currentSlide.value?.id === slide.id ? 'active' : ''}`}
                        onClick=${() => onSlideSelect(slide)}
                        onContextMenu=${(e) => handleContextMenu(e, slide)}
                    >
                        <div class="slide-thumbnail">
                            <div class="thumbnail-placeholder">
                                Slide ${index + 1}
                            </div>
                        </div>
                        <div class="slide-info">
                            <div class="slide-title">${slide.title || `Slide ${index + 1}`}</div>
                            <div class="slide-meta">${slide.layers?.length || 0} layers</div>
                        </div>
                    </div>
                `)}
            </div>

            <button class="add-slide-btn">
                + Add Slide
            </button>

            ${contextMenu && html`
                <div 
                    class="context-menu"
                    style=${{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
                >
                    <button onClick=${() => handleDuplicate(contextMenu.slide)}>
                        Duplicate
                    </button>
                    <button onClick=${() => handleDelete(contextMenu.slide)}>
                        Delete
                    </button>
                </div>
            `}
        </div>
    `;
}
