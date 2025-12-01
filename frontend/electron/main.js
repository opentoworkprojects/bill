const { app, BrowserWindow, BrowserView, Menu, shell, ipcMain, Notification, session, globalShortcut } = require('electron');
const path = require('path');
const CONFIG = require('./config');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let whatsappView = null;
let whatsappConnected = false;
let whatsappViewVisible = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: CONFIG.WINDOW.WIDTH,
    height: CONFIG.WINDOW.HEIGHT,
    minWidth: CONFIG.WINDOW.MIN_WIDTH,
    minHeight: CONFIG.WINDOW.MIN_HEIGHT,
    title: CONFIG.APP_NAME,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: CONFIG.WINDOW.BACKGROUND_COLOR
  });

  // Load the app from web (finverge.tech)
  const startUrl = isDev ? CONFIG.DEV_URL : CONFIG.PRODUCTION_URL;
  
  console.log(`[BillByteKOT Desktop] Loading from: ${startUrl}`);
  console.log(`[BillByteKOT Desktop] Backend: ${CONFIG.BACKEND_URL}`);
  
  mainWindow.loadURL(startUrl);
  
  // Inject electronAPI bridge into the page after it loads
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[BillByteKOT Desktop] Page loaded, injecting Electron bridge');
    
    // Inject a bridge that uses postMessage for communication
    mainWindow.webContents.executeJavaScript(`
      window.__ELECTRON__ = true;
      window.__ELECTRON_VERSION__ = '${CONFIG.APP_VERSION}';
      
      // Create message queue for Electron communication
      window.__electronMessages = window.__electronMessages || [];
      
      // Create electronAPI bridge using message queue
      if (!window.electronAPI) {
        window.electronAPI = {
          isElectron: true,
          openWhatsAppWeb: () => {
            window.__electronMessages.push({ type: 'ELECTRON_OPEN_WHATSAPP' });
            console.log('[electronAPI] Queued: OPEN_WHATSAPP');
          },
          closeWhatsAppWeb: () => {
            window.__electronMessages.push({ type: 'ELECTRON_CLOSE_WHATSAPP' });
            console.log('[electronAPI] Queued: CLOSE_WHATSAPP');
          },
          getWhatsAppStatus: () => {
            return new Promise((resolve) => {
              const handler = (event) => {
                if (event.data && event.data.type === 'ELECTRON_WHATSAPP_STATUS_RESPONSE') {
                  window.removeEventListener('message', handler);
                  resolve(event.data.status);
                }
              };
              window.addEventListener('message', handler);
              window.__electronMessages.push({ type: 'ELECTRON_GET_WHATSAPP_STATUS' });
            });
          },
          sendWhatsAppDirect: (phone, message) => {
            return new Promise((resolve) => {
              const handler = (event) => {
                if (event.data && event.data.type === 'ELECTRON_SEND_WHATSAPP_RESPONSE') {
                  window.removeEventListener('message', handler);
                  resolve(event.data.result);
                }
              };
              window.addEventListener('message', handler);
              window.__electronMessages.push({ type: 'ELECTRON_SEND_WHATSAPP', phone, message });
            });
          },
          onWhatsAppStatus: (callback) => {
            window.addEventListener('message', (event) => {
              if (event.data.type === 'ELECTRON_WHATSAPP_STATUS_UPDATE') {
                callback(event.data.status);
              }
            });
          }
        };
        console.log('[BillByteKOT Desktop] electronAPI bridge created');
      }
    `);
  });
  
  // Listen for postMessage events from the web page via executeJavaScript polling
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(`
        if (window.__electronMessages && window.__electronMessages.length > 0) {
          const messages = window.__electronMessages;
          window.__electronMessages = [];
          messages;
        }
      `).then(messages => {
        if (messages && messages.length > 0) {
          messages.forEach(msg => {
            handleElectronMessage(msg);
          });
        }
      }).catch(() => {});
    }
  }, 100);
  
  function handleElectronMessage(msg) {
    console.log('[BillByteKOT Desktop] Received message:', msg.type);
    
    if (msg.type === 'ELECTRON_OPEN_WHATSAPP') {
      createWhatsAppView();
      showWhatsAppView();
    } else if (msg.type === 'ELECTRON_CLOSE_WHATSAPP') {
      hideWhatsAppView();
    } else if (msg.type === 'ELECTRON_GET_WHATSAPP_STATUS') {
      const status = {
        connected: whatsappConnected,
        viewVisible: whatsappViewVisible
      };
      mainWindow.webContents.executeJavaScript(`
        window.postMessage({ type: 'ELECTRON_WHATSAPP_STATUS_RESPONSE', status: ${JSON.stringify(status)} }, '*');
      `);
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // DevTools can be opened with F12 or Ctrl+Shift+I
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'BillByteKOT',
      submenu: [
        { label: 'About BillByteKOT', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('navigate', '/settings') },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools', label: 'Developer Tools', accelerator: 'F12' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+1', click: () => mainWindow.webContents.send('navigate', '/dashboard') },
        { label: 'Orders', accelerator: 'CmdOrCtrl+2', click: () => mainWindow.webContents.send('navigate', '/orders') },
        { label: 'Menu', accelerator: 'CmdOrCtrl+3', click: () => mainWindow.webContents.send('navigate', '/menu') },
        { label: 'Tables', accelerator: 'CmdOrCtrl+4', click: () => mainWindow.webContents.send('navigate', '/tables') },
        { label: 'Kitchen', accelerator: 'CmdOrCtrl+5', click: () => mainWindow.webContents.send('navigate', '/kitchen') },
        { type: 'separator' },
        { label: 'Reports', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.send('navigate', '/reports') },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('navigate', '/settings') }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://finverge.tech/docs') },
        { label: 'Support', click: () => shell.openExternal('https://finverge.tech/support') },
        { label: 'Visit Website', click: () => shell.openExternal('https://finverge.tech') },
        { type: 'separator' },
        { label: 'Check for Updates', click: () => checkForUpdates() }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handle notifications from renderer
ipcMain.on('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Handle print request
ipcMain.on('print-receipt', (event, content) => {
  const printWindow = new BrowserWindow({ show: false });
  printWindow.loadURL(`data:text/html,${encodeURIComponent(content)}`);
  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({ silent: false, printBackground: true }, (success) => {
      printWindow.close();
    });
  });
});

