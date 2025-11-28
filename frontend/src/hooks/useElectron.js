import { useEffect, useCallback } from 'react';

/**
 * Hook to integrate Electron features with React
 * Provides navigation, notifications, and printing capabilities
 * Note: Navigation is handled by ElectronNavigator component in App.js
 */
export const useElectron = () => {
  
  // Check if running in Electron
  const isElectron = window.electronAPI?.isElectron || false;
  const platform = window.electronAPI?.platform || 'web';
  
  // Navigation is handled by ElectronNavigator component in App.js
  
  // Handle update check from Electron menu
  useEffect(() => {
    if (isElectron && window.electronAPI?.onCheckUpdates) {
      window.electronAPI.onCheckUpdates(() => {
        // Show update notification or modal
        alert('You are running the latest version of RestoBill!');
      });
    }
  }, [isElectron]);
  
  // Show native notification
  const showNotification = useCallback((title, body) => {
    if (isElectron && window.electronAPI?.showNotification) {
      window.electronAPI.showNotification(title, body);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }, [isElectron]);
  
  // Print receipt using native dialog
  const printReceipt = useCallback((htmlContent) => {
    if (isElectron && window.electronAPI?.printReceipt) {
      window.electronAPI.printReceipt(htmlContent);
    } else {
      // Fallback for web: open print window
      const printWindow = window.open('', '', 'width=400,height=600');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }, [isElectron]);
  
  // Get app version
  const getVersion = useCallback(() => {
    if (isElectron && window.electronAPI?.getVersion) {
      return window.electronAPI.getVersion();
    }
    return '1.0.0';
  }, [isElectron]);
  
  return {
    isElectron,
    platform,
    showNotification,
    printReceipt,
    getVersion
  };
};

export default useElectron;
