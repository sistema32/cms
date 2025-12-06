/**
 * CMS SDK - Global JavaScript SDK for LexCMS
 * 
 * This script provides a unified interface for plugins and components
 * to access CMS functionality with permission checking.
 * 
 * Usage (in plugins):
 *   <script src="/admincp/assets/js/cms-sdk.js"></script>
 *   
 *   // Check permissions
 *   if (window.CMS.hasPermission('media:read')) {
 *       window.CMS.MediaPicker.open({ ... });
 *   }
 * 
 * @author LexCMS
 * @version 1.0.0
 */

(function () {
    'use strict';

    // Initialize CMS namespace
    window.CMS = window.CMS || {};

    // State
    let userContext = null;
    let contextLoaded = false;
    let contextPromise = null;

    /**
     * Load user context from API
     */
    async function loadContext() {
        if (contextLoaded) return userContext;
        if (contextPromise) return contextPromise;

        contextPromise = (async () => {
            try {
                const response = await fetch('/api/cms/context', {
                    credentials: 'include'
                });

                if (!response.ok) {
                    console.warn('[CMS SDK] Could not load context, using defaults');
                    userContext = { user: null, permissions: [], isSuperAdmin: false };
                } else {
                    userContext = await response.json();
                }
            } catch (error) {
                console.warn('[CMS SDK] Context load error:', error);
                userContext = { user: null, permissions: [], isSuperAdmin: false };
            }

            contextLoaded = true;
            return userContext;
        })();

        return contextPromise;
    }

    /**
     * Check if user has a specific permission
     * Format: "module:action" (e.g., "media:read", "users:create")
     */
    function hasPermission(permission) {
        if (!userContext) {
            console.warn('[CMS SDK] Context not loaded. Call CMS.ready() first.');
            return false;
        }

        // Superadmin has all permissions
        if (userContext.isSuperAdmin) {
            return true;
        }

        return userContext.permissions.includes(permission);
    }

    /**
     * Check if user has any of the specified permissions
     */
    function hasAnyPermission(permissions) {
        return permissions.some(p => hasPermission(p));
    }

    /**
     * Check if user has all of the specified permissions
     */
    function hasAllPermissions(permissions) {
        return permissions.every(p => hasPermission(p));
    }

    /**
     * Get current user info
     */
    function getUser() {
        return userContext?.user || null;
    }

    /**
     * Get all user permissions
     */
    function getPermissions() {
        if (userContext?.isSuperAdmin) {
            return ['*']; // Superadmin has all
        }
        return userContext?.permissions || [];
    }

    /**
     * Check if user is superadmin
     */
    function isSuperAdmin() {
        return userContext?.isSuperAdmin || false;
    }

    // ============ MEDIA PICKER WRAPPER ============

    /**
     * Wrapped MediaPicker that checks permissions
     */
    /**
     * Wrapped MediaPicker that checks permissions
     * Uses Proxy to forward other methods (setFilter, search, etc.) to underlying implementation
     */
    const MediaPickerWrapper = new Proxy({
        /**
         * Open media picker with permission check
         */
        open: async function (options = {}) {
            // Ensure context is loaded
            await loadContext();

            // Check read permission
            if (!hasPermission('media:read')) {
                console.warn('[CMS SDK] User lacks media:read permission');

                // Show permission denied message
                showPermissionDenied('No tienes permiso para acceder a la biblioteca de medios.');
                return;
            }

            // Check if underlying MediaPicker exists
            if (!window.CMS._MediaPicker) {
                console.error('[CMS SDK] MediaPicker component not loaded');
                return;
            }

            // Determine what features are available
            const canUpload = hasPermission('media:create');

            // Call underlying picker with adjusted options
            window.CMS._MediaPicker.open({
                ...options,
                canUpload: canUpload,
                onSelect: (media) => {
                    if (options.onSelect) options.onSelect(media);
                }
            });
        },

        close: function () {
            if (window.CMS._MediaPicker) {
                window.CMS._MediaPicker.close();
            }
        }
    }, {
        get: function (target, prop) {
            // Return wrapper implementation if exists (open, close)
            if (prop in target) {
                return target[prop];
            }

            // Otherwise forward to underlying implementation if available
            if (window.CMS._MediaPicker && prop in window.CMS._MediaPicker) {
                const value = window.CMS._MediaPicker[prop];
                // Bind functions to original instance
                if (typeof value === 'function') {
                    return value.bind(window.CMS._MediaPicker);
                }
                return value;
            }

            return undefined;
        }
    });

    /**
     * Show permission denied modal
     */
    function showPermissionDenied(message) {
        const existing = document.getElementById('cms-permission-denied-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'cms-permission-denied-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center';
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black/50" onclick="this.parentElement.remove()"></div>
            <div class="relative bg-base-100 rounded-lg shadow-xl p-6 max-w-sm mx-4 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
                    <svg class="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-bold mb-2">Permiso Denegado</h3>
                <p class="text-sm opacity-70 mb-4">${message}</p>
                <button class="btn btn-sm btn-primary" onclick="this.closest('#cms-permission-denied-modal').remove()">
                    Entendido
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // ============ PUBLIC API ============

    /**
     * Wait for SDK to be ready (context loaded)
     */
    window.CMS.ready = async function (callback) {
        await loadContext();
        if (callback) callback(window.CMS);
        return window.CMS;
    };

    // Permission checking
    window.CMS.hasPermission = hasPermission;
    window.CMS.hasAnyPermission = hasAnyPermission;
    window.CMS.hasAllPermissions = hasAllPermissions;
    window.CMS.getPermissions = getPermissions;
    window.CMS.isSuperAdmin = isSuperAdmin;

    // User info
    window.CMS.getUser = getUser;

    // Store original MediaPicker reference and replace with wrapper
    Object.defineProperty(window.CMS, 'MediaPicker', {
        get: function () {
            return MediaPickerWrapper;
        },
        set: function (picker) {
            // Store original picker internally
            window.CMS._MediaPicker = picker;
        }
    });

    // Auto-load context
    loadContext().then(() => {
        console.log('[CMS SDK] Loaded. User:', userContext?.user?.name || 'Guest',
            '| SuperAdmin:', userContext?.isSuperAdmin || false,
            '| Permissions:', userContext?.permissions?.length || 0);
    });

    console.log('[CMS SDK] Initialized');
})();
