import { html } from "htm/preact";
import { useState, useEffect } from "preact/hooks";

/**
 * LexSlider - Slider List Page
 * Displays all sliders with CRUD actions
 */

export function SliderListPage() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSliders();
  }, []);

  async function loadSliders() {
    try {
      const response = await fetch('/api/plugins/lexslider/sliders');
      if (!response.ok) throw new Error('Failed to load sliders');
      const data = await response.json();
      // Defensive check: ensure data is an array
      setSliders(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) {
        console.error("API did not return an array:", data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSlider(id, name) {
    if (!confirm(`¿Estás seguro de eliminar el slider "${name}"?`)) return;

    try {
      const response = await fetch(`/api/plugins/lexslider/sliders/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete slider');

      setSliders(sliders.filter(s => s.id !== id));
      alert('Slider eliminado exitosamente');
    } catch (err) {
      alert('Error al eliminar slider: ' + err.message);
    }
  }

  async function duplicateSlider(id, name) {
    try {
      const response = await fetch(`/api/plugins/lexslider/sliders/${id}/duplicate`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to duplicate slider');

      const newSlider = await response.json();
      setSliders([newSlider, ...sliders]);
      alert('Slider duplicado exitosamente');
    } catch (err) {
      alert('Error al duplicar slider: ' + err.message);
    }
  }

  if (loading) {
    return html`
      <div class="flex flex-col items-center justify-center p-16 text-center">
        <div class="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-500">Cargando sliders...</p>
      </div>
    `;
  }

  if (error) {
    return html`
      <div class="flex flex-col items-center justify-center p-16 text-center">
        <p class="text-red-500 mb-4">Error: ${error}</p>
        <button onClick=${loadSliders} class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors">
          Reintentar
        </button>
      </div>
    `;
  }

  return html`
    <div class="p-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">LexSlider</h1>
        <div class="flex gap-3">
          <a href="/admincp/plugins/lexslider/sliders?view=templates" class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors no-underline">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Templates
          </a>
          <a href="/admincp/plugins/lexslider/sliders?view=new" class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors no-underline">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Crear Nuevo Slider
          </a>
        </div>
      </div>

      ${sliders.length === 0 ? html`
        <div class="text-center p-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <h3 class="text-2xl font-semibold text-gray-900 mb-2">No hay sliders creados</h3>
          <p class="text-gray-500 mb-6">Crea tu primer slider para comenzar</p>
          <a href="/admincp/plugins/lexslider/sliders?view=new" class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors no-underline">Crear Slider</a>
        </div>
      ` : html`
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${sliders.map(slider => html`
            <div key=${slider.id} class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
              <div class="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <div class="text-white/50">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
              </div>
              
              <div class="p-5">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${slider.name}</h3>
                ${slider.alias && html`
                  <div class="mb-2">
                    <code class="bg-gray-100 px-2 py-1 rounded text-sm text-blue-600 font-mono">[lexslider alias="${slider.alias}"]</code>
                  </div>
                `}
                <p class="text-sm text-gray-500">
                  ${slider.width}×${slider.height}px
                  ${slider.type && ` • ${slider.type}`}
                </p>
              </div>
              
              <div class="flex gap-2 p-4 border-t border-gray-100 bg-gray-50/50">
                <a href="/admincp/plugins/lexslider/sliders?view=slides&id=${slider.id}" class="flex-1 inline-flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors no-underline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Edit Slides
                </a>
                <a href="/admincp/plugins/lexslider/sliders?view=edit&id=${slider.id}" class="inline-flex justify-center items-center p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" title="Settings">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </a>
                <button 
                  onClick=${() => duplicateSlider(slider.id, slider.name)} 
                  class="inline-flex justify-center items-center p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  title="Duplicar slider"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button 
                  onClick=${() => deleteSlider(slider.id, slider.name)} 
                  class="inline-flex justify-center items-center p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Eliminar slider"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}
