import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import * as themeService from "./themeService.ts";

export interface Asset {
    handle: string;
    src: string;
    version?: string;
    deps?: string[];
    type: "style" | "script";
    media?: string; // for styles
    inFooter?: boolean; // for scripts
}

export class ThemeAssetService {
    private static instance: ThemeAssetService;
    private styles: Map<string, Asset> = new Map();
    private scripts: Map<string, Asset> = new Map();

    private constructor() { }

    public static getInstance(): ThemeAssetService {
        if (!ThemeAssetService.instance) {
            ThemeAssetService.instance = new ThemeAssetService();
        }
        return ThemeAssetService.instance;
    }

    // --- Registration ---

    public enqueueStyle(handle: string, src: string, deps: string[] = [], version?: string, media: string = "all") {
        this.styles.set(handle, {
            handle,
            src,
            deps,
            version: version || "1.0",
            type: "style",
            media
        });
    }

    public enqueueScript(handle: string, src: string, deps: string[] = [], version?: string, inFooter: boolean = true) {
        this.scripts.set(handle, {
            handle,
            src,
            deps,
            version: version || "1.0",
            type: "script",
            inFooter
        });
    }

    // --- Output ---

    public getStyles(): string {
        // Simple dependency resolution (not robust cyclic check)
        const sorted = this.resolveDependencies(Array.from(this.styles.values()));
        return sorted.map(asset =>
            `<link rel="stylesheet" id="${asset.handle}-css" href="${asset.src}?ver=${asset.version}" media="${asset.media}" />`
        ).join("\n");
    }

    public getScripts(inFooter: boolean = true): string {
        const assets = Array.from(this.scripts.values()).filter(s => s.inFooter === inFooter);
        const sorted = this.resolveDependencies(assets);
        return sorted.map(asset =>
            `<script src="${asset.src}?ver=${asset.version}" id="${asset.handle}-js"></script>`
        ).join("\n");
    }

    private resolveDependencies(assets: Asset[]): Asset[] {
        const resolved: Asset[] = [];
        const seen = new Set<string>();
        const assetMap = new Map(assets.map(a => [a.handle, a]));

        const visit = (asset: Asset) => {
            if (seen.has(asset.handle)) return;
            seen.add(asset.handle);

            if (asset.deps) {
                for (const depHandle of asset.deps) {
                    const dep = assetMap.get(depHandle);
                    if (dep) visit(dep);
                }
            }
            resolved.push(asset);
        };

        assets.forEach(a => visit(a));
        return resolved;
    }

    // --- Compilation Stub ---

    public async compileScss(absolutePath: string): Promise<string> {
        // In a real implementation, call SASS compiler
        console.log(`Stub: Compiling SCSS from ${absolutePath}`);
        try {
            const content = await Deno.readTextFile(absolutePath);
            // Mock compilation: simply replace strings
            return content.replace(/\$primary/g, "blue");
        } catch (e) {
            console.error("SCSS Compilation failed", e);
            return "/* Error compiling SCSS */";
        }
    }
}

export const themeAssetService = ThemeAssetService.getInstance();
