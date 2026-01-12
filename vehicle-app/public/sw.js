// AdMotion Vehicle App Service Worker
const CACHE_NAME = 'admotion-vehicle-v1';
const RUNTIME_CACHE = 'admotion-runtime-v1';
const AD_CACHE = 'admotion-ads-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ SW install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== AD_CACHE)
            .map((name) => {
              console.log('🗑️ Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle ad media files (videos/images) - cache first
  if (isAdMedia(url)) {
    event.respondWith(
      caches.open(AD_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('📦 Serving ad from cache:', url.pathname);
                return cachedResponse;
              }
              
              return fetch(request)
                .then((networkResponse) => {
                  // Cache the ad media
                  if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone());
                    console.log('💾 Cached ad media:', url.pathname);
                  }
                  return networkResponse;
                });
            });
        })
    );
    return;
  }
  
  // Handle API requests - network first, cache fallback
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached API response
          return caches.match(request);
        })
    );
    return;
  }
  
  // Handle static assets - cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then((networkResponse) => {
            // Cache static assets
            if (networkResponse.ok && shouldCache(url)) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'AdMotion', body: event.data?.text() || 'New notification' };
  }
  
  const title = data.title || 'AdMotion Vehicle';
  const options = {
    body: data.body || 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked');
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Handle reload action
  if (event.notification.data?.action === 'reload') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({ action: 'reload' });
          });
        })
    );
    return;
  }
  
  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('💬 SW received message:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'cacheAd') {
    const { url, adId } = event.data;
    caches.open(AD_CACHE)
      .then((cache) => {
        fetch(url)
          .then((response) => {
            if (response.ok) {
              cache.put(url, response);
              console.log('💾 Cached ad:', adId);
            }
          });
      });
  }
  
  if (event.data.action === 'clearAdCache') {
    caches.delete(AD_CACHE)
      .then(() => {
        console.log('🗑️ Ad cache cleared');
        caches.open(AD_CACHE);
      });
  }
});

// Periodic background sync for location updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'location-sync') {
    console.log('📍 Periodic location sync triggered');
    event.waitUntil(syncLocation());
  }
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'heartbeat-sync') {
    console.log('💓 Background heartbeat sync triggered');
    event.waitUntil(syncHeartbeat());
  }
});

// Helper functions
function isAdMedia(url) {
  const pathname = url.pathname.toLowerCase();
  return pathname.includes('/ads/') || 
         pathname.includes('/media/') ||
         pathname.endsWith('.mp4') ||
         pathname.endsWith('.webm') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.gif') ||
         pathname.endsWith('.webp') ||
         url.hostname.includes('firebasestorage');
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('firestore') ||
         url.hostname.includes('firebase');
}

function shouldCache(url) {
  const pathname = url.pathname;
  return pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.ttf');
}

async function syncLocation() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
      client.postMessage({ action: 'syncLocation' });
    });
  } catch (error) {
    console.error('❌ Location sync failed:', error);
  }
}

async function syncHeartbeat() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
      client.postMessage({ action: 'syncHeartbeat' });
    });
  } catch (error) {
    console.error('❌ Heartbeat sync failed:', error);
  }
}

console.log('🚀 AdMotion Service Worker loaded');
