/**
 * Unit Tests for Image Compression Utility
 * Feature: menu-page-performance
 * Tests specific edge cases and error conditions
 * Requirements: 3.3, 3.4, 3.5
 */

import { ImageCompressionUtility } from '../imageCompression';

// Mock File class
class MockFile extends Blob {
  constructor(bits, name, options) {
    super(bits, options);
    this.name = name;
    this.lastModified = Date.now();
  }
}

global.File = MockFile;

// Helper function to create mock image files
const createMockImageFile = (name, size, type = 'image/jpeg') => {
  const file = new MockFile(['image data'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock canvas and image APIs
class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = null;
    this.width = 1920;
    this.height = 1080;
  }

  set src(value) {
    this._src = value;
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }

  get src() {
    return this._src;
  }
}

class MockCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
    this._context = {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      drawImage: jest.fn()
    };
  }

  getContext() {
    return this._context;
  }

  toBlob(callback, format, quality) {
    const size = Math.floor(this.width * this.height * quality * 0.1);
    const blob = new Blob(['mock image data'], { type: format });
    Object.defineProperty(blob, 'size', { value: size });
    setTimeout(() => callback(blob), 10);
  }
}

global.Image = MockImage;
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return new MockCanvas();
    }
    return {};
  }
};

class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }

  readAsDataURL(file) {
    this.result = `data:${file.type};base64,mockdata`;
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 10);
  }
}

global.FileReader = MockFileReader;

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  constructor() {
    this.upload = {
      addEventListener: jest.fn()
    };
    this.addEventListener = jest.fn();
    this.open = jest.fn();
    this.send = jest.fn();
    this.setRequestHeader = jest.fn();
    this.abort = jest.fn();
    this.status = 200;
    this.responseText = JSON.stringify({ success: true, url: 'http://example.com/image.jpg' });
  }

  simulateProgress(loaded, total) {
    const progressHandler = this.upload.addEventListener.mock.calls.find(
      call => call[0] === 'progress'
    );
    if (progressHandler) {
      progressHandler[1]({ lengthComputable: true, loaded, total });
    }
  }

  simulateLoad() {
    const loadHandler = this.addEventListener.mock.calls.find(
      call => call[0] === 'load'
    );
    if (loadHandler) {
      loadHandler[1]();
    }
  }

  simulateError() {
    const errorHandler = this.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    );
    if (errorHandler) {
      errorHandler[1]();
    }
  }

  simulateAbort() {
    const abortHandler = this.addEventListener.mock.calls.find(
      call => call[0] === 'abort'
    );
    if (abortHandler) {
      abortHandler[1]();
    }
  }
}

global.XMLHttpRequest = MockXMLHttpRequest;

