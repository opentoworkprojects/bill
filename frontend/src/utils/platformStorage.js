// ✅ Platform-Specific Storage Manager
// Handles storage across Web, Desktop (Electron), and Mobile (Capacitor)

class PlatformStorage {
  constructor() {
    this.platform = this.detectPlatform();
    this.storage = null;
  }

  detectPlatform() {
    if (typeof window !== 'undefined') {
      if (window.electronAPI || window.__ELECTRON__) {
        return 'electron';
      } else if (window.Capacitor) {
        return 'capacitor';
      }
    }
    return 'web';
  }

  async initializeStorage() {
    switch (this.platform) {
      case 'electron':
        this.storage = new ElectronStorage();
        break;
      case 'capacitor':
        this.storage = new CapacitorStorage();
        break;
      default:
        this.storage = new WebStorage();
    }
    
    await this.storage.initialize();
    console.log(`✅ ${this.platform} storage initialized`);
  }

  // Unified API methods
  async get(key) {
    return await this.storage.get(key);
  }

  async set(key, value) {
    return await this.storage.set(key, value);
  }

  async remove(key) {
    return await this.storage.remove(key);
  }

  async clear() {
    return await this.storage.clear();
  }

  async keys() {
    return await this.storage.keys();
  }

  async getStorageInfo() {
    return await this.storage.getStorageInfo();
  }

  // Database operations
  async query(sql, params = []) {
    return await this.storage.query(sql, params);
  }

  async executeBatch(operations) {
    return await this.storage.executeBatch(operations);
  }

  // File operations
  async exportToFile(data, filename) {
    return await this.storage.exportToFile(data, filename);
  }

  async importFromFile(filepath) {
    return await this.storage.importFromFile(filepath);
  }
}

