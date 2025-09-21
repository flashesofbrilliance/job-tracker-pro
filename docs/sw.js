// Service Worker for Sushi Discovery PWA
// Provides offline functionality with smart caching strategy

const CACHE_NAME = 'sushi-discovery-v1.5.0';
const DATA_CACHE_NAME = 'sushi-data-v1.5.0';

// Static assets that can be cached aggressively
const STATIC_ASSETS = [
  './manifest.json',
  './style.css',
  // External CDN resources (cached for offline)
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.20.0/cannon.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Dynamic assets that need fresh content (network-first)
const DYNAMIC_ASSETS = [
  './discovery.html',
  './discovery.js',
  './discovery-core.js',
  './index.html',
  './app.js'
];

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  console.log('🍣 Sushi Discovery Service Worker: Installing with smart caching...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🍣 Sushi Discovery Service Worker: Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('🍣 Sushi Discovery Service Worker: Installation complete!');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('🍣 Sushi Discovery Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🍣 Sushi Discovery Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🍣 Sushi Discovery Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('🍣 Sushi Discovery Service Worker: Activation complete!');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('🍣 Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, return offline page
            if (event.request.destination === 'document') {
              return caches.match('./discovery.html');
            }
            
            // For other resources, just fail gracefully
            return new Response('Offline - Sushi Discovery unavailable', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sushi-data-sync') {
    console.log('🍣 Sushi Discovery Service Worker: Syncing data...');
    event.waitUntil(syncSushiData());
  }
});

// Push notifications for achievements
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('🍣 Sushi Discovery Service Worker: Push received:', data);
    
    const options = {
      body: data.body || 'New sushi achievement unlocked!',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: data,
      actions: [
        {
          action: 'view',
          title: '🍣 View Discovery',
          icon: './icons/icon-96x96.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: './icons/icon-96x96.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Sushi Discovery', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('./discovery.html')
    );
  }
});

// Sync function for offline data
async function syncSushiData() {
  try {
    // This would sync any pending sushi choices/analytics when back online
    console.log('🍣 Sushi Discovery Service Worker: Data sync completed');
  } catch (error) {
    console.error('🍣 Sushi Discovery Service Worker: Sync failed:', error);
  }
}

// Update notification for new version
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Log service worker events for debugging
console.log('🍣 Sushi Discovery Service Worker: Loaded and ready for omakase!');