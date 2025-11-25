/**
 * EditorView - Main editor integration component
 * Combines all editor components into a complete interface
 */

import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { EditorHeader } from './EditorHeader.js';
import { SlidesPanel } from './SlidesPanel.js';
import { SlideEditor } from './SlideEditor.js';
import { PropertiesPanel } from './PropertiesPanel.js';
import { LayerList } from './LayerList.js';
import { AnimationTimeline } from './AnimationTimeline.js';
import { ResponsiveEditor } from './ResponsiveEditor.js';
import { currentSlider, currentSlide, layers, actions } from '../services/state.js';
import { api } from '../services/api.js';
import { initKeyboardShortcuts, cleanupKeyboardShortcuts } from '../utils/keyboard.js';

export function EditorView({ sliderId, onBack }) {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSlider();
    }, [sliderId]);

    useEffect(() => {
        initKeyboardShortcuts();
        return () => cleanupKeyboardShortcuts();
    }, []);

    const loadSlider = async () => {
        setLoading(true);
        try {
            // Load slider
            const slider = await api.sliders.get(sliderId);
            actions.setCurrentSlider(slider);

            // Load slides
            const slidesData = await api.slides.list(sliderId);
            setSlides(slidesData);

            // Select first slide if available
            if (slidesData.length > 0) {
                handleSlideSelect(slidesData[0]);
            }
        } catch (error) {
            console.error('Failed to load slider:', error);
            alert('Failed to load slider');
        } finally {
            setLoading(false);
        }
    };

    const handleSlideSelect = async (slide) => {
        actions.setCurrentSlide(slide);
        // Layers will be loaded automatically by state.js
    };

    const handleSave = async () => {
        try {
            const slider = currentSlider.value;
            const slide = currentSlide.value;
            const currentLayers = layers.value;

            if (!slider || !slide) {
                alert('No slide selected');
                return;
            }

            // Show saving indicator
            const saveBtn = document.querySelector('.btn-save');
            if (saveBtn) {
                saveBtn.textContent = '💾 Saving...';
                saveBtn.disabled = true;
            }

            // Save slider settings
            await api.sliders.update(slider.id, {
                name: slider.name,
                alias: slider.alias,
                config: slider.config,
            });

            // Save slide settings
            await api.slides.update(slide.id, {
                background: slide.background,
                settings: slide.settings,
            });

            // Save all layers (update existing ones)
            for (const layer of currentLayers) {
                await api.layers.update(layer.id, {
                    type: layer.type,
                    content: layer.content,
                    settings: layer.settings,
                    position: layer.position,
                    animations: layer.animations,
                    responsiveSettings: layer.responsiveSettings,
                    order: layer.order,
                });
            }

            // Reset button
            if (saveBtn) {
                saveBtn.textContent = '✅ Saved!';
                setTimeout(() => {
                    saveBtn.textContent = '💾 Save';
                    saveBtn.disabled = false;
                }, 2000);
            }

            console.log('Slider saved successfully');
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save slider: ' + error.message);

            // Reset button on error
            const saveBtn = document.querySelector('.btn-save');
            if (saveBtn) {
                saveBtn.textContent = '💾 Save';
                saveBtn.disabled = false;
            }
        }
    };

    if (loading) {
        return html`
            <div class="editor-loading">
                <p>Loading editor...</p>
            </div>
        `;
    }

    return html`
        <div class="editor-view">
            <${EditorHeader} onBack=${onBack} onSave=${handleSave} />
            
            <div class="editor-main">
                <${SlidesPanel} 
                    slides=${slides} 
                    onSlideSelect=${handleSlideSelect}
                />
                
                <div class="editor-center">
                    <${SlideEditor} />
                    <${AnimationTimeline} />
                </div>
                
                <div class="editor-right">
                    <${PropertiesPanel} />
                    <${ResponsiveEditor} />
                    <${LayerList} />
                </div>
            </div>
        </div>
    `;
}
