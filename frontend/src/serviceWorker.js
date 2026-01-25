/**
 * Ultra-Performance Service Worker
 * Offline-first caching strategy for lightning-fast POS
 */

const CACHE_NAME = 'billbytekot-ultra-v1';
const STATIC_CACHE = 'billbytekot-static-v1';
const DYNAMIC_CACHE = 'billbytekot-dynamic-v1';

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/menu',
  '/api/business-settings',
  '/api/tables',
  '/api/categories'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('🚀 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API requests with cache-first strategy for critical data
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIs.some(api => url.pathname.startsWith(api));
  
  if (isCacheable) {
    // Cache-first for critical business data
    try {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('⚡ Serving from cache:', url.pathname);
        
        // Update cache in background
        fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
          })
          .catch(() => {}); // Ignore background update errors
        
        return cachedResponse;
      }
      
      // Fetch and cache
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
      
    } catch (error) {
      console.log('❌ API request failed:', error);
      return new Response(
        JSON.stringify({ error: 'Offline - cached data not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Network-first for non-cacheable APIs
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle static requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch and cache
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    // Return offline page or cached version
    return caches.match('/') || new Response('Offline', { status: 503 });
  }
}

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-orders') {
    console.log('🔄 Background syncing failed orders...');
    event.waitUntil(syncFailedOrders());
  }
});

/**
 * Sync failed orders when connection is restored
 */
async function syncFailedOrders() {
  try {
    const db = await openIndexedDB();
    const failedOrders = await getFailedOrders(db);
    
    for (const order of failedOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order.data)
        });
        
        if (response.ok) {
          await removeFailedOrder(db, order.id);
          console.log('✅ Synced order:', order.id);
        }
      } catch (error) {
        console.log('❌ Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.log('❌ Background sync failed:', error);
  }
}

/**
 * IndexedDB helpers for offline order storage
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BillByteKOT', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('failedOrders')) {
        db.createObjectStore('failedOrders', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getFailedOrders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['failedOrders'], 'readonly');
    const store = transaction.objectStore('failedOrders');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFailedOrder(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['failedOrders'], 'readwrite');
    const store = transaction.objectStore('failedOrders');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notification handling
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view_order') {
    event.waitUntil(
      clients.openWindow(`/orders/${event.notification.data.orderId}`)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🚀 Ultra-Performance Service Worker loaded');