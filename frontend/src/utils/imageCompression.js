/**
 * Image Compression Utility
 * Client-side image compression with progress tracking and cancellation support
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

/**
 * Compression options structure
 * @typedef {Object} CompressionOptions
 * @property {number} maxWidth - Maximum image width (default: 1200)
 * @property {number} maxHeight - Maximum image height (default: 1200)
 * @property {number} quality - Compression quality 0-1 (default: 0.85)
 * @property {string} format - Output format (default: 'image/jpeg')
 * @property {boolean} maintainAspectRatio - Maintain aspect ratio (default: true)
 */

/**
 * Upload progress callback
 * @callback ProgressCallback
 * @param {number} percent - Progress percentage (0-100)
 * @param {string} stage - Current stage (compressing, uploading)
 * @param {Object} details - Additional details
 */

class ImageCompressionUtility {
  constructor() {
    this.defaultOptions = {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
      format: 'image/jpeg',
      maintainAspectRatio: true
    };

    this.debugMode = process.env.NODE_ENV === 'development';
    this.activeCompressions = new Map();
    this.activeUploads = new Map();
  }

  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[ImageCompression ${timestamp}] ${message}`, data || '');
    }
  }

  /**
   * Compress image file
   * @param {File} file - Image file to compress
   * @param {CompressionOptions} options - Compression options
   * @param {ProgressCallback} onProgress - Progress callback
   * @returns {Promise<Blob>} - Compressed image blob
   */
  async compressImage(file, options = {}, onProgress = null) {
    const startTime = Date.now();
    const compressionId = `compress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate file
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }

    // Merge options with defaults
    const finalOptions = { ...this.defaultOptions, ...options };

    this.log(`Starting compression for ${file.name}`, {
      originalSize: file.size,
      type: file.type,
      options: finalOptions
    });

    // Track active compression
    this.activeCompressions.set(compressionId, {
      file,
      startTime,
      cancelled: false
    });

    try {
      // Report initial progress
      if (onProgress) {
        onProgress(0, 'compressing', { fileName: file.name, originalSize: file.size });
      }

      // Load image
      const image = await this.loadImage(file);
      
      if (this.activeCompressions.get(compressionId)?.cancelled) {
        throw new Error('Compression cancelled');
      }

      if (onProgress) {
        onProgress(30, 'compressing', { stage: 'image loaded' });
      }

      // Calculate dimensions
      const dimensions = this.calculateDimensions(
        image.width,
        image.height,
        finalOptions
      );

      if (onProgress) {
        onProgress(50, 'compressing', { 
          stage: 'resizing',
          dimensions 
        });
      }

      // Create canvas and compress
      const compressedBlob = await this.compressToBlob(
        image,
        dimensions,
        finalOptions
      );

      if (this.activeCompressions.get(compressionId)?.cancelled) {
        throw new Error('Compression cancelled');
      }

      const duration = Date.now() - startTime;
      const compressionRatio = ((file.size - compressedBlob.size) / file.size) * 100;

      this.log(`Compression completed for ${file.name}`, {
        originalSize: file.size,
        compressedSize: compressedBlob.size,
        compressionRatio: compressionRatio.toFixed(2) + '%',
        duration
      });

      if (onProgress) {
        onProgress(100, 'compressing', {
          stage: 'complete',
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          compressionRatio,
          duration
        });
      }

      return compressedBlob;
    } catch (error) {
      this.log(`Compression failed for ${file.name}`, error);
      throw error;
    } finally {
      this.activeCompressions.delete(compressionId);
    }
  }

  /**
   * Load image from file
   * @param {File} file - Image file
   * @returns {Promise<HTMLImageElement>} - Loaded image
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          resolve(img);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calculate target dimensions maintaining aspect ratio
   * @param {number} width - Original width
   * @param {number} height - Original height
   * @param {CompressionOptions} options - Compression options
   * @returns {Object} - Target dimensions {width, height}
   */
  calculateDimensions(width, height, options) {
    let targetWidth = width;
    let targetHeight = height;

    if (options.maintainAspectRatio) {
      // Calculate scaling factor
      const widthScale = options.maxWidth / width;
      const heightScale = options.maxHeight / height;
      const scale = Math.min(widthScale, heightScale, 1); // Don't upscale

      // Scale both dimensions
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      
      // Round to maintain aspect ratio better
      // If width is the limiting factor, round width first
      if (widthScale < heightScale) {
        targetWidth = Math.round(scaledWidth);
        targetHeight = Math.round(targetWidth / (width / height));
      } else {
        // Height is the limiting factor, round height first
        targetHeight = Math.round(scaledHeight);
        targetWidth = Math.round(targetHeight * (width / height));
      }
    } else {
      targetWidth = Math.min(width, options.maxWidth);
      targetHeight = Math.min(height, options.maxHeight);
    }

    return { width: targetWidth, height: targetHeight };
  }

  /**
   * Compress image to blob using canvas
   * @param {HTMLImageElement} image - Image element
   * @param {Object} dimensions - Target dimensions
   * @param {CompressionOptions} options - Compression options
   * @returns {Promise<Blob>} - Compressed blob
   */
  compressToBlob(image, dimensions, options) {
    return new Promise((resolve, reject) => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        // Get context and draw image
        const ctx = canvas.getContext('2d');
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image
        ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          options.format,
          options.quality
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Upload image with progress tracking
   * @param {File|Blob} file - File or blob to upload
   * @param {string} uploadUrl - Upload URL
   * @param {Object} uploadOptions - Upload options (headers, etc.)
   * @param {ProgressCallback} onProgress - Progress callback
   * @returns {Promise<Object>} - Upload response
   */
  async uploadImageWithProgress(file, uploadUrl, uploadOptions = {}, onProgress = null) {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    this.log(`Starting upload`, {
      fileName: file.name || 'compressed-image',
      size: file.size,
      uploadUrl
    });

    // Create abort controller
    const abortController = new AbortController();

    // Track active upload
    this.activeUploads.set(uploadId, {
      file,
      startTime,
      abortController,
      cancelled: false
    });

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file, file.name || 'image.jpg');

      // Add additional fields if provided
      if (uploadOptions.additionalFields) {
        Object.entries(uploadOptions.additionalFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Setup progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded * 100) / e.total);
          
          if (onProgress) {
            onProgress(percent, 'uploading', {
              loaded: e.loaded,
              total: e.total,
              speed: this.calculateUploadSpeed(uploadId, e.loaded)
            });
          }
        }
      });

      // Setup abort signal
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      // Create promise for upload
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              resolve({ success: true, data: xhr.responseText });
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });
      });

      // Open and send request
      xhr.open('POST', uploadUrl);

      // Add headers
      if (uploadOptions.headers) {
        Object.entries(uploadOptions.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.send(formData);

      // Wait for upload to complete
      const response = await uploadPromise;

      const duration = Date.now() - startTime;
      this.log(`Upload completed`, {
        duration,
        size: file.size,
        speed: (file.size / duration * 1000 / 1024).toFixed(2) + ' KB/s'
      });

      if (onProgress) {
        onProgress(100, 'complete', {
          duration,
          response
        });
      }

      return response;
    } catch (error) {
      this.log(`Upload failed`, error);
      throw error;
    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  /**
   * Calculate upload speed
   * @param {string} uploadId - Upload ID
   * @param {number} loaded - Bytes loaded
   * @returns {number} - Speed in KB/s
   */
  calculateUploadSpeed(uploadId, loaded) {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) return 0;

    const duration = Date.now() - upload.startTime;
    if (duration === 0) return 0;

    return (loaded / duration * 1000 / 1024); // KB/s
  }

  /**
   * Cancel compression
   * @param {string} compressionId - Compression ID
   * @returns {boolean} - Success status
   */
  cancelCompression(compressionId) {
    const compression = this.activeCompressions.get(compressionId);
    if (!compression) return false;

    compression.cancelled = true;
    this.log(`Compression ${compressionId} cancelled`);
    return true;
  }

  /**
   * Cancel upload
   * @param {string} uploadId - Upload ID
   * @returns {boolean} - Success status
   */
  cancelUpload(uploadId) {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) return false;

    upload.cancelled = true;
    if (upload.abortController) {
      upload.abortController.abort();
    }

    this.log(`Upload ${uploadId} cancelled`);
    return true;
  }

  /**
   * Get active compressions
   * @returns {Array<Object>} - Array of active compressions
   */
  getActiveCompressions() {
    return Array.from(this.activeCompressions.entries()).map(([id, data]) => ({
      id,
      fileName: data.file.name,
      fileSize: data.file.size,
      duration: Date.now() - data.startTime
    }));
  }

  /**
   * Get active uploads
   * @returns {Array<Object>} - Array of active uploads
   */
  getActiveUploads() {
    return Array.from(this.activeUploads.entries()).map(([id, data]) => ({
      id,
      fileName: data.file.name || 'compressed-image',
      fileSize: data.file.size,
      duration: Date.now() - data.startTime
    }));
  }

  /**
   * Get statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      activeCompressions: this.activeCompressions.size,
      activeUploads: this.activeUploads.size,
      compressions: this.getActiveCompressions(),
      uploads: this.getActiveUploads()
    };
  }

  /**
   * Clear all active operations
   */
  clear() {
    // Cancel all compressions
    this.activeCompressions.forEach((data, id) => {
      data.cancelled = true;
    });
    this.activeCompressions.clear();

    // Cancel all uploads
    this.activeUploads.forEach((data, id) => {
      if (data.abortController) {
        data.abortController.abort();
      }
    });
    this.activeUploads.clear();

    this.log('All operations cleared');
  }
}

// Create singleton instance
const imageCompression = new ImageCompressionUtility();

// Export individual methods for convenience
export const compressImage = (file, options, onProgress) => 
  imageCompression.compressImage(file, options, onProgress);
export const uploadImageWithProgress = (file, uploadUrl, uploadOptions, onProgress) => 
  imageCompression.uploadImageWithProgress(file, uploadUrl, uploadOptions, onProgress);
export const cancelCompression = (compressionId) => 
  imageCompression.cancelCompression(compressionId);
export const cancelUpload = (uploadId) => 
  imageCompression.cancelUpload(uploadId);
export const getActiveCompressions = () => 
  imageCompression.getActiveCompressions();
export const getActiveUploads = () => 
  imageCompression.getActiveUploads();
export const getStats = () => 
  imageCompression.getStats();

// Export both class and singleton
export { ImageCompressionUtility };
export default imageCompression;
