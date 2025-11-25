import { html } from "htm/preact";
import { useState, useEffect, useRef } from "preact/hooks";

export function SlideEditor({ sliderId }) {
    const [slider, setSlider] = useState(null);
    const [slides, setSlides] = useState([]);
    const [selectedSlideId, setSelectedSlideId] = useState(null);
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load initial data
    useEffect(() => {
        if (sliderId && sliderId !== 'undefined') {
            loadData();
        } else {
            setLoading(false);
        }
    }, [sliderId]);

    async function loadData() {
        try {
            const [sliderRes, slidesRes] = await Promise.all([
                fetch(`/api/plugins/lexslider/sliders/${sliderId}`),
                fetch(`/api/plugins/lexslider/sliders/${sliderId}/slides`)
            ]);

            if (!sliderRes.ok || !slidesRes.ok) throw new Error("Failed to load data");

            const sliderData = await sliderRes.json();
            const slidesData = await slidesRes.json();

            setSlider(sliderData);
            setSlides(Array.isArray(slidesData) ? slidesData : []);

            if (slidesData.length > 0) {
                setSelectedSlideId(slidesData[0].id);
            }
        } catch (err) {
            console.error(err);
            alert("Error loading editor: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function addSlide() {
        try {
            const res = await fetch(`/api/plugins/lexslider/sliders/${sliderId}/slides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Slide ${slides.length + 1}`,
                    ordering: slides.length,
                    background: JSON.stringify({ type: 'color', value: '#ffffff' }),
                    layers: JSON.stringify([]),
                    settings: JSON.stringify({})
                })
            });

            if (!res.ok) throw new Error("Failed to create slide");

            const newSlide = await res.json();
            setSlides([...slides, newSlide]);
            setSelectedSlideId(newSlide.id);
        } catch (err) {
            alert(err.message);
        }
    }

    const selectedSlide = slides.find(s => s.id === selectedSlideId);

    if (loading) return html`<div class="flex justify-center p-20"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>`;

    if (!slider) return html`
        <div class="flex flex-col items-center justify-center h-screen bg-gray-50">
            <div class="text-red-600 mb-4 font-medium">Slider not found (ID: ${sliderId})</div>
            <a href="/admincp/plugins/lexslider/sliders" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors no-underline">
                Volver al listado
            </a>
        </div>
    `;

    return html`
        <div class="flex flex-col h-screen bg-gray-100 overflow-hidden">
            <!-- Header -->
            <div class="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm z-10">
                <div class="flex items-center gap-4">
                    <a href="/admincp/plugins/lexslider/sliders" class="text-gray-500 hover:text-gray-800">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    </a>
                    <h1 class="font-bold text-gray-800">${slider.name} <span class="text-xs font-normal text-gray-500 ml-2">${slider.width}x${slider.height}px</span></h1>
                </div>
                <div class="flex gap-2">
                    <button onClick=${() => alert('Preview not implemented')} class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Preview</button>
                    <button onClick=${() => alert('Save not implemented')} class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">Save</button>
                </div>
            </div>

            <div class="flex-1 flex overflow-hidden">
                <!-- Left Sidebar: Slides List -->
                <div class="w-64 bg-white border-r flex flex-col">
                    <div class="p-3 border-b bg-gray-50 flex justify-between items-center">
                        <span class="text-xs font-bold text-gray-500 uppercase">Slides</span>
                        <button onClick=${addSlide} class="p-1 hover:bg-gray-200 rounded" title="Add Slide">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2 space-y-2">
                        ${slides.map(slide => html`
                            <div 
                                key=${slide.id}
                                onClick=${() => setSelectedSlideId(slide.id)}
                                class="p-3 rounded cursor-pointer border transition-all ${selectedSlideId === slide.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300 bg-white'}"
                            >
                                <div class="text-sm font-medium text-gray-800 truncate">${slide.title}</div>
                                <div class="text-xs text-gray-400 mt-1">#${slide.id}</div>
                            </div>
                        `)}
                        ${slides.length === 0 && html`<div class="text-center p-4 text-sm text-gray-400">No slides yet</div>`}
                    </div>
                </div>

                <!-- Center: Canvas -->
                <div class="flex-1 bg-gray-200 overflow-auto flex items-center justify-center p-8 relative">
                    ${selectedSlide ? html`
                        <div 
                            class="bg-white shadow-2xl relative transition-all duration-300"
                            style="width: ${slider.width}px; height: ${slider.height}px; background-color: ${JSON.parse(selectedSlide.background || '{}').value || '#ffffff'};"
                        >
                            <!-- Layers would go here -->
                            <div class="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none border-2 border-dashed border-gray-300 m-4">
                                Slide Content Area
                            </div>
                        </div>
                    ` : html`
                        <div class="text-gray-500">Select a slide to edit</div>
                    `}
                </div>

                <!-- Right Sidebar: Properties -->
                <div class="w-72 bg-white border-l flex flex-col">
                    <div class="h-10 border-b bg-gray-50 flex items-center px-4">
                        <span class="text-xs font-bold text-gray-500 uppercase">Properties</span>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4">
                        ${selectedSlide ? html`
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Slide Title</label>
                                    <input type="text" value=${selectedSlide.title} class="w-full text-sm border-gray-300 rounded p-2 border" />
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Background Color</label>
                                    <div class="flex gap-2">
                                        <input type="color" class="h-8 w-8 rounded cursor-pointer border p-0" />
                                        <input type="text" value="#ffffff" class="flex-1 text-sm border-gray-300 rounded p-2 border" />
                                    </div>
                                </div>
                            </div>
                        ` : html`
                            <div class="text-sm text-gray-400 text-center mt-10">No selection</div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}
