import { html, raw } from "hono/html";
import { env } from "../../config/env.ts";

interface TipTapEditorProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
}

export const TipTapEditor = (props: TipTapEditorProps) => {
  const {
    name,
    value = "",
    placeholder = "Escribe tu historia...",
    required = false,
  } = props;

  const editorId = `tiptap-${name}`;
  const inputId = `input-${name}`;
  const toolbarId = `toolbar-${name}`;
  const sourceAreaId = `source-${name}`;
  const switchModeBtnId = `switch-mode-${name}`;

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

      .ProseMirror p.is-editor-empty:first-child::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }

      /* Typography & Nodes */
      .ProseMirror h1 { font-size: 2em; font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.2; }
      .ProseMirror h2 { font-size: 1.5em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; }
      .ProseMirror h3 { font-size: 1.25em; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; }
      
      .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 1em 0; }
      .ProseMirror blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; color: #6b7280; font-style: italic; margin: 1.5em 0; }
      .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1em 0; display: block; }
      .ProseMirror img.ProseMirror-selectednode { outline: 3px solid #167bff; }
      
      .ProseMirror a { color: #167bff; text-decoration: underline; cursor: pointer; }
      
      .ProseMirror code { background: #f3f4f6; color: #e01b24; padding: 0.2em 0.4em; border-radius: 0.3em; font-size: 0.85em; font-family: monospace; }
      .ProseMirror pre { background: #1e2328; color: #f8f9fa; padding: 0.75rem 1rem; border-radius: 0.5rem; margin: 1em 0; overflow-x: auto; }
      .ProseMirror pre code { background: transparent; color: inherit; padding: 0; }

      /* Toolbar */
      .tiptap-toolbar {
        display: flex;
        gap: 0.25rem;
        padding: 0.5rem;
        border-bottom: 1px solid #eef0f2;
        margin-bottom: 1rem;
        background: white;
        position: sticky;
        top: 0;
        z-index: 10;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .tiptap-btn {
        background: transparent;
        border: none;
        border-radius: 0.375rem;
        padding: 0.4rem;
        cursor: pointer;
        color: #666;
        font-size: 0.9rem;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        min-height: 32px;
      }
      
      .tiptap-btn:hover { background: #f3f4f6; color: #111; }
      .tiptap-btn.is-active { background: #e5e7eb; color: #000; font-weight: 600; }
      
      .tiptap-separator { width: 1px; height: 1.5rem; background: #e5e7eb; margin: 0 0.5rem; }
      
      .tiptap-btn-label { font-size: 0.75rem; font-weight: 600; margin-left: 0.25rem; display: none; } /* Show labels on larger screens? */

      /* Source Mode */
      .tiptap-source-mode {
        width: 100%;
        min-height: 300px;
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #d4d4d4;
        background: #1e1e1e;
        border: none;
        padding: 1rem;
        border-radius: 0.5rem;
        resize: vertical;
        display: none; /* Hidden by default */
      }
      
      .tiptap-source-mode:focus { outline: 2px solid #167bff; }

      .is-source-mode #tiptap-${name} { display: none; }
      .is-source-mode #source-${name} { display: block; }
      
      /* Bubble Menu */
      .tiptap-bubble-menu {
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
    </style>

    <div class="lex-editor-wrapper">
      <div id="editor-container-${name}" class="lex-editor-container" style="position: relative;">
        <!-- Toolbar -->
        <div id="${toolbarId}" class="tiptap-toolbar">
            <!-- Buttons injected by JS -->
        </div>

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
      import { Editor } from 'https://esm.sh/@tiptap/core@2.4.0';
      import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.4.0';
      import Image from 'https://esm.sh/@tiptap/extension-image@2.4.0';
      import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder@2.4.0';
      import Link from 'https://esm.sh/@tiptap/extension-link@2.4.0';
      import TextAlign from 'https://esm.sh/@tiptap/extension-text-align@2.4.0';
      import Underline from 'https://esm.sh/@tiptap/extension-underline@2.4.0';
      import BubbleMenu from 'https://esm.sh/@tiptap/extension-bubble-menu@2.4.0';
      
      // Custom Image Extension with resizing and alignment
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
                
                if (layout === 'center') {
                  style += 'margin-left: auto; margin-right: auto;';
                } else if (layout === 'left') {
                  style += 'float: left; margin-right: 1rem; margin-bottom: 0.5rem;';
                } else if (layout === 'right') {
                  style += 'float: right; margin-left: 1rem; margin-bottom: 0.5rem;';
                }
                
                return {
                  'data-layout': layout,
                  style: style,
                };
              },
            },
          };
        },
      });

      document.addEventListener('DOMContentLoaded', () => {
        const input = document.getElementById('${inputId}');
        const toolbar = document.getElementById('${toolbarId}');
        const sourceArea = document.getElementById('${sourceAreaId}');
        const container = document.getElementById('editor-container-${name}');
        
        if (!input || !toolbar) return;

        // Create Bubble Menu DOM
        const bubbleMenu = document.createElement('div');
        bubbleMenu.className = 'tiptap-bubble-menu';
        container.appendChild(bubbleMenu);

        let isSourceMode = false;

        const editor = new Editor({
          element: document.getElementById('${editorId}'),
          extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: '${placeholder}' }),
            CustomImage,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            BubbleMenu.configure({
              element: bubbleMenu,
              tippyOptions: { duration: 100 },
              shouldShow: ({ editor }) => editor.isActive('image'),
            }),
          ],
          content: input.value, 
          editorProps: {
            attributes: {
              class: 'ProseMirror-content',
            },
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
             window['editor_${name}'] = editor;
             window['tiptap_${name}'] = editor;
          }
        });

        // Bubble Menu UI
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
            
            // Attach events
            bubbleMenu.querySelectorAll('button').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    if (btn.dataset.layout) {
                        editor.chain().focus().updateAttributes('image', { layout: btn.dataset.layout }).run();
                    } else if (btn.dataset.width) {
                        editor.chain().focus().updateAttributes('image', { width: btn.dataset.width }).run();
                    }
                };
            });
        }

        // --- Toolbar Generation ---
        const icons = {
          bold: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>',
          italic: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>',
          underline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>',
          strike2: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><path d="M16 6a4 4 0 0 0-8 0c0 4 8 3 8 7a4 4 0 0 1-8 0"></path></svg>',
          h1: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>', 
          h2: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>',
          ul: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
          ol: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>',
          quote: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>',
          code: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
          left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>',
          center: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>',
          image: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
          link: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
        };

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
            { id: 'image', label: 'Imagen', icon: icons.image, action: () => openMediaPickerForEditor(editor) },
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
                if (btn.isActive && btn.isActive()) {
                    button.classList.add('is-active');
                } else {
                    button.classList.remove('is-active');
                }
            };

            toolbar.appendChild(button);
        });

        function updateToolbarState(editor) {
            const btns = toolbar.querySelectorAll('.tiptap-btn');
            btns.forEach(b => {
                if (b.checkActive) b.checkActive();
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

        function openMediaPickerForEditor(editor) {
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
                alert('Selector de medios no disponible');
            }
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

      });
    </script>`)
    }
`;
};
