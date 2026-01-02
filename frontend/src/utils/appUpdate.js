// App Update Utility - Check for updates and show in-app notification
import { toast } from 'sonner';

const APP_VERSION_KEY = 'billbytekot_app_version';
const LAST_UPDATE_CHECK_KEY = 'billbytekot_last_update_check';
const UPDATE_DISMISSED_KEY = 'billbytekot_update_dismissed';

// Current app version (update this when releasing new versions)
export const CURRENT_VERSION = '1.4.0';

// Check for updates from backend
export const checkForUpdates = async (apiBaseUrl) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/app-version`);
    if (!response.ok) return null;
    
    const data = await response.json();
    localStorage.setItem(LAST_UPDATE_CHECK_KEY, new Date().toISOString());
    
    return {
      latestVersion: data.version,
      currentVersion: CURRENT_VERSION,
      hasUpdate: compareVersions(data.version, CURRENT_VERSION) > 0,
      releaseNotes: data.release_notes || '',
      forceUpdate: data.force_update || false,
      downloadUrl: data.download_url || null,
      updateMessage: data.message || 'A new version is available!'
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return null;
  }
};

// Compare version strings (returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal)
const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

// Check if update was dismissed recently (within 24 hours)
export const isUpdateDismissed = (version) => {
  try {
    const dismissed = JSON.parse(localStorage.getItem(UPDATE_DISMISSED_KEY) || '{}');
    if (dismissed.version !== version) return false;
    
    const dismissedAt = new Date(dismissed.timestamp);
    const hoursSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceDismissed < 24;
  } catch (e) {
    return false;
  }
};

// Dismiss update notification
export const dismissUpdate = (version) => {
  localStorage.setItem(UPDATE_DISMISSED_KEY, JSON.stringify({
    version,
    timestamp: new Date().toISOString()
  }));
};

// Should check for updates (not more than once per hour)
export const shouldCheckForUpdates = () => {
  try {
    const lastCheck = localStorage.getItem(LAST_UPDATE_CHECK_KEY);
    if (!lastCheck) return true;
    
    const hoursSinceLastCheck = (Date.now() - new Date(lastCheck).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastCheck >= 1;
  } catch (e) {
    return true;
  }
};

// Refresh the app (for PWA/TWA)
export const refreshApp = () => {
  // Clear service worker cache and reload
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.update();
      });
    });
  }
  
  // Clear caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Hard reload
  window.location.reload(true);
};

// Get stored version
export const getStoredVersion = () => {
  return localStorage.getItem(APP_VERSION_KEY) || CURRENT_VERSION;
};

// Update stored version
export const updateStoredVersion = () => {
  localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
};

// Check if this is a fresh install or update
export const checkVersionChange = () => {
  const storedVersion = getStoredVersion();
  const isNewInstall = !localStorage.getItem(APP_VERSION_KEY);
  const isUpdated = storedVersion !== CURRENT_VERSION;
  
  if (isNewInstall || isUpdated) {
    updateStoredVersion();
    
    if (isUpdated && !isNewInstall) {
      return {
        type: 'updated',
        from: storedVersion,
        to: CURRENT_VERSION
      };
    }
    
    if (isNewInstall) {
      return { type: 'new_install', version: CURRENT_VERSION };
    }
  }
  
  return null;
};
