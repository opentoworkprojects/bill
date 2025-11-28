const { app, BrowserWindow, Menu, shell, ipcMain, Notification } = require('electron');
const path = require('path');
const CONFIG = require('./config');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: CONFIG.WINDOW.WIDTH,
    height: CONFIG.WINDOW.HEIGHT,
    minWidth: CONFIG.WINDOW.MIN_WIDTH,
    minHeight: CONFIG.WINDOW.MIN_HEIGHT,
    icon: path.join(__dirname, '../public/logo192.png'),
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

  // Load the app - Use finverge.tech in production, localhost in dev
  const startUrl = isDev ? CONFIG.DEV_URL : CONFIG.PRODUCTION_URL;
  
  console.log(`[RestoBill Desktop] Loading from: ${startUrl}`);
  console.log(`[RestoBill Desktop] Backend: ${CONFIG.BACKEND_URL}`);
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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
      label: 'RestoBill',
      submenu: [
        { label: 'About RestoBill', role: 'about' },
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

function checkForUpdates() {
  // Placeholder for auto-update functionality
  mainWindow.webContents.send('check-updates');
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
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
