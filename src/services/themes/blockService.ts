import { join } from "@std/path";
import { themeCacheService } from "./themeCacheService.ts";

export interface BlockSchema {
    type: string;
    label?: string;
    default?: any;
    options?: unknown[];
}

export interface BlockConfig {
    name: string;
    title: string;
    category?: string;
    icon?: string;
    attributes?: Record<string, BlockSchema>;
}

export interface Block {
    config: BlockConfig;
    component: any; // The TSX component
    path: string;
}

/**
 * Service to manage Theme Blocks.
 * Allows themes to define "Blocks" (modular components) that can be used to build pages.
 */
export class BlockService {
    private static instance: BlockService;
    private blocks: Map<string, Block[]> = new Map(); // theme -> blocks

    private constructor() { }

    public static getInstance(): BlockService {
        if (!BlockService.instance) {
            BlockService.instance = new BlockService();
        }
        return BlockService.instance;
    }

    /**
     * Load all blocks for a theme
     */
    public async loadThemeBlocks(themeName: string): Promise<Block[]> {
        // Check cache first (in-memory only for now, could use themeCacheService)
        if (this.blocks.has(themeName)) {
            return this.blocks.get(themeName)!;
        }

        const blocks: Block[] = [];
        const blocksDir = join(Deno.cwd(), "src", "themes", themeName, "blocks");

        try {
            // Check if blocks directory exists
            await Deno.stat(blocksDir);

            for await (const entry of Deno.readDir(blocksDir)) {
                if (entry.isFile && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
                    try {
                        const blockPath = join(blocksDir, entry.name);
                        const module = await import(`file://${blockPath}`);

                        // Expect export const config
                        const config = module.config as BlockConfig;
                        // Expect export default as Component
                        const component = module.default;

                        if (config && component) {
                            blocks.push({
                                config: {
                                    ...config,
                                    name: config.name || entry.name.replace(/\.(tsx|ts)$/, ""),
                                },
                                component,
                                path: blockPath
                            });
                        }
                    } catch (e) {
                        console.warn(`Failed to load block ${entry.name} in theme ${themeName}:`, e);
                    }
                }
            }
        } catch {
            // No blocks dir, that's fine
        }

        this.blocks.set(themeName, blocks);
        return blocks;
    }

    /**
     * Get a specific block
     */
    public async getBlock(themeName: string, blockName: string): Promise<Block | null> {
        const blocks = await this.loadThemeBlocks(themeName);
        return blocks.find(b => b.config.name === blockName) || null;
    }

    /**
     * Render a list of blocks
     */
    public async renderBlocks(blocksData: Array<{ name: string, attributes: any }>, themeName: string): Promise<any[]> {
        const rendered = [];
        const blocks = await this.loadThemeBlocks(themeName);
        const blockMap = new Map(blocks.map(b => [b.config.name, b]));

        for (const data of blocksData) {
            const block = blockMap.get(data.name);
            if (block) {
                // In a real implementation this would invoke the component
                // For now we return the component + props for the renderer to handle (e.g. Preact renderToString)
                rendered.push({
                    component: block.component,
                    props: data.attributes
                });
            }
        }

        return rendered;
    }
}

export const blockService = BlockService.getInstance();
