/**
 * Ultra-Performance Image Optimizer
 * Progressive loading with WebP support and blur-up technique
 */

class ImageOptimizer {
  constructor() {
    this.cache = new Map();
    this.loadingImages = new Set();
    this.observer = null;
    this.supportsWebP = null;
    this.supportedFormats = new Set();
    
    this.initializeObserver();
    this.detectFormatSupport();
  }

  /**
   * Initialize Intersection Observer for lazy loading
   */
  initializeObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before visible
          threshold: 0.01
        }
      );
    }
  }

  /**
   * Detect supported image formats
   */
  async detectFormatSupport() {
    const formats = [
      { format: 'webp', data: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA' },
      { format: 'avif', data: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=' }
    ];

    for (const { format, data } of formats) {
      try {
        const supported = await this.testImageFormat(data);
        if (supported) {
          this.supportedFormats.add(format);
        }
      } catch (error) {
        console.log(`Format ${format} not supported`);
      }
    }

    console.log('🖼️ Supported image formats:', Array.from(this.supportedFormats));
  }

  /**
   * Test if image format is supported
   */
  testImageFormat(data) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
      img.src = data;
    });
  }

  /**
   * Get optimized image URL with format and size
   */
  getOptimizedUrl(originalUrl, options = {}) {
    if (!originalUrl) return null;

    const {
      width = null,
      height = null,
      quality = 80,
      format = 'auto'
    } = options;

    // If it's already a data URL or external URL, return as-is
    if (originalUrl.startsWith('data:') || originalUrl.startsWith('http')) {
      return originalUrl;
    }

    // Build optimized URL
    let optimizedUrl = originalUrl;
    const params = new URLSearchParams();

    if (width) params.set('w', width);
    if (height) params.set('h', height);
    params.set('q', quality);

    // Choose best format
    if (format === 'auto') {
      if (this.supportedFormats.has('avif')) {
        params.set('f', 'avif');
      } else if (this.supportedFormats.has('webp')) {
        params.set('f', 'webp');
      }
    } else if (this.supportedFormats.has(format)) {
      params.set('f', format);
    }

    if (params.toString()) {
      optimizedUrl += (originalUrl.includes('?') ? '&' : '?') + params.toString();
    }

    return optimizedUrl;
  }

  /**
   * Create responsive image sources
   */
  createResponsiveSources(originalUrl, sizes = []) {
    if (!originalUrl) return [];

    const defaultSizes = [
      { width: 320, media: '(max-width: 320px)' },
      { width: 640, media: '(max-width: 640px)' },
      { width: 1024, media: '(max-width: 1024px)' },
      { width: 1920, media: '(min-width: 1025px)' }
    ];

    const responsiveSizes = sizes.length > 0 ? sizes : defaultSizes;
    const sources = [];

    // Generate sources for each supported format
    for (const format of ['avif', 'webp']) {
      if (this.supportedFormats.has(format)) {
        const srcSet = responsiveSizes
          .map(size => `${this.getOptimizedUrl(originalUrl, { ...size, format })} ${size.width}w`)
          .join(', ');
        
        sources.push({
          type: `image/${format}`,
          srcSet,
          sizes: responsiveSizes.map(s => `${s.media} ${s.width}px`).join(', ')
        });
      }
    }

    // Fallback JPEG/PNG
    const fallbackSrcSet = responsiveSizes
      .map(size => `${this.getOptimizedUrl(originalUrl, size)} ${size.width}w`)
      .join(', ');
    
    sources.push({
      srcSet: fallbackSrcSet,
      sizes: responsiveSizes.map(s => `${s.media} ${s.width}px`).join(', ')
    });

    return sources;
  }

  /**
   * Generate blur placeholder
   */
  generateBlurPlaceholder(width = 40, height = 30) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }

  /**
   * Load image with progressive enhancement
   */
  async loadImage(imgElement) {
    const src = imgElement.dataset.src;
    if (!src || this.loadingImages.has(src)) return;

    this.loadingImages.add(src);
    imgElement.classList.add('loading');

    try {
      // Check cache first
      if (this.cache.has(src)) {
        this.applyImage(imgElement, this.cache.get(src));
        return;
      }

      // Load optimized image
      const optimizedSrc = this.getOptimizedUrl(src, {
        width: imgElement.dataset.width,
        height: imgElement.dataset.height,
        quality: imgElement.dataset.quality || 80
      });

      const img = new Image();
      
      // Set up loading promise
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });

      img.src = optimizedSrc;
      
      // Wait for image to load
      await loadPromise;
      
      // Cache the loaded image
      this.cache.set(src, optimizedSrc);
      
      // Apply with fade-in effect
      this.applyImage(imgElement, optimizedSrc);
      
    } catch (error) {
      console.error('❌ Failed to load image:', src, error);
      imgElement.classList.add('error');
      
      // Try fallback image
      const fallback = imgElement.dataset.fallback;
      if (fallback) {
        this.applyImage(imgElement, fallback);
      }
    } finally {
      this.loadingImages.delete(src);
      imgElement.classList.remove('loading');
    }
  }

  /**
   * Apply loaded image with smooth transition
   */
  applyImage(imgElement, src) {
    // Create new image for smooth transition
    const newImg = new Image();
    newImg.onload = () => {
      imgElement.src = src;
      imgElement.classList.add('loaded');
      
      // Remove blur placeholder
      setTimeout(() => {
        imgElement.classList.remove('blur-placeholder');
      }, 300);
    };
    newImg.src = src;
  }

  /**
   * Observe element for lazy loading
   */
  observe(element) {
    if (this.observer && element) {
      // Add blur placeholder
      if (!element.src && element.dataset.src) {
        element.src = this.generateBlurPlaceholder();
        element.classList.add('blur-placeholder');
      }
      
      this.observer.observe(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(element);
    }
  }

  /**
   * Preload critical images
   */
  preload(urls, options = {}) {
    const promises = urls.map(url => {
      const optimizedUrl = this.getOptimizedUrl(url, options);
      
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimizedUrl;
        link.onload = () => {
          this.cache.set(url, optimizedUrl);
          resolve(optimizedUrl);
        };
        link.onerror = reject;
        
        document.head.appendChild(link);
      });
    });

    return Promise.allSettled(promises);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Image cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      loadingImages: this.loadingImages.size,
      supportedFormats: Array.from(this.supportedFormats)
    };
  }
}

// Create singleton instance
const imageOptimizer = new ImageOptimizer();

// React hook for image optimization
export const useOptimizedImage = (src, options = {}) => {
  const [imageSrc, setImageSrc] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    const optimizedSrc = imageOptimizer.getOptimizedUrl(src, options);
    
    const img = new Image();
    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoading(false);
    };
    img.onerror = (err) => {
      setError(err);
      setIsLoading(false);
    };
    img.src = optimizedSrc;

  }, [src, JSON.stringify(options)]);

  return { imageSrc, isLoading, error };
};

// React component for optimized images
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  quality = 80,
  lazy = true,
  fallback,
  ...props 
}) => {
  const imgRef = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (imgRef.current && lazy) {
      imageOptimizer.observe(imgRef.current);
    }
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={lazy ? undefined : imageOptimizer.getOptimizedUrl(src, { width, height, quality })}
      data-src={src}
      data-width={width}
      data-height={height}
      data-quality={quality}
      data-fallback={fallback}
      alt={alt}
      className={`optimized-image ${className} ${isLoaded ? 'loaded' : ''}`}
      onLoad={handleLoad}
      {...props}
    />
  );
};

export default imageOptimizer;