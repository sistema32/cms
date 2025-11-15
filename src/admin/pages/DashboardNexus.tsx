import { html, raw } from "hono/html";
import { AdminLayoutNexus } from "../components/AdminLayoutNexus.tsx";
import type { NotificationItem } from "../components/NotificationPanel.tsx";

/**
 * Nexus Dashboard - Cloned from Nexus Dashboard E-commerce
 * https://nexus.daisyui.com/dashboards/ecommerce
 * Modern, clean, professional dashboard with statistics, charts, and tables
 */

interface DashboardNexusProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  stats?: {
    totalPosts: number;
    totalUsers: number;
    totalComments: number;
    totalViews: number;
  };
  recentPosts?: Array<{
    id: number;
    title: string;
    author: string;
    status: string;
    createdAt: Date;
  }>;
  notifications?: NotificationItem[];
  unreadNotificationCount?: number;
}

// Mock data for recent orders
const recentOrders = [
  { id: '#5021', customer: 'María García', product: 'Premium Theme', amount: '$89.00', status: 'Completed', date: '2025-11-14' },
  { id: '#5020', customer: 'Juan Pérez', product: 'Pro Plugin', amount: '$49.00', status: 'Processing', date: '2025-11-14' },
  { id: '#5019', customer: 'Ana López', product: 'Starter Package', amount: '$29.00', status: 'Completed', date: '2025-11-13' },
  { id: '#5018', customer: 'Carlos Ruiz', product: 'Enterprise License', amount: '$199.00', status: 'Completed', date: '2025-11-13' },
  { id: '#5017', customer: 'Laura Sánchez', product: 'Custom Design', amount: '$299.00', status: 'Pending', date: '2025-11-12' },
];

// Mock data for top products
const topProducts = [
  { name: 'Premium Theme', sales: 145, revenue: '$12,905', trend: '+12%' },
  { name: 'Pro Plugin', sales: 98, revenue: '$4,802', trend: '+8%' },
  { name: 'Starter Package', sales: 234, revenue: '$6,786', trend: '+15%' },
  { name: 'Enterprise License', sales: 45, revenue: '$8,955', trend: '+5%' },
];

