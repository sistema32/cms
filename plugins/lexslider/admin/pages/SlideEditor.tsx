import { html } from "https://esm.sh/htm@3.1.1/preact";
import { useState, useEffect } from "https://esm.sh/preact@10.19.3/hooks";
import { EnhancedSlideCanvas } from "../components/EnhancedCanvas.tsx";

/**
 * LexSlider - Visual Slide Editor
 * Drag-and-drop layer editor with live preview
 */

export function SlideEditor({ sliderId }) {
  const [slider, setSlider] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSlider();
  }, [sliderId]);

  async function loadSlider() {
    try {
      const response = await fetch(`/api/lexslider/sliders/${sliderId}`);
      const data = await response.json();
      setSlider(data);
      setSlides(data.slides || []);
    } catch (error) {
      console.error('Error loading slider:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addSlide() {
    try {
      const response = await fetch(`/api/lexslider/sliders/${sliderId}/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Slide ${slides.length + 1}`,
          background: { type: 'color', value: '#667eea' },
          layers: []
        })
      });
      const newSlide = await response.json();
      setSlides([...slides, newSlide]);
      setCurrentSlideIndex(slides.length);
    } catch (error) {
      alert('Error creating slide: ' + error.message);
    }
  }

  async function deleteSlide(slideId, index) {
    if (!confirm('¿Eliminar este slide?')) return;

    try {
      await fetch(`/api/lexslider/slides/${slideId}`, { method: 'DELETE' });
      const newSlides = slides.filter((_, i) => i !== index);
      setSlides(newSlides);
      if (currentSlideIndex >= newSlides.length) {
        setCurrentSlideIndex(Math.max(0, newSlides.length - 1));
      }
    } catch (error) {
      alert('Error deleting slide: ' + error.message);
    }
  }

  function addLayer(type) {
    const currentSlide = slides[currentSlideIndex];
    if (!currentSlide) return;

    const newLayer = {
      id: `layer-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      position: { x: 100, y: 100, width: 300, height: 100, zIndex: 1 },
      style: getDefaultStyle(type),
      animation: { type: 'fade', duration: 600, delay: 0 }
    };

    const updatedLayers = [...(currentSlide.layers || []), newLayer];
    updateSlide(currentSlideIndex, { layers: updatedLayers });
  }

  async function updateSlide(index, updates) {
    const slide = slides[index];
    const updatedSlide = { ...slide, ...updates };

    try {
      await fetch(`/api/lexslider/slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const newSlides = [...slides];
      newSlides[index] = updatedSlide;
      setSlides(newSlides);
    } catch (error) {
      console.error('Error updating slide:', error);
    }
  }

  function getDefaultContent(type) {
    switch (type) {
      case 'heading': return 'Heading Text';
      case 'text': return 'Your text here';
      case 'button': return 'Click Me';
      case 'image': return { src: 'https://via.placeholder.com/300x200', alt: 'Image' };
      default: return '';
    }
  }

  function getDefaultStyle(type) {
    switch (type) {
      case 'heading':
        return { color: '#fff', fontSize: '3rem', fontWeight: '700' };
      case 'text':
        return { color: '#fff', fontSize: '1.25rem' };
      case 'button':
        return { background: '#167bff', color: '#fff', padding: '12px 32px', borderRadius: '6px' };
      default:
        return {};
    }
  }

  if (loading) {
    return html`<div class="loading">Loading...</div>`;
  }

  if (!slider) {
    return html`<div class="error">Slider not found</div>`;
  }

  const currentSlide = slides[currentSlideIndex];

  return html`
    <div class="slide-editor">
      <!-- Header -->
      <div class="editor-header">
        <div class="editor-header-left">
          <a href="/admincp/lexslider" class="btn btn-secondary">← Back</a>
          <h1>${slider.name}</h1>
        </div>
        <div class="editor-header-right">
          <button onClick=${() => window.open(`/api/lexslider/render/${slider.id}`, '_blank')} class="btn btn-secondary">
            Preview
          </button>
        </div>
      </div>

      <div class="editor-layout">
        <!-- Left Sidebar: Slides -->
        <div class="editor-sidebar-left">
          <div class="sidebar-header">
            <h3>Slides</h3>
            <button onClick=${addSlide} class="btn btn-sm btn-primary">+ Add</button>
          </div>
          <div class="slides-list">
            ${slides.map((slide, index) => html`
              <div 
                key=${slide.id}
                class=${`slide-thumb ${index === currentSlideIndex ? 'active' : ''}`}
                onClick=${() => setCurrentSlideIndex(index)}
              >
                <div class="slide-thumb-preview">
                  <span>${index + 1}</span>
                </div>
                <div class="slide-thumb-info">
                  <p>${slide.title || `Slide ${index + 1}`}</p>
                  <button 
                    onClick=${(e) => { e.stopPropagation(); deleteSlide(slide.id, index); }}
                    class="btn-icon"
                  >×</button>
                </div>
              </div>
            `)}
          </div>
        </div>

        <!-- Center: Canvas -->
        <div class="editor-canvas">
          ${currentSlide ? html`
            <${EnhancedSlideCanvas}
              slide=${currentSlide}
              slider=${slider}
              onLayerSelect=${setSelectedLayer}
              selectedLayer=${selectedLayer}
              onUpdateSlide=${(updates) => updateSlide(currentSlideIndex, updates)}
            />
          ` : html`
            <div class="canvas-empty">
              <p>No slides yet</p>
              <button onClick=${addSlide} class="btn btn-primary">Create First Slide</button>
            </div>
          `}
        </div>

        <!-- Right Sidebar: Layer Tools -->
        <div class="editor-sidebar-right">
          <div class="sidebar-header">
            <h3>Add Layer</h3>
          </div>
          <div class="layer-tools">
            <button onClick=${() => addLayer('heading')} class="tool-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7h16M4 17h16M9 12h6"></path>
              </svg>
              Heading
            </button>
            <button onClick=${() => addLayer('text')} class="tool-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7V4h16v3M9 20h6M12 4v16"></path>
              </svg>
              Text
            </button>
            <button onClick=${() => addLayer('button')} class="tool-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="8" width="18" height="8" rx="2"></rect>
              </svg>
              Button
            </button>
            <button onClick=${() => addLayer('image')} class="tool-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Image
            </button>
          </div>

          ${selectedLayer && html`
            <${LayerProperties}
              layer=${selectedLayer}
              onUpdate=${(updates) => {
        const updatedLayers = currentSlide.layers.map(l =>
          l.id === selectedLayer.id ? { ...l, ...updates } : l
        );
        updateSlide(currentSlideIndex, { layers: updatedLayers });
      }}
              onDelete=${() => {
        const updatedLayers = currentSlide.layers.filter(l => l.id !== selectedLayer.id);
        updateSlide(currentSlideIndex, { layers: updatedLayers });
        setSelectedLayer(null);
      }}
            />
          `}
        </div>
      </div>
    </div>

    <style>
      .slide-editor {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f5f5f5;
      }

      .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
      }

      .editor-header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .editor-header h1 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .editor-layout {
        flex: 1;
        display: grid;
        grid-template-columns: 250px 1fr 300px;
        overflow: hidden;
      }

      .editor-sidebar-left,
      .editor-sidebar-right {
        background: #fff;
        border-right: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
      }

      .editor-sidebar-right {
        border-right: none;
        border-left: 1px solid #e5e7eb;
      }

      .sidebar-header {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .sidebar-header h3 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
        text-transform: uppercase;
        color: #6b7280;
      }

      .slides-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
      }

      .slide-thumb {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
      }

      .slide-thumb:hover {
        background: #f9fafb;
      }

      .slide-thumb.active {
        background: #eff6ff;
        border-color: #167bff;
      }

      .slide-thumb-preview {
        aspect-ratio: 16/9;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .slide-thumb-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .slide-thumb-info p {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .btn-icon {
        width: 24px;
        height: 24px;
        border: none;
        background: #fee;
        color: #f31260;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.25rem;
        line-height: 1;
      }

      .editor-canvas {
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        overflow: auto;
      }

      .canvas-empty {
        text-align: center;
      }

      .layer-tools {
        padding: 1rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }

      .tool-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .tool-btn:hover {
        background: #f9fafb;
        border-color: #167bff;
      }
    </style>
  `;
}

