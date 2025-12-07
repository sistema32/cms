import { html } from "hono/html";

export const FocusStyles = () => html`
  <style>
    /* Override specific Nexus Styles for Focus Mode structure if JS inline styles persist */
    :root {
      --sidebar-width: 260px !important;
    }
    
    .nexus-sidebar {
      background-color: #f9fafb !important;
      border-right: 1px solid transparent !important;
    }

    .nexus-header {
      background-color: rgba(255,255,255,0.8) !important;
      backdrop-filter: blur(12px);
      border-bottom: 1px solid transparent !important;
    }

    .nexus-main {
      background-color: #ffffff;
    }
    
    /* Clean Sidebar Links */
    .nexus-sidebar-nav > ul > li > a {
      color: #6b7280 !important;
      font-weight: 500 !important;
    }
    
    .nexus-sidebar-nav > ul > li > a:hover {
      color: #111827 !important;
      background: #f3f4f6 !important;
    }
    
    .nexus-sidebar-nav > ul > li > a.active {
      color: #000 !important;
      background: #f3f4f6 !important;
      font-weight: 600 !important;
    }
    
    .nexus-sidebar-nav > ul > li > a.active::before {
      background: #000 !important; 
    }
    
    /* Elegant Shadows for active elements */
    .nexus-search input:focus {
      box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
      border-color: #e5e7eb !important;
    }

    /* Custom Scrollbar for Focus Mode (Hidden/Minimal) */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #d1d5db;
    }
  </style>
`;
