import type { PluginAPI } from "../../src/lib/plugin-system/PluginAPI.ts";

/**
 * LexSlider Admin Routes
 * Registers admin panel pages
 */

export function registerAdminRoutes(api: PluginAPI) {
    // Register admin menu item
    api.registerAdminMenu({
        id: 'lexslider',
        label: 'LexSlider',
        icon: 'slider', // Icon identifier
        path: '/admincp/lexslider',
        order: 50
    });

    // List page
    api.registerAdminPage('/admincp/lexslider', async () => {
        const { SliderListPage } = await import('./pages/SliderList.tsx');
        return SliderListPage();
    });

    // Create page
    api.registerAdminPage('/admincp/lexslider/new', async () => {
        const { SliderForm } = await import('./pages/SliderForm.tsx');
        return SliderForm({ sliderId: null });
    });

    // Edit page
    api.registerAdminPage('/admincp/lexslider/edit/:id', async (params) => {
        const { SliderForm } = await import('./pages/SliderForm.tsx');
        return SliderForm({ sliderId: params.id });
    });

    // Slide editor (visual editor)
    api.registerAdminPage('/admincp/lexslider/slides/:id', async (params) => {
        const { SlideEditor } = await import('./pages/SlideEditor.tsx');
        return SlideEditor({ sliderId: params.id });
    });

    // Template gallery
    api.registerAdminPage('/admincp/lexslider/templates', async () => {
        const { TemplateGallery } = await import('./pages/TemplateGallery.tsx');
        return TemplateGallery();
    });
}
