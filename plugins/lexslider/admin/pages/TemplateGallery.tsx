import { html } from "https://esm.sh/htm@3.1.1/preact";
import { useState } from "https://esm.sh/preact@10.19.3/hooks";
import { templates, getAllCategories } from "../../lib/templates.ts";

/**
 * Template Gallery Page
 * Browse and use pre-made slider templates
 */

export function TemplateGallery() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const categories = ['all', ...getAllCategories()];

    const filteredTemplates = selectedCategory === 'all'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    async function useTemplate(template) {
        try {
            // Create slider from template
            const response = await fetch('/api/lexslider/sliders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: template.name,
                    width: template.config.slider.width,
                    height: template.config.slider.height,
                    settings: template.config.slider.settings
                })
            });

            if (!response.ok) throw new Error('Failed to create slider');
            const slider = await response.json();

            // Create slides from template
            for (const slideConfig of template.config.slides) {
                await fetch(`/api/lexslider/sliders/${slider.id}/slides`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        background: slideConfig.background,
                        layers: slideConfig.layers
                    })
                });
            }

            alert('Template created successfully!');
            window.location.href = `/admincp/lexslider/slides/${slider.id}`;
        } catch (error) {
            alert('Error creating template: ' + error.message);
        }
    }

    return html`
    <div class="template-gallery">
      <div class="gallery-header">
        <h1>Slider Templates</h1>
        <p>Choose a template to get started quickly</p>
      </div>

      <div class="gallery-filters">
        ${categories.map(cat => html`
          <button
            key=${cat}
            class=${`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick=${() => setSelectedCategory(cat)}
          >
            ${cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        `)}
      </div>

      <div class="template-grid">
        ${filteredTemplates.map(template => html`
          <div key=${template.id} class="template-card">
            <div class="template-preview">
              <div class="template-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
            </div>
            <div class="template-info">
              <h3>${template.name}</h3>
              <p>${template.description}</p>
              <div class="template-meta">
                <span class="badge">${template.category}</span>
                <span class="slides-count">${template.config.slides.length} slides</span>
              </div>
            </div>
            <div class="template-actions">
              <button onClick=${() => useTemplate(template)} class="btn btn-primary btn-block">
                Use Template
              </button>
            </div>
          </div>
        `)}
      </div>
    </div>

    <style>
      .template-gallery {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .gallery-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .gallery-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
      }

      .gallery-header p {
        font-size: 1.125rem;
        color: #6b7280;
        margin: 0;
      }

      .gallery-filters {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .filter-btn {
        padding: 0.625rem 1.25rem;
        border: 1px solid #e5e7eb;
        background: #fff;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-btn:hover {
        border-color: #167bff;
        color: #167bff;
      }

      .filter-btn.active {
        background: #167bff;
        color: #fff;
        border-color: #167bff;
      }

      .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 2rem;
      }

      .template-card {
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
      }

      .template-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-4px);
      }

      .template-preview {
        aspect-ratio: 16/9;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .template-placeholder svg {
        color: rgba(255, 255, 255, 0.5);
      }

      .template-info {
        padding: 1.5rem;
      }

      .template-info h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .template-info p {
        color: #6b7280;
        font-size: 0.875rem;
        margin: 0 0 1rem 0;
        line-height: 1.5;
      }

      .template-meta {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #eff6ff;
        color: #167bff;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
      }

      .slides-count {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .template-actions {
        padding: 0 1.5rem 1.5rem;
      }

      .btn-block {
        width: 100%;
      }
    </style>
  `;
}