describe('ImageCompression Unit Tests - Edge Cases', () => {
  let compression;

  beforeEach(() => {
    compression = new ImageCompressionUtility();
    jest.clearAllMocks();
  });

  afterEach(() => {
    compression.clear();
  });

  /**
   * Test invalid file types
   * Requirements: 3.3
   */
  describe('invalid file types', () => {
    test('rejects non-image files', async () => {
      const textFile = new MockFile(['text content'], 'document.txt', { type: 'text/plain' });

      await expect(compression.compressImage(textFile)).rejects.toThrow('File is not an image');
    });

    test('rejects PDF files', async () => {
      const pdfFile = new MockFile(['pdf content'], 'document.pdf', { type: 'application/pdf' });

      await expect(compression.compressImage(pdfFile)).rejects.toThrow('File is not an image');
    });

    test('rejects video files', async () => {
      const videoFile = new MockFile(['video content'], 'video.mp4', { type: 'video/mp4' });

      await expect(compression.compressImage(videoFile)).rejects.toThrow('File is not an image');
    });

    test('accepts JPEG files', async () => {
      const jpegFile = new MockFile(['image data'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(jpegFile, 'size', { value: 50000 });

      const result = await compression.compressImage(jpegFile);
      expect(result).toBeInstanceOf(Blob);
    });

    test('accepts PNG files', async () => {
      const pngFile = new MockFile(['image data'], 'photo.png', { type: 'image/png' });
      Object.defineProperty(pngFile, 'size', { value: 50000 });

      const result = await compression.compressImage(pngFile);
      expect(result).toBeInstanceOf(Blob);
    });

    test('accepts WebP files', async () => {
      const webpFile = new MockFile(['image data'], 'photo.webp', { type: 'image/webp' });
      Object.defineProperty(webpFile, 'size', { value: 50000 });

      const result = await compression.compressImage(webpFile);
      expect(result).toBeInstanceOf(Blob);
    });
  });

  /**
   * Test oversized files
   * Requirements: 3.3
   */
  describe('oversized files', () => {
    test('handles very large files', async () => {
      const largeFile = new MockFile(['large image data'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 50000000 }); // 50MB

      const result = await compression.compressImage(largeFile);
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeLessThan(largeFile.size);
    });

    test('compresses to reasonable size', async () => {
      const file = new MockFile(['image data'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10000000 }); // 10MB

      const result = await compression.compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });

    test('handles minimum file size', async () => {
      const tinyFile = new MockFile(['x'], 'tiny.jpg', { type: 'image/jpeg' });
      Object.defineProperty(tinyFile, 'size', { value: 100 }); // 100 bytes

      const result = await compression.compressImage(tinyFile);
      expect(result).toBeInstanceOf(Blob);
    });
  });

  /**
   * Test upload cancellation
   * Requirements: 3.5
   */
  describe('upload cancellation', () => {
    test('cancels upload successfully', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const uploadPromise = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        {}
      );

      // Get active uploads
      const activeUploads = compression.getActiveUploads();
      expect(activeUploads.length).toBeGreaterThan(0);

      // Cancel the upload
      const uploadId = activeUploads[0].id;
      const cancelled = compression.cancelUpload(uploadId);
      expect(cancelled).toBe(true);

      // Upload should fail with cancellation error
      await expect(uploadPromise).rejects.toThrow();
    });

    test('returns false when cancelling non-existent upload', () => {
      const cancelled = compression.cancelUpload('non_existent_id');
      expect(cancelled).toBe(false);
    });

    test('clears upload from active list after cancellation', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const uploadPromise = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        {}
      );

      const activeUploads = compression.getActiveUploads();
      const uploadId = activeUploads[0].id;

      compression.cancelUpload(uploadId);

      try {
        await uploadPromise;
      } catch (error) {
        // Expected
      }

      // Should be removed from active uploads
      const finalUploads = compression.getActiveUploads();
      expect(finalUploads.find(u => u.id === uploadId)).toBeUndefined();
    });

    test('cancels compression successfully', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const compressionPromise = compression.compressImage(file);

      // Get active compressions
      const activeCompressions = compression.getActiveCompressions();
      
      if (activeCompressions.length > 0) {
        const compressionId = activeCompressions[0].id;
        const cancelled = compression.cancelCompression(compressionId);
        expect(cancelled).toBe(true);
      }

      try {
        await compressionPromise;
      } catch (error) {
        // Cancellation may cause error
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  /**
   * Test upload retry after failure
   * Requirements: 3.4
   */
  describe('upload retry after failure', () => {
    test('retries upload with same file', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      // First upload fails
      const xhr1 = new MockXMLHttpRequest();
      xhr1.status = 500;
      global.XMLHttpRequest = jest.fn(() => xhr1);

      const promise1 = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        {}
      );

      setTimeout(() => xhr1.simulateError(), 50);

      await expect(promise1).rejects.toThrow();

      // Retry with same file (should work)
      const xhr2 = new MockXMLHttpRequest();
      xhr2.status = 200;
      global.XMLHttpRequest = jest.fn(() => xhr2);

      const promise2 = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        {}
      );

      setTimeout(() => xhr2.simulateLoad(), 50);

      const result = await promise2;
      expect(result).toBeDefined();
    });

    test('preserves file data across retries', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const originalSize = file.size;
      const originalName = file.name;

      // First attempt
      try {
        const xhr = new MockXMLHttpRequest();
        xhr.status = 500;
        global.XMLHttpRequest = jest.fn(() => xhr);

        const promise = compression.uploadImageWithProgress(
          file,
          'http://example.com/upload',
          {}
        );

        setTimeout(() => xhr.simulateError(), 50);
        await promise;
      } catch (error) {
        // Expected
      }

      // File properties should be unchanged
      expect(file.size).toBe(originalSize);
      expect(file.name).toBe(originalName);
    });
  });

  /**
   * Test progress tracking
   */
  describe('progress tracking', () => {
    test('reports progress during compression', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const progressUpdates = [];
      const onProgress = (percent, stage, details) => {
        progressUpdates.push({ percent, stage, details });
      };

      await compression.compressImage(file, {}, onProgress);

      // Should have received progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);

      // First update should be 0%
      expect(progressUpdates[0].percent).toBe(0);

      // Last update should be 100%
      expect(progressUpdates[progressUpdates.length - 1].percent).toBe(100);

      // All updates should have valid stage
      progressUpdates.forEach(update => {
        expect(update.stage).toBeDefined();
        expect(update.percent).toBeGreaterThanOrEqual(0);
        expect(update.percent).toBeLessThanOrEqual(100);
      });
    });

    test('reports progress during upload', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const progressUpdates = [];
      const onProgress = (percent, stage, details) => {
        progressUpdates.push({ percent, stage, details });
      };

      const xhr = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => xhr);

      const uploadPromise = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        {},
        onProgress
      );

      // Simulate progress
      setTimeout(() => {
        xhr.simulateProgress(25000, 50000); // 50%
        xhr.simulateProgress(50000, 50000); // 100%
        xhr.simulateLoad();
      }, 50);

      await uploadPromise;

      // Should have received progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    test('handles progress callback errors gracefully', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const onProgress = () => {
        throw new Error('Progress callback error');
      };

      // Should not throw even if callback throws
      await expect(compression.compressImage(file, {}, onProgress)).resolves.toBeDefined();
    });
  });

  /**
   * Test error conditions
   */
  describe('error conditions', () => {
    test('handles null file', async () => {
      await expect(compression.compressImage(null)).rejects.toThrow('Invalid file provided');
    });

    test('handles undefined file', async () => {
      await expect(compression.compressImage(undefined)).rejects.toThrow('Invalid file provided');
    });

    test('handles non-File object', async () => {
      await expect(compression.compressImage({ not: 'a file' })).rejects.toThrow();
    });

    test('handles upload with invalid URL', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const xhr = new MockXMLHttpRequest();
      xhr.status = 404;
      global.XMLHttpRequest = jest.fn(() => xhr);

      const promise = compression.uploadImageWithProgress(
        file,
        'http://example.com/invalid',
        {}
      );

      setTimeout(() => xhr.simulateLoad(), 50);

      await expect(promise).rejects.toThrow();
    });

    test('handles network error during upload', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const xhr = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => xhr);

      const promise = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        {}
      );

      setTimeout(() => xhr.simulateError(), 50);

      await expect(promise).rejects.toThrow('Upload failed');
    });
  });

  /**
   * Test statistics and tracking
   */
  describe('statistics and tracking', () => {
    test('tracks active compressions', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const promise = compression.compressImage(file);

      const stats = compression.getStats();
      expect(stats.activeCompressions).toBeGreaterThanOrEqual(0);
      expect(stats.activeUploads).toBe(0);

      await promise;

      const finalStats = compression.getStats();
      expect(finalStats.activeCompressions).toBe(0);
    });

    test('tracks active uploads', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const xhr = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => xhr);

      const promise = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        {}
      );

      const stats = compression.getStats();
      expect(stats.activeUploads).toBeGreaterThanOrEqual(0);

      setTimeout(() => xhr.simulateLoad(), 50);
      await promise;

      const finalStats = compression.getStats();
      expect(finalStats.activeUploads).toBe(0);
    });

    test('clears all operations', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      // Start compression
      const compressionPromise = compression.compressImage(file);

      // Start upload
      const xhr = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => xhr);
      const uploadPromise = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        {}
      );

      // Clear all
      compression.clear();

      const stats = compression.getStats();
      expect(stats.activeCompressions).toBe(0);
      expect(stats.activeUploads).toBe(0);

      // Wait for promises to settle
      try {
        await compressionPromise;
      } catch (e) {}
      
      try {
        setTimeout(() => xhr.simulateLoad(), 50);
        await uploadPromise;
      } catch (e) {}
    });
  });

  /**
   * Test upload options
   */
  describe('upload options', () => {
    test('includes additional fields in upload', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const xhr = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => xhr);

      const uploadOptions = {
        additionalFields: {
          userId: '123',
          category: 'menu'
        }
      };

      const promise = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        uploadOptions
      );

      setTimeout(() => xhr.simulateLoad(), 50);
      await promise;

      // Verify send was called
      expect(xhr.send).toHaveBeenCalled();
    });

    test('includes custom headers in upload', async () => {
      const file = createMockImageFile('photo.jpg', 50000);

      const xhr = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => xhr);

      const uploadOptions = {
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'value'
        }
      };

      const promise = compression.uploadImageWithProgress(
        file,
        'http://example.com/upload',
        uploadOptions
      );

      setTimeout(() => xhr.simulateLoad(), 50);
      await promise;

      // Verify headers were set
      expect(xhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer token123');
      expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Custom-Header', 'value');
    });
  });
});

