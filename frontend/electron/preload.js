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
  
  // WhatsApp Integration (legacy - opens external browser)
  sendWhatsApp: (phone, message) => ipcRenderer.send('send-whatsapp', { phone, message }),
  sendWhatsAppBusiness: (phone, message, businessNumber) => ipcRenderer.send('send-whatsapp-business', { phone, message, businessNumber }),
  sendBulkWhatsApp: (contacts, message) => ipcRenderer.send('send-bulk-whatsapp', { contacts, message }),
  
  // WhatsApp Web Integration (built-in with persistent session)
  openWhatsAppWeb: () => ipcRenderer.send('open-whatsapp-web'),
  closeWhatsAppWeb: () => ipcRenderer.send('close-whatsapp-web'),
  toggleWhatsAppView: () => ipcRenderer.send('toggle-whatsapp-view'),
  getWhatsAppStatus: () => ipcRenderer.invoke('get-whatsapp-status'),
  sendWhatsAppDirect: (phone, message) => ipcRenderer.invoke('send-whatsapp-direct', { phone, message }),
  sendWhatsAppBulkDirect: (contacts, message) => ipcRenderer.invoke('send-whatsapp-bulk-direct', { contacts, message }),
  logoutWhatsApp: () => ipcRenderer.invoke('logout-whatsapp'),
  
  // WhatsApp event listeners
  onWhatsAppStatus: (callback) => ipcRenderer.on('whatsapp-status', (_event, data) => callback(data)),
  onWhatsAppBulkProgress: (callback) => ipcRenderer.on('whatsapp-bulk-progress', (_event, data) => callback(data)),
  onWhatsAppViewState: (callback) => ipcRenderer.on('whatsapp-view-state', (_event, data) => callback(data)),
  
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
console.log(`[RestoBill Desktop] electronAPI exposed:`, typeof window !== 'undefined' ? 'YES' : 'NO');

// Verify electronAPI is available after page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[RestoBill Desktop] electronAPI available:', !!window.electronAPI);
    console.log('[RestoBill Desktop] openWhatsAppWeb available:', !!window.electronAPI?.openWhatsAppWeb);
  });
}
