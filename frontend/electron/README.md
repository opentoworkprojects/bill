# BillByteKOT Desktop App (Electron)

Desktop application for BillByteKOT - Restaurant Billing & Management System by FinVerge Tech.

## Configuration

- **Frontend**: https://finverge.tech
- **Backend**: https://restro-ai.onrender.com
- **Company**: FinVerge Tech

## Features

- 🖥️ Native desktop app for Windows, macOS, and Linux
- 📋 Native menu bar with keyboard shortcuts
- 🔔 Native system notifications
- 🖨️ Native print dialog for receipts
- 🌐 Loads from finverge.tech (no local build needed)
- 🎨 Native window controls

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Running in Development

```bash
cd frontend
npm install
npm run electron:dev
```

This will:
1. Start the React development server on port 3000
2. Wait for the server to be ready
3. Launch Electron pointing to localhost:3000

### Building for Production

The production build loads directly from **finverge.tech** - no React build needed!

#### Build for Windows:
```bash
npm run electron:build:win
```

#### Build for macOS:
```bash
npm run electron:build:mac
```

#### Build for Linux:
```bash
npm run electron:build:linux
```

### Output

Built applications will be in `frontend/dist-electron/`:

- **Windows**: `BillByteKOT-1.0.0-win-x64.exe` (installer) and portable version
- **macOS**: `BillByteKOT-1.0.0-mac.dmg`
- **Linux**: `BillByteKOT-1.0.0-linux.AppImage`

## Configuration Files

### `config.js`
Main configuration file with URLs and settings:
```javascript
module.exports = {
  PRODUCTION_URL: 'https://finverge.tech',
  BACKEND_URL: 'https://restro-ai.onrender.com',
  // ... other settings
};
```

### Changing URLs
To point to a different deployment, edit `electron/config.js`:
```javascript
PRODUCTION_URL: 'https://your-domain.com',
BACKEND_URL: 'https://your-backend.onrender.com',
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + 1 | Dashboard |
| Ctrl/Cmd + 2 | Orders |
| Ctrl/Cmd + 3 | Menu |
| Ctrl/Cmd + 4 | Tables |
| Ctrl/Cmd + 5 | Kitchen |
| Ctrl/Cmd + R | Reports |
| Ctrl/Cmd + , | Settings |
| Ctrl/Cmd + Q | Quit |

## Architecture

```
electron/
├── main.js      # Main process (window management, menus)
├── preload.js   # Preload script (secure bridge to renderer)
└── README.md    # This file

src/
├── hooks/
│   └── useElectron.js    # React hook for Electron features
└── components/
    └── DesktopInfo.js    # Desktop app info component
```

## Security

- Context isolation enabled
- Node integration disabled
- Preload script provides secure API bridge
- External links open in default browser

## Troubleshooting

### App won't start
- Ensure all dependencies are installed: `npm install`
- Check if port 3000 is available for dev mode

### Build fails
- Clear cache: `rm -rf node_modules/.cache`
- Reinstall: `npm run clean-install`

### Icons not showing
- Ensure `public/logo192.png` and `public/logo512.png` exist
- For Windows, you may need `.ico` format
