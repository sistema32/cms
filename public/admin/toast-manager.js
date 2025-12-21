/**
 * Toast Manager - External JS for CSP compliance
 * This file is loaded externally to avoid inline script CSP violations.
 */
(function () {
    'use strict';

    // Timing constants (copied from server config)
    const TOAST_TIMING = {
        DEFAULT_DURATION: 5000,
        ERROR_DURATION: 7000,
        SUCCESS_DURATION: 3000,
        NO_AUTO_DISMISS: 0
    };

    const ANIMATION_DURATION = {
        FAST: 150,
        DEFAULT: 300,
        SLOW: 500,
        TOAST_SLIDE: 300
    };

    let toastIdCounter = 0;

    // Toast manager
    window.toastManager = {
        show: function (options) {
            const id = options.id || 'toast-' + (++toastIdCounter);
            const type = options.type || 'info';
            const title = options.title || '';
            const message = options.message || '';
            const duration = options.duration !== undefined ? options.duration : TOAST_TIMING.DEFAULT_DURATION;

            this.remove(id); // Remove if exists

            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = this.createToast(id, type, title, message, duration);
            container.appendChild(toast);

            // Auto-dismiss
            if (duration > 0) {
                const progressBar = toast.querySelector('.toast-progress');
                if (progressBar) {
                    progressBar.style.width = '100%';
                    setTimeout(function () {
                        progressBar.style.width = '0%';
                        progressBar.style.transition = 'width ' + duration + 'ms linear';
                    }, 10);
                }

                setTimeout(function () {
                    window.toastManager.remove(id);
                }, duration);
            }

            return id;
        },

        createToast: function (id, type, title, message, duration) {
            const toast = document.createElement('div');
            toast.id = id;
            toast.className = 'admin-toast relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden';
            toast.setAttribute('role', 'alert');

            const colors = {
                success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-l-4 border-green-500', icon: '✓', iconBg: 'bg-green-500' },
                error: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-4 border-red-500', icon: '✕', iconBg: 'bg-red-500' },
                warning: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-l-4 border-orange-500', icon: '⚠', iconBg: 'bg-orange-500' },
                info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-4 border-blue-500', icon: 'ℹ', iconBg: 'bg-blue-500' }
            };

            const color = colors[type] || colors.info;

            toast.innerHTML =
                '<div class="flex items-start p-4 ' + color.bg + ' ' + color.border + '">' +
                '<div class="flex-shrink-0">' +
                '<div class="' + color.iconBg + ' rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">' +
                color.icon +
                '</div>' +
                '</div>' +
                '<div class="ml-3 flex-1">' +
                (title ? '<p class="text-sm font-semibold text-gray-900 dark:text-gray-100">' + title + '</p>' : '') +
                '<p class="text-sm text-gray-700 dark:text-gray-300 ' + (title ? 'mt-1' : '') + '">' + message + '</p>' +
                '</div>' +
                '<button data-toast-close="' + id + '" class="ml-3 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none" aria-label="Close">' +
                '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">' +
                '<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>' +
                '</svg>' +
                '</button>' +
                '</div>' +
                (duration > 0 ? '<div class="toast-progress ' + color.iconBg + '" style="width: 100%;"></div>' : '');

            return toast;
        },

        remove: function (id) {
            const toast = document.getElementById(id);
            if (!toast) return;

            toast.classList.add('removing');
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, ANIMATION_DURATION.TOAST_SLIDE);
        },

        success: function (message, title, duration) {
            return this.show({ type: 'success', title: title, message: message, duration: duration });
        },

        error: function (message, title, duration) {
            return this.show({ type: 'error', title: title, message: message, duration: duration });
        },

        warning: function (message, title, duration) {
            return this.show({ type: 'warning', title: title, message: message, duration: duration });
        },

        info: function (message, title, duration) {
            return this.show({ type: 'info', title: title, message: message, duration: duration });
        }
    };

    // Alias for easier access
    window.toast = window.toastManager;

    // Event delegation for toast close buttons
    document.addEventListener('click', function (e) {
        var closeBtn = e.target.closest('[data-toast-close]');
        if (closeBtn) {
            var toastId = closeBtn.getAttribute('data-toast-close');
            if (toastId && window.toastManager) {
                window.toastManager.remove(toastId);
            }
        }
    });

    console.log('Toast manager initialized');
})();
