/**
 * Quick test to verify render endpoint works
 */

const BASE_URL = 'http://localhost:8000/api/plugins/lexslider';

async function quickTest() {
    console.log('🧪 Quick Render Test\n');

    try {
        // 1. Create slider
        console.log('1. Creating slider...');
        const sliderRes = await fetch(`${BASE_URL}/sliders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Quick Test',
                alias: 'quick-test',
                config: { width: 1200, height: 600 }
            })
        });
        const sliderData = await sliderRes.json();
        console.log('   Response:', JSON.stringify(sliderData, null, 2));

        const sliderId = sliderData.id || sliderData.data?.id;
        if (!sliderId) {
            console.log('   ❌ No ID in response!');
            return;
        }
        console.log(`   ✓ Slider ID: ${sliderId}`);

        // 2. Create slide
        console.log('\n2. Creating slide...');
        const slideRes = await fetch(`${BASE_URL}/sliders/${sliderId}/slides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order: 0,
                background: { type: 'color', color: '#ffffff' },
                settings: { duration: 5000 }
            })
        });
        const slideData = await slideRes.json();
        const slideId = slideData.id || slideData.data?.id;
        console.log(`   ✓ Slide ID: ${slideId}`);

        // 3. Test render
        console.log('\n3. Testing render endpoint...');
        const renderRes = await fetch(`${BASE_URL}/render/${sliderId}`);
        const renderData = await renderRes.json();
        console.log('   Response:', JSON.stringify(renderData, null, 2));

        if (renderData.slides && renderData.slides.length > 0) {
            console.log(`   ✅ SUCCESS! Got ${renderData.slides.length} slide(s)`);
        } else {
            console.log('   ❌ No slides in response');
        }

        // Cleanup
        console.log('\n4. Cleanup...');
        await fetch(`${BASE_URL}/sliders/${sliderId}`, { method: 'DELETE' });
        console.log('   ✓ Done');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickTest();
