/**
 * Admin Utilities - External JS for CSP compliance
 * Contains event handlers and utilities for admin panel
 */
(function () {
    'use strict';

    // ========================================
    // Sidebar functionality
    // ========================================
    window.toggleSidebar = function () {
        var sidebar = document.getElementById('sidebar');
        var mainContent = document.getElementById('mainContent');
        var mobileOverlay = document.getElementById('mobileOverlay');

        // Mobile behavior
        if (window.innerWidth <= 1024) {
            if (sidebar) sidebar.classList.toggle('open');
            if (mobileOverlay) mobileOverlay.classList.toggle('open');
        } else {
            // Desktop behavior
            if (sidebar) sidebar.classList.toggle('closed');
            if (mainContent) mainContent.classList.toggle('expanded');
        }
    };

    // ========================================
    // Collapsible sections
    // ========================================
    function initCollapsible(id) {
        var storageKey = 'collapsible-state-' + id;
        var savedState = localStorage.getItem(storageKey);
        var section = document.querySelector('[data-collapsible-id="' + id + '"]');

        if (!section) return;

        var header = section.querySelector('.nexus-collapsible-header');
        var content = section.querySelector('.nexus-collapsible-content');

        if (savedState !== null) {
            var isOpen = savedState === 'true';
            if (header) header.setAttribute('aria-expanded', isOpen);
            if (content) {
                content.style.display = isOpen ? 'block' : 'none';
                if (isOpen) {
                    content.classList.add('open');
                } else {
                    content.classList.remove('open');
                }
            }
        }
    }

    window.toggleCollapsible = function (id) {
        var section = document.querySelector('[data-collapsible-id="' + id + '"]');
        if (!section) return;

        var header = section.querySelector('.nexus-collapsible-header');
        var content = section.querySelector('.nexus-collapsible-content');
        var isOpen = header.getAttribute('aria-expanded') === 'true';
        var newState = !isOpen;

        header.setAttribute('aria-expanded', newState);
        content.style.display = newState ? 'block' : 'none';

        if (newState) {
            content.classList.add('open');
        } else {
            content.classList.remove('open');
        }

        // Save to localStorage
        var storageKey = 'collapsible-state-' + id;
        localStorage.setItem(storageKey, newState);
    };

    // ========================================
    // Customize panel functions
    // ========================================
    window.toggleCustomizePanel = function () {
        var wrapper = document.getElementById('customizePanelWrapper');
        if (wrapper) {
            if (wrapper.style.height === '0px' || wrapper.style.height === '0' || wrapper.style.height === '') {
                if (typeof populateBlocksList === 'function') {
                    populateBlocksList();
                }
                wrapper.style.height = 'auto';
                var scrollHeight = wrapper.scrollHeight;
                wrapper.style.height = '0px';
                wrapper.offsetHeight; // Force reflow
                wrapper.style.height = scrollHeight + 'px';
            } else {
                wrapper.style.height = '0px';
            }
        }
    };

    window.closeCustomizePanel = function () {
        var wrapper = document.getElementById('customizePanelWrapper');
        if (wrapper) {
            wrapper.style.height = '0px';
        }
    };

    // ========================================
    // Centralized data-action handler
    // ========================================
    var safeActions = {
        'toggleSidebar()': function () { window.toggleSidebar(); },
        'window.location.reload()': function () { window.location.reload(); },
        'markAllNotificationsAsRead()': function () {
            if (typeof markAllNotificationsAsRead === 'function') {
                markAllNotificationsAsRead();
            }
        },
        'toggleCustomizePanel()': function () { window.toggleCustomizePanel(); },
        'closeCustomizePanel()': function () { window.closeCustomizePanel(); }
    };

    document.addEventListener('click', function (e) {
        // Handle data-action
        var actionTarget = e.target.closest('[data-action]');
        if (actionTarget) {
            var action = actionTarget.getAttribute('data-action');
            if (action && safeActions[action]) {
                e.preventDefault();
                safeActions[action]();
                return;
            }
        }

        // Handle data-collapsible-toggle
        var toggle = e.target.closest('[data-collapsible-toggle]');
        if (toggle) {
            var id = toggle.getAttribute('data-collapsible-toggle');
            if (id && window.toggleCollapsible) {
                window.toggleCollapsible(id);
            }
            return;
        }
    });

    // ========================================
    // Initialize on DOM ready
    // ========================================
    document.addEventListener('DOMContentLoaded', function () {
        // Initialize collapsible sections
        var sections = document.querySelectorAll('[data-collapsible-id]');
        sections.forEach(function (section) {
            var id = section.getAttribute('data-collapsible-id');
            initCollapsible(id);
        });

        // Close sidebar on mobile when clicking a link
        var sidebarLinks = document.querySelectorAll('.nexus-sidebar-nav a');
        sidebarLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 1024) {
                    var sidebar = document.getElementById('sidebar');
                    var mobileOverlay = document.getElementById('mobileOverlay');
                    if (sidebar) sidebar.classList.remove('open');
                    if (mobileOverlay) mobileOverlay.classList.remove('open');
                }
            });
        });
    });

    console.log('Admin utilities initialized');
})();
