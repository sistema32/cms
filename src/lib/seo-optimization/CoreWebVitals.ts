/**
 * Core Web Vitals Optimization
 * LCP, FID, CLS optimization utilities
 */

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export class CoreWebVitalsOptimizer {
  private static instance: CoreWebVitalsOptimizer;

  private constructor() {}

  static getInstance(): CoreWebVitalsOptimizer {
    if (!CoreWebVitalsOptimizer.instance) {
      CoreWebVitalsOptimizer.instance = new CoreWebVitalsOptimizer();
    }
    return CoreWebVitalsOptimizer.instance;
  }

  /**
   * Generate web vitals tracking script
   */
  generateTrackingScript(): string {
    return `
<script type="module">
import {onLCP, onFID, onCLS, onFCP, onTTFB} from 'https://unpkg.com/web-vitals@3/dist/web-vitals.js?module';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });

  // Send to backend
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/web-vitals', body);
  } else {
    fetch('/api/analytics/web-vitals', {
      body,
      method: 'POST',
      keepalive: true,
    });
  }
}

onLCP(sendToAnalytics);
onFID(sendToAnalytics);
onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
</script>`.trim();
  }

  /**
   * Generate LCP optimization hints
   */
  generateLCPOptimizationHTML(largestElement: string): string {
    return `
<!-- LCP Optimization -->
<link rel="preload" as="image" href="${largestElement}">
<link rel="prefetch" href="${largestElement}">`.trim();
  }

  /**
   * Generate CLS prevention styles
   */
  generateCLSPreventionCSS(): string {
    return `
<style id="cls-prevention">
/* Prevent Cumulative Layout Shift */

/* Reserve space for images */
img, picture, video {
  aspect-ratio: attr(width) / attr(height);
  height: auto;
}

/* Reserve space for ads */
.ad-container {
  min-height: 250px;
}

/* Font loading optimization */
@font-face {
  font-family: 'System Font';
  font-display: swap;
  src: local('Arial'), local('Helvetica'), local('sans-serif');
}

body {
  font-family: 'System Font', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Prevent reflow from dynamic content */
[data-dynamic-content] {
  contain: layout style paint;
}

/* Skeleton screens */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>`.trim();
  }

  /**
   * Generate FID optimization script
   */
  generateFIDOptimizationScript(): string {
    return `
<script>
// Break up long tasks
function yieldToMain() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

// Debounce expensive operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle scroll events
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Idle-until-urgent pattern
if ('requestIdleCallback' in window) {
  const scheduleDeferredWork = (callback) => {
    requestIdleCallback(() => {
      callback();
    }, { timeout: 2000 });
  };

  // Defer non-critical work
  scheduleDeferredWork(() => {
    // Non-critical initialization
    console.log('Non-critical work executed');
  });
}
</script>`.trim();
  }

  /**
   * Generate viewport meta tag
   */
  generateViewportMeta(): string {
    return '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
  }

  /**
   * Generate performance hints
   */
  generatePerformanceHints(): string[] {
    return [
      "<!-- Core Web Vitals Optimization -->",
      this.generateViewportMeta(),
      this.generateCLSPreventionCSS(),
      this.generateFIDOptimizationScript(),
      this.generateTrackingScript(),
    ];
  }

  /**
   * Generate skeleton screen for loading state
   */
  generateSkeletonScreen(type: "article" | "card" | "list"): string {
    const templates = {
      article: `
<div class="skeleton-article">
  <div class="skeleton skeleton-title" style="width: 80%; height: 32px; margin-bottom: 16px;"></div>
  <div class="skeleton skeleton-meta" style="width: 40%; height: 16px; margin-bottom: 24px;"></div>
  <div class="skeleton skeleton-image" style="width: 100%; height: 400px; margin-bottom: 24px;"></div>
  <div class="skeleton skeleton-text" style="width: 100%; height: 16px; margin-bottom: 12px;"></div>
  <div class="skeleton skeleton-text" style="width: 95%; height: 16px; margin-bottom: 12px;"></div>
  <div class="skeleton skeleton-text" style="width: 90%; height: 16px;"></div>
</div>`,
      card: `
<div class="skeleton-card">
  <div class="skeleton skeleton-image" style="width: 100%; height: 200px; margin-bottom: 16px;"></div>
  <div class="skeleton skeleton-title" style="width: 90%; height: 24px; margin-bottom: 12px;"></div>
  <div class="skeleton skeleton-text" style="width: 100%; height: 14px; margin-bottom: 8px;"></div>
  <div class="skeleton skeleton-text" style="width: 80%; height: 14px;"></div>
</div>`,
      list: `
<div class="skeleton-list">
  <div class="skeleton skeleton-item" style="width: 100%; height: 60px; margin-bottom: 12px;"></div>
  <div class="skeleton skeleton-item" style="width: 100%; height: 60px; margin-bottom: 12px;"></div>
  <div class="skeleton skeleton-item" style="width: 100%; height: 60px;"></div>
</div>`,
    };

    return templates[type];
  }
}

export const coreWebVitalsOptimizer = CoreWebVitalsOptimizer.getInstance();
