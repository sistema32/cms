/**
 * Simple manual test for render endpoint
 */

console.log('🧪 Testing Render Endpoint\n');

const BASE_URL = 'http://localhost:8000/api/plugins/lexslider';

async function testRenderEndpoint() {
    try {
        // Step 1: Create a test slider
        console.log('1. Creating test slider...');
        const sliderRes = await fetch(`${BASE_URL}/sliders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Render Test',
                alias: 'render-test',
                config: { width: 1200, height: 600 }
            })
        });
        const slider = await sliderRes.json();
        console.log(`   ✓ Slider created: ${slider.id}`);

        // Step 2: Create a slide
        console.log('2. Creating slide...');
        const slideRes = await fetch(`${BASE_URL}/sliders/${slider.id}/slides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order: 0,
                background: { type: 'color', color: '#ffffff' },
                settings: { duration: 5000 }
            })
        });
        const slide = await slideRes.json();
        console.log(`   ✓ Slide created: ${slide.id}`);

        // Step 3: Create a layer
        console.log('3. Creating layer...');
        const layerRes = await fetch(`${BASE_URL}/slides/${slide.id}/layers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'heading',
                content: 'Test Heading',
                settings: { fontSize: 32, color: '#000000' },
                position: { x: 100, y: 100, width: 300, height: 100, zIndex: 1 },
                animations: { in: { type: 'fadeInUp', duration: 1000 } },
                responsiveSettings: {},
                order: 0
            })
        });
        const layer = await layerRes.json();
        console.log(`   ✓ Layer created: ${layer.id}`);

        // Step 4: Test render by ID
        console.log('\n4. Testing render by ID...');
        const renderByIdRes = await fetch(`${BASE_URL}/render/${slider.id}`);
        const renderByIdData = await renderByIdRes.json();
        console.log('   Response:', JSON.stringify(renderByIdData, null, 2));

        if (!renderByIdData.slides || renderByIdData.slides.length === 0) {
            console.log('   ❌ No slides in response!');
            console.log('   Slider ID:', slider.id);
            console.log('   Response keys:', Object.keys(renderByIdData));
        } else {
            console.log(`   ✓ Render by ID works! (${renderByIdData.slides.length} slides)`);
            console.log(`   ✓ Slide has ${renderByIdData.slides[0].layers?.length || 0} layers`);
        }

        // Step 5: Test render by alias
        console.log('\n5. Testing render by alias...');
        const renderByAliasRes = await fetch(`${BASE_URL}/render/render-test`);
        const renderByAliasData = await renderByAliasRes.json();

        if (!renderByAliasData.slides || renderByAliasData.slides.length === 0) {
            console.log('   ❌ No slides in response!');
        } else {
            console.log(`   ✓ Render by alias works! (${renderByAliasData.slides.length} slides)`);
        }

        // Cleanup
        console.log('\n6. Cleaning up...');
        await fetch(`${BASE_URL}/sliders/${slider.id}`, { method: 'DELETE' });
        console.log('   ✓ Cleaned up');

        console.log('\n✅ Render endpoint test complete!');
        return true;
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        return false;
    }
}

testRenderEndpoint();
