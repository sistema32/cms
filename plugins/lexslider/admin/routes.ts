import type { WorkerPluginAPI } from "../../src/lib/plugin-system/worker/WorkerPluginAPI.ts";

/**
 * LexSlider Admin Routes
 * Registers admin panel pages
 */

export function registerAdminRoutes(api: WorkerPluginAPI) {
    // Register admin menu item
    api.registerAdminMenu({
        id: 'lexslider',
        label: 'LexSlider',
        icon: 'slider',
        path: '/admincp/lexslider',
        order: 50
    });

    // List page
    api.registerAdminPage('/admincp/lexslider', async () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>LexSlider - Slider List</title>
    <style>
        body { font-family: system-ui; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>LexSlider - Slider List</h1>
    <p>This is the slider list page.</p>
    <p><a href="/admincp/lexslider/new">Create New Slider</a></p>
</body>
</html>`;
    });

    // Create page
    api.registerAdminPage('/admincp/lexslider/new', async () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>LexSlider - Create Slider</title>
    <style>
        body { font-family: system-ui; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Create New Slider</h1>
    <p>Slider creation form will go here.</p>
    <p><a href="/admincp/lexslider">Back to List</a></p>
</body>
</html>`;
    });

    // Edit page
    api.registerAdminPage('/admincp/lexslider/edit/:id', async (params) => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>LexSlider - Edit Slider</title>
    <style>
        body { font-family: system-ui; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Edit Slider ${params.id || 'Unknown'}</h1>
    <p>Slider edit form will go here.</p>
    <p><a href="/admincp/lexslider">Back to List</a></p>
</body>
</html>`;
    });

    // Slide editor
    api.registerAdminPage('/admincp/lexslider/slides/:id', async (params) => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>LexSlider - Slide Editor</title>
    <style>
        body { font-family: system-ui; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Slide Editor for Slider ${params.id || 'Unknown'}</h1>
    <p>Visual slide editor will go here.</p>
    <p><a href="/admincp/lexslider">Back to List</a></p>
</body>
</html>`;
    });

    // Template gallery
    api.registerAdminPage('/admincp/lexslider/templates', async () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>LexSlider - Templates</title>
    <style>
        body { font-family: system-ui; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Template Gallery</h1>
    <p>Slider templates will be displayed here.</p>
    <p><a href="/admincp/lexslider">Back to List</a></p>
</body>
</html>`;
    });
}
