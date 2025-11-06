/**
 * PWA Optimizer - Phase 5
 * Service Worker, Web App Manifest, Offline capabilities
 */

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface WebAppManifest {
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
  categories?: string[];
  lang?: string;
  dir?: "ltr" | "rtl" | "auto";
  orientation?: "any" | "natural" | "landscape" | "portrait";
  scope?: string;
}

export interface CacheStrategy {
  name: string;
  pattern: RegExp | string;
  strategy: "cacheFirst" | "networkFirst" | "staleWhileRevalidate" | "networkOnly" | "cacheOnly";
  cacheName?: string;
  maxAge?: number;
  maxEntries?: number;
}

export class PWAOptimizer {
  private static instance: PWAOptimizer;

  static getInstance(): PWAOptimizer {
    if (!PWAOptimizer.instance) {
      PWAOptimizer.instance = new PWAOptimizer();
    }
    return PWAOptimizer.instance;
  }

  /**
   * Generate Web App Manifest
   */
  generateManifest(config: WebAppManifest): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate manifest link tag
   */
  generateManifestLink(manifestUrl: string): string {
    return `<link rel="manifest" href="${manifestUrl}" />`;
  }

  /**
   * Generate theme color meta tags
   */
  generateThemeColorTags(themeColor: string): string {
    return `<meta name="theme-color" content="${themeColor}" />
<meta name="msapplication-TileColor" content="${themeColor}" />
<meta name="apple-mobile-web-app-status-bar-style" content="${themeColor}" />`;
  }

  /**
   * Generate Apple touch icons
   */
  generateAppleTouchIcons(icons: Array<{ size: number; url: string }>): string {
    return icons
      .map((icon) => `<link rel="apple-touch-icon" sizes="${icon.size}x${icon.size}" href="${icon.url}" />`)
      .join("\n");
  }

  /**
   * Generate Service Worker registration script
   */
  generateSWRegistration(swPath: string = "/sw.js"): string {
    return `<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('${swPath}')
      .then(registration => {
        console.log('ServiceWorker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}
</script>`;
  }

  /**
   * Generate Service Worker with caching strategies
   */
  generateServiceWorker(config: {
    version: string;
    cacheStrategies: CacheStrategy[];
    offlinePageUrl?: string;
    precacheUrls?: string[];
  }): string {
    const { version, cacheStrategies, offlinePageUrl, precacheUrls = [] } = config;

    return `// Service Worker v${version}
const CACHE_VERSION = '${version}';
const CACHE_NAME = 'lexcms-v' + CACHE_VERSION;
const OFFLINE_URL = '${offlinePageUrl || "/offline.html"}';

// URLs to precache
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};

// Cache strategies configuration
const CACHE_STRATEGIES = ${JSON.stringify(cacheStrategies.map(s => ({
      name: s.name,
      pattern: s.pattern.toString(),
      strategy: s.strategy,
      cacheName: s.cacheName || CACHE_NAME,
      maxAge: s.maxAge,
      maxEntries: s.maxEntries,
    })), null, 2)};

// Install event - precache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll([OFFLINE_URL, ...PRECACHE_URLS]);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('lexcms-v')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Find matching cache strategy
  const strategy = findCacheStrategy(url.pathname);

  if (strategy) {
    event.respondWith(
      handleRequest(request, strategy)
        .catch(() => {
          // If all fails, try to return offline page
          return caches.match(OFFLINE_URL);
        })
    );
  }
});

// Find cache strategy for URL
function findCacheStrategy(pathname) {
  for (const strategy of CACHE_STRATEGIES) {
    const pattern = new RegExp(strategy.pattern.slice(1, -1)); // Remove regex delimiters from string
    if (pattern.test(pathname)) {
      return strategy;
    }
  }
  return null;
}

// Handle request with cache strategy
async function handleRequest(request, strategy) {
  const cacheName = strategy.cacheName || CACHE_NAME;

  switch (strategy.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cacheName);

    case 'networkFirst':
      return networkFirst(request, cacheName);

    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cacheName);

    case 'networkOnly':
      return fetch(request);

    case 'cacheOnly':
      return caches.match(request);

    default:
      return fetch(request);
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

// Network First strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

async function syncForms() {
  // Implement form sync logic here
  console.log('Syncing forms...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
`;
  }

