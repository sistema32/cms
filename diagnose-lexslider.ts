#!/usr/bin/env -S deno run --allow-net

/**
 * LexSlider Plugin Diagnostic Script
 * Checks the current state of the LexSlider plugin
 */

const BASE_URL = "http://localhost:8000";

console.log("🔍 LexSlider Plugin Diagnostic\n");

// 1. Check plugin info
console.log("1. Checking plugin info...");
try {
    const response = await fetch(`${BASE_URL}/api/plugins/lexslider`);
    const data = await response.json();
    console.log("   Status:", response.status);
    console.log("   Data:", JSON.stringify(data, null, 2));
} catch (error) {
    console.error("   Error:", error.message);
}

console.log("\n2. Checking plugin list...");
try {
    const response = await fetch(`${BASE_URL}/api/plugins`);
    const data = await response.json();
    const lexslider = data.data?.find((p: any) => p.name === "lexslider");
    console.log("   LexSlider found:", !!lexslider);
    if (lexslider) {
        console.log("   Is Active:", lexslider.isActive);
        console.log("   Version:", lexslider.version);
    }
} catch (error) {
    console.error("   Error:", error.message);
}

console.log("\n3. Checking admin menu...");
try {
    const response = await fetch(`${BASE_URL}/admincp/api/menu`);
    const data = await response.json();
    console.log("   Status:", response.status);
    console.log("   Menu items:", data.data?.length || 0);
    if (data.data) {
        const lexsliderMenu = data.data.find((m: any) => m.id === "lexslider");
        console.log("   LexSlider menu found:", !!lexsliderMenu);
    }
} catch (error) {
    console.error("   Error:", error.message);
}

console.log("\n4. Testing admin page access...");
try {
    const response = await fetch(`${BASE_URL}/admincp/lexslider`);
    console.log("   Status:", response.status);
    if (response.status === 200) {
        const html = await response.text();
        console.log("   Page renders:", html.includes("LexSlider"));
    }
} catch (error) {
    console.error("   Error:", error.message);
}

console.log("\n✅ Diagnostic complete");
