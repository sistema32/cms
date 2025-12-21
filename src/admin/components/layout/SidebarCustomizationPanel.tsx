import { html, raw } from "hono/html";

export const SidebarCustomizationPanel = () => {
  return html`
    <!-- Customization Panel Trigger -->
    <button
      type="button"
      id="customizePanelToggle"
      class="customize-trigger"
      data-action="toggleCustomizePanel()"
      title="Personalizar editor"
    >
      ⚙️
    </button>

    <!-- Customization Panel (Slide Down) -->
    <div id="customizePanelWrapper" style="background: #f8f9fa; border-bottom: 1px solid #eef0f2; overflow: hidden; height: 0; transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
      <div id="customizePanel" class="customize-panel-inner">
        <div class="customize-header">
          <div>
            <h3 style="margin: 0; font-size: 1.125rem;">Personalizar Editor</h3>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">Arrastra los elementos para reorganizar tu espacio de trabajo.</p>
          </div>
          <button type="button" data-action="closeCustomizePanel()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%;" onmouseover="this.style.background='#eef0f2'" onmouseout="this.style.background='transparent'">✕</button>
        </div>
        
        <div class="customize-grid">
           <!-- Comentarios Toggle -->
          <div class="customize-section" style="border-right: 1px solid #eef0f2;">
             <h4 style="margin: 0 0 1rem 0; font-size: 0.9375rem; font-weight: 600;">Opciones Globales</h4>
            <label class="toggle-wrapper">
              <input type="checkbox" id="defaultComments" onchange="saveEditorSettings()">
              <span>Permitir comentarios</span>
            </label>
          </div>
          
          <!-- Bloques del Sidebar -->
          <div class="customize-section" style="flex: 1;">
            <h4 style="margin: 0 0 1rem 0; font-size: 0.9375rem; font-weight: 600;">Bloques del Sidebar</h4>
            <div id="blocksList" class="blocks-list horizontal-scroll">
              <!-- Populated by JavaScript -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .customize-trigger {
        position: fixed;
        top: 6rem;
        right: 2rem;
        width: 48px;
        height: 48px;
        background: white;
        border: 1px solid #eef0f2;
        border-radius: 50%;
        cursor: pointer;
        z-index: 999;
        font-size: 1.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .customize-trigger:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }

      .customize-panel-inner {
        max-width: 1200px;
        margin: 0 auto;
      }

      .customize-grid {
        display: flex;
        min-height: 200px;
      }

      .customize-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #eef0f2;
      }

      .customize-section {
        padding: 1.5rem;
        border-bottom: 1px solid #eef0f2;
      }

      .customize-section:last-child {
        border-bottom: none;
      }

      .toggle-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        font-size: 0.9375rem;
      }

      .toggle-wrapper input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .blocks-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding: 0.5rem 0;
      }

      .block-item {
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #eef0f2;
        border-radius: 0.5rem;
        cursor: move;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: all 0.2s ease;
        user-select: none;
        min-width: 200px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }

      .block-item:hover {
        background: #f0f1f3;
      }

      .block-item.dragging {
        opacity: 0.5;
        cursor: grabbing;
      }

      .block-item input[type="checkbox"] {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .drag-handle {
        color: #999;
        cursor: grab;
        font-size: 1.25rem;
        line-height: 1;
      }

      .block-title {
        flex: 1;
        font-size: 0.9375rem;
        color: #1e2328;
      }
    </style>
  `;
};