export const DashboardNexusPage = (props: DashboardNexusProps) => {
  const { user, stats, recentPosts = [], notifications = [], unreadNotificationCount = 0 } = props;

  const content = html`
    <style>
      /* ========== NEXUS DASHBOARD STYLES ========== */
      .dashboard-header {
        margin-bottom: 2.5rem;
      }

      .dashboard-title {
        font-size: 2rem;
        font-weight: 700;
        color: oklch(var(--bc));
        margin-bottom: 0.5rem;
        letter-spacing: -0.025em;
      }

      .dashboard-subtitle {
        font-size: 0.9375rem;
        color: oklch(var(--bc) / 0.65);
        font-weight: 400;
      }

      /* ========== PERIOD SELECTOR ========== */
      .period-selector {
        display: inline-flex;
        gap: 0.5rem;
        padding: 0.25rem;
        background: oklch(var(--b2));
        border-radius: 0.5rem;
        border: 1px solid oklch(var(--bc) / 0.08);
      }

      .period-btn {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: oklch(var(--bc) / 0.7);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
      }

      .period-btn:hover {
        color: oklch(var(--bc));
        background: oklch(var(--b1) / 0.5);
      }

      .period-btn.active {
        background: oklch(var(--b1));
        color: oklch(var(--p));
        font-weight: 600;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      }

      /* ========== STAT CARDS (NEXUS STYLE) ========== */
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1.25rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: oklch(var(--b1));
        border-radius: 1rem;
        padding: 1.75rem;
        border: 1px solid oklch(var(--bc) / 0.08);
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .stat-card:hover {
        box-shadow: 0 8px 16px -4px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
        transform: translateY(-1px);
        border-color: oklch(var(--bc) / 0.12);
      }

      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, oklch(var(--p)), oklch(var(--s)));
        opacity: 0;
        transition: opacity 0.2s;
      }

      .stat-card:hover::before {
        opacity: 1;
      }

      .stat-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .stat-card-icon {
        width: 48px;
        height: 48px;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-card-icon.primary {
        background: oklch(var(--p) / 0.1);
        color: oklch(var(--p));
      }

      .stat-card-icon.success {
        background: oklch(var(--su) / 0.1);
        color: oklch(var(--su));
      }

      .stat-card-icon.info {
        background: oklch(var(--in) / 0.1);
        color: oklch(var(--in));
      }

      .stat-card-icon.warning {
        background: oklch(var(--wa) / 0.1);
        color: oklch(var(--wa));
      }

      .stat-card-trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
      }

      .stat-card-trend.up {
        background: oklch(var(--su) / 0.1);
        color: oklch(var(--su));
      }

      .stat-card-trend.down {
        background: oklch(var(--er) / 0.1);
        color: oklch(var(--er));
      }

      .stat-card-value {
        font-size: 2.25rem;
        font-weight: 700;
        color: oklch(var(--bc));
        line-height: 1;
        margin-bottom: 0.5rem;
        letter-spacing: -0.025em;
      }

      .stat-card-label {
        font-size: 0.875rem;
        color: oklch(var(--bc) / 0.65);
        font-weight: 500;
      }

      .stat-card-chart {
        height: 48px;
        margin-top: 1.25rem;
        opacity: 0.6;
      }

      /* ========== SALES CHART CARD ========== */
      .chart-card {
        background: oklch(var(--b1));
        border-radius: 1rem;
        padding: 2rem;
        border: 1px solid oklch(var(--bc) / 0.08);
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        margin-bottom: 1.5rem;
      }

      .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2rem;
      }

      .chart-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: oklch(var(--bc));
        letter-spacing: -0.0125em;
      }

      .chart-legend {
        display: flex;
        gap: 1.5rem;
        align-items: center;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }

      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .chart-area {
        height: 280px;
        position: relative;
      }

      /* ========== TABLE STYLES (NEXUS) ========== */
      .data-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .data-table thead {
        background: oklch(var(--b2) / 0.5);
      }

      .data-table th {
        padding: 0.875rem 1rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: oklch(var(--bc) / 0.6);
        border-bottom: 1px solid oklch(var(--bc) / 0.08);
      }

      .data-table th:first-child {
        border-top-left-radius: 0.5rem;
      }

      .data-table th:last-child {
        border-top-right-radius: 0.5rem;
      }

      .data-table td {
        padding: 1rem;
        font-size: 0.875rem;
        border-bottom: 1px solid oklch(var(--bc) / 0.06);
        color: oklch(var(--bc));
      }

      .data-table tbody tr {
        transition: background 0.15s;
      }

      .data-table tbody tr:hover {
        background: oklch(var(--b2) / 0.3);
      }

      .data-table tbody tr:last-child td {
        border-bottom: none;
      }

      .table-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
      }

      .badge-completed {
        background: oklch(var(--su) / 0.15);
        color: oklch(var(--su));
      }

      .badge-processing {
        background: oklch(var(--in) / 0.15);
        color: oklch(var(--in));
      }

      .badge-pending {
        background: oklch(var(--wa) / 0.15);
        color: oklch(var(--wa));
      }

      /* ========== CONTENT CARDS ========== */
      .content-card {
        background: oklch(var(--b1));
        border-radius: 1rem;
        padding: 1.5rem;
        border: 1px solid oklch(var(--bc) / 0.08);
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
      }

      .content-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }

      .content-card-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: oklch(var(--bc));
        letter-spacing: -0.0125em;
      }

      .content-card-action {
        font-size: 0.875rem;
        color: oklch(var(--p));
        text-decoration: none;
        font-weight: 500;
        transition: opacity 0.2s;
      }

      .content-card-action:hover {
        opacity: 0.8;
      }

      /* ========== ACTIVITY LIST ========== */
      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .activity-item {
        display: flex;
        align-items: start;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        transition: background 0.2s;
      }

      .activity-item:hover {
        background: oklch(var(--b2));
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: oklch(var(--p) / 0.1);
        color: oklch(var(--p));
      }

      .activity-content {
        flex: 1;
        min-width: 0;
      }

      .activity-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: oklch(var(--bc));
        margin-bottom: 0.25rem;
        line-height: 1.4;
      }

      .activity-description {
        font-size: 0.8125rem;
        color: oklch(var(--bc) / 0.65);
        line-height: 1.5;
      }

      .activity-time {
        font-size: 0.75rem;
        color: oklch(var(--bc) / 0.55);
        white-space: nowrap;
        font-weight: 500;
      }

      /* ========== QUICK ACTIONS ========== */
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .quick-action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.5rem;
        background: oklch(var(--b1));
        border: 2px dashed oklch(var(--bc) / 0.2);
        border-radius: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
      }

      .quick-action-btn:hover {
        border-color: oklch(var(--p));
        background: oklch(var(--p) / 0.05);
      }

      .quick-action-icon {
        width: 40px;
        height: 40px;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: oklch(var(--p) / 0.1);
        color: oklch(var(--p));
      }

      .quick-action-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: oklch(var(--bc));
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .dashboard-title {
          font-size: 1.5rem;
        }

        .stat-grid {
          grid-template-columns: 1fr;
        }

        .stat-card-value {
          font-size: 1.75rem;
        }

        .quick-actions {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>

    <!-- Dashboard Header -->
    <div class="dashboard-header" style="display: flex; align-items: center; justify-content: space-between;">
      <div>
        <h1 class="dashboard-title">Dashboard de E-commerce</h1>
        <p class="dashboard-subtitle">Bienvenido de vuelta, ${user?.name || 'Usuario'} 👋 Aquí está tu resumen de hoy.</p>
      </div>
      <div class="period-selector">
        <button class="period-btn">Hoy</button>
        <button class="period-btn active">7 días</button>
        <button class="period-btn">30 días</button>
        <button class="period-btn">12 meses</button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stat-grid">
      <!-- Total Revenue -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="stat-card-trend up">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            +23.5%
          </div>
        </div>
        <div class="stat-card-value">$54,239</div>
        <div class="stat-card-label">Ingresos Totales</div>
        <div class="stat-card-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 48" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:oklch(var(--p));stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:oklch(var(--p));stop-opacity:0" />
              </linearGradient>
            </defs>
            <path d="M0,40 L25,35 L50,38 L75,28 L100,22 L125,25 L150,15 L175,10 L200,12"
                  fill="url(#grad1)" stroke="oklch(var(--p))" stroke-width="2.5"/>
          </svg>
        </div>
      </div>

      <!-- Total Orders -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon success">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <div class="stat-card-trend up">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            +18.2%
          </div>
        </div>
        <div class="stat-card-value">1,428</div>
        <div class="stat-card-label">Pedidos Totales</div>
        <div class="stat-card-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 48" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:oklch(var(--su));stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:oklch(var(--su));stop-opacity:0" />
              </linearGradient>
            </defs>
            <path d="M0,42 L25,38 L50,40 L75,32 L100,28 L125,30 L150,22 L175,18 L200,20"
                  fill="url(#grad2)" stroke="oklch(var(--su))" stroke-width="2.5"/>
          </svg>
        </div>
      </div>

      <!-- New Customers -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon info">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div class="stat-card-trend up">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            +12.8%
          </div>
        </div>
        <div class="stat-card-value">248</div>
        <div class="stat-card-label">Nuevos Clientes</div>
        <div class="stat-card-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 48" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:oklch(var(--in));stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:oklch(var(--in));stop-opacity:0" />
              </linearGradient>
            </defs>
            <path d="M0,38 L25,36 L50,34 L75,30 L100,28 L125,26 L150,22 L175,18 L200,16"
                  fill="url(#grad3)" stroke="oklch(var(--in))" stroke-width="2.5"/>
          </svg>
        </div>
      </div>

      <!-- Conversion Rate -->
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon warning">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div class="stat-card-trend up">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
            +4.3%
          </div>
        </div>
        <div class="stat-card-value">3.89%</div>
        <div class="stat-card-label">Tasa de Conversión</div>
        <div class="stat-card-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 48" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad4" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:oklch(var(--wa));stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:oklch(var(--wa));stop-opacity:0" />
              </linearGradient>
            </defs>
            <path d="M0,44 L25,42 L50,40 L75,38 L100,34 L125,28 L150,26 L175,22 L200,18"
                  fill="url(#grad4)" stroke="oklch(var(--wa))" stroke-width="2.5"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Sales Chart -->
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <h2 class="chart-title">Resumen de Ventas</h2>
          <p style="font-size: 0.875rem; color: oklch(var(--bc) / 0.6); margin-top: 0.25rem;">
            Rendimiento de ventas durante los últimos 7 días
          </p>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-dot" style="background: oklch(var(--p));"></div>
            <span style="color: oklch(var(--bc) / 0.7);">Ingresos</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: oklch(var(--su));"></div>
            <span style="color: oklch(var(--bc) / 0.7);">Pedidos</span>
          </div>
        </div>
      </div>
      <div class="chart-area">
        <svg width="100%" height="100%" viewBox="0 0 800 280" preserveAspectRatio="none" style="overflow: visible;">
          <defs>
            <linearGradient id="chartGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:oklch(var(--p));stop-opacity:0.2" />
              <stop offset="100%" style="stop-color:oklch(var(--p));stop-opacity:0" />
            </linearGradient>
            <linearGradient id="chartGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:oklch(var(--su));stop-opacity:0.15" />
              <stop offset="100%" style="stop-color:oklch(var(--su));stop-opacity:0" />
            </linearGradient>
          </defs>

          <!-- Grid lines -->
          <line x1="0" y1="0" x2="800" y2="0" stroke="oklch(var(--bc) / 0.08)" stroke-width="1"/>
          <line x1="0" y1="70" x2="800" y2="70" stroke="oklch(var(--bc) / 0.08)" stroke-width="1"/>
          <line x1="0" y1="140" x2="800" y2="140" stroke="oklch(var(--bc) / 0.08)" stroke-width="1"/>
          <line x1="0" y1="210" x2="800" y2="210" stroke="oklch(var(--bc) / 0.08)" stroke-width="1"/>
          <line x1="0" y1="280" x2="800" y2="280" stroke="oklch(var(--bc) / 0.08)" stroke-width="1"/>

          <!-- Revenue area -->
          <path d="M0,220 L114,180 L228,190 L342,140 L456,120 L570,130 L684,80 L800,90 L800,280 L0,280 Z"
                fill="url(#chartGrad1)"/>
          <path d="M0,220 L114,180 L228,190 L342,140 L456,120 L570,130 L684,80 L800,90"
                fill="none" stroke="oklch(var(--p))" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Orders area -->
          <path d="M0,240 L114,210 L228,220 L342,180 L456,160 L570,170 L684,120 L800,130 L800,280 L0,280 Z"
                fill="url(#chartGrad2)"/>
          <path d="M0,240 L114,210 L228,220 L342,180 L456,160 L570,170 L684,120 L800,130"
                fill="none" stroke="oklch(var(--su))" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8,5"/>

          <!-- Data points for Revenue -->
          <circle cx="0" cy="220" r="4" fill="oklch(var(--p))"/>
          <circle cx="114" cy="180" r="4" fill="oklch(var(--p))"/>
          <circle cx="228" cy="190" r="4" fill="oklch(var(--p))"/>
          <circle cx="342" cy="140" r="4" fill="oklch(var(--p))"/>
          <circle cx="456" cy="120" r="4" fill="oklch(var(--p))"/>
          <circle cx="570" cy="130" r="4" fill="oklch(var(--p))"/>
          <circle cx="684" cy="80" r="4" fill="oklch(var(--p))"/>
          <circle cx="800" cy="90" r="4" fill="oklch(var(--p))"/>
        </svg>

        <!-- X-axis labels -->
        <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding: 0 0.5rem;">
          <span style="font-size: 0.75rem; color: oklch(var(--bc) / 0.5);">Lun</span>
          <span style="font-size: 0.75rem; color: oklch(var(--bc) / 0.5);">Mar</span>
          <span style="font-size: 0.75rem; color: oklch(var(--bc) / 0.5);">Mié</span>
          <span style="font-size: 0.75rem; color: oklch(var(--bc) / 0.5);">Jue</span>
          <span style="font-size: 0.75rem; color: oklch(var(--bc) / 0.5);">Vie</span>
          <span style="font-size: 0.75rem; color: oklch(var(--bc) / 0.5);">Sáb</span>
          <span style="font-size: 0.75rem; color: oklch(var(--bc) / 0.5);">Dom</span>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Orders Table (2/3 width) -->
      <div class="lg:col-span-2">
        <div class="content-card">
          <div class="content-card-header">
            <h2 class="content-card-title">Pedidos Recientes</h2>
            <a href="/admin/orders" class="content-card-action">Ver todos →</a>
          </div>
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                ${raw(recentOrders.map((order) => `
                  <tr>
                    <td style="font-weight: 600; color: oklch(var(--p));">${order.id}</td>
                    <td>${order.customer}</td>
                    <td style="color: oklch(var(--bc) / 0.7);">${order.product}</td>
                    <td style="font-weight: 600;">${order.amount}</td>
                    <td>
                      <span class="table-badge badge-${order.status.toLowerCase()}">
                        ${order.status}
                      </span>
                    </td>
                    <td style="color: oklch(var(--bc) / 0.6); font-size: 0.8125rem;">${order.date}</td>
                  </tr>
                `).join(''))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Top Products (1/3 width) -->
      <div>
        <div class="content-card">
          <div class="content-card-header">
            <h2 class="content-card-title">Productos Destacados</h2>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${raw(topProducts.map((product, index) => `
              <div style="display: flex; align-items: start; gap: 1rem; padding-bottom: 1.25rem; ${index < topProducts.length - 1 ? 'border-bottom: 1px solid oklch(var(--bc) / 0.08);' : ''}">
                <div style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 0.5rem; background: oklch(var(--p) / 0.1); display: flex; align-items: center; justify-content: center; font-weight: 700; color: oklch(var(--p)); font-size: 1.125rem;">
                  ${index + 1}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 0.875rem; color: oklch(var(--bc)); margin-bottom: 0.25rem;">
                    ${product.name}
                  </div>
                  <div style="display: flex; gap: 1rem; font-size: 0.8125rem; color: oklch(var(--bc) / 0.6);">
                    <span>${product.sales} ventas</span>
                    <span>•</span>
                    <span style="font-weight: 600; color: oklch(var(--bc));">${product.revenue}</span>
                  </div>
                </div>
                <div style="flex-shrink: 0; font-size: 0.75rem; font-weight: 600; color: oklch(var(--su)); background: oklch(var(--su) / 0.1); padding: 0.25rem 0.5rem; border-radius: 0.375rem;">
                  ${product.trend}
                </div>
              </div>
            `).join(''))}
          </div>
        </div>
      </div>
    </div>
  `;

  return AdminLayoutNexus({
    title: "Dashboard",
    children: content,
    activePage: "dashboard",
    user,
    notifications,
    unreadNotificationCount,
  });
};

export default DashboardNexusPage;