  /**
   * Generate PWA install prompt
   */
  generateInstallPrompt(): string {
    return `<script>
let deferredPrompt;
const installButton = document.getElementById('install-pwa-button');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();

  // Stash the event so it can be triggered later
  deferredPrompt = e;

  // Show install button
  if (installButton) {
    installButton.style.display = 'block';

    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(\`User response to the install prompt: \${outcome}\`);

      // Clear the deferredPrompt
      deferredPrompt = null;

      // Hide install button
      installButton.style.display = 'none';
    });
  }
});

// Detect if app is already installed
window.addEventListener('appinstalled', (e) => {
  console.log('PWA installed successfully');
  if (installButton) {
    installButton.style.display = 'none';
  }
});

// Check if running as PWA
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
  console.log('Running as PWA');
  document.body.classList.add('pwa-mode');
}
</script>`;
  }

  /**
   * Generate offline page HTML
   */
  generateOfflinePage(config: {
    title?: string;
    message?: string;
    logoUrl?: string;
  } = {}): string {
    const { title = "You're offline", message = "Please check your internet connection.", logoUrl } = config;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .offline-container {
      max-width: 500px;
    }
    .offline-icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    ${logoUrl ? `
    .offline-logo {
      width: 120px;
      height: 120px;
      margin-bottom: 20px;
    }
    ` : ""}
    h1 {
      font-size: 32px;
      margin: 0 0 16px;
    }
    p {
      font-size: 18px;
      opacity: 0.9;
      margin: 0 0 32px;
    }
    .retry-button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .retry-button:hover {
      transform: scale(1.05);
    }
    .retry-button:active {
      transform: scale(0.95);
    }
  </style>
</head>
<body>
  <div class="offline-container">
    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="offline-logo">` : '<div class="offline-icon">📡</div>'}
    <h1>${title}</h1>
    <p>${message}</p>
    <button class="retry-button" onclick="location.reload()">Try Again</button>
  </div>
  <script>
    // Auto-retry when back online
    window.addEventListener('online', () => {
      console.log('Back online!');
      location.reload();
    });
  </script>
</body>
</html>`;
  }

  /**
   * Generate default cache strategies
   */
  getDefaultCacheStrategies(): CacheStrategy[] {
    return [
      {
        name: "static-assets",
        pattern: /\.(js|css|woff2?|ttf|eot|svg)$/,
        strategy: "cacheFirst",
        cacheName: "static-assets",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 100,
      },
      {
        name: "images",
        pattern: /\.(png|jpg|jpeg|webp|avif|gif|ico)$/,
        strategy: "cacheFirst",
        cacheName: "images",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        maxEntries: 200,
      },
      {
        name: "api",
        pattern: /\/api\//,
        strategy: "networkFirst",
        cacheName: "api-cache",
        maxAge: 5 * 60, // 5 minutes
        maxEntries: 50,
      },
      {
        name: "pages",
        pattern: /\/[^.]*$/,
        strategy: "staleWhileRevalidate",
        cacheName: "pages",
        maxAge: 24 * 60 * 60, // 1 day
        maxEntries: 50,
      },
    ];
  }

  /**
   * Check PWA requirements
   */
  checkPWARequirements(config: {
    hasManifest: boolean;
    hasServiceWorker: boolean;
    hasHTTPS: boolean;
    hasIcons: boolean;
    hasStartUrl: boolean;
  }): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!config.hasManifest) missing.push("Web App Manifest");
    if (!config.hasServiceWorker) missing.push("Service Worker");
    if (!config.hasHTTPS) missing.push("HTTPS");
    if (!config.hasIcons) missing.push("Icons (192x192 and 512x512)");
    if (!config.hasStartUrl) missing.push("Start URL");

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

export const pwaOptimizer = PWAOptimizer.getInstance();
