// Offline Sync Utility - Queue orders when offline, sync when online
import { toast } from 'sonner';

const OFFLINE_QUEUE_KEY = 'billbytekot_offline_queue';
const PENDING_SYNC_KEY = 'billbytekot_pending_sync';

// Check if online
export const isOnline = () => navigator.onLine;

// Get offline queue
export const getOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

// Add item to offline queue
export const addToOfflineQueue = (action, data) => {
  const queue = getOfflineQueue();
  queue.push({
    id: Date.now().toString(),
    action, // 'create_order', 'update_order', 'complete_order', etc.
    data,
    timestamp: new Date().toISOString(),
    retries: 0
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  toast.info('Saved offline. Will sync when online.');
  return queue.length;
};

// Remove item from queue
export const removeFromQueue = (id) => {
  const queue = getOfflineQueue().filter(item => item.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

// Clear entire queue
export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

// Get pending sync count
export const getPendingSyncCount = () => getOfflineQueue().length;

// Sync offline queue when online
export const syncOfflineQueue = async (apiClient) => {
  if (!isOnline()) {
    toast.error('Still offline. Cannot sync.');
    return { success: false, synced: 0, failed: 0 };
  }
  
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: true, synced: 0, failed: 0 };
  }
  
  toast.info(`Syncing ${queue.length} offline items...`);
  
  let synced = 0;
  let failed = 0;
  
  for (const item of queue) {
    try {
      let response;
      
      switch (item.action) {
        case 'create_order':
          response = await apiClient.post('/orders', item.data);
          break;
        case 'update_order':
          response = await apiClient.put(`/orders/${item.data.id}`, item.data);
          break;
        case 'complete_order':
          response = await apiClient.put(`/orders/${item.data.id}`, { status: 'completed', ...item.data });
          break;
        case 'cancel_order':
          response = await apiClient.put(`/orders/${item.data.id}`, { status: 'cancelled' });
          break;
        default:
          console.warn('Unknown action:', item.action);
          continue;
      }
      
      if (response?.status >= 200 && response?.status < 300) {
        removeFromQueue(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Sync failed for item:', item, error);
      failed++;
      
      // Update retry count
      const queue = getOfflineQueue();
      const idx = queue.findIndex(q => q.id === item.id);
      if (idx !== -1) {
        queue[idx].retries = (queue[idx].retries || 0) + 1;
        queue[idx].lastError = error.message;
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
    }
  }
  
  if (synced > 0) {
    toast.success(`Synced ${synced} items successfully!`);
  }
  if (failed > 0) {
    toast.error(`${failed} items failed to sync. Will retry later.`);
  }
  
  return { success: failed === 0, synced, failed };
};

// Auto-sync when coming online
let syncInProgress = false;

export const setupAutoSync = (apiClient) => {
  window.addEventListener('online', async () => {
    if (syncInProgress) return;
    
    const pendingCount = getPendingSyncCount();
    if (pendingCount > 0) {
      toast.info('Back online! Syncing data...');
      syncInProgress = true;
      await syncOfflineQueue(apiClient);
      syncInProgress = false;
    } else {
      toast.success('Back online!');
    }
  });
  
  window.addEventListener('offline', () => {
    toast.warning('You are offline. Changes will be saved locally.');
  });
};

// Check and show offline indicator
export const getConnectionStatus = () => {
  return {
    online: isOnline(),
    pendingSync: getPendingSyncCount()
  };
};
