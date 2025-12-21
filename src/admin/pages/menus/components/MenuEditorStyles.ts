import { html } from "hono/html";

export const MenuEditorStyles = html`
    <style>
      :root {
        --clean-bg: #f8fafc;
        --clean-card-bg: #ffffff;
        --clean-border: #e2e8f0;
        --clean-text: #1e293b;
        --clean-text-muted: #64748b;
        --clean-primary: var(--nexus-primary);
        --clean-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        --clean-shadow-hover: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      }

      .editor-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          align-items: start;
          font-family: 'Inter', system-ui, sans-serif;
      }
      @media(max-width: 900px) {
          .editor-grid { grid-template-columns: 1fr; }
      }

      /* Sidebar Palette */
      .sidebar-header { margin-bottom: 1rem; }
      .sidebar-header .eyebrow { font-size: 0.75rem; letter-spacing: .08em; text-transform: uppercase; color: var(--clean-text-muted); margin: 0; }
      .sidebar-header h3 { margin: 4px 0; font-size: 1.1rem; }
      .sidebar-header .text-hint { margin: 0; }

      .palette-group { 
        border: 1px solid var(--clean-border); 
        border-radius: 12px; 
        margin-bottom: 14px; 
        background: var(--clean-card-bg); 
        box-shadow: 0 1px 2px rgba(15,23,42,0.04); 
        overflow: hidden;
      }
      .palette-title { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 12px 14px; 
        background: #f8fafc; 
        border-bottom: 1px solid var(--clean-border); 
        font-weight: 700; 
        color: var(--clean-text);
      }
      .palette-title .badge { 
        background: rgba(var(--nexus-primary-rgb), 0.12); 
        color: var(--clean-primary); 
        font-weight: 700; 
        padding: 4px 10px; 
        border-radius: 999px; 
        font-size: 0.75rem;
      }
      .palette-title .badge.muted { background: #e2e8f0; color: #334155; }

      .palette-list { padding: 12px; display: grid; gap: 10px; }

      .palette-item { 
        border: 1px dashed var(--clean-border); 
        border-radius: 10px; 
        padding: 12px; 
        background: #fff; 
        cursor: grab; 
        transition: all 0.18s ease; 
      }
      .palette-item:hover { border-color: var(--clean-border); box-shadow: none; transform: none; }
      .palette-item__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
      .palette-item .item-title { margin: 0; font-weight: 700; color: var(--clean-text); }
      .palette-item .item-meta { margin: 4px 0 0; color: var(--clean-text-muted); font-size: 0.85rem; }
      .palette-item--form { cursor: default; border-style: solid; }
      .palette-item--form button {
        margin-top: 8px;
        width: 100%;
        border: none;
        border-radius: 10px;
        background: var(--clean-primary);
        color: #fff;
        padding: 10px 14px;
        font-weight: 700;
        box-shadow: var(--clean-shadow);
      }
      .palette-item--form button:hover { box-shadow: var(--clean-shadow); transform: none; }

      /* Primary action (Guardar) aligned with pill buttons */
      .pill-btn.primary {
        border-color: var(--clean-primary);
        color: var(--clean-primary);
        background: #fff;
        font-weight: 700;
      }
      .pill-btn.primary:hover { 
        border-color: var(--clean-primary);
        color: var(--clean-primary);
        background: rgba(var(--nexus-primary-rgb), 0.08);
      }
      .form-group.compact { margin-bottom: 10px; }

      .pill-btn { 
        border: 1px solid var(--clean-border); 
        background: #f8fafc; 
        color: var(--clean-text); 
        border-radius: 999px; 
        padding: 6px 12px; 
        font-size: 0.85rem; 
        cursor: pointer; 
        transition: all 0.2s ease;
      }
      .pill-btn:hover { border-color: var(--clean-primary); color: var(--clean-primary); }
      .pill-btn.danger { border-color: #fecdd3; color: #b91c1c; background: #fff1f2; }

      .menu-items-sidebar .text-hint { color: var(--clean-text-muted); }

      /* Menu Structure Area */
      .menu-stage {
          background: var(--clean-card-bg);
          border: 1px solid var(--clean-border);
          border-radius: 12px;
          padding: 24px;
          box-shadow: var(--clean-shadow);
          position: relative;
          overflow: visible;
      }
      .stage-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
      .stage-head h3 { margin: 4px 0; }
      .stage-head .text-hint { margin: 0; }
      .stage-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .drop-helper { 
        border: 1px dashed var(--clean-border); 
        border-radius: 10px; 
        padding: 14px; 
        text-align: center; 
        color: var(--clean-text-muted); 
        background: #f8fafc; 
        margin-bottom: 14px;
      }
      .drop-helper.active { border-color: var(--clean-primary); color: var(--clean-primary); background: rgba(var(--nexus-primary-rgb), 0.04); }
      .menu-structure.drop-highlight { box-shadow: 0 0 0 2px rgba(var(--nexus-primary-rgb), 0.2); border-radius: 10px; }
      
      /* Nestable Items - Overriding Default Plugin Styles */
      .dd { max-width: 100%; border: none; overflow: visible; }
      .dd-list { list-style: none; padding: 0; margin: 0; overflow: visible; }
      .dd-item { margin-bottom: 10px; position: relative; line-height: 1.5; font-size: 1rem; overflow: visible; }
      .dd-handle {
          background: transparent !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          box-shadow: none !important;
      }
      
      .item-card {
          display: flex;
          align-items: stretch;
          background: #ffffff;
          border: 1px solid var(--clean-border);
          border-radius: 10px;
          box-shadow: var(--clean-shadow);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
      }
      .item-card:hover {
          border-color: var(--clean-primary);
          box-shadow: var(--clean-shadow-hover);
          transform: translateY(-2px);
      }

      .drag-handle {
          width: 42px;
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          align-self: stretch;
          background: transparent;
          cursor: grab;
          color: #cbd5e1;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 1px;
          user-select: none;
          border: none;
      }
      .drag-handle:hover { background: transparent; box-shadow: none; }
      .drag-handle .grip-dots { pointer-events: none; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%; }
      
      .item-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          gap: 12px;
      }
      .item-title { display: flex; align-items: center; gap: 10px; }
      .item-label { font-weight: 600; color: var(--clean-text); }
      
      /* Placeholder (Drop Target) */
      .dd-placeholder { 
          background: rgba(var(--nexus-primary-rgb), 0.04) !important; 
          border: 2px dashed var(--clean-primary) !important; 
          border-radius: 8px !important;
          margin: 10px 0 !important; 
          min-height: 50px !important; 
          box-sizing: border-box !important; 
      }
      
      .dd-dragel { position: absolute; pointer-events: none; z-index: 9999; }
      .dd-dragel .dd-item { margin: 0; }
      .dd-dragel .item-card { 
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important; 
          transform: rotate(2deg) scale(1.02) !important;
          border-color: var(--clean-primary) !important;
          background: #ffffff !important;
          opacity: 0.95;
      }

      /* Nesting Guide / Hierarchy */
      .dd-list .dd-list { 
          padding-left: 36px !important; 
          margin-top: 10px !important; 
          border-left: 2px solid #f1f5f9; /* Subtle guide line */
      }
      
      .item-actions { display: flex; gap: 8px; align-items: center; }
      .item-type-badge { 
          font-size: 0.65rem; 
          background: #f1f5f9; 
          padding: 3px 8px; 
          border-radius: 6px; 
          font-weight: 600; 
          color: var(--clean-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid #e2e8f0;
      }
      
      .remove-item { 
          color: var(--clean-text-muted); 
          cursor: pointer; 
          width: 28px; height: 28px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; 
          opacity: 0.6;
          border: 1px solid transparent;
          background: transparent;
      }
      .remove-item:hover { 
          background: #fee2e2; 
          color: #ef4444; 
          opacity: 1;
          border-color: #fecdd3;
      }

      /* Settings Section */
      .settings-card { 
          margin-top: 2.5rem; 
          padding: 0; 
          border-top: 1px solid var(--clean-border);
          padding-top: 2rem;
          background: transparent;
          box-shadow: none;
          border-radius: 0;
          border-left: none; border-right: none; border-bottom: none;
      }
      .form-group { margin-bottom: 1.5rem; }
      .form-label { 
          display: block; 
          font-weight: 600; 
          margin-bottom: 0.5rem; 
          color: var(--clean-text); 
          font-size: 0.9rem;
      }
      .form-input, select.form-input { 
          width: 100%; padding: 0.75rem 1rem; 
          border: 1px solid var(--clean-border); border-radius: 8px; 
          background: #ffffff; color: var(--clean-text);
          font-size: 0.95rem;
          transition: all 0.2s ease;
      }
      .form-input:hover, select.form-input:hover {
          border-color: #cbd5e1;
      }
      .form-input:focus, select.form-input:focus { 
          border-color: var(--clean-primary); 
          outline: none; 
          box-shadow: 0 0 0 4px rgba(var(--nexus-primary-rgb), 0.1); 
      }
      
      /* Utilities & Buttons */
      .scrollable-list { max-height: 280px; overflow-y: auto; padding-right: 4px; }
      .scrollable-list::-webkit-scrollbar { width: 4px; }
      .scrollable-list::-webkit-scrollbar-track { background: transparent; }
      .scrollable-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      .scrollable-list::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      
      .mt-2 { margin-top: 1rem; }
      .mt-1 { margin-top: 0.25rem; }
      .text-hint { font-size: 0.85rem; color: var(--clean-text-muted); line-height: 1.6; margin-bottom: 1.5rem; }
      .eyebrow { font-size: 0.75rem; letter-spacing: .08em; text-transform: uppercase; color: var(--clean-text-muted); margin-bottom: 0.2rem; }
      .w-full { width: 100%; display: flex; justify-content: center; align-items: center; }
      h3 { font-size: 1.1rem; font-weight: 700; color: var(--clean-text); margin-bottom: 1rem; margin-top: 0;}

      /* Page header */
      .page-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }
      .page-head__titles h1 { margin: 4px 0 6px; font-size: 1.6rem; letter-spacing: -0.01em; }
      .crumbs { display: flex; align-items: center; gap: 6px; color: var(--clean-text-muted); font-size: 0.9rem; }
      .crumb-link { color: var(--clean-primary); text-decoration: none; }
      .page-head__actions { display: flex; gap: 10px; align-items: center; }

      /* Override legacy nestable bits so everything looks Nexus */
      .dd { border: none; }
      .dd-empty, .dd-nochildren { display: none !important; }
      .dd-list .dd-item:last-child { margin-bottom: 0; }

      .item-settings {
        background: #f8fafc;
        border: 1px solid var(--clean-border);
        border-radius: 10px;
        padding: 12px;
        margin-top: 8px;
        box-shadow: inset 0 1px 0 rgba(148,163,184,0.25);
        position: relative;
        z-index: 25;
      }
      .item-settings .form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
      .item-settings .form-row.two-col { flex-direction: row; gap: 10px; }
      .item-settings .form-row.two-col > div { flex: 1; }
      .item-settings label { 
        display: block;
        font-size: 0.85rem; 
        color: var(--clean-text); 
        font-weight: 600;
      }
      .item-settings input, .item-settings select {
        border: 1px solid var(--clean-border);
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 0.9rem;
        background: #fff;
      }
      @media (max-width: 640px) {
        .item-settings .form-row.two-col { flex-direction: column; }
      }
      .item-settings input:focus, .item-settings select:focus {
        outline: none;
        border-color: var(--clean-primary);
        box-shadow: 0 0 0 3px rgba(var(--nexus-primary-rgb), 0.12);
      }

      .dd-nodrag { cursor: default !important; }

      .pill-btn.ghost {
        background: transparent;
        border: 1px solid var(--clean-border);
        color: var(--clean-text);
      }
    </style>
`;
