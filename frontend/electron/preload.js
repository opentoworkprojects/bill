const { contextBridge, ipcRenderer } = require('electron');
const CONFIG = require('./config');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation
  onNavigate: (callback) => ipcRenderer.on('navigate', (_event, path) => callback(path)),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  
  // Printing
  printReceipt: (content) => ipcRenderer.send('print-receipt', content),
  
  // Updates
  onCheckUpdates: (callback) => ipcRenderer.on('check-updates', () => callback()),
  
  // Platform info
  platform: process.platform,
  isElectron: true,
  
  // App info
  appName: CONFIG.APP_NAME,
  appVersion: CONFIG.APP_VERSION,
  companyName: CONFIG.COMPANY_NAME,
  backendUrl: CONFIG.BACKEND_URL,
  
  // Get version
  getVersion: () => CONFIG.APP_VERSION,
  
  // Get config (safe subset)
  getConfig: () => ({
    appName: CONFIG.APP_NAME,
    appVersion: CONFIG.APP_VERSION,
    companyName: CONFIG.COMPANY_NAME,
    companyUrl: CONFIG.COMPANY_URL
  })
});

// Log that preload script loaded
console.log(`[RestoBill Desktop] v${CONFIG.APP_VERSION} - Preload script loaded`);
console.log(`[RestoBill Desktop] Platform: ${process.platform}`);
