/**
 * CMS Media Picker - Global Reusable Component
 * 
 * A standalone modal for selecting media from the CMS library.
 * Can be used by any part of the admin panel including plugins.
 * 
 * Usage:
 *   window.CMS.MediaPicker.open({
 *     onSelect: (media) => console.log('Selected:', media),
 *     filter: 'image',  // 'image', 'video', 'document', or null for all
 *     multiple: false   // Allow multiple selection
 *   });
 * 
 * @author LexCMS
 * @version 1.0.0
 */

(function () {
    'use strict';

    // Ensure CMS namespace exists
    window.CMS = window.CMS || {};

    // i18n translations (can be extended/replaced)
    const i18n = {
        title: 'Media Library',
        search: 'Search...',
        upload: 'Upload',
        uploading: 'Uploading...',
        allMedia: 'All Media',
        images: 'Images',
        videos: 'Videos',
        documents: 'Documents',
        filter: 'Filter',
        selected: 'selected',
        cancel: 'Cancel',
        select: 'Select',
        noMediaFound: 'No media found',
        close: 'close',
        // Can be replaced by window.CMS.MediaPicker.setLanguage({ ... })
    };

    // State
    let modalElement = null;
    let mediaItems = [];
    let selectedItems = [];
    let currentOptions = {};
    let isLoading = false;
    let searchQuery = '';
    let currentFilter = null;

    // API endpoint
    const API_URL = '/api/media';


    /**
     * Create the modal HTML structure
     */
    function createModal() {
        if (modalElement) return modalElement;

        const modal = document.createElement('div');
        modal.id = 'cms-media-picker-modal';
        // DaisyUI Modal Structure: .modal > .modal-box
        // We use .modal-open to show it.
        modal.className = 'modal';
        // Force high z-index to overlay plugins and center the modal
        modal.style.zIndex = '2147483647';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';

        modal.innerHTML = `
            <!-- Backdrop -->
            <form method="dialog" class="modal-backdrop bg-black/60 backdrop-blur-sm">
                <button onclick="window.CMS.MediaPicker.close()">${i18n.close}</button>
            </form>
            
            <!-- Modal Window -->
            <div class="modal-box p-0 flex flex-col shadow-2xl overflow-hidden" style="background-color: #ffffff; color: #1f2937; width: 1800px; height: 900px;">
                
                <!-- HEADER -->
                <div class="flex items-center justify-between px-4 md:px-6 py-3 shrink-0" style="border-bottom: 1px solid #e5e7eb; background-color: #f9fafb;">
                    <div class="flex items-center gap-3">
                        <!-- Hamburger Menu (Mobile Only) -->
                        <button class="md:hidden btn btn-sm btn-ghost btn-square" onclick="document.getElementById('cms-media-picker-sidebar').classList.toggle('hidden')">
                            <svg class="w-5 h-5" style="color: #374151;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                        <h3 class="font-bold text-base md:text-lg" style="color: #111827;">${i18n.title}</h3>
                    </div>
                    
                    <div class="flex items-center gap-2 md:gap-3">
                        <!-- Search -->
                        <div class="relative w-40 md:w-64">
                            <input type="text" 
                                   placeholder="${i18n.search}" 
                                   class="input input-sm input-bordered w-full pl-11 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   style="background-color: #ffffff; border-color: #d1d5db; color: #1f2937; font-size: 0.875rem;"
                                   id="cms-media-picker-search"
                                   oninput="window.CMS.MediaPicker.search(this.value)">
                            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" style="color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>
                        
                        <button class="btn btn-sm btn-ghost btn-circle hover:bg-gray-100" onclick="window.CMS.MediaPicker.close()">
                            <svg class="w-5 h-5" style="color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <!-- BODY -->
                <div class="flex-1 flex overflow-hidden relative" style="min-height: 0;">
                    
                    <!-- SIDEBAR (1/3) - Always visible on desktop, toggleable on mobile -->
                    <div id="cms-media-picker-sidebar" class="flex md:w-64 p-5 flex-col gap-4 shrink-0 overflow-y-auto md:relative h-full md:h-auto" style="background-color: #f8f9fa; border-right: 1px solid #dee2e6; box-shadow: 1px 0 3px rgba(0,0,0,0.05);">
                        <!-- Close button for mobile -->
                        <button class="md:hidden self-end btn btn-sm btn-ghost btn-circle mb-2" onclick="document.getElementById('cms-media-picker-sidebar').classList.add('hidden')">
                            <svg class="w-5 h-5" style="color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                        
                        <button class="btn btn-primary btn-sm w-full gap-2" style="background-color: #4f46e5 !important; border-color: #4f46e5 !important; color: #ffffff !important;"
                                onclick="document.getElementById('cms-media-picker-file-input').click()">
                            <svg class="w-4 h-4" style="color: #ffffff !important;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                            </svg>
                            <span style="color: #ffffff !important;">${i18n.upload}</span>
                        </button>
                        <input type="file" id="cms-media-picker-file-input" class="hidden" multiple accept="image/*,video/*,application/pdf"
                               onchange="window.CMS.MediaPicker.handleUpload(this.files)">

                        <!-- Upload Progress -->
                        <div id="cms-media-picker-upload-progress" class="hidden p-2 rounded text-xs" style="background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div class="flex justify-between mb-1" style="color: #6b7280;">
                                <span>${i18n.uploading}</span>
                                <span id="cms-media-picker-upload-status">0%</span>
                            </div>
                            <progress class="progress progress-primary w-full h-1" id="cms-media-picker-upload-bar" value="0" max="100"></progress>
                        </div>

                        <!-- Filters -->
                        <div>
                            <h4 class="text-xs uppercase font-semibold mb-2 px-2" style="color: #9ca3af;">${i18n.filter}</h4>
                            <ul class="menu p-0 w-full text-sm" style="background-color: transparent;">
                                <li><a class="active rounded hover:bg-white/50" style="color: #374151;" data-filter="" onclick="window.CMS.MediaPicker.setFilter(null)">${i18n.allMedia}</a></li>
                                <li><a class="rounded hover:bg-white/50" style="color: #374151;" data-filter="image" onclick="window.CMS.MediaPicker.setFilter('image')">${i18n.images}</a></li>
                                <li><a class="rounded hover:bg-white/50" style="color: #374151;" data-filter="video" onclick="window.CMS.MediaPicker.setFilter('video')">${i18n.videos}</a></li>
                                <li><a class="rounded hover:bg-white/50" style="color: #374151;" data-filter="document" onclick="window.CMS.MediaPicker.setFilter('document')">${i18n.documents}</a></li>
                            </ul>
                        </div>
                    </div>

                    <!-- GRID AREA (2/3) -->
                    <div class="flex-1 overflow-y-auto p-6 relative" style="background-color: #ffffff; min-height: 0;" id="cms-media-picker-dropzone">
                        <div id="cms-media-picker-grid">
                            <!-- JS Injected Grid -->
                        </div>
                    </div>
                </div>

                <!-- FOOTER -->
                <div class="p-3 flex items-center justify-between shrink-0" style="border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                    <div class="text-xs md:text-sm" style="color: #6b7280;">
                         <span id="cms-media-picker-selected-count">0</span> ${i18n.selected}
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-ghost hover:bg-gray-100" style="color: #374151 !important;" onclick="window.CMS.MediaPicker.close()">${i18n.cancel}</button>
                        <button class="btn btn-sm btn-primary" style="background-color: #4f46e5; border-color: #4f46e5; color: #ffffff !important;" id="cms-media-picker-confirm-btn" disabled onclick="window.CMS.MediaPicker.confirm()">${i18n.select}</button>
                    </div>
                </div>
            </div>
        `;

        // Add inline style for active menu state and mobile responsiveness
        const style = document.createElement('style');
        style.textContent = `
            #cms-media-picker-modal .menu a.active {
                background-color: #4f46e5 !important;
                color: #ffffff !important;
                font-weight: 500;
            }
            #cms-media-picker-modal .menu a:hover {
                background-color: rgba(79, 70, 229, 0.08);
            }
            #cms-media-picker-modal .menu a.active:hover {
                background-color: #4338ca !important;
            }
            #cms-media-picker-modal .menu a {
                transition: all 0.15s ease;
            }
            
            /* Upload button override */
            #cms-media-picker-modal .btn-primary {
                background-color: #4f46e5 !important;
                border-color: #4f46e5 !important;
                color: #ffffff !important;
            }
            #cms-media-picker-modal .btn-primary:hover {
                background-color: #4338ca !important;
                border-color: #4338ca !important;
            }
            
            /* Professional polish */
            #cms-media-picker-modal .modal-box {
                border-radius: 12px;
            }
            #cms-media-picker-modal h3 {
                letter-spacing: -0.02em;
            }
            #cms-media-picker-modal h4 {
                letter-spacing: 0.05em;
            }
            
            /* Mobile responsive adjustments */
            @media (min-width: 768px) {
                #cms-media-picker-modal .modal-box {
                    width: 1800px !important;
                    height: 900px !important;
                }
            }
            
            /* Mobile sidebar overlay */
            @media (max-width: 767px) {
                #cms-media-picker-modal .modal-box {
                    width: 95vw !important;
                    height: 90vh !important;
                    max-height: 90vh !important;
                }
                #cms-media-picker-sidebar {
                    position: absolute;
                    width: 80vw;
                    max-width: 300px;
                    box-shadow: 2px 0 8px rgba(0,0,0,0.15);
                    z-index: 10 !important;
                }
                #cms-media-picker-sidebar.hidden {
                    display: none !important;
                }
            }
        `;
        modal.appendChild(style);

        document.body.appendChild(modal);
        modalElement = modal;

        // Setup drag and drop on dropzone
        const dropzone = modal.querySelector('#cms-media-picker-dropzone');
        setupDropzone(dropzone);

        return modal;
    }

    /**
     * Setup drag and drop handlers
     */
    function setupDropzone(dropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropzone.addEventListener('dragenter', () => dropzone.classList.add('border-primary', 'bg-primary/10'));
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-primary', 'bg-primary/10'));
        dropzone.addEventListener('drop', (e) => {
            dropzone.classList.remove('border-primary', 'bg-primary/10');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                window.CMS.MediaPicker.handleUpload(files);
            }
        });
    }

    /**
     * Load media from API
     */
    async function loadMedia() {
        isLoading = true;
        updateUI();

        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            if (currentFilter) params.set('type', currentFilter);

            const url = `${API_URL}?${params.toString()} `;
            const response = await fetch(url, { credentials: 'include' });

            if (!response.ok) throw new Error('Failed to load media');

            const data = await response.json();
            mediaItems = Array.isArray(data) ? data : (data.media || data.rows || []);
        } catch (error) {
            console.error('[MediaPicker] Error loading media:', error);
            mediaItems = [];
        }

        isLoading = false;
        updateUI();
    }

    /**
     * Handle file upload
     */
    async function handleUpload(files) {
        if (!files || files.length === 0) return;

        const progressEl = document.getElementById('cms-media-picker-upload-progress');
        const statusEl = document.getElementById('cms-media-picker-upload-status');
        const barEl = document.getElementById('cms-media-picker-upload-bar');

        progressEl.classList.remove('hidden');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            statusEl.textContent = `Uploading ${file.name}... (${i + 1}/${files.length})`;
            barEl.value = (i / files.length) * 100;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name} `);
                }

                barEl.value = ((i + 1) / files.length) * 100;
            } catch (error) {
                console.error('[MediaPicker] Upload error:', error);
                statusEl.textContent = `Error: ${error.message} `;
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        progressEl.classList.add('hidden');
        document.getElementById('cms-media-picker-file-input').value = '';

        // Reload media
        await loadMedia();
    }

    /**
     * Update UI based on state
     */
    /**
     * Update UI based on state
     */
    function updateUI() {
        const grid = document.getElementById('cms-media-picker-grid');
        const statusEl = document.getElementById('cms-media-picker-status');

        // Buttons in new footer? Use confirm ID if present, otherwise no specific ID was set in createModal 
        // Wait, I didn't set ID for Confirm button in createModal. I used onclick.
        // Let's add IDs back for safer selection or just trust existing logic?
        // Let's assume standard behavior.

        if (!grid) return;

        // Loading state
        if (isLoading) {
            grid.innerHTML = `
            <div class="flex h-full items-center justify-center opacity-50">
                <span class="loading loading-spinner loading-lg"></span>
            </div>
            `;
            return;
        }

        // Filter items
        let filtered = mediaItems;
        if (currentOptions.filter) {
            filtered = mediaItems.filter(m => m.type === currentOptions.filter);
        }
        if (currentFilter && currentFilter !== currentOptions.filter) {
            filtered = filtered.filter(m => m.type === currentFilter);
        }

        // Empty state
        if (filtered.length === 0) {
            grid.innerHTML = `
            <div class="flex flex-col h-full items-center justify-center opacity-50">
                    <svg class="w-16 h-16 opacity-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p class="text-sm">${i18n.noMediaFound}</p>
            </div>
            `;
        } else {
            // Render grid with responsive columns
            grid.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4 pb-12">
                ${filtered.map(media => {
                const isSelected = selectedItems.some(s => s.id === media.id);
                const thumbnail = getThumbnail(media);

                return `
                            <div class="group relative aspect-square bg-base-100 rounded-lg border-2 overflow-hidden cursor-pointer transition-all
                                        ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-base-200 hover:border-primary/50 hover:shadow-lg'}"
                                 onclick="window.CMS.MediaPicker.toggleSelect(${media.id})">
                                ${thumbnail}
                                
                                <!-- Overlay Gradient -->
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <!-- Meta Info -->
                                <div class="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p class="text-[10px] text-white font-medium truncate">${media.originalFilename || media.filename}</p>
                                    <p class="text-[9px] text-white/70">${(media.size / 1024).toFixed(1)} KB</p>
                                </div>

                                <!-- Selection Checkmark -->
                                ${isSelected ? `
                                    <div class="absolute top-2 right-2 w-6 h-6 shadow-sm rounded-full flex items-center justify-center" style="background-color: #4f46e5; color: #ffffff;">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                ` : ''}
                            </div>
                        `;
            }).join('')
                }
            </div>
            `;
        }

        // Update selection count text
        const countEl = document.getElementById('cms-media-picker-selected-count');
        if (countEl) {
            countEl.textContent = selectedItems.length.toString();
        }

        // Update confirm button state
        const confirmBtn = document.getElementById('cms-media-picker-confirm-btn');
        if (confirmBtn) {
            if (selectedItems.length > 0) {
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = '1';
            } else {
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
            }
        }

        // Update sidebar filter active states
        const links = document.querySelectorAll('#cms-media-picker-modal .menu a');
        links.forEach(link => {
            // Compare data-filter attribute (can be empty string for All)
            const filter = link.getAttribute('data-filter');
            // If currentFilter is null/undefined, match empty string
            const isActive = (filter === (currentFilter || ''));

            if (isActive) link.classList.add('active');
            else link.classList.remove('active');
        });
    }

    /**
     * Get thumbnail HTML for media item
     */
    function getThumbnail(media) {
        if (media.type === 'image') {
            return `<img src="${media.url}" alt="${media.originalFilename || ''}" class="w-full h-full object-cover">`;
        } else if (media.type === 'video') {
            return `
            <div class="w-full h-full bg-base-300 flex items-center justify-center">
                <svg class="w-12 h-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            `;
        } else {
            return `
            <div class="w-full h-full bg-base-300 flex items-center justify-center">
                <svg class="w-12 h-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
            </div>
            `;
        }
    }

    /**
     * Toggle selection of a media item
     */
    function toggleSelect(id) {
        const media = mediaItems.find(m => m.id === id);
        if (!media) return;

        const index = selectedItems.findIndex(s => s.id === id);

        if (index >= 0) {
            // Deselect
            selectedItems.splice(index, 1);
        } else {
            // Select
            if (currentOptions.multiple) {
                selectedItems.push(media);
            } else {
                selectedItems = [media];
            }
        }

        updateUI();
    }



    /**
     * Public API
     */
    window.CMS.MediaPicker = {
        /**
         * Open the media picker modal
         * @param {Object} options
         * @param {Function} options.onSelect - Callback when media is selected
         * @param {string} options.filter - Filter by type: 'image', 'video', 'document', or null
         * @param {boolean} options.multiple - Allow multiple selection
         */
        open: function (options = {}) {
            currentOptions = {
                onSelect: options.onSelect || (() => { }),
                filter: options.filter || null,
                multiple: options.multiple || false
            };

            currentFilter = currentOptions.filter;
            selectedItems = [];
            searchQuery = '';

            createModal();
            modalElement.classList.remove('hidden');
            modalElement.classList.add('modal-open'); // DaisyUI class
            document.body.style.overflow = 'hidden';

            // Reset search
            const searchInput = document.getElementById('cms-media-picker-search');
            if (searchInput) searchInput.value = '';

            loadMedia();
        },

        /**
         * Close the media picker modal
         */
        close: function () {
            if (modalElement) {
                modalElement.classList.remove('modal-open');
                modalElement.classList.add('hidden');
                document.body.style.overflow = '';
            }
            selectedItems = [];
            currentOptions = {};
        },

        /**
         * Confirm selection and call callback
         */
        confirm: function () {
            if (selectedItems.length > 0 && currentOptions.onSelect) {
                if (currentOptions.multiple) {
                    currentOptions.onSelect(selectedItems);
                } else {
                    currentOptions.onSelect(selectedItems[0]);
                }
            }
            this.close();
        },

        /**
         * Set filter type
         */
        setFilter: function (filter) {
            currentFilter = filter;
            loadMedia();
        },

        /**
         * Search media
         */
        search: function (query) {
            searchQuery = query;
            // Debounce search
            clearTimeout(this._searchTimeout);
            this._searchTimeout = setTimeout(() => loadMedia(), 300);
        },

        /**
         * Toggle selection
         */
        toggleSelect: toggleSelect,

        /**
         * Handle file upload
         */
        handleUpload: handleUpload,

        /**
         * Set language for i18n
         * @param {Object} translations - Object with translation keys
         * Usage: window.CMS.MediaPicker.setLanguage({ title: 'Biblioteca de Medios', ... })
         */
        setLanguage: function (translations) {
            Object.assign(i18n, translations);
            // Recreate modal if it exists to apply new translations
            if (modalElement) {
                const wasOpen = !modalElement.classList.contains('hidden');
                modalElement.remove();
                modalElement = null;
                if (wasOpen) {
                    createModal();
                    modalElement.classList.remove('hidden');
                    modalElement.classList.add('modal-open');
                }
            }
        },

        // Internal timeout
        _searchTimeout: null
    };

    // Register with CMS SDK done automatically via Object.defineProperty in cms-sdk.js
    // No manual registration needed here as line 360 calls the setter.

    console.log('[CMS] MediaPicker component loaded');
})();
