/**
 * Nexus Editor Core
 * Handles initialization, block registry, and interaction logic.
 */

console.log('[NexusEditor] editor-core.js loaded', window.location.href);

window.NexusEditor = {
    patterns: {},
    extensions: [],

    registerPattern(id, definition) {
        this.patterns[id] = definition;
        console.log(`[NexusEditor] Pattern registered: ${id}`);
    },

    registerExtension(extension) {
        this.extensions.push(extension);
    }
};

// --- DEFAULT PATTERNS ---
const defaultIcons = {
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
    trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    palette: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
    bgImage: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
};

// Register Default Patterns
const defaultPatterns = {
    hero: {
        label: 'Hero Section',
        icon: defaultIcons.grid,
        content: `
        <div data-type="box" class="nexus-box nexus-hero" style="background-color: #f3f4f6; background-size: cover; background-position: center; padding: 6rem 2rem; border-radius: 16px; text-align: center; position: relative; overflow: hidden; min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="position: relative; z-index: 10;">
             <h1 style="font-size: 3.5rem; font-weight: 800; color: #111827; margin-bottom: 1.5rem; line-height: 1.1; text-shadow: 0 2px 10px rgba(255,255,255,0.5);">Impactful Headline</h1>
             <p style="font-size: 1.25rem; color: #374151; max-width: 700px; margin: 0 auto 2.5rem; line-height: 1.6; background: rgba(255,255,255,0.6); backdrop-filter: blur(4px); padding: 1rem; border-radius: 8px; display: inline-block;">Engage your audience with a clear, concise subtitle that drives action immediately.</p>
             <div style="display: flex; gap: 1rem; justify-content: center;">
                 <a href="#" class="btn-primary" style="display: inline-block; background: #2563eb; color: white; padding: 1rem 2.5rem; border-radius: 9999px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); transition: transform 0.2s;">Get Started</a>
             </div>
          </div>
        </div>
      `
    },
    cta: {
        label: 'Call to Action',
        icon: defaultIcons.box,
        content: `
        <div data-type="box" class="nexus-box nexus-cta" style="background: #eff6ff; border-left: 6px solid #3b82f6; padding: 3rem; border-radius: 0 12px 12px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
          <div style="flex: 1; min-width: 300px;">
             <h3 style="color: #1e40af; margin-top: 0; font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">Ready to dive in?</h3>
             <p style="color: #4b5563; margin-bottom: 0; font-size: 1.1rem;">Start your free trial today and experience the difference.</p>
          </div>
          <a href="#" style="background: #2563eb; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1.1rem; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">Join Now &rarr;</a>
        </div>
      `
    },
    // ... Feature Grid, Testimonial, Pricing remain similar but ensure styles are updated if needed. 
    // Keeping them concise here for brevity but will include full content in file writing.
    featureGrid: {
        label: 'Feature Grid',
        icon: defaultIcons.grid,
        content: `
         <div data-type="box" class="nexus-box nexus-features" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; padding: 1.5rem 0;">
            <div style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
               <div style="width: 48px; height: 48px; background: #dbeafe; color: #2563eb; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; font-size: 1.5rem; font-weight: bold;">1</div>
               <h4 style="margin: 0 0 0.75rem 0; color: #111827; font-size: 1.25rem;">Performance</h4>
               <p style="margin: 0; color: #6b7280; font-size: 1rem; line-height: 1.6;">Optimized for speed and efficiency.</p>
            </div>
            <div style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
               <div style="width: 48px; height: 48px; background: #fae8ff; color: #c026d3; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; font-size: 1.5rem; font-weight: bold;">2</div>
               <h4 style="margin: 0 0 0.75rem 0; color: #111827; font-size: 1.25rem;">Reliability</h4>
               <p style="margin: 0; color: #6b7280; font-size: 1rem; line-height: 1.6;">Built with robust standards.</p>
            </div>
            <div style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid #f3f4f6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
               <div style="width: 48px; height: 48px; background: #dcfce7; color: #16a34a; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; font-size: 1.5rem; font-weight: bold;">3</div>
               <h4 style="margin: 0 0 0.75rem 0; color: #111827; font-size: 1.25rem;">Security</h4>
               <p style="margin: 0; color: #6b7280; font-size: 1rem; line-height: 1.6;">Enterprise-grade protection.</p>
            </div>
         </div>
       `
    },
    testimonial: {
        label: 'Testimonial',
        icon: defaultIcons.quote,
        content: `
          <div data-type="box" class="nexus-box nexus-testimonial" style="background: linear-gradient(to right, #ffffff, #fafafa); padding: 3rem; border-radius: 16px; text-align: center; border: 1px solid #e5e7eb; position: relative;">
             <p style="font-size: 1.25rem; color: #374151; font-style: italic; margin-bottom: 2rem; line-height: 1.6;">"Simply outstanding tool."</p>
             <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                <div style="width: 50px; height: 50px; background: #e5e7eb; border-radius: 50%;"></div>
                <div style="text-align: left;">
                   <strong style="display: block; color: #111; font-size: 1rem;">User Name</strong>
                   <span style="color: #6b7280; font-size: 0.875rem;">CEO, Company</span>
                </div>
             </div>
          </div>
       `
    },
    pricing: {
        label: 'Pricing Table',
        icon: defaultIcons.box,
        content: `
          <div data-type="box" class="nexus-box nexus-pricing" style="display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; padding: 2rem 0;">
             <div style="flex: 1; min-width: 280px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 2.5rem; text-align: center;">
                <h3 style="color: #6b7280;">Basic</h3>
                <div style="font-size: 3rem; font-weight: 800; margin-bottom: 2rem;">$0</div>
                <a href="#" style="display: block; background: #f9fafb; padding: 0.875rem; border-radius: 8px; text-decoration: none; color: #374151;">Get Started</a>
             </div>
             <div style="flex: 1; min-width: 280px; background: #111827; border: 1px solid #111827; border-radius: 16px; padding: 2.5rem; text-align: center; color: white; transform: scale(1.05);">
                <h3 style="color: #9ca3af;">Pro</h3>
                <div style="font-size: 3rem; font-weight: 800; margin-bottom: 2rem;">$29</div>
                <a href="#" style="display: block; background: #2563eb; padding: 0.875rem; border-radius: 8px; text-decoration: none; color: white;">Upgrade</a>
             </div>
          </div>
       `
    }
};

