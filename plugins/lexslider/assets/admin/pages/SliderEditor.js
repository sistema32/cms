import { html } from "htm/preact";
import { useState, useEffect } from "preact/hooks";

export function SliderEditor({ id }) {
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    type: 'simple',
    width: 1200,
    height: 600,
    responsive: {},
    settings: {}
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadSlider();
    }
  }, [id]);

  async function loadSlider() {
    try {
      const response = await fetch(`/api/plugins/lexslider/sliders/${id}`);
      if (!response.ok) throw new Error('Failed to load slider');
      const data = await response.json();
      setFormData({
        name: data.name || '',
        alias: data.alias || '',
        type: data.type || 'simple',
        width: data.width || 1200,
        height: data.height || 600,
        responsive: typeof data.responsive === 'string' ? JSON.parse(data.responsive) : (data.responsive || {}),
        settings: typeof data.settings === 'string' ? JSON.parse(data.settings) : (data.settings || {})
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = id
        ? `/api/plugins/lexslider/sliders/${id}`
        : '/api/plugins/lexslider/sliders';

      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save slider');
      }

      const savedSlider = await response.json();
      console.log("DEBUG: Saved slider response:", savedSlider);

      if (!savedSlider || !savedSlider.id) {
        console.error("Saved slider missing ID:", savedSlider);
        alert("Error: El servidor no devolvió un ID válido. Respuesta: " + JSON.stringify(savedSlider));
        throw new Error("El slider se guardó pero no se recibió un ID válido.");
      }

      // Redirect to list or edit slides
      if (!id) {
        // If new, redirect to edit slides
        window.location.href = `/admincp/plugins/lexslider/sliders?view=slides&id=${savedSlider.id}`;
      } else {
        // If edit, go back to list
        window.location.href = '/admincp/plugins/lexslider/sliders';
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function handleChange(e) {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  }

  if (loading) {
    return html`
      <div class="flex justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    `;
  }

  return html`
    <div class="p-8 max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
          ${id ? 'Editar Slider' : 'Crear Nuevo Slider'}
        </h1>
        <a href="/admincp/plugins/lexslider/sliders" class="text-gray-600 hover:text-gray-900">
          Cancelar
        </a>
      </div>
      
      <div class="bg-white rounded-lg shadow overflow-hidden">
        ${error && html`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">${error}</p>
                    </div>
                </div>
            </div>
        `}

        <form onSubmit=${handleSubmit} class="p-6 space-y-6">
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <!-- Name -->
                <div class="sm:col-span-4">
                    <label for="name" class="block text-sm font-medium text-gray-700">Nombre del Slider</label>
                    <div class="mt-1">
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            required
                            value=${formData.name}
                            onInput=${handleChange}
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            placeholder="Mi Slider Principal"
                        />
                    </div>
                </div>

                <!-- Alias -->
                <div class="sm:col-span-2">
                    <label for="alias" class="block text-sm font-medium text-gray-700">Alias (Shortcode)</label>
                    <div class="mt-1">
                        <input 
                            type="text" 
                            name="alias" 
                            id="alias" 
                            value=${formData.alias}
                            onInput=${handleChange}
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            placeholder="home-slider"
                        />
                    </div>
                </div>

                <!-- Type -->
                <div class="sm:col-span-6">
                    <label for="type" class="block text-sm font-medium text-gray-700">Tipo de Slider</label>
                    <div class="mt-1">
                        <select 
                            id="type" 
                            name="type" 
                            value=${formData.type}
                            onChange=${handleChange}
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        >
                            <option value="simple">Simple (Fade/Slide)</option>
                            <option value="carousel">Carrusel (Múltiples slides)</option>
                            <option value="showcase">Showcase (3D)</option>
                        </select>
                    </div>
                </div>

                <!-- Dimensions -->
                <div class="sm:col-span-3">
                    <label for="width" class="block text-sm font-medium text-gray-700">Ancho (px)</label>
                    <div class="mt-1">
                        <input 
                            type="number" 
                            name="width" 
                            id="width" 
                            required
                            min="100"
                            value=${formData.width}
                            onInput=${handleChange}
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                <div class="sm:col-span-3">
                    <label for="height" class="block text-sm font-medium text-gray-700">Alto (px)</label>
                    <div class="mt-1">
                        <input 
                            type="number" 
                            name="height" 
                            id="height" 
                            required
                            min="50"
                            value=${formData.height}
                            onInput=${handleChange}
                            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                    </div>
                </div>
            </div>

            <div class="pt-5 border-t border-gray-200 flex justify-end gap-3">
                <a 
                    href="/admincp/plugins/lexslider/sliders"
                    class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </a>
                <button 
                    type="submit" 
                    disabled=${saving}
                    class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    ${saving ? 'Guardando...' : (id ? 'Actualizar Slider' : 'Crear Slider')}
                </button>
            </div>
        </form>
      </div>
    </div>
  `;
}
