/**
 * Hot Reload Development Server
 * Automatically reloads browser when theme files change
 */

import { invalidateAllCache } from "../services/themeCacheService.ts";

export interface HotReloadConfig {
  port?: number;
  watchPaths?: string[];
  debounceMs?: number;
  verbose?: boolean;
}

export class HotReloadServer {
  private clients = new Set<WebSocket>();
  private watcher?: Deno.FsWatcher;
  private config: Required<HotReloadConfig>;
  private debounceTimers = new Map<string, number>();
  private isRunning = false;

  constructor(config: HotReloadConfig = {}) {
    this.config = {
      port: config.port || 3001,
      watchPaths: config.watchPaths || [
        "./src/themes",
        "./src/admin/assets",
      ],
      debounceMs: config.debounceMs || 100,
      verbose: config.verbose || false,
    };
  }

  /**
   * Start the hot reload server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("Hot reload server is already running");
      return;
    }

    this.isRunning = true;

    // Start WebSocket server
    this.startWebSocketServer();

    // Start file watchers
    await this.startFileWatchers();

    console.log(`🔥 Hot reload server started on ws://localhost:${this.config.port}`);
  }

  /**
   * Stop the hot reload server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Close all WebSocket connections
    for (const client of this.clients) {
      try {
        client.close();
      } catch (error) {
        console.error("Error closing WebSocket client:", error);
      }
    }
    this.clients.clear();

    // Stop file watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }

    this.isRunning = false;
    console.log("🔥 Hot reload server stopped");
  }

  /**
   * Start WebSocket server
   */
  private startWebSocketServer(): void {
    const port = this.config.port;

    Deno.serve(
      { port, onListen: () => {} },
      (req) => {
        const upgrade = req.headers.get("upgrade") || "";

        if (upgrade.toLowerCase() === "websocket") {
          const { socket, response } = Deno.upgradeWebSocket(req);

          socket.onopen = () => {
            this.clients.add(socket);
            if (this.config.verbose) {
              console.log(`🔌 Client connected (${this.clients.size} total)`);
            }

            // Send initial connection message
            socket.send(
              JSON.stringify({
                type: "connected",
                message: "Hot reload ready",
              })
            );
          };

          socket.onclose = () => {
            this.clients.delete(socket);
            if (this.config.verbose) {
              console.log(`🔌 Client disconnected (${this.clients.size} total)`);
            }
          };

          socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.clients.delete(socket);
          };

          return response;
        }

        // Health check endpoint
        if (req.url.endsWith("/health")) {
          return new Response(
            JSON.stringify({
              status: "ok",
              clients: this.clients.size,
              watching: this.config.watchPaths,
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response("Hot Reload Server - WebSocket only", {
          status: 400,
        });
      }
    );
  }

  /**
   * Start file watchers for theme directories
   */
  private async startFileWatchers(): Promise<void> {
    try {
      // Watch multiple paths
      const watchPaths = this.config.watchPaths.filter((path) => {
        try {
          const stat = Deno.statSync(path);
          return stat.isDirectory;
        } catch {
          console.warn(`⚠️  Watch path does not exist: ${path}`);
          return false;
        }
      });

      if (watchPaths.length === 0) {
        console.warn("⚠️  No valid watch paths found");
        return;
      }

      // Create file system watcher
      this.watcher = Deno.watchFs(watchPaths, { recursive: true });

      // Process file system events
      this.processFileEvents();

      if (this.config.verbose) {
        console.log(`👀 Watching paths:`, watchPaths);
      }
    } catch (error) {
      console.error("Error starting file watchers:", error);
    }
  }

  /**
   * Process file system events
   */
  private async processFileEvents(): Promise<void> {
    if (!this.watcher) return;

    try {
      for await (const event of this.watcher) {
        // Only handle modify and create events
        if (event.kind !== "modify" && event.kind !== "create") {
          continue;
        }

        for (const path of event.paths) {
          // Skip certain files/directories
          if (this.shouldIgnoreFile(path)) {
            continue;
          }

          // Debounce rapid changes to the same file
          this.debouncedReload(path);
        }
      }
    } catch (error) {
      if (error.name !== "Interrupted") {
        console.error("Error in file watcher:", error);
      }
    }
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnoreFile(path: string): boolean {
    const ignoredPatterns = [
      /node_modules/,
      /\.git/,
      /\.DS_Store/,
      /~$/,
      /\.swp$/,
      /\.tmp$/,
      /\.log$/,
    ];

    return ignoredPatterns.some((pattern) => pattern.test(path));
  }

  /**
   * Debounce reload for rapid file changes
   */
  private debouncedReload(filePath: string): void {
    // Clear existing timer for this file
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.handleFileChange(filePath);
      this.debounceTimers.delete(filePath);
    }, this.config.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Handle file change event
   */
  private handleFileChange(filePath: string): void {
    const relativePath = filePath.replace(Deno.cwd() + "/", "");

    console.log(`🔄 File changed: ${relativePath}`);

    // Invalidate theme cache
    try {
      invalidateAllCache();
      if (this.config.verbose) {
        console.log("  ✓ Cache invalidated");
      }
    } catch (error) {
      console.error("  ✗ Error invalidating cache:", error);
    }

    // Determine reload type based on file extension
    const reloadType = this.getReloadType(filePath);

    // Broadcast reload message to all clients
    this.broadcast({
      type: "reload",
      file: relativePath,
      reloadType,
      timestamp: Date.now(),
    });

    if (this.config.verbose) {
      console.log(`  ✓ Notified ${this.clients.size} client(s) - ${reloadType}`);
    }
  }

  /**
   * Determine reload type based on file extension
   */
  private getReloadType(filePath: string): "full" | "css" | "assets" {
    const ext = filePath.split(".").pop()?.toLowerCase();

    if (ext === "css") {
      return "css";
    }

    if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext || "")) {
      return "assets";
    }

    return "full";
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(data: any): void {
    const message = JSON.stringify(data);
    const deadClients: WebSocket[] = [];

    for (const client of this.clients) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        } else {
          deadClients.push(client);
        }
      } catch (error) {
        console.error("Error sending to client:", error);
        deadClients.push(client);
      }
    }

    // Clean up dead connections
    for (const client of deadClients) {
      this.clients.delete(client);
    }
  }

