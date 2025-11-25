import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { api } from '../services/api.js';

export function Dashboard() {
    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSliders();
    }, []);

    const loadSliders = async () => {
        setLoading(true);
        try {
            const data = await api.sliders.list();
            setSliders(data);
        } catch (error) {
            console.error('Failed to load sliders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const name = prompt('Slider name:');
        if (!name) return;

        try {
            const slider = await api.sliders.create({
                name,
                alias: name.toLowerCase().replace(/\s+/g, '-'),
                config: {
                    width: 1200,
                    height: 600,
                    mode: 'boxed',
                    autoplay: { enabled: false, duration: 5000, pauseOnHover: true },
                    arrows: { enabled: true, style: 'simple' }
                }
            });
            window.location.href = `?view=edit&id=${slider.id}`;
        } catch (error) {
            alert('Failed to create slider');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this slider?')) return;
        try {
            await api.sliders.delete(id);
            loadSliders();
        } catch (error) {
            alert('Failed to delete slider');
        }
    };

    const handleDuplicate = async (id) => {
        try {
            const copy = await api.sliders.duplicate(id);
            loadSliders();
        } catch (error) {
            alert('Failed to duplicate slider');
        }
    };

    if (loading) {
        return html`<div class="p-8">Loading...</div>`;
    }

    return html`
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold">LexSlider</h1>
                <button 
                    onClick=${handleCreate}
                    class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    + New Slider
                </button>
            </div>

            ${sliders.length === 0 ? html`
                <div class="text-center py-12 text-gray-500">
                    <p>No sliders yet. Create your first one!</p>
                </div>
            ` : html`
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${sliders.map(slider => html`
                        <div key=${slider.id} class="border rounded-lg p-4 hover:shadow-lg transition">
                            <div class="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center">
                                <span class="text-gray-400">Preview</span>
                            </div>
                            <h3 class="font-semibold text-lg mb-1">${slider.name}</h3>
                            <p class="text-sm text-gray-500 mb-3">Alias: ${slider.alias}</p>
                            <div class="flex gap-2">
                                <a 
                                    href="?view=edit&id=${slider.id}"
                                    class="flex-1 text-center bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
                                    Edit
                                </a>
                                <button 
                                    onClick=${() => handleDuplicate(slider.id)}
                                    class="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200">
                                    Copy
                                </button>
                                <button 
                                    onClick=${() => handleDelete(slider.id)}
                                    class="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `)}
                </div>
            `}
        </div>
    `;
}