// Handle WhatsApp integration
ipcMain.on('send-whatsapp', (event, { phone, message }) => {
  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  shell.openExternal(whatsappUrl);
});

// Handle WhatsApp Business integration
ipcMain.on('send-whatsapp-business', (event, { phone, message, businessNumber }) => {
  // If business number is provided, use WhatsApp Business API
  if (businessNumber) {
    const businessUrl = `https://wa.me/${businessNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    shell.openExternal(businessUrl);
  } else {
    // Fallback to regular WhatsApp
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    shell.openExternal(whatsappUrl);
  }
});

// Handle bulk WhatsApp messages
ipcMain.on('send-bulk-whatsapp', (event, { contacts, message }) => {
  contacts.forEach((contact, index) => {
    setTimeout(() => {
      const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message.replace('{name}', contact.name))}`;
      shell.openExternal(whatsappUrl);
    }, index * 2000); // 2 second delay between each message
  });
});

// ============ WHATSAPP WEB INTEGRATION (EMBEDDED) ============

// Create persistent WhatsApp session
const getWhatsAppSession = () => {
  return session.fromPartition('persist:whatsapp', { cache: true });
};

// Create embedded WhatsApp BrowserView
function createWhatsAppView() {
  if (whatsappView) {
    return whatsappView;
  }

  const whatsappSession = getWhatsAppSession();

  whatsappView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      session: whatsappSession,
      webSecurity: true
    }
  });

  whatsappView.webContents.loadURL('https://web.whatsapp.com');

  // Set user agent to avoid WhatsApp blocking
  whatsappView.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Monitor connection status
  whatsappView.webContents.on('did-finish-load', () => {
    injectWhatsAppMonitor();
  });

  // Listen for console messages to detect connection status
  whatsappView.webContents.on('console-message', (_, __, message) => {
    if (message && message.startsWith('WHATSAPP_STATUS:')) {
      const status = message.replace('WHATSAPP_STATUS:', '');
      whatsappConnected = (status === 'connected');
      
      // Notify main window of status change
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-status', { 
          connected: whatsappConnected, 
          status: status 
        });
      }
    }
  });

  return whatsappView;
}

// Inject monitoring script into WhatsApp Web
function injectWhatsAppMonitor() {
  if (!whatsappView) return;
  
  whatsappView.webContents.executeJavaScript(`
    (function() {
      if (window.__whatsappMonitorInjected) return;
      window.__whatsappMonitorInjected = true;
      
      let lastStatus = null;
      
      const checkConnection = () => {
        try {
          const chatList = document.querySelector('[data-testid="chat-list"]') || 
                          document.querySelector('[aria-label="Chat list"]') ||
                          document.querySelector('div[data-tab="3"]') ||
                          document.querySelector('[data-testid="conversation-panel-wrapper"]');
          const qrCode = document.querySelector('[data-testid="qrcode"]') || 
                        document.querySelector('canvas[aria-label="Scan me!"]') ||
                        document.querySelector('div[data-ref]') ||
                        document.querySelector('[data-testid="intro-md-beta-logo-dark"]');
          
          let status = 'loading';
          if (chatList && !qrCode) {
            status = 'connected';
          } else if (qrCode) {
            status = 'qr_visible';
          }
          
          if (status !== lastStatus) {
            lastStatus = status;
            console.log('WHATSAPP_STATUS:' + status);
          }
        } catch(e) {}
      };
      
      checkConnection();
      setInterval(checkConnection, 2000);
    })();
  `).catch(() => {});
}

