/**
 * Image Optimization Service
 * WebP conversion, compression, responsive images
 */

export interface ImageOptimizationOptions {
  quality?: number; // 1-100
  width?: number;
  height?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  progressive?: boolean;
  resize?: "cover" | "contain" | "fill";
}

export interface OptimizedImage {
  originalUrl: string;
  optimizedUrl: string;
  webpUrl?: string;
  avifUrl?: string;
  width: number;
  height: number;
  size: number; // bytes
  format: string;
  srcset?: string; // For responsive images
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;

  private constructor() {}

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  /**
   * Optimize image for web
   */
  async optimizeImage(
    imagePath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      quality = 80,
      format = "webp",
      width,
      height,
    } = options;

    // In production, would use Sharp or similar library
    // For now, return mock implementation
    const optimized: OptimizedImage = {
      originalUrl: imagePath,
      optimizedUrl: this.getOptimizedPath(imagePath, format, width),
      webpUrl: this.getOptimizedPath(imagePath, "webp", width),
      avifUrl: this.getOptimizedPath(imagePath, "avif", width),
      width: width || 800,
      height: height || 600,
      size: 50000, // Mock size
      format,
      srcset: this.generateSrcSet(imagePath, format),
    };

    return optimized;
  }

  /**
   * Generate srcset for responsive images
   */
  private generateSrcSet(imagePath: string, format: string): string {
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    return sizes
      .map((size) => `${this.getOptimizedPath(imagePath, format, size)} ${size}w`)
      .join(", ");
  }

  /**
   * Get optimized image path
   */
  private getOptimizedPath(
    imagePath: string,
    format: string,
    width?: number
  ): string {
    const ext = imagePath.split(".").pop();
    const base = imagePath.replace(`.${ext}`, "");
    const sizeStr = width ? `-${width}w` : "";
    return `${base}${sizeStr}.${format}`;
  }

  /**
   * Generate picture element with multiple formats
   */
  generatePictureElement(
    imagePath: string,
    alt: string,
    options: {
      width?: number;
      height?: number;
      loading?: "lazy" | "eager";
      decoding?: "async" | "sync" | "auto";
      sizes?: string;
    } = {}
  ): string {
    const {
      width,
      height,
      loading = "lazy",
      decoding = "async",
      sizes = "100vw",
    } = options;

    const webpSrcset = this.generateSrcSet(imagePath, "webp");
    const avifSrcset = this.generateSrcSet(imagePath, "avif");
    const jpegSrcset = this.generateSrcSet(imagePath, "jpeg");

    const dimensionAttrs = width && height
      ? `width="${width}" height="${height}"`
      : "";

    return `
<picture>
  <source type="image/avif" srcset="${avifSrcset}" sizes="${sizes}">
  <source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">
  <source type="image/jpeg" srcset="${jpegSrcset}" sizes="${sizes}">
  <img
    src="${imagePath}"
    alt="${alt}"
    ${dimensionAttrs}
    loading="${loading}"
    decoding="${decoding}"
    style="width: 100%; height: auto;"
  />
</picture>`.trim();
  }

  /**
   * Add blur-up placeholder
   */
  generateBlurUpPlaceholder(imagePath: string): string {
    // Generate tiny placeholder (20px width)
    const placeholderUrl = this.getOptimizedPath(imagePath, "jpeg", 20);

    return `
<div class="blur-up-image" style="position: relative; overflow: hidden;">
  <img
    src="${placeholderUrl}"
    style="filter: blur(20px); transform: scale(1.1); position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    aria-hidden="true"
  />
  ${this.generatePictureElement(imagePath, "")}
</div>`.trim();
  }

  /**
   * Generate lazy loading script
   */
  getLazyLoadScript(): string {
    return `
<script>
// Lazy loading with Intersection Observer
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          img.removeAttribute('data-srcset');
        }
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
  });
}
</script>`.trim();
  }
}

export const imageOptimizer = ImageOptimizer.getInstance();