// Web Storage Implementation (IndexedDB)
class WebStorage {
  constructor() {
    this.dbName = 'BillByteKOT_DB';
    this.version = 1;
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('key_value')) {
          const store = db.createObjectStore('key_value', { keyPath: 'key' });
          store.createIndex('key', 'key', { unique: true });
        }
      };
    });
  }

  async get(key) {
    const transaction = this.db.transaction(['key_value'], 'readonly');
    const store = transaction.objectStore('key_value');
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key, value) {
    const transaction = this.db.transaction(['key_value'], 'readwrite');
    const store = transaction.objectStore('key_value');
    const request = store.put({ key, value, timestamp: Date.now() });
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key) {
    const transaction = this.db.transaction(['key_value'], 'readwrite');
    const store = transaction.objectStore('key_value');
    const request = store.delete(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    const transaction = this.db.transaction(['key_value'], 'readwrite');
    const store = transaction.objectStore('key_value');
    const request = store.clear();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async keys() {
    const transaction = this.db.transaction(['key_value'], 'readonly');
    const store = transaction.objectStore('key_value');
    const request = store.getAllKeys();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        platform: 'web',
        type: 'IndexedDB',
        used: estimate.usage,
        available: estimate.quota,
        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    }
    return { platform: 'web', type: 'IndexedDB' };
  }

  async query(sql, params) {
    // IndexedDB doesn't support SQL, so we simulate it
    throw new Error('SQL queries not supported in web storage');
  }

  async executeBatch(operations) {
    const results = [];
    for (const op of operations) {
      try {
        switch (op.type) {
          case 'set':
            await this.set(op.key, op.value);
            results.push({ success: true });
            break;
          case 'remove':
            await this.remove(op.key);
            results.push({ success: true });
            break;
          default:
            results.push({ success: false, error: 'Unknown operation' });
        }
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }

  async exportToFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true, path: filename };
  }

  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// Electron Storage Implementation (SQLite)
class ElectronStorage {
  constructor() {
    this.electronAPI = window.electronAPI;
  }

  async initialize() {
    if (!this.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    // Initialize SQLite database
    await this.electronAPI.initDatabase();
  }

  async get(key) {
    return await this.electronAPI.storageGet(key);
  }

  async set(key, value) {
    return await this.electronAPI.storageSet(key, value);
  }

  async remove(key) {
    return await this.electronAPI.storageRemove(key);
  }

  async clear() {
    return await this.electronAPI.storageClear();
  }

  async keys() {
    return await this.electronAPI.storageKeys();
  }

  async getStorageInfo() {
    return await this.electronAPI.getStorageInfo();
  }

  async query(sql, params) {
    return await this.electronAPI.query(sql, params);
  }

  async executeBatch(operations) {
    return await this.electronAPI.executeBatch(operations);
  }

  async exportToFile(data, filename) {
    return await this.electronAPI.exportToFile(data, filename);
  }

  async importFromFile(filepath) {
    return await this.electronAPI.importFromFile(filepath);
  }
}

// Capacitor Storage Implementation (SQLite)
class CapacitorStorage {
  constructor() {
    this.Preferences = null;
    this.SQLite = null;
    this.Filesystem = null;
    this.Device = null;
    this.Permissions = null;
  }

  async initialize() {
    try {
      // Import Capacitor plugins dynamically
      if (typeof window !== 'undefined' && window.Capacitor) {
        const { Preferences } = await import('@capacitor/preferences');
        const { CapacitorSQLite } = await import('@capacitor-community/sqlite').catch(() => ({ CapacitorSQLite: null }));
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Device } = await import('@capacitor/device');
        
        this.Preferences = Preferences;
        this.SQLite = CapacitorSQLite;
        this.Filesystem = Filesystem;
        this.Directory = Directory;
        this.Encoding = Encoding;
        this.Device = Device;
        this.Permissions = null; // Permissions not imported
        
        // Initialize SQLite database only if available
        if (this.SQLite) {
          await this.SQLite.createConnection({
            database: 'billbytekot.db',
            version: 1,
            encrypted: false,
            mode: 'full'
          });
        }
        
        console.log('✅ Capacitor storage initialized');
      } else {
        throw new Error('Capacitor not available');
      }
    } catch (error) {
      console.error('Failed to initialize Capacitor storage:', error);
      throw error;
    }
  }

  async get(key) {
    const result = await this.Preferences.get({ key });
    return result.value ? JSON.parse(result.value) : null;
  }

  async set(key, value) {
    await this.Preferences.set({ 
      key, 
      value: JSON.stringify(value) 
    });
  }

  async remove(key) {
    await this.Preferences.remove({ key });
  }

  async clear() {
    await this.Preferences.clear();
  }

  async keys() {
    const result = await this.Preferences.keys();
    return result.keys;
  }

  async getStorageInfo() {
    const keys = await this.keys();
    let totalSize = 0;
    
    for (const key of keys) {
      const value = await this.get(key);
      totalSize += JSON.stringify(value).length;
    }
    
    return {
      platform: 'capacitor',
      type: 'SQLite + Storage API',
      itemCount: keys.length,
      estimatedSize: totalSize,
      sizeFormatted: `${(totalSize / 1024).toFixed(2)} KB`
    };
  }

  async query(sql, params = []) {
    if (!this.SQLite) {
      console.warn('SQLite not available, skipping query');
      return [];
    }
    const result = await this.SQLite.query({
      database: 'billbytekot.db',
      statement: sql,
      values: params
    });
    return result.values;
  }

  async executeBatch(operations) {
    if (!this.SQLite) {
      console.warn('SQLite not available, skipping batch execution');
      return { changes: 0 };
    }
    const statements = operations.map(op => ({
      statement: op.sql,
      values: op.params || []
    }));
    
    const result = await this.SQLite.executeSet({
      database: 'billbytekot.db',
      set: statements
    });
    
    return result.changes;
  }

  async exportToFile(data, filename) {
    try {
      // Use Capacitor Filesystem plugin
      const result = await this.Filesystem.writeFile({
        path: filename,
        data: JSON.stringify(data, null, 2),
        directory: this.Directory.Documents,
        encoding: this.Encoding.UTF8
      });
      
      return { success: true, path: result.uri };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  }

  async importFromFile(filepath) {
    try {
      const result = await this.Filesystem.readFile({
        path: filepath,
        directory: this.Directory.Documents,
        encoding: this.Encoding.UTF8
      });
      
      return JSON.parse(result.data);
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const platformStorage = new PlatformStorage();
export default PlatformStorage;