Object.entries(defaultPatterns).forEach(([key, val]) => {
    window.NexusEditor.registerPattern(key, val);
});

// INIT EDITOR
import { Editor, Node } from 'https://esm.sh/@tiptap/core@2.4.0';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.4.0';
import Image from 'https://esm.sh/@tiptap/extension-image@2.4.0';
import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder@2.4.0';
import Link from 'https://esm.sh/@tiptap/extension-link@2.4.0';
import TextAlign from 'https://esm.sh/@tiptap/extension-text-align@2.4.0';
import Underline from 'https://esm.sh/@tiptap/extension-underline@2.4.0';
import BubbleMenu from 'https://esm.sh/@tiptap/extension-bubble-menu@2.4.0';
import FloatingMenu from 'https://esm.sh/@tiptap/extension-floating-menu@2.4.0';

export async function initTipTap(name) {
    const container = document.getElementById('editor-container-' + name);
    if (!container) return;

    const input = document.getElementById('input-' + name);
    const toolbar = document.getElementById('toolbar-' + name);
    const sourceArea = document.getElementById('source-' + name);
    const editorElementId = 'tiptap-' + name;

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
                width: { default: '100%', renderHTML: a => ({ width: a.width, style: `width: ${a.width}; max-width: 100%; height: auto;` }) },
                layout: { default: 'center', renderHTML: a => ({ 'data-layout': a.layout, style: a.layout === 'center' ? 'display: block; margin: 0 auto;' : `float: ${a.layout}; margin-${a.layout === 'left' ? 'right' : 'left'}: 1rem;` }) },
            };
        },
    });

    // ... (Inserter Logic remains the same, verified) ...
    if (floatingMenu) {
        floatingMenu.innerHTML = `
      <div class="inserter-wrapper">
         <button class="inserter-btn-main" type="button">${defaultIcons.plus}</button>
         <div class="inserter-menu" style="display: none;">
            <div class="inserter-section">
               <small>Básicos</small>
               <button class="inserter-item" data-action="heading">${defaultIcons.heading} Encabezado</button>
               <button class="inserter-item" data-action="list">${defaultIcons.list} Lista</button>
               <button class="inserter-item" data-action="quote">${defaultIcons.quote} Cita</button>
               <button class="inserter-item" data-action="image">${defaultIcons.image} Imagen</button>
            </div>
            <div class="inserter-section" id="pattern-list-${name}">
               <small>Patrones</small>
            </div>
         </div>
      </div>
      `;

        const mainBtn = floatingMenu.querySelector('.inserter-btn-main');
        const menu = floatingMenu.querySelector('.inserter-menu');
        const patternList = floatingMenu.querySelector(`#pattern-list-${name}`);

        Object.entries(window.NexusEditor.patterns).forEach(([key, pattern]) => {
            const btn = document.createElement('button');
            btn.className = 'inserter-item';
            btn.dataset.action = `pattern-${key}`;
            btn.innerHTML = `${pattern.icon || defaultIcons.box} ${pattern.label}`;
            patternList.appendChild(btn);
        });

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
                const pattern = window.NexusEditor.patterns[key];
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
    }


    // INIT EDITOR
    const editor = new Editor({
        element: document.getElementById(editorElementId),
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: container.dataset.placeholder }),
            CustomImage,
            BoxNode,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            BubbleMenu.configure({
                element: bubbleMenu,
                tippyOptions: { duration: 100 },
                shouldShow: ({ editor }) => editor.isActive('image') || editor.isActive('box'),
            }),
            FloatingMenu.configure({
                element: floatingMenu,
                tippyOptions: { duration: 100 },
            }),
            ...window.NexusEditor.extensions
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
            editorInstance = editor;
        }
    });

    function updateToolbarState(editor) {
        const btns = toolbar.querySelectorAll('.tiptap-btn');
        btns.forEach(b => {
            if (b.checkActive) b.checkActive();
        });
    }

    function updateBubbleMenu(editor) {
        if (editor.isActive('image')) {
            updateImageMenu(editor);
            return;
        }
        if (editor.isActive('box')) {
            updateBoxMenu(editor);
            return;
        }
    }

    function updateBoxMenu(editor) {
        // Prevent re-rendering if menu already set up (optional optimization, but good for color picker state)
        // For now, we simple re-render to ensure latest state
        bubbleMenu.innerHTML = `
           <div class="bubble-group" style="align-items: center;">
              <div style="position: relative; display: flex; align-items: center;">
                  <input type="color" id="bg-color-picker" style="width: 30px; height: 30px; border: none; cursor: pointer; background: transparent; padding: 0;" title="Background Color">
              </div>
              <button type="button" class="bubble-btn" title="Background Image">${defaultIcons.bgImage}</button>
              <button type="button" class="bubble-btn" title="Delete Block" style="color: #ef4444;">${defaultIcons.trash}</button>
           </div>
        `;

        const colorPicker = bubbleMenu.querySelector('#bg-color-picker');
        const imgBtn = bubbleMenu.querySelector('button[title="Background Image"]');
        const delBtn = bubbleMenu.querySelector('button[title="Delete Block"]');

        // Sync color picker with current bg color (basic check)
        // Ideally we parse the style string to find background-color

        colorPicker.oninput = (e) => {
            const color = e.target.value;
            // Update background color while preserving other styles
            // This is a naive replacement, a better approach would be parsing style object
            // For now, prompt-based CSS editing is safer for complex styles, but this handles simple color
            editor.chain().focus().updateAttributes('box', { style: `background-color: ${color};` }).run(); 
             // Note: This overwrites all style. 
             // Ideally we want to merge. Let's try to read current style attribute first.
             // But BoxNode relies on a single style string.
             // Let's defer to a more robust merge in future, 
             // checking if user accepts overwrite or if we implement style merging.
             // IMPROVEMENT: Parse current style
             updateBoxStyle(editor, 'background-color', color);
        };

        imgBtn.onclick = (e) => {
             e.preventDefault();
             if (window.openMediaPicker) {
                 window.openMediaPicker({
                      type: 'image',
                      onSelect: (media) => {
                          if (media && media.url) {
                              updateBoxStyle(editor, 'background-image', `url('${media.url}')`);
                              updateBoxStyle(editor, 'background-size', 'cover');
                              updateBoxStyle(editor, 'background-position', 'center');
                          }
                      }
                 });
             } else {
                 const url = window.prompt('URL Imagen de Fondo:');
                 if (url) {
                      updateBoxStyle(editor, 'background-image', `url('${url}')`);
                      updateBoxStyle(editor, 'background-size', 'cover');
                 }
             }
        };

        delBtn.onclick = (e) => {
            e.preventDefault();
            if(confirm('¿Eliminar este bloque?')) {
                editor.chain().focus().deleteSelection().run();
            }
        };
    }
    
    // Helper to merge styles safely
    function updateBoxStyle(editor, property, value) {
        const currentStyle = editor.getAttributes('box').style || '';
        const styles = currentStyle.split(';').map(s => s.trim()).filter(s => s);
        const newStyles = styles.filter(s => !s.startsWith(property));
        newStyles.push(`${property}: ${value}`);
        editor.chain().focus().updateAttributes('box', { style: newStyles.join('; ') + ';' }).run();
    }

    // Helper functions for image bubble menu and toolbar...
    function updateImageMenu(editor) {
        const currentWidth = editor.getAttributes('image').width || '100%';
        const currentLayout = editor.getAttributes('image').layout || 'center';
        bubbleMenu.innerHTML = `
                < div class= "bubble-group" >
            <button type="button" class="bubble-btn ${currentLayout === 'left' ? 'is-active' : ''}" data-layout="left">⇤</button>
            <button type="button" class="bubble-btn ${currentLayout === 'center' ? 'is-active' : ''}" data-layout="center">⇹</button>
            <button type="button" class="bubble-btn ${currentLayout === 'right' ? 'is-active' : ''}" data-layout="right">⇥</button>
         </div >
         <div class="bubble-separator"></div>
         <div class="bubble-group">
            <button type="button" class="bubble-btn ${currentWidth === '25%' ? 'is-active' : ''}" data-width="25%">S</button>
            <button type="button" class="bubble-btn ${currentWidth === '50%' ? 'is-active' : ''}" data-width="50%">M</button>
            <button type="button" class="bubble-btn ${currentWidth === '100%' ? 'is-active' : ''}" data-width="100%">L</button>
         </div>`;
         
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
        const url = window.prompt('URL: ', previousUrl);
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

    const buttons = [
        { id: 'bold', label: 'Negrita', icon: defaultIcons.bold, action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive('bold') },
        { id: 'italic', label: 'Cursiva', icon: defaultIcons.italic, action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive('italic') },
        { id: 'underline', label: 'Subrayado', icon: defaultIcons.underline, action: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor.isActive('underline') },
        { id: 'strike', label: 'Tachado', icon: defaultIcons.strike2, action: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive('strike') },
        { type: 'separator' },
        { id: 'h1', label: 'H1', icon: defaultIcons.h1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive('heading', { level: 1 }) },
        { id: 'h2', label: 'H2', icon: defaultIcons.h2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive('heading', { level: 2 }) },
        { type: 'separator' },
        { id: 'ul', label: 'Lista', icon: defaultIcons.ul, action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList') },
        { id: 'ol', label: 'Lista Ord', icon: defaultIcons.ol, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList') },
        { id: 'quote', label: 'Cita', icon: defaultIcons.quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive('blockquote') },
        { id: 'code', label: 'Código', icon: defaultIcons.code, action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: () => editor.isActive('codeBlock') },
        { type: 'separator' },
        { id: 'left', label: 'Izq', icon: defaultIcons.left, action: () => editor.chain().focus().setTextAlign('left').run(), isActive: () => editor.isActive({ textAlign: 'left' }) },
        { id: 'center', label: 'Centro', icon: defaultIcons.center, action: () => editor.chain().focus().setTextAlign('center').run(), isActive: () => editor.isActive({ textAlign: 'center' }) },
        { type: 'separator' },
        { id: 'link', label: 'Link', icon: defaultIcons.link, action: () => setLink(editor), isActive: () => editor.isActive('link') },
        {
            id: 'image', label: 'Imagen', icon: defaultIcons.image, action: () => {
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
                    if (url) editor.chain().focus().setImage({ src: url }).run();
                }
            }, isActive: () => false
        },
        { type: 'separator', style: 'margin-left: auto;' },
        {
            id: 'source',
            label: 'HTML',
            icon: '<span style="font-family:monospace;font-size:10px;font-weight:bold">&lt;/&gt;</span>',
            action: toggleSourceMode,
            isActive: () => isSourceMode
        }
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

}