// Show WhatsApp view embedded in main window
function showWhatsAppView() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  if (!whatsappView) {
    createWhatsAppView();
  }
  
  mainWindow.setBrowserView(whatsappView);
  
  // Position the view (full window or split)
  const bounds = mainWindow.getBounds();
  whatsappView.setBounds({ 
    x: 0, 
    y: 0, 
    width: bounds.width, 
    height: bounds.height 
  });
  whatsappView.setAutoResize({ width: true, height: true });
  whatsappViewVisible = true;
  
  mainWindow.webContents.send('whatsapp-view-state', { visible: true });
}

// Hide WhatsApp view
function hideWhatsAppView() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  mainWindow.setBrowserView(null);
  whatsappViewVisible = false;
  
  mainWindow.webContents.send('whatsapp-view-state', { visible: false });
}

// Toggle WhatsApp view
ipcMain.on('toggle-whatsapp-view', () => {
  if (whatsappViewVisible) {
    hideWhatsAppView();
  } else {
    showWhatsAppView();
  }
});

// Open WhatsApp Web view
ipcMain.on('open-whatsapp-web', () => {
  showWhatsAppView();
});

// Close/Hide WhatsApp view
ipcMain.on('close-whatsapp-web', () => {
  hideWhatsAppView();
});

// Get WhatsApp connection status
ipcMain.handle('get-whatsapp-status', () => {
  return { 
    connected: whatsappConnected,
    viewVisible: whatsappViewVisible
  };
});

// Send message via WhatsApp Web directly
ipcMain.handle('send-whatsapp-direct', async (_, { phone, message }) => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!whatsappView) {
      createWhatsAppView();
    }
    
    // Show the WhatsApp view
    showWhatsAppView();
    
    // Wait a bit for view to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate to chat with message
    const chatUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    whatsappView.webContents.loadURL(chatUrl);

    return { success: true, message: 'Opening chat...' };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
});

// Send bulk messages via WhatsApp Web
ipcMain.handle('send-whatsapp-bulk-direct', async (_, { contacts, message }) => {
  try {
    if (!whatsappView) {
      createWhatsAppView();
    }
    
    showWhatsAppView();
    await new Promise(resolve => setTimeout(resolve, 1000));

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const cleanPhone = contact.phone.replace(/\D/g, '');
      const personalizedMessage = message.replace(/{name}/g, contact.name || 'Customer');
      
      const chatUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(personalizedMessage)}`;
      whatsappView.webContents.loadURL(chatUrl);
      
      // Notify progress
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-bulk-progress', {
          current: i + 1,
          total: contacts.length,
          contact: contact.name
        });
      }
      
      // Wait between messages
      if (i < contacts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    return { success: true, sent: contacts.length };
  } catch (error) {
    console.error('WhatsApp bulk send error:', error);
    return { success: false, error: error.message };
  }
});

// Logout from WhatsApp (clear session)
ipcMain.handle('logout-whatsapp', async () => {
  try {
    hideWhatsAppView();
    
    const whatsappSession = getWhatsAppSession();
    await whatsappSession.clearStorageData();
    whatsappConnected = false;
    
    // Destroy and recreate view
    if (whatsappView) {
      whatsappView.webContents.destroy();
      whatsappView = null;
    }
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('whatsapp-status', { connected: false, status: 'logged_out' });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Initialize WhatsApp on app start (to check if already logged in)
function initWhatsApp() {
  createWhatsAppView();
  // Don't show it, just create it to check login status
  setTimeout(() => {
    injectWhatsAppMonitor();
  }, 3000);
}

function checkForUpdates() {
  // Placeholder for auto-update functionality
  mainWindow.webContents.send('check-updates');
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  
  // Register global shortcuts for DevTools
  const toggleDevTools = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  };
  
  // F12 - Toggle DevTools
  globalShortcut.register('F12', toggleDevTools);
  
  // Ctrl+Shift+I - Toggle DevTools
  globalShortcut.register('CommandOrControl+Shift+I', toggleDevTools);
  
  // Ctrl+Shift+O - Toggle DevTools (custom shortcut)
  globalShortcut.register('CommandOrControl+Shift+O', toggleDevTools);
  
  // Initialize WhatsApp in background to check login status
  setTimeout(initWhatsApp, 2000);
});

app.on('window-all-closed', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});
