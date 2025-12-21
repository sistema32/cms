import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { themeCacheService } from "./themeCacheService.ts";

export interface MarketplaceTheme {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    previewUrl: string;
    downloadUrl: string;
    price: number;
    rating: number;
}

/**
 * Service to manage Theme Marketplace.
 * Allows discovering and installing themes from an external source.
 */
export class ThemeMarketplaceService {
    private static instance: ThemeMarketplaceService;
    private readonly MARKETPLACE_API = "https://mod.lexcms.org/api/themes"; // Mock URL

    private constructor() { }

    public static getInstance(): ThemeMarketplaceService {
        if (!ThemeMarketplaceService.instance) {
            ThemeMarketplaceService.instance = new ThemeMarketplaceService();
        }
        return ThemeMarketplaceService.instance;
    }

    /**
     * Get available themes from marketplace
     */
    public async getAvailableThemes(): Promise<MarketplaceTheme[]> {
        // Stub: Mock data
        return [
            {
                id: "minimalist-pro",
                name: "Minimalist Pro",
                version: "2.0.0",
                description: "Clean, fast and elegant theme for bloggers.",
                author: "LexCMS Team",
                previewUrl: "https://themes.lexcms.org/minimalist",
                downloadUrl: "https://themes.lexcms.org/download/minimalist.zip",
                price: 0,
                rating: 4.8
            },
            {
                id: "magazine-daily",
                name: "Magazine Daily",
                version: "1.1.0",
                description: "Perfect for news sites and magazines.",
                author: "CreativeStudio",
                previewUrl: "https://themes.lexcms.org/magazine",
                downloadUrl: "https://themes.lexcms.org/download/magazine.zip",
                price: 19,
                rating: 4.5
            }
        ];
    }

    /**
     * Download and install a theme
     */
    public async installTheme(themeId: string): Promise<boolean> {
        console.log(`📦 Downloading theme ${themeId}...`);

        try {
            // Stub: Simulate download and unzip
            // In real world: fetch(url), Deno.writeFile, unzip
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create dummy folder to simulate installation
            const themeDir = join(Deno.cwd(), "src", "themes", themeId);
            await Deno.mkdir(themeDir, { recursive: true });
            await Deno.writeTextFile(join(themeDir, "theme.json"), JSON.stringify({
                name: themeId,
                version: "1.0.0",
                description: "Installed via Marketplace",
                config: { custom: {} }
            }, null, 2));

            console.log(`✅ Theme ${themeId} installed successfully.`);
            themeCacheService.invalidateAll();
            return true;
        } catch (error) {
            console.error(`❌ Failed to install theme ${themeId}:`, error);
            return false;
        }
    }
}

export const themeMarketplaceService = ThemeMarketplaceService.getInstance();