// Layer Properties Panel
function LayerProperties({ layer, onUpdate, onDelete }) {
  return html`
    <div class="layer-properties">
      <div class="sidebar-header">
        <h3>Layer Properties</h3>
        <button onClick=${onDelete} class="btn-icon">×</button>
      </div>

      <div class="properties-content">
        <div class="property-group">
          <label>Content</label>
          ${layer.type === 'image' ? html`
            <input
              type="text"
              value=${layer.content.src}
              onInput=${(e) => onUpdate({ content: { ...layer.content, src: e.target.value } })}
              placeholder="Image URL"
            />
          ` : html`
            <input
              type="text"
              value=${layer.content}
              onInput=${(e) => onUpdate({ content: e.target.value })}
            />
          `}
        </div>

        <div class="property-group">
          <label>Position</label>
          <div class="property-row">
            <input
              type="number"
              value=${layer.position.x}
              onInput=${(e) => onUpdate({ position: { ...layer.position, x: parseInt(e.target.value) } })}
              placeholder="X"
            />
            <input
              type="number"
              value=${layer.position.y}
              onInput=${(e) => onUpdate({ position: { ...layer.position, y: parseInt(e.target.value) } })}
              placeholder="Y"
            />
          </div>
        </div>

        <div class="property-group">
          <label>Size</label>
          <div class="property-row">
            <input
              type="number"
              value=${layer.position.width}
              onInput=${(e) => onUpdate({ position: { ...layer.position, width: parseInt(e.target.value) } })}
              placeholder="Width"
            />
            <input
              type="number"
              value=${layer.position.height}
              onInput=${(e) => onUpdate({ position: { ...layer.position, height: parseInt(e.target.value) } })}
              placeholder="Height"
            />
          </div>
        </div>

        <div class="property-group">
          <label>Animation</label>
          <select
            value=${layer.animation?.type || 'fade'}
            onChange=${(e) => onUpdate({ animation: { ...layer.animation, type: e.target.value } })}
          >
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="slide-left">Slide Left</option>
            <option value="slide-right">Slide Right</option>
            <option value="slide-up">Slide Up</option>
            <option value="slide-down">Slide Down</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>
      </div>
    </div>

    <style>
      .layer-properties {
        display: flex;
        flex-direction: column;
        border-top: 1px solid #e5e7eb;
      }

      .properties-content {
        padding: 1rem;
        overflow-y: auto;
      }

      .property-group {
        margin-bottom: 1rem;
      }

      .property-group label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
        margin-bottom: 0.5rem;
      }

      .property-group input,
      .property-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .property-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
    </style>
  `;
}
