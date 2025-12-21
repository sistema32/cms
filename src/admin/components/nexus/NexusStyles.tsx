import { html } from "hono/html";

export const NexusStyles = () => html`
  <style>
    /* ========== NEXUS DESIGN SYSTEM VARIABLES ========== */
    :root {
      --sidebar-width: 280px;
      --header-height: 72px;

      /* Nexus Color System - Light Theme */
      --nexus-primary: #167bff;
      --nexus-primary-content: #fff;
      --nexus-secondary: #9c5de8;
      --nexus-accent: #00d3bb;
      --nexus-success: #0bbf58;
      --nexus-warning: #f5a524;
      --nexus-error: #f31260;
      --nexus-info: #14b4ff;

      /* Base Colors */
      --nexus-base-100: #fff;
      --nexus-base-200: #eef0f2;
      --nexus-base-300: #dcdee0;
      --nexus-base-content: #1e2328;

      /* Background Colors */
      --nexus-root-bg: #fafbfc;
      --nexus-sidebar-bg: #fff;
      --nexus-topbar-bg: #fff;

      /* Border Radius - Nexus uses smaller, more subtle radii */
      --nexus-radius-sm: 0.25rem;
      --nexus-radius-md: 0.5rem;
      --nexus-radius-lg: 0.75rem;

      /* Spacing */
      --nexus-card-padding: 20px;
    }

    [data-theme="dark"] {
      /* Nexus Color System - Dark Theme */
      --nexus-primary: #378dff;
      --nexus-primary-content: #fff;
      --nexus-secondary: #b071ff;
      --nexus-accent: #00d3bb;
      --nexus-success: #0bbf58;
      --nexus-warning: #f5a524;
      --nexus-error: #f31260;
      --nexus-info: #14b4ff;

      /* Base Colors */
      --nexus-base-100: #181c20;
      --nexus-base-200: #22262a;
      --nexus-base-300: #2c3034;
      --nexus-base-content: #f0f4f8;

      /* Background Colors */
      --nexus-root-bg: #121416;
      --nexus-sidebar-bg: #181c20;
      --nexus-topbar-bg: #181b1f;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: var(--nexus-root-bg);
    }

    /* ========== LAYOUT ========== */
    .nexus-layout {
      display: flex;
      min-height: 100vh;
    }

    /* ========== SIDEBAR ========== */
    .nexus-sidebar {
      position: fixed;
      left: 0;
      top: 0;
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--nexus-sidebar-bg);
      border-right: 1px solid var(--nexus-base-300);
      display: flex;
      flex-direction: column;
      z-index: 50;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.03);
    }

    .nexus-sidebar.closed {
      transform: translateX(-100%);
    }

    /* Sidebar Header */
    .nexus-sidebar-header {
      height: var(--header-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      border-bottom: 1px solid var(--nexus-base-200);
    }

    .nexus-sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }

    .nexus-sidebar-logo {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--nexus-primary) 0%, var(--nexus-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.025em;
    }

    .sidebar-close-btn {
      display: none;
      width: 32px;
      height: 32px;
      align-items: center;
      justify-content: center;
      border-radius: var(--nexus-radius-sm);
      background: transparent;
      border: none;
      color: var(--nexus-base-content);
      opacity: 0.6;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sidebar-close-btn:hover {
      background: var(--nexus-base-200);
      opacity: 1;
    }

    /* Sidebar Navigation */
    .nexus-sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0.75rem 0.75rem;
    }

    .nexus-sidebar-nav::-webkit-scrollbar {
      width: 6px;
    }

    .nexus-sidebar-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .nexus-sidebar-nav::-webkit-scrollbar-thumb {
      background: var(--nexus-base-300);
      border-radius: 3px;
    }

    .nexus-sidebar-nav::-webkit-scrollbar-thumb:hover {
      background: var(--nexus-primary);
      opacity: 0.5;
    }

    .nexus-sidebar-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nexus-sidebar-nav > ul > li {
      margin-bottom: 0.125rem;
    }

    /* Main menu items */
    .nexus-sidebar-nav > ul > li > a,
    .nexus-sidebar-nav > ul > li > details > summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--nexus-radius-md);
      font-weight: 500;
      font-size: 0.875rem;
      line-height: 1.25;
      color: var(--nexus-base-content);
      opacity: 0.7;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      text-decoration: none;
      position: relative;
    }

    .nexus-sidebar-nav > ul > li > a > svg,
    .nexus-sidebar-nav > ul > li > details > summary > svg:first-child {
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      stroke-width: 2;
      color: var(--nexus-base-content);
      opacity: 0.6;
      transition: all 0.2s;
    }

    .nexus-sidebar-nav > ul > li > a > span,
    .nexus-sidebar-nav > ul > li > details > summary > span {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Chevron icon */
    .chevron-icon {
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
      margin-left: auto;
      stroke-width: 2.5;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    details[open] > summary .chevron-icon {
      transform: rotate(180deg);
    }

    .nexus-sidebar-nav > ul > li > a:hover,
    .nexus-sidebar-nav > ul > li > details > summary:hover {
      background: rgba(22, 123, 255, 0.08);
      color: var(--nexus-primary);
      opacity: 1;
    }

    .nexus-sidebar-nav > ul > li > a:hover > svg,
    .nexus-sidebar-nav > ul > li > details > summary:hover > svg {
      color: var(--nexus-primary);
      opacity: 1;
    }

    .nexus-sidebar-nav > ul > li > a.active,
    .nexus-sidebar-nav > ul > li > details[open] > summary.active {
      background: rgba(22, 123, 255, 0.12);
      color: var(--nexus-primary);
      font-weight: 600;
      opacity: 1;
    }

    .nexus-sidebar-nav > ul > li > details[open] > summary {
      color: var(--nexus-base-content);
      opacity: 1;
    }

    .nexus-sidebar-nav > ul > li > a.active > svg,
    .nexus-sidebar-nav > ul > li > details[open] > summary > svg:first-child {
      color: var(--nexus-primary);
      opacity: 1;
    }

    /* Remove default details marker */
    .nexus-sidebar-nav details > summary {
      list-style: none;
    }

    .nexus-sidebar-nav details > summary::-webkit-details-marker {
      display: none;
    }

    /* Submenu container */
    .nexus-sidebar-nav details > ul {
      padding: 0.25rem 0 0.5rem 0;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 500px;
      }
    }

    /* Submenu items */
    .nexus-sidebar-nav details > ul > li {
      margin: 0;
    }

    .nexus-sidebar-nav details > ul > li > a {
      display: flex;
      align-items: center;
      padding: 0.625rem 1rem 0.625rem 3rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--nexus-base-content);
      opacity: 0.65;
      border-radius: var(--nexus-radius-sm);
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
      position: relative;
    }

    .nexus-sidebar-nav details > ul > li > a::before {
      content: "";
      position: absolute;
      left: 1.75rem;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--nexus-base-content);
      opacity: 0.25;
      transition: all 0.2s;
    }

    .nexus-sidebar-nav details > ul > li > a:hover {
      background: rgba(22, 123, 255, 0.08);
      color: var(--nexus-primary);
      opacity: 1;
      padding-left: 3.25rem;
    }

    .nexus-sidebar-nav details > ul > li > a:hover::before {
      background: var(--nexus-primary);
      opacity: 1;
      transform: scale(1.25);
    }

    .nexus-sidebar-nav details > ul > li > a.active {
      background: rgba(22, 123, 255, 0.15);
      color: var(--nexus-primary);
      font-weight: 600;
      opacity: 1;
      padding-left: 2.875rem;
      border-left: 3px solid var(--nexus-primary);
    }

    .nexus-sidebar-nav details > ul > li > a.active::before {
      display: none;
    }

    /* Sidebar Footer */
    .nexus-sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--nexus-base-200);
    }

    .nexus-sidebar-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: var(--nexus-radius-md);
      transition: all 0.15s;
      cursor: pointer;
    }

    .nexus-sidebar-user:hover {
      background: var(--nexus-base-200);
    }

    .nexus-sidebar-user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(22, 123, 255, 0.2);
    }

    .nexus-sidebar-user-info {
      flex: 1;
      min-width: 0;
    }

    .nexus-sidebar-user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--nexus-base-content);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nexus-sidebar-user-role {
      font-size: 0.75rem;
      color: var(--nexus-base-content);
      opacity: 0.5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ========== MAIN CONTENT ========== */
    .nexus-main {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nexus-main.expanded {
      margin-left: 0;
    }

    /* ========== HEADER ========== */
    .nexus-header {
      height: var(--header-height);
      background: var(--nexus-topbar-bg);
      border-bottom: 1px solid var(--nexus-base-200);
      display: flex;
      align-items: center;
      padding: 0 2rem;
      gap: 1.5rem;
      position: sticky;
      top: 0;
      z-index: 40;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.02);
    }

    .mobile-menu-btn {
      display: none;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      border-radius: var(--nexus-radius-md);
      background: transparent;
      border: none;
      color: var(--nexus-base-content);
      cursor: pointer;
      transition: all 0.2s;
    }

    .mobile-menu-btn:hover {
      background: var(--nexus-base-200);
    }

    .nexus-breadcrumbs {
      flex: 1;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .breadcrumbs ul {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .breadcrumbs ul li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .breadcrumbs ul li a {
      color: var(--nexus-base-content);
      opacity: 0.6;
      text-decoration: none;
      transition: all 0.15s;
      font-weight: 500;
    }

    .breadcrumbs ul li a:hover {
      color: var(--nexus-primary);
      opacity: 1;
    }

    .breadcrumbs ul li:last-child {
      color: var(--nexus-base-content);
      font-weight: 600;
    }

    .breadcrumbs ul li:not(:last-child)::after {
      content: "/";
      color: var(--nexus-base-content);
      opacity: 0.3;
    }

    .nexus-header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .nexus-search {
      width: 320px;
      position: relative;
    }

    .nexus-search input {
      width: 100%;
      height: 40px;
      padding: 0 1rem 0 2.5rem;
      border: 1px solid var(--nexus-base-300);
      border-radius: var(--nexus-radius-md);
      font-size: 0.875rem;
      background: var(--nexus-base-100);
      color: var(--nexus-base-content);
      transition: all 0.2s;
    }

    .nexus-search input:focus {
      outline: none;
      border-color: var(--nexus-primary);
      box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
    }

    .nexus-search input::placeholder {
      color: var(--nexus-base-content);
      opacity: 0.4;
    }

    .nexus-search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1rem;
      height: 1rem;
      color: var(--nexus-base-content);
      opacity: 0.4;
      pointer-events: none;
    }

    .nexus-icon-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--nexus-radius-md);
      background: transparent;
      border: none;
      color: var(--nexus-base-content);
      opacity: 0.7;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nexus-icon-btn:hover {
      background: var(--nexus-base-200);
      opacity: 1;
    }

    /* ========== CONTENT ========== */
    .nexus-content {
      flex: 1;
      padding: 2rem 2.5rem;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
    }

    /* ========== MOBILE OVERLAY ========== */
    .mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 45;
    }

    @media (max-width: 1024px) {
      .nexus-sidebar {
        transform: translateX(-100%);
      }

      .nexus-sidebar.open {
        transform: translateX(0);
      }

      .nexus-main {
        margin-left: 0;
      }

      .mobile-menu-btn {
        display: flex;
      }

      .sidebar-close-btn {
        display: flex;
      }

      .mobile-overlay.open {
        display: block;
      }

      .nexus-search {
        display: none;
      }
    }
    /* ========== UTILITY CLASSES (CSP-compliant) ========== */
    /* Flex utilities */
    .u-flex { display: flex; }
    .u-flex-inline { display: inline-flex; }
    .u-flex-col { display: flex; flex-direction: column; }
    .u-flex-row { display: flex; flex-direction: row; }
    .u-flex-wrap { flex-wrap: wrap; }
    .u-items-center { align-items: center; }
    .u-items-start { align-items: flex-start; }
    .u-items-end { align-items: flex-end; }
    .u-justify-center { justify-content: center; }
    .u-justify-between { justify-content: space-between; }
    .u-justify-end { justify-content: flex-end; }
    .u-flex-1 { flex: 1; }

    /* Gap utilities */
    .u-gap-xs { gap: 0.25rem; }
    .u-gap-sm { gap: 0.5rem; }
    .u-gap-md { gap: 0.75rem; }
    .u-gap-lg { gap: 1rem; }
    .u-gap-xl { gap: 1.5rem; }
    .u-gap-2xl { gap: 2rem; }

    /* Display utilities */
    .u-hidden { display: none; }
    .u-block { display: block; }
    .u-inline { display: inline; }
    .u-inline-block { display: inline-block; }
    .u-grid { display: grid; }

    /* Margin utilities */
    .u-mb-0 { margin-bottom: 0; }
    .u-mb-xs { margin-bottom: 0.25rem; }
    .u-mb-sm { margin-bottom: 0.5rem; }
    .u-mb-md { margin-bottom: 1rem; }
    .u-mb-lg { margin-bottom: 1.5rem; }
    .u-mb-xl { margin-bottom: 2rem; }
    .u-mt-md { margin-top: 1rem; }
    .u-mr-sm { margin-right: 0.5rem; }
    .u-ml-sm { margin-left: 0.5rem; }

    /* Padding utilities */
    .u-p-md { padding: 1rem; }
    .u-p-lg { padding: 1.5rem; }
    .u-px-md { padding-left: 1rem; padding-right: 1rem; }
    .u-py-sm { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .u-py-md { padding-top: 1rem; padding-bottom: 1rem; }

    /* Width utilities */
    .u-w-full { width: 100%; }
    .u-w-auto { width: auto; }

    /* Common combined patterns */
    .u-flex-center { display: flex; align-items: center; justify-content: center; }
    .u-flex-between { display: flex; align-items: center; justify-content: space-between; }
    .u-flex-gap-sm { display: flex; gap: 0.5rem; }
    .u-flex-gap-md { display: flex; gap: 0.75rem; }
    .u-flex-gap-lg { display: flex; gap: 1rem; }
    .u-flex-col-gap-sm { display: flex; flex-direction: column; gap: 0.5rem; }
    .u-flex-col-gap-md { display: flex; flex-direction: column; gap: 0.75rem; }
    .u-action-buttons { display: flex; gap: 0.5rem; }
    .u-section-hidden { margin-bottom: 2rem; display: none; }

    /* Background utilities */
    .u-bg-muted { background: #f8f9fa; }
    .u-border-bottom { border-bottom: 1px solid #eee; }
  </style>
`;
