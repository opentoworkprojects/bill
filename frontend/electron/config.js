/**
 * RestoBill Desktop App Configuration
 * 
 * This file contains configuration for the Electron desktop app.
 * Update these values for your deployment.
 */

module.exports = {
  // Your deployed frontend URL (finverge.tech)
  PRODUCTION_URL: 'https://finverge.tech',
  
  // Backend API URL (Render deployment)
  BACKEND_URL: 'https://restro-ai.onrender.com',
  
  // App Information
  APP_NAME: 'RestoBill',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Restaurant Billing & Management System',
  
  // Company Information
  COMPANY_NAME: 'FinVerge Tech',
  COMPANY_URL: 'https://finverge.tech',
  SUPPORT_EMAIL: 'support@finverge.tech',
  
  // Window Settings
  WINDOW: {
    WIDTH: 1400,
    HEIGHT: 900,
    MIN_WIDTH: 1024,
    MIN_HEIGHT: 700,
    BACKGROUND_COLOR: '#f5f3ff'
  },
  
  // Development Settings
  DEV_URL: 'http://localhost:3000',
  DEV_TOOLS: true,
  
  // Update Settings (for future auto-update feature)
  UPDATE_URL: 'https://finverge.tech/updates',
  CHECK_FOR_UPDATES: true,
  
  // Feature Flags
  FEATURES: {
    NOTIFICATIONS: true,
    NATIVE_PRINT: true,
    AUTO_UPDATE: false, // Enable when auto-update server is ready
    OFFLINE_MODE: false
  }
};