export const SidebarCustomizationScript = () => {
  return raw(`
    <script>
      // Sidebar customization state
      let editorSettings = {
        commentsEnabled: true,
        blocks: [
          { id: 'actions-section', title: 'Publicar Entrada', visible: true, order: 0 },
          { id: 'publish-section', title: 'Publicación', visible: true, order: 1 },
          { id: 'slug-section', title: 'Slug', visible: true, order: 2 },
          { id: 'organization-section', title: 'Organización', visible: true, order: 3 },
          { id: 'featured-image-section', title: 'Imagen Destacada', visible: true, order: 4 },
          { id: 'seo-section', title: 'SEO', visible: true, order: 5 }
        ]
      };

      // Load settings from localStorage
      function loadEditorSettings() {
        const saved = localStorage.getItem('post-editor-settings');
        if (saved) {
          try {
            editorSettings = JSON.parse(saved);
          } catch (e) {
            console.error('Failed to load editor settings:', e);
          }
        }
        applyEditorSettings();
        populateBlocksList();
      }

      // Save settings to localStorage
      function saveEditorSettings() {
        const commentsCheckbox = document.getElementById('defaultComments');
        if (commentsCheckbox) {
          editorSettings.commentsEnabled = commentsCheckbox.checked;
        }
        localStorage.setItem('post-editor-settings', JSON.stringify(editorSettings));
        applyEditorSettings();
      }

      // Apply settings to the editor
      function applyEditorSettings() {
        const sidebar = document.getElementById('customizableSidebar');
        if (!sidebar) return;

        // Sort and show/hide blocks
        editorSettings.blocks.forEach(block => {
          const el = sidebar.querySelector(\`[data-block-id="\${block.id}"]\`);
          if (el) {
            el.style.display = block.visible ? '' : 'none';
            el.style.order = String(block.order);
          }
        });

        // Update comments toggle in Panel
        const commentsPanelCheckbox = document.getElementById('defaultComments');
        if (commentsPanelCheckbox) {
          commentsPanelCheckbox.checked = editorSettings.commentsEnabled;
        }

        // Update REAL hidden input in form
        const realCommentsInput = document.getElementById('commentsEnabledInput');
        if (realCommentsInput) {
            realCommentsInput.value = editorSettings.commentsEnabled ? 'true' : 'false';
        }
      }

      // Populate blocks list in panel
      function populateBlocksList() {
        const blocksList = document.getElementById('blocksList');
        if (!blocksList) return;

        blocksList.innerHTML = '';
        
        // Sort blocks by order
        const sortedBlocks = [...editorSettings.blocks].sort((a, b) => a.order - b.order);
        
        sortedBlocks.forEach(block => {
          const item = document.createElement('div');
          item.className = 'block-item';
          item.draggable = true;
          item.dataset.blockId = block.id;
          
          item.innerHTML = \`
            <span class="drag-handle">⋮⋮</span>
            <input type="checkbox" \${block.visible ? 'checked' : ''} onchange="toggleBlockVisibility('\${block.id}')">
            <span class="block-title">\${block.title}</span>
          \`;
          
          item.addEventListener('dragstart', handleDragStart);
          item.addEventListener('dragover', handleDragOver);
          item.addEventListener('drop', handleDrop);
          item.addEventListener('dragend', handleDragEnd);
          
          blocksList.appendChild(item);
        });
      }

      // Toggle block visibility
      window.toggleBlockVisibility = function(blockId) {
        const block = editorSettings.blocks.find(b => b.id === blockId);
        if (block) {
          block.visible = !block.visible;
          saveEditorSettings();
          populateBlocksList();
        }
      };

      // Drag and drop handlers
      let draggedElement = null;

      function handleDragStart(e) {
        draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }

      function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = getDragAfterElement(e.currentTarget.parentElement, e.clientY);
        const dragging = document.querySelector('.dragging');
        
        if (afterElement == null) {
          e.currentTarget.parentElement.appendChild(dragging);
        } else {
          e.currentTarget.parentElement.insertBefore(dragging, afterElement);
        }
      }

      function handleDrop(e) {
        e.preventDefault();
        updateBlockOrder();
      }

      function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedElement = null;
      }

      function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.block-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          
          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
      }

      function updateBlockOrder() {
        const items = document.querySelectorAll('#blocksList .block-item');
        items.forEach((item, index) => {
          const blockId = item.dataset.blockId;
          const block = editorSettings.blocks.find(b => b.id === blockId);
          if (block) {
            block.order = index;
          }
        });
        saveEditorSettings();
      }

      // Panel toggle functions
      // Panel toggle functions
      window.toggleCustomizePanel = function() {
        const wrapper = document.getElementById('customizePanelWrapper');
        if (wrapper) {
           if (wrapper.style.height === '0px' || wrapper.style.height === '0' || wrapper.style.height === '') {
             populateBlocksList(); // Refresh list before opening
             wrapper.style.height = 'auto'; // Calc height
             const scrollHeight = wrapper.scrollHeight;
             wrapper.style.height = '0px';
             // Force reflow
             wrapper.offsetHeight; 
             wrapper.style.height = scrollHeight + 'px';
           } else {
             wrapper.style.height = '0px';
           }
        }
      };

      window.closeCustomizePanel = function() {
        const wrapper = document.getElementById('customizePanelWrapper');
        if (wrapper) {
          wrapper.style.height = '0px';
        }
      };

      // Initialize on load
      document.addEventListener('DOMContentLoaded', function() {
        loadEditorSettings();
      });
    </script>
  `);
};