  /**
   * Get server statistics
   */
  getStats(): {
    isRunning: boolean;
    connectedClients: number;
    watchedPaths: string[];
    port: number;
  } {
    return {
      isRunning: this.isRunning,
      connectedClients: this.clients.size,
      watchedPaths: this.config.watchPaths,
      port: this.config.port,
    };
  }
}

// Singleton instance
let hotReloadInstance: HotReloadServer | null = null;

/**
 * Get or create hot reload server instance
 */
export function getHotReloadServer(config?: HotReloadConfig): HotReloadServer {
  if (!hotReloadInstance) {
    hotReloadInstance = new HotReloadServer(config);
  }
  return hotReloadInstance;
}

/**
 * Check if hot reload is enabled
 */
export function isHotReloadEnabled(): boolean {
  return Deno.env.get("DEV_MODE") === "true" || Deno.env.get("NODE_ENV") === "development";
}

/**
 * Get hot reload client script
 */
export function getHotReloadScript(port = 3001): string {
  return `
<script>
  (function() {
    if (!window.__HOT_RELOAD__) {
      window.__HOT_RELOAD__ = true;

      const ws = new WebSocket('ws://localhost:${port}');
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 10;

      ws.onopen = () => {
        console.log('🔥 Hot reload connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'reload') {
            console.log('🔄 Reloading:', data.file, '(' + data.reloadType + ')');

            if (data.reloadType === 'css') {
              // Reload CSS without full page reload
              reloadCSS();
            } else if (data.reloadType === 'assets') {
              // Reload images/assets
              reloadAssets();
            } else {
              // Full page reload
              location.reload();
            }
          } else if (data.type === 'connected') {
            console.log('🔥', data.message);
          }
        } catch (err) {
          console.error('Hot reload error:', err);
        }
      };

      ws.onerror = () => {
        console.warn('🔥 Hot reload connection error');
      };

      ws.onclose = () => {
        console.warn('🔥 Hot reload disconnected');

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(() => {
            console.log(\`🔥 Reconnecting... (attempt \${reconnectAttempts}/\${maxReconnectAttempts})\`);
            location.reload();
          }, 1000 * reconnectAttempts);
        }
      };

      function reloadCSS() {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
          const href = link.href.split('?')[0];
          link.href = href + '?t=' + Date.now();
        });
      }

      function reloadAssets() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          const src = img.src.split('?')[0];
          img.src = src + '?t=' + Date.now();
        });
      }
    }
  })();
</script>
  `.trim();
}
