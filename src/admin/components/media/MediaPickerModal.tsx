import { html, raw } from "hono/html";
import { env } from "@/config/env.ts";

export const MediaPickerModal = () => {
    return html`
    <!-- Unified Media Picker Modal -->
    <div id="unifiedMediaPickerModal" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 9999; padding: 2rem; overflow-y: auto;">
      <div style="max-width: 1200px; margin: 0 auto; background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eef0f2;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0; color: #111;">Biblioteca de Medios</h3>
          <button
            type="button"
            data-media-action="close"
            style="width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; font-size: 1.5rem; color: #666; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;"
            onmouseover="this.style.background='#f3f4f6'"
            onmouseout="this.style.background='transparent'"
          >
            ×
          </button>
        </div>

        <!-- Toolbar (Tabs + Actions) -->
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 0.5rem; background: #f3f4f6; padding: 0.25rem; border-radius: 0.5rem;">
                <button type="button" class="media-tab active" data-media-tab="library" style="padding: 0.5rem 1rem; border-radius: 0.25rem; border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Biblioteca</button>
                <button type="button" class="media-tab" data-media-tab="upload" style="padding: 0.5rem 1rem; border-radius: 0.25rem; border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; background: transparent; color: #666;">Subir Archivos</button>
            </div>
            <div style="flex: 1;"></div>
            <input type="text" placeholder="Buscar..." style="padding: 0.5rem 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; min-width: 250px;" oninput="filterMedia(this.value)" />
        </div>

        <!-- Content Area -->
        <div id="mediaPickerContent" style="min-height: 400px; max-height: 60vh; overflow-y: auto;">
            
            <!-- View: Library -->
            <div id="mediaLibraryView">
                <div id="mediaGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem;">
                    <!-- Items injected via JS -->
                    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #999;">
                        Cargando medios...
                    </div>
                </div>
            </div>

            <!-- View: Upload -->
            <div id="mediaUploadView" style="display: none; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #e5e7eb; border-radius: 0.75rem; padding: 4rem; text-align: center;">
                <div style="margin-bottom: 1.5rem;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600;">Arrastra archivos aquí o haz clic para subir</h4>
                <p style="margin: 0 0 1.5rem 0; color: #6b7280; font-size: 0.875rem;">Soporta JPG, PNG, GIF, WEBP hasta 10MB</p>
                
                <input type="file" id="globalMediaUploadInput" accept="image/*" style="display: none;" multiple />
                <button 
                    type="button" 
                    data-media-action="triggerUpload"
                    style="background: #000; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                >
                    Seleccionar Archivos
                </button>
                <div id="globalUploadProgress" style="margin-top: 1rem; width: 100%; max-width: 400px; display: none;">
                    <div style="height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                        <div id="globalUploadProgressBar" style="width: 0%; height: 100%; background: #167bff; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #eef0f2; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" data-media-action="close" style="padding: 0.625rem 1.25rem; border-radius: 0.375rem; border: 1px solid #e5e7eb; background: white; font-weight: 500; cursor: pointer;">Cancelar</button>
            <button type="button" id="mediaSelectBtn" disabled data-media-action="confirm" style="padding: 0.625rem 1.25rem; border-radius: 0.375rem; border: none; background: #e5e7eb; color: #9ca3af; font-weight: 600; cursor: not-allowed; transition: all 0.2s;">Seleccionar</button>
        </div>

      </div>
    </div>

    <script>
    (function(){
        // Global State
        let currentCallback = null;
        let selectedItems = new Set();
        let allMedia = [];
        let isMultiSelect = false;

        // --- PUBLIC API ---
        window.openMediaPicker = function(options = {}) {
            const { onSelect, multi = false, type = 'image' } = options;
            
            currentCallback = onSelect;
            isMultiSelect = multi;
            selectedItems.clear();
            updateSelectButton();
            
            // Show modal
            const modal = document.getElementById('unifiedMediaPickerModal');
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent background scroll
                loadMediaLibrary(); // Initial load
                switchMediaTab('library'); // Reset view
            }
        };

        window.closeMediaPicker = function() {
            const modal = document.getElementById('unifiedMediaPickerModal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
            currentCallback = null;
        };

        // --- INTERNAL LOGIC ---

        window.switchMediaTab = function(tabName) {
            // Update tabs UI
            document.querySelectorAll('.media-tab').forEach(t => {
                t.style.background = 'transparent';
                t.style.boxShadow = 'none';
                t.style.color = '#666';
            });
            const activeTab = document.querySelector(\`.media-tab[onclick*="\${tabName}"]\`);
            if (activeTab) {
                activeTab.style.background = 'white';
                activeTab.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                activeTab.style.color = '#111';
            }

            // Update View
            document.getElementById('mediaLibraryView').style.display = tabName === 'library' ? 'block' : 'none';
            document.getElementById('mediaUploadView').style.display = tabName === 'upload' ? 'flex' : 'none';
        };

        async function loadMediaLibrary() {
            const grid = document.getElementById('mediaGrid');
            try {
                // Fetch data
                const response = await fetch('${env.ADMIN_PATH}/media/data?limit=100', { 
                    credentials: 'include',
                    cache: 'no-store'
                });
                if (!response.ok) throw new Error('Error de red');
                const data = await response.json();
                console.log('Media Picker Loaded:', data);
                
                // Handle direct array or object with media property from different API conventions
                allMedia = Array.isArray(data) ? data : (Array.isArray(data.media) ? data.media : []);
                renderGrid(allMedia);
                
            } catch (e) {
                console.error('Media Picker Error:', e);
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #f31260;">Error cargando medios</div>';
            }
        }

        window.filterMedia = function(query) {
            if (!query) return renderGrid(allMedia);
            
            const lowerQ = query.toLowerCase();
            const filtered = allMedia.filter(m => 
                (m.filename && m.filename.toLowerCase().includes(lowerQ)) ||
                (m.originalFilename && m.originalFilename.toLowerCase().includes(lowerQ))
            );
            renderGrid(filtered);
        }

        function renderGrid(items) {
            const grid = document.getElementById('mediaGrid');
            console.log('[renderGrid] Total items received:', items.length, items);
            
            if (!items.length) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 2rem;">No se encontraron archivos.</div>';
                return;
            }

            // Relaxed filter: check for 'image' type or mime types starting with 'image/'
            const images = items.filter(i => {
                 if (!i.type) return false;
                 const t = i.type.toLowerCase();
                 return t === 'image' || t.startsWith('image/');
            });
            console.log('[renderGrid] Images after filter:', images.length, images.map(i => ({ id: i.id, type: i.type })));

            grid.innerHTML = images.map(media => {
                const isSelected = selectedItems.has(media.id);
                const border = isSelected ? '3px solid #167bff' : '1px solid #e5e7eb';
                const opacity = isSelected ? '1' : '0.9';

                return \`
                    <div 
                        onclick="toggleMediaSelection(\${media.id})"
                        class="media-item"
                        style="
                            position: relative; 
                            aspect-ratio: 1; 
                            cursor: pointer; 
                            border-radius: 0.5rem; 
                            overflow: hidden; 
                            border: \${border};
                            transition: all 0.1s;
                        "
                    >
                        <img 
                            src="\${media.url}" 
                            style="width: 100%; height: 100%; object-fit: cover; opacity: \${opacity};" 
                            loading="lazy"
                        />
                        \${isSelected ? '<div style="position: absolute; top:0.25rem; right: 0.25rem; background:#167bff; color:white; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:12px;">✓</div>' : ''}
                    </div>
                \`;
            }).join('');
        }

        window.toggleMediaSelection = function(id) {
            if (!isMultiSelect) {
                selectedItems.clear();
                selectedItems.add(id);
            } else {
                if (selectedItems.has(id)) selectedItems.delete(id);
                else selectedItems.add(id);
            }
            renderGrid(allMedia); // Re-render to show selection state
            updateSelectButton();
        };

        function updateSelectButton() {
            const btn = document.getElementById('mediaSelectBtn');
            const count = selectedItems.size;
            
            if (count > 0) {
                btn.disabled = false;
                btn.style.background = '#000';
                btn.style.color = 'white';
                btn.style.cursor = 'pointer';
                btn.textContent = \`Seleccionar (\${count})\`;
            } else {
                btn.disabled = true;
                btn.style.background = '#e5e7eb';
                btn.style.color = '#9ca3af';
                btn.style.cursor = 'not-allowed';
                btn.textContent = 'Seleccionar';
            }
        }

        window.confirmMediaSelection = function() {
            if (currentCallback && selectedItems.size > 0) {
                // Find full objects
                const selectedObjects = allMedia.filter(m => selectedItems.has(m.id));
                // Return single object if not multi, else array
                const result = isMultiSelect ? selectedObjects : selectedObjects[0];
                currentCallback(result);
            }
            closeMediaPicker();
        };

        // --- UPLOAD LOGIC ---
        document.addEventListener('DOMContentLoaded', () => {
            const input = document.getElementById('globalMediaUploadInput');
            if (input) {
                input.addEventListener('change', async (e) => {
                    if (!e.target.files.length) return;
                    
                    const files = Array.from(e.target.files);
                    const progressBox = document.getElementById('globalUploadProgress');
                    const bar = document.getElementById('globalUploadProgressBar');
                    
                    progressBox.style.display = 'block';
                    bar.style.width = '10%';

                    try {
                        console.group('Media Upload Debug');
                        console.log('Starting upload. Files:', files);
                        
                        const uploadedIds = []; // Collect IDs for auto-selection

                        // Quick sequential upload (or parallel)
                        for (const file of files) {
                            console.log('Processing file:', file.name, file.type, file.size);
                            const formData = new FormData();
                            formData.append('files', file);

                            bar.style.width = '50%';
                            
                            const uploadUrl = '${env.ADMIN_PATH}/api/media/upload';
                            console.log('Uploading to:', uploadUrl);

                            const res = await fetch(uploadUrl, {
                                method: 'POST',
                                body: formData,
                                credentials: 'include'
                            });
                            
                            console.log('Upload response status:', res.status);

                            if (!res.ok) {
                                let errorText;
                                try {
                                    const errorJson = await res.json();
                                    console.error('Upload failed (JSON):', errorJson);
                                    errorText = errorJson.error || 'Server Error';
                                } catch (e) {
                                    errorText = await res.text();
                                    console.error('Upload failed (Text):', errorText);
                                }
                                throw new Error('Upload failed: ' + errorText);
                            }

                            const json = await res.json();
                            console.log('Upload success payload:', json);

                            // Collect IDs of uploaded files for auto-selection
                            if (json.files && json.files.length > 0) {
                                json.files.forEach(f => uploadedIds.push(f.id));
                            } else {
                                console.warn('Server processed request but returned no files. Check field name match.');
                            }
                        }
                        
                        bar.style.width = '100%';
                        
                        // Switch to library tab and reload
                        switchMediaTab('library');
                        await loadMediaLibrary();
                        
                        // Auto-select the uploaded items
                        if (uploadedIds.length > 0) {
                            console.log('[AutoSelect] Selecting uploaded IDs:', uploadedIds);
                            uploadedIds.forEach(id => selectedItems.add(id));
                            renderGrid(allMedia); // Re-render to show selection
                            updateSelectButton();
                        }
                        
                        progressBox.style.display = 'none';
                        bar.style.width = '0%';
                        input.value = '';

                    } catch (e) {
                         console.error('Upload Exception:', e);
                         alert('Error subiendo archivos: ' + e.message);
                         progressBox.style.display = 'none';
                    } finally {
                        console.groupEnd();
                    }
                });
            }
        });

    })();
    </script>
  `;
};
