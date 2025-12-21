/**
 * CSS Generator Utilities
 * Converts style objects to CSS strings
 */

// deno-lint-ignore no-explicit-any
export type StyleObject = Record<string, any>;

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert style object to CSS string
 */
export function styleToString(style: StyleObject): string {
    if (!style || typeof style !== 'object') return '';

    return Object.entries(style)
        .filter(([key, value]) =>
            value !== undefined &&
            value !== null &&
            key !== 'tablet' &&
            key !== 'mobile' &&
            typeof value !== 'object'
        )
        .map(([key, value]) => `${toKebabCase(key)}: ${value}`)
        .join('; ');
}

/**
 * Generate responsive CSS for a layer
 */
export function generateLayerCSS(
    layerId: string,
    style: StyleObject
): string {
    let css = `.${layerId} { ${styleToString(style)} } `;

    if (style.tablet && typeof style.tablet === 'object') {
        const tabletStyle = { ...style, ...style.tablet };
        css += `@media (max-width: 768px) { .${layerId} { ${styleToString(tabletStyle)} } } `;
    }

    if (style.mobile && typeof style.mobile === 'object') {
        const mobileStyle = { ...style, ...(style.tablet || {}), ...style.mobile };
        css += `@media (max-width: 480px) { .${layerId} { ${styleToString(mobileStyle)} } } `;
    }

    return css;
}

/**
 * Generate base slider CSS
 */
export function generateSliderCSS(sliderId: number | string, width: number, height: number): string {
    return `
        .ss3-${sliderId} { position: relative; width: 100%; max-width: ${width}px; margin: 0 auto; overflow: hidden; }
        .ss3-${sliderId} .ss3-slides { display: flex; position: relative; width: 100%; height: ${height}px; overflow: hidden; }
        .ss3-${sliderId} .ss3-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transition: opacity var(--duration, 0.5s); }
        .ss3-${sliderId} .ss3-slide.active { opacity: 1; z-index: 1; }
        .ss3-${sliderId} .ss3-layer { position: absolute; transition: none; }
        .ss3-${sliderId} .ss3-global-layer { position: absolute; z-index: 10; }
        .ss3-${sliderId} .ss3-ken-burns { animation: kenBurns 20s ease-in-out infinite alternate; }
        @keyframes kenBurns { 0% { transform: scale(1) translate(0, 0); } 100% { transform: scale(1.1) translate(-2%, -2%); } }
    `.replace(/\s+/g, ' ').trim();
}
