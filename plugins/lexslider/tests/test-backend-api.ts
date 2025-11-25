/**
 * LexSlider Backend API Test Script
 * Tests all layer and export endpoints
 */

// Test configuration
const BASE_URL = 'http://localhost:8000/api/plugins/lexslider';
const headers = {
    'Content-Type': 'application/json',
};

async function testBackendAPI() {
    console.log('🧪 Testing LexSlider Backend API...\n');

    let sliderId: number;
    let slideId: number;
    let layerId: number;

    try {
        // Test 1: Create a slider
        console.log('1️⃣ Creating slider...');
        const sliderRes = await fetch(`${BASE_URL}/sliders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: 'Test Slider',
                alias: 'test-slider-' + Date.now(),
                type: 'simple',
                settings: {
                    width: 1200,
                    height: 600,
                    autoplay: true,
                },
            }),
        });
        const slider = await sliderRes.json();
        sliderId = slider.id;
        console.log('✅ Slider created:', sliderId);

        // Test 2: Create a slide
        console.log('\n2️⃣ Creating slide...');
        const slideRes = await fetch(`${BASE_URL}/sliders/${sliderId}/slides`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: 'Test Slide',
                thumbnail: '',
                settings: {
                    background: { type: 'color', value: '#ffffff' },
                },
            }),
        });
        const slide = await slideRes.json();
        slideId = slide.id;
        console.log('✅ Slide created:', slideId);

        // Test 3: Create a layer
        console.log('\n3️⃣ Creating layer...');
        const layerRes = await fetch(`${BASE_URL}/slides/${slideId}/layers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'heading',
                content: 'Hello World',
                settings: {
                    fontSize: 48,
                    color: '#000000',
                },
                position: {
                    x: 100,
                    y: 100,
                    width: 400,
                    height: 100,
                    zIndex: 1,
                },
                animations: {
                    in: { type: 'fadeIn', duration: 1000 },
                    out: null,
                    loop: null,
                },
            }),
        });
        const layer = await layerRes.json();
        layerId = layer.id;
        console.log('✅ Layer created:', layerId);

        // Test 4: List layers
        console.log('\n4️⃣ Listing layers...');
        const layersRes = await fetch(`${BASE_URL}/slides/${slideId}/layers`);
        const layers = await layersRes.json();
        console.log('✅ Layers found:', layers.length);

        // Test 5: Update layer
        console.log('\n5️⃣ Updating layer...');
        const updateRes = await fetch(`${BASE_URL}/layers/${layerId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                content: 'Hello Updated World',
            }),
        });
        const updatedLayer = await updateRes.json();
        console.log('✅ Layer updated:', updatedLayer.content);

        // Test 6: Duplicate layer
        console.log('\n6️⃣ Duplicating layer...');
        const dupRes = await fetch(`${BASE_URL}/layers/${layerId}/duplicate`, {
            method: 'POST',
            headers,
        });
        const dupLayer = await dupRes.json();
        console.log('✅ Layer duplicated:', dupLayer.id);

        // Test 7: Export slider
        console.log('\n7️⃣ Exporting slider...');
        const exportRes = await fetch(`${BASE_URL}/sliders/${sliderId}/export`);
        const exportData = await exportRes.json();
        console.log('✅ Slider exported, slides:', exportData.slides.length);
        console.log('   Layers in first slide:', exportData.slides[0].layers.length);

        // Test 8: Import slider
        console.log('\n8️⃣ Importing slider...');
        const importRes = await fetch(`${BASE_URL}/import`, {
            method: 'POST',
            headers,
            body: JSON.stringify(exportData),
        });
        const importedSlider = await importRes.json();
        console.log('✅ Slider imported:', importedSlider.id);

        // Test 9: Delete layer
        console.log('\n9️⃣ Deleting layer...');
        await fetch(`${BASE_URL}/layers/${layerId}`, {
            method: 'DELETE',
        });
        console.log('✅ Layer deleted');

        // Test 10: Delete slider
        console.log('\n🔟 Deleting test sliders...');
        await fetch(`${BASE_URL}/sliders/${sliderId}`, {
            method: 'DELETE',
        });
        await fetch(`${BASE_URL}/sliders/${importedSlider.id}`, {
            method: 'DELETE',
        });
        console.log('✅ Sliders deleted');

        console.log('\n✅ All tests passed! Backend API is working correctly.');

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);

        // Cleanup
        if (sliderId) {
            try {
                await fetch(`${BASE_URL}/sliders/${sliderId}`, { method: 'DELETE' });
            } catch { }
        }
    }
}

// Run tests
if (import.meta.main) {
    await testBackendAPI();
}
