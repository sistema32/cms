/**
 * SEO Optimization Library
 * Complete SEO optimization suite for LexCMS
 */

// Phase 1: Quick Wins
export { ImageOptimizer, imageOptimizer } from "./ImageOptimizer.ts";
export { ResourceOptimizer, resourceOptimizer } from "./ResourceOptimizer.ts";
export { CoreWebVitalsOptimizer, coreWebVitalsOptimizer } from "./CoreWebVitals.ts";

// Phase 2: Content Optimization
export { ContentOptimizer, contentOptimizer } from "./ContentOptimizer.ts";

// Phase 3: URL Structure
export { URLOptimizer, urlOptimizer } from "./URLOptimizer.ts";

// Phase 4: Advanced Schema
export { AdvancedSchemaGenerator, advancedSchemaGenerator } from "./AdvancedSchema.ts";

// Phase 5: PWA & Performance
export { PWAOptimizer, pwaOptimizer } from "./PWAOptimizer.ts";

// Phase 6: Hreflang & Multi-language
export { HreflangManager, hreflangManager } from "./HreflangManager.ts";

// Phase 7: Monitoring
export { SEOMonitoring, seoMonitoring } from "./SEOMonitoring.ts";

// Rendering Integration
export { SEORenderingHelper, seoRenderingHelper } from "./SEORenderingHelper.ts";
export type { PageSEOConfig, SEOHeadTags } from "./SEORenderingHelper.ts";
