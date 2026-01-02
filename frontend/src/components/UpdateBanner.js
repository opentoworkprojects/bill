// In-App Update Banner Component
import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { Button } from './ui/button';
import { checkForUpdates, isUpdateDismissed, dismissUpdate, refreshApp, shouldCheckForUpdates, CURRENT_VERSION } from '../utils/appUpdate';
import { getConnectionStatus, getPendingSyncCount, syncOfflineQueue } from '../utils/offlineSync';
import { API } from '../App';
import axios from 'axios';

const UpdateBanner = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Check for updates on mount
    if (shouldCheckForUpdates()) {
      checkUpdates();
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending sync count
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_ORDERS') {
          handleSync();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = () => {
    setPendingSync(getPendingSyncCount());
  };

  const checkUpdates = async () => {
    try {
      const info = await checkForUpdates(API);
      if (info?.hasUpdate && !isUpdateDismissed(info.latestVersion)) {
        setUpdateInfo(info);
        setShowBanner(true);
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // For PWA/TWA, we just need to refresh to get the latest version
    setTimeout(() => {
      refreshApp();
    }, 500);
  };

  const handleDismiss = () => {
    if (updateInfo) {
      dismissUpdate(updateInfo.latestVersion);
    }
    setShowBanner(false);
  };

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      await syncOfflineQueue(axios.create({ baseURL: API }));
      updatePendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
    }
    setIsSyncing(false);
  };

  // Offline indicator
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 z-[100] flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
        <WifiOff className="w-4 h-4" />
        <span>You're offline. Changes will sync when connected.</span>
        {pendingSync > 0 && (
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {pendingSync} pending
          </span>
        )}
      </div>
    );
  }

  // Pending sync indicator
  if (pendingSync > 0 && isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white px-4 py-2 z-[100] flex items-center justify-between text-sm font-medium shadow-lg">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          <span>{pendingSync} items waiting to sync</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSync}
          disabled={isSyncing}
          className="text-white hover:bg-white/20 h-7 px-3"
        >
          {isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-1" />
              Sync Now
            </>
          )}
        </Button>
      </div>
    );
  }

  // Update banner
  if (!showBanner || !updateInfo) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-3 z-[100] shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base">
              New Update Available! v{updateInfo.latestVersion}
            </p>
            <p className="text-xs sm:text-sm text-white/80 truncate">
              {updateInfo.updateMessage || 'Tap to update for new features and improvements'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="bg-white text-violet-600 hover:bg-white/90 h-9 px-4 font-semibold"
          >
            {isUpdating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Update'
            )}
          </Button>
          
          {!updateInfo.forceUpdate && (
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {updateInfo.releaseNotes && (
        <div className="max-w-4xl mx-auto mt-2 text-xs text-white/70 line-clamp-2">
          {updateInfo.releaseNotes}
        </div>
      )}
    </div>
  );
};

export default UpdateBanner;
