const CACHE_NAME = 'deliveryroute-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/orders',
  '/api/inventory',
  '/api/customers',
  '/api/products',
  '/api/statistics',
];

// Install event - cache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Ensure the new service worker takes control immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstStrategy(request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then(cache => cache.match('/'))
            .then(response => response || cache.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Handle static resources with Cache First strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      cacheFirstStrategy(request)
    );
    return;
  }

  // Default to Network First for other requests
  event.respondWith(
    networkFirstStrategy(request)
  );
});

// Network First Strategy - try network, fallback to cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For API requests, return a custom offline response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Data not available offline' 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Cache First Strategy - try cache, fallback to network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Cache first strategy failed:', error);
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'delivery-sync') {
    event.waitUntil(syncDeliveries());
  }
  
  if (event.tag === 'inventory-sync') {
    event.waitUntil(syncInventory());
  }
});

// Sync delivery data when back online
async function syncDeliveries() {
  try {
    // Get pending deliveries from IndexedDB or localStorage
    const pendingDeliveries = await getPendingDeliveries();
    
    for (const delivery of pendingDeliveries) {
      try {
        await fetch('/api/delivery/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(delivery)
        });
        
        // Remove from pending queue on success
        await removePendingDelivery(delivery.id);
      } catch (error) {
        console.log('Failed to sync delivery:', delivery.id, error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Sync inventory updates when back online
async function syncInventory() {
  try {
    const pendingUpdates = await getPendingInventoryUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch('/api/inventory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        await removePendingInventoryUpdate(update.id);
      } catch (error) {
        console.log('Failed to sync inventory update:', update.id, error);
      }
    }
  } catch (error) {
    console.log('Inventory sync failed:', error);
  }
}

// Helper functions for managing offline data
async function getPendingDeliveries() {
  // In a real implementation, this would read from IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingDelivery(id) {
  // Remove from IndexedDB
  console.log('Removing pending delivery:', id);
}

async function getPendingInventoryUpdates() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

async function removePendingInventoryUpdate(id) {
  // Remove from IndexedDB
  console.log('Removing pending inventory update:', id);
}

// Push notification handling
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de DeliveryRoute',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DeliveryRoute', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/orders')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle message events from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
