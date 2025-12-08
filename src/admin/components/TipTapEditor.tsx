import { html, raw } from "hono/html";
import { env } from "../../config/env.ts";

interface TipTapEditorProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  editorMode?: 'classic' | 'blocks';
}

export const TipTapEditor = (props: TipTapEditorProps) => {
  const {
    name,
    value = "",
    placeholder = "Escribe tu historia...",
    required = false,
    editorMode = 'classic',
  } = props;

  const editorId = `tiptap-${name}`;
  const inputId = `input-${name}`;
  const toolbarId = `toolbar-${name}`;
  const sourceAreaId = `source-${name}`;

  return html`
    <style>
      /* TipTap Core Styles */
      .ProseMirror {
        outline: none;
        min-height: 300px;
        font-family: 'Merriweather', serif; 
        font-size: 1.125rem;
        line-height: 1.8;
        color: #1e2328;
      }

      .lex-editor-container {
        border: 1px solid #eef0f2;
        border-radius: 0.5rem;
        background: #fff;
        overflow: visible; /* Allow floating menu to hang out */
        transition: border-color 0.2s;
      }
      
      .lex-editor-container:focus-within {
        border-color: #167bff;
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .tiptap-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        padding: 0.5rem;
        border-bottom: 1px solid #eef0f2;
        background: #fff;
        align-items: center;
      }

      .tiptap-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid transparent; 
        background: transparent;
        color: #666;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tiptap-btn:hover {
        background: #f3f4f6;
        color: #1e2328;
      }

      .tiptap-btn.is-active {
        background: #e5e7eb;
        color: #000;
        font-weight: 600;
      }

      .tiptap-separator {
        width: 1px;
        height: 20px;
        background: #eef0f2;
        margin: 0 0.5rem;
        align-self: center;
      }

      .tiptap-source-mode {
        display: none; 
        width: 100%;
        min-height: 300px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        padding: 1rem;
        border: none;
        outline: none;
        resize: vertical;
        line-height: 1.6;
        color: #333;
        background: #f8f9fa;
      }
      
      .ProseMirror {
        padding: 1rem;
        min-height: 300px;
      }

      .is-source-mode #tiptap-${name} { display: none; }
      .is-source-mode #source-${name} { display: block; }
      
      /* Bubble Menu & Floating Menu */
      .tiptap-menu-container {
        display: flex;
        align-items: center;
        background: #fff;
        border: 1px solid #eef0f2;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 0.25rem;
        gap: 0.5rem;
        z-index: 50;
      }
      
      .tiptap-floating-menu {
        margin-left: -2rem; 
      }
      
      .bubble-group {
        display: flex;
        gap: 0.25rem;
      }
      
      .bubble-btn {
        background: transparent;
        border: none;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        font-size: 0.85rem;
        color: #666;
        transition: all 0.2s;
        min-width: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .bubble-btn:hover {
        background: #f3f4f6;
        color: #111;
      }
      
      .bubble-btn.is-active {
        background: #e5e7eb;
        color: #000;
        font-weight: 600;
      }
      
      .bubble-separator {
        width: 1px;
        height: 1.25rem;
        background: #e5e7eb;
      }
      
      /* Mode specific styles */
      .editor-mode-blocks .tiptap-toolbar {
          display: none !important;
      }
      
      .editor-mode-classic .tiptap-floating-menu {
          display: none !important;
      }
      
      /* Inserter Menu (Gutenberg Style) */
      .inserter-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }
      
      .inserter-btn-main {
        width: 32px;
        height: 32px;
        background: #1e2328;
        color: #fff;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      
      .inserter-btn-main:hover {
        background: #000;
        transform: scale(1.05);
      }
      
      .inserter-btn-main.active {
        transform: rotate(45deg);
        background: #333;
      }
      
      .inserter-menu {
        position: absolute;
        bottom: 110%; 
        left: 0;
        margin-bottom: 0.5rem;
        background: white;
        border: 1px solid #eef0f2;
        border-radius: 0.5rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        padding: 0.5rem;
        width: 240px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 100;
        animation: fadeIn 0.1s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .inserter-section {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }
      
      .inserter-section small {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: #999;
        font-weight: 700;
        padding-left: 0.5rem;
        margin-bottom: 0.25rem;
        letter-spacing: 0.05em;
      }
      
      .inserter-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        border: none;
        background: transparent;
        color: #444;
        font-size: 0.9rem;
        border-radius: 0.375rem;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
        font-weight: 500;
      }
      
      .inserter-item:hover {
        background: #f3f4f6;
        color: #000;
      }
      
      .inserter-item svg {
        opacity: 0.6;
        width: 18px;
        height: 18px;
      }
      .inserter-item:hover svg {
        opacity: 1;
      }
      
      .nexus-box {
        margin: 1.5rem 0;
        position: relative;
      }
      .nexus-box:hover::after {
        content: 'Box';
        position: absolute;
        top: -10px;
        right: 0;
        background: #eee;
        font-size: 0.6rem;
        padding: 2px 4px;
        border-radius: 3px;
        color: #888;
      }
    </style>

    <div class="lex-editor-wrapper ${editorMode === 'blocks' ? 'editor-mode-blocks' : 'editor-mode-classic'}">
      <div id="editor-container-${name}" class="lex-editor-container" style="position: relative;" data-instance-name="${name}" data-placeholder="${placeholder}">
        <!-- Toolbar (Classic Mode) -->
        <div id="${toolbarId}" class="tiptap-toolbar"></div>

        <!-- Editor Content (Visual) -->
        <div id="${editorId}"></div>
        
        <!-- Source Content (HTML) -->
        <textarea id="${sourceAreaId}" class="tiptap-source-mode" spellcheck="false"></textarea>
        
        <input
          type="hidden"
          id="${inputId}"
          name="${name}"
          value="${value.replace(/"/g, "&quot;")}"
          ${required ? "required" : ""}
        />
      </div>
    </div>

    ${raw(`<script type="module">
      import { Editor, Node } from 'https://esm.sh/@tiptap/core@2.4.0';
      import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.4.0';
      import Image from 'https://esm.sh/@tiptap/extension-image@2.4.0';
      import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder@2.4.0';
      import Link from 'https://esm.sh/@tiptap/extension-link@2.4.0';
      import TextAlign from 'https://esm.sh/@tiptap/extension-text-align@2.4.0';
      import Underline from 'https://esm.sh/@tiptap/extension-underline@2.4.0';
      import BubbleMenu from 'https://esm.sh/@tiptap/extension-bubble-menu@2.4.0';
      import FloatingMenu from 'https://esm.sh/@tiptap/extension-floating-menu@2.4.0';
      
      const BoxNode = Node.create({
        name: 'box',
        group: 'block',
        content: 'block+',
        defining: true,
        addAttributes() {
          return {
            class: { default: 'nexus-box' },
            style: { default: '' }
          }
        },
        parseHTML() {
          return [{ tag: 'div[data-type="box"]' }]
        },
        renderHTML({ HTMLAttributes }) {
          return ['div', { 'data-type': 'box', ...HTMLAttributes }, 0]
        },
      });

      const CustomImage = Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: '100%',
              renderHTML: attributes => ({
                width: attributes.width,
                style: \`width: \${attributes.width}; max-width: 100%; height: auto;\`
              }),
            },
            layout: {
              default: 'center',
              renderHTML: attributes => {
                const layout = attributes.layout;
                let style = 'display: block; height: auto; ';
                if (layout === 'center') style += 'margin-left: auto; margin-right: auto;';
                else if (layout === 'left') style += 'float: left; margin-right: 1rem; margin-bottom: 0.5rem;';
                else if (layout === 'right') style += 'float: right; margin-left: 1rem; margin-bottom: 0.5rem;';
                
                return { 'data-layout': layout, style: style };
              },
            },
          };
        },
      });

      const icons = {
        plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
        heading: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>',
        list: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
        quote: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>',
        image: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        box: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>',
        grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
        bold: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>',
        italic: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>',
        underline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>',
        strike2: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><path d="M16 6a4 4 0 0 0-8 0c0 4 8 3 8 7a4 4 0 0 1-8 0"></path></svg>',
        h1: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>', 
        h2: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>',
        ul: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
        ol: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>',
        code: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
        left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>',
        center: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>',
        link: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
      };

      const patterns = {
        hero: {
          label: 'Hero Section',
          icon: icons.grid,
          content: \`
            <div data-type="box" class="nexus-box nexus-hero" style="background: #f3f4f6; padding: 3rem 2rem; border-radius: 8px; text-align: center;">
              <h1>Gran Título de Impacto</h1>
              <p>Subtítulo descriptivo que engancha al lector immédiatement.</p>
              <p><a href="#" class="btn-primary" style="background: #167bff; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none;">Botón de Acción</a></p>
            </div>
          \`
        },
        cta: {
          label: 'Call to Action',
          icon: icons.box,
          content: \`
            <div data-type="box" class="nexus-box nexus-cta" style="background: #eef2ff; border-left: 4px solid #4f46e5; padding: 1.5rem;">
              <h3 style="color: #4f46e5; margin-top: 0;">¿Te interesa saber más?</h3>
              <p>Suscríbete a nuestro boletín para recibir las últimas novedades directamente en tu correo.</p>
            </div>
          \`
        },
        info: {
          label: 'Info Box',
          icon: icons.quote,
          content: \`
            <div data-type="box" class="nexus-box nexus-info" style="background: #fffbeb; border: 1px solid #fcd34d; padding: 1rem; border-radius: 6px;">
              <p><strong>💡 Nota Importante:</strong> Este es un bloque de información destacado para resaltar puntos clave.</p>
            </div>
          \`
        }
      };

      // INIT FUNCTION
      async function initTipTap(name) {
         const container = document.getElementById('editor-container-' + name);
         if (!container) return;

         const input = document.getElementById('input-' + name);
         const toolbar = document.getElementById('toolbar-' + name);
         const sourceArea = document.getElementById('source-' + name);
         const editorElementId = 'tiptap-' + name;
         const placeholder = container.dataset.placeholder || '';
         
         // Create Bubble Menu DOM
         const bubbleMenu = document.createElement('div');
         bubbleMenu.className = 'tiptap-menu-container tiptap-bubble-menu';
         container.appendChild(bubbleMenu);
         
         // Create Floating Menu DOM
         const floatingMenu = document.createElement('div');
         floatingMenu.className = 'tiptap-menu-container tiptap-floating-menu';
         container.appendChild(floatingMenu);

         let isSourceMode = false;
         let editorInstance;

         // SETUP INSERTER
         if (floatingMenu) {
            floatingMenu.innerHTML = \`
            <div class="inserter-wrapper">
               <button class="inserter-btn-main" type="button">\${icons.plus}</button>
               <div class="inserter-menu" style="display: none;">
                  <div class="inserter-section">
                     <small>Básicos</small>
                     <button class="inserter-item" data-action="heading">\${icons.heading} Encabezado</button>
                     <button class="inserter-item" data-action="list">\${icons.list} Lista</button>
                     <button class="inserter-item" data-action="quote">\${icons.quote} Cita</button>
                     <button class="inserter-item" data-action="image">\${icons.image} Imagen</button>
                  </div>
                  <div class="inserter-section">
                     <small>Patrones</small>
                     <button class="inserter-item" data-action="pattern-hero">\${icons.grid} Hero</button>
                     <button class="inserter-item" data-action="pattern-cta">\${icons.box} CTA</button>
                     <button class="inserter-item" data-action="pattern-info">\${icons.quote} Info</button>
                  </div>
               </div>
            </div>
            \`;
            
            const mainBtn = floatingMenu.querySelector('.inserter-btn-main');
            const menu = floatingMenu.querySelector('.inserter-menu');
            
            mainBtn.addEventListener('click', (e) => {
              e.stopPropagation(); 
              const isHidden = menu.style.display === 'none';
              menu.style.display = isHidden ? 'flex' : 'none';
              mainBtn.classList.toggle('active', !isHidden);
            });
            
            menu.addEventListener('click', (e) => {
               const btn = e.target.closest('.inserter-item');
               if (!btn) return;
               
               const action = btn.dataset.action;
               if (!editorInstance) return;

               if (action === 'heading') editorInstance.chain().focus().toggleHeading({ level: 2 }).run();
               if (action === 'list') editorInstance.chain().focus().toggleBulletList().run();
               if (action === 'quote') editorInstance.chain().focus().toggleBlockquote().run();
               if (action === 'image') {
                   // Open Media Picker
                   if (window.openMediaPicker) {
                        window.openMediaPicker({
                            type: 'image',
                            onSelect: (media) => {
                                if (media && media.url) {
                                    editorInstance.chain().focus().setImage({ src: media.url, alt: media.originalFilename }).run();
                                }
                            }
                        });
                   } else {
                        const url = window.prompt('URL de la imagen:');
                        if (url) editorInstance.chain().focus().setImage({ src: url }).run();
                   }
               }
               
               if (action.startsWith('pattern-')) {
                   const key = action.replace('pattern-', '');
                   const pattern = patterns[key];
                   if (pattern) {
                       editorInstance.chain().focus().insertContent(pattern.content).run();
                   }
               }
               
               menu.style.display = 'none';
               mainBtn.classList.remove('active');
            });
            
            document.addEventListener('click', (e) => {
                if (!floatingMenu.contains(e.target) && menu.style.display !== 'none') {
                  menu.style.display = 'none';
                  mainBtn.classList.remove('active');
                }
            });
         } // End Inserter

         // INIT EDITOR
         const editor = new Editor({
          element: document.getElementById(editorElementId),
          extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
            CustomImage,
            BoxNode,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            BubbleMenu.configure({
              element: bubbleMenu,
              tippyOptions: { duration: 100 },
              shouldShow: ({ editor }) => editor.isActive('image'),
            }),
            FloatingMenu.configure({
               element: floatingMenu,
               tippyOptions: { duration: 100 },
            }),
          ],
          content: input.value, 
          editorProps: {
            attributes: { class: 'ProseMirror-content' },
          },
          onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            input.value = html;
            sourceArea.value = html; 
            input.dispatchEvent(new Event('input', { bubbles: true }));
            updateToolbarState(editor);
          },
          onSelectionUpdate: ({ editor }) => {
            updateToolbarState(editor);
            updateBubbleMenu(editor);
          },
          onCreate: ({ editor }) => {
             sourceArea.value = editor.getHTML(); 
             updateToolbarState(editor);
             window['editor_' + name] = editor;
             window['tiptap_' + name] = editor;
             editorInstance = editor;
          }
         });

         // TOOLBAR & HELPERS
         function updateToolbarState(editor) {
            const btns = toolbar.querySelectorAll('.tiptap-btn');
            btns.forEach(b => {
                if (b.checkActive) b.checkActive();
            });
         }

         function updateBubbleMenu(editor) {
            if (!editor.isActive('image')) return;
            const currentWidth = editor.getAttributes('image').width || '100%';
            const currentLayout = editor.getAttributes('image').layout || 'center';

            bubbleMenu.innerHTML = \`
               <div class="bubble-group">
                   <button type="button" class="bubble-btn \${currentLayout === 'left' ? 'is-active' : ''}" data-layout="left">⇤</button>
                   <button type="button" class="bubble-btn \${currentLayout === 'center' ? 'is-active' : ''}" data-layout="center">⇹</button>
                   <button type="button" class="bubble-btn \${currentLayout === 'right' ? 'is-active' : ''}" data-layout="right">⇥</button>
               </div>
               <div class="bubble-separator"></div>
               <div class="bubble-group">
                   <button type="button" class="bubble-btn \${currentWidth === '25%' ? 'is-active' : ''}" data-width="25%">S</button>
                   <button type="button" class="bubble-btn \${currentWidth === '50%' ? 'is-active' : ''}" data-width="50%">M</button>
                   <button type="button" class="bubble-btn \${currentWidth === '100%' ? 'is-active' : ''}" data-width="100%">L</button>
               </div>
            \`;
            
            bubbleMenu.querySelectorAll('button').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    if (btn.dataset.layout) editor.chain().focus().updateAttributes('image', { layout: btn.dataset.layout }).run();
                    else if (btn.dataset.width) editor.chain().focus().updateAttributes('image', { width: btn.dataset.width }).run();
                    setTimeout(() => updateBubbleMenu(editor), 0);
                };
            });
         }

         function setLink(editor) {
             const previousUrl = editor.getAttributes('link').href;
             const url = window.prompt('URL del enlace:', previousUrl);
             if (url === null) return;
             if (url === '') {
                 editor.chain().focus().extendMarkRange('link').unsetLink().run();
                 return;
             }
             editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
         }
         
         function toggleSourceMode() {
             isSourceMode = !isSourceMode;
             if (isSourceMode) {
                sourceArea.value = editor.getHTML();
                container.classList.add('is-source-mode');
             } else {
                const content = sourceArea.value;
                editor.commands.setContent(content);
                container.classList.remove('is-source-mode');
             }
             updateToolbarState(editor);
         }
         
         sourceArea.addEventListener('input', () => {
             if (isSourceMode) {
                input.value = sourceArea.value;
                input.dispatchEvent(new Event('input', { bubbles: true })); 
             }
         });

         // Render Toolbar Buttons
         const buttons = [
             { id: 'bold', label: 'Negrita', icon: icons.bold, action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive('bold') },
             { id: 'italic', label: 'Cursiva', icon: icons.italic, action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive('italic') },
             { id: 'underline', label: 'Subrayado', icon: icons.underline, action: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor.isActive('underline') },
             { id: 'strike', label: 'Tachado', icon: icons.strike2, action: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive('strike') },
             { type: 'separator' },
             { id: 'h1', label: 'H1', icon: icons.h1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive('heading', { level: 1 }) },
             { id: 'h2', label: 'H2', icon: icons.h2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive('heading', { level: 2 }) },
             { type: 'separator' },
             { id: 'ul', label: 'Lista', icon: icons.ul, action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList') },
             { id: 'ol', label: 'Lista Ord', icon: icons.ol, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList') },
             { id: 'quote', label: 'Cita', icon: icons.quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive('blockquote') },
             { id: 'code', label: 'Código', icon: icons.code, action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: () => editor.isActive('codeBlock') },
             { type: 'separator' },
             { id: 'left', label: 'Izq', icon: icons.left, action: () => editor.chain().focus().setTextAlign('left').run(), isActive: () => editor.isActive({ textAlign: 'left' }) },
             { id: 'center', label: 'Centro', icon: icons.center, action: () => editor.chain().focus().setTextAlign('center').run(), isActive: () => editor.isActive({ textAlign: 'center' }) },
             { type: 'separator' },
             { id: 'link', label: 'Link', icon: icons.link, action: () => setLink(editor), isActive: () => editor.isActive('link') },
             { id: 'image', label: 'Imagen', icon: icons.image, action: () => {
                 if (window.openMediaPicker) {
                     window.openMediaPicker({
                         type: 'image',
                         onSelect: (media) => {
                             if (media && media.url) {
                                 editor.chain().focus().setImage({ src: media.url, alt: media.originalFilename }).run();
                             }
                         }
                     });
                 } else {
                     const url = window.prompt('URL Imagen:');
                     if(url) editor.chain().focus().setImage({src:url}).run();
                 }
             }, isActive: () => false },
             { type: 'separator', style: 'margin-left: auto;' }, 
             { 
                id: 'source', 
                label: 'HTML', 
                icon: '<span style="font-family:monospace;font-size:10px;font-weight:bold">&lt;/&gt;</span>', 
                action: toggleSourceMode,
                isActive: () => isSourceMode 
             },
         ];

         buttons.forEach(btn => {
             if (btn.type === 'separator') {
                 const sep = document.createElement('div');
                 sep.className = 'tiptap-separator';
                 if (btn.style) sep.style.cssText = btn.style;
                 toolbar.appendChild(sep);
                 return;
             }
             const button = document.createElement('button');
             button.type = 'button'; 
             button.className = 'tiptap-btn';
             button.innerHTML = btn.icon;
             button.title = btn.label;
             button.onclick = btn.action;
             button.checkActive = () => {
                 if (btn.isActive && btn.isActive()) button.classList.add('is-active');
                 else button.classList.remove('is-active');
             };
             toolbar.appendChild(button);
         });

      } // End initTipTap

      const name = "${name}";
      document.addEventListener('DOMContentLoaded', () => {
         initTipTap(name);
      });
    </script>`)
    }
`;
};
