/**
 * Analytics Dashboard Plugin
 * Demonstrates custom admin panel registration
 */

import type { PluginClass } from '../../src/lib/plugin-system/types.ts';
import type { PluginAPI } from '../../src/lib/plugin-system/PluginAPI.ts';
import { AdminLayout } from '../../src/admin/components/AdminLayout.tsx';
import { html } from 'hono/html';

export default class AnalyticsDashboardPlugin implements PluginClass {
  private api: PluginAPI;

  constructor(api: PluginAPI) {
    this.api = api;
  }

  async onActivate(): Promise<void> {
    this.api.log('Analytics Dashboard Plugin activating...', 'info');

    // Register custom admin panel
    this.api.registerAdminPanel({
      id: 'analytics',
      title: 'Analíticas',
      description: 'Panel de métricas y estadísticas del sitio',
      icon: 'chart-line',
      path: 'analytics',
      showInMenu: true,
      order: 1,
      component: this.renderAnalyticsPanel.bind(this),
    });

    // Register another panel for detailed reports
    this.api.registerAdminPanel({
      id: 'reports',
      title: 'Reportes',
      description: 'Reportes detallados y exportación de datos',
      icon: 'file-chart',
      path: 'reports',
      showInMenu: true,
      order: 2,
      component: this.renderReportsPanel.bind(this),
    });

    this.api.log('Analytics panels registered successfully', 'info');
  }

  async onDeactivate(): Promise<void> {
    this.api.log('Analytics Dashboard Plugin deactivating...', 'info');
    // Panels are automatically unregistered by the PluginManager
  }

  /**
   * Render the analytics panel
   */
  private async renderAnalyticsPanel(context: any) {
    const { user, settings, pluginPanels = [] } = context;

    // Filter panels for menu
    const menuPanels = pluginPanels
      .filter((p: any) => p.showInMenu !== false)
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        pluginName: p.pluginName,
        path: p.path,
        icon: p.icon,
      }));

    // Fetch some analytics data (simulated)
    const analyticsData = await this.getAnalyticsData();

    return html`${AdminLayout({
      title: 'Analíticas',
      activePage: 'plugin.analytics-dashboard.analytics',
      user,
      pluginPanels: menuPanels,
      children: html`
        <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

          <!-- Page header -->
          <div class="mb-8">
            <h1 class="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
              📊 Panel de Analíticas
            </h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Métricas y estadísticas de tu sitio web
            </p>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            <!-- Total Views -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Visitas Totales
                </div>
                <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                ${analyticsData.totalViews.toLocaleString()}
              </div>
              <div class="mt-2 text-sm text-green-600 dark:text-green-400">
                +${analyticsData.viewsGrowth}% desde ayer
              </div>
            </div>

            <!-- Unique Visitors -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Visitantes Únicos
                </div>
                <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                ${analyticsData.uniqueVisitors.toLocaleString()}
              </div>
              <div class="mt-2 text-sm text-green-600 dark:text-green-400">
                +${analyticsData.visitorsGrowth}% desde ayer
              </div>
            </div>

            <!-- Avg Session Duration -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Duración Promedio
                </div>
                <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                ${analyticsData.avgSessionDuration}
              </div>
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                minutos por sesión
              </div>
            </div>

            <!-- Bounce Rate -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tasa de Rebote
                </div>
                <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">
                ${analyticsData.bounceRate}%
              </div>
              <div class="mt-2 text-sm text-red-600 dark:text-red-400">
                -${analyticsData.bounceRateChange}% desde ayer
              </div>
            </div>

          </div>

          <!-- Chart Section -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Visitas de los últimos 7 días
            </h2>
            <div class="h-64 flex items-end justify-between space-x-2">
              ${analyticsData.last7Days.map((day: any) => html`
                <div class="flex-1 flex flex-col items-center">
                  <div class="w-full bg-violet-500 rounded-t" style="height: ${(day.views / Math.max(...analyticsData.last7Days.map((d: any) => d.views))) * 100}%"></div>
                  <div class="text-xs text-gray-600 dark:text-gray-400 mt-2">${day.label}</div>
                  <div class="text-xs font-semibold text-gray-900 dark:text-white">${day.views}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Top Pages Table -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Páginas más visitadas
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Página</th>
                    <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Visitas</th>
                    <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${analyticsData.topPages.map((page: any) => html`
                    <tr class="border-b border-gray-100 dark:border-gray-700/50">
                      <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">${page.path}</td>
                      <td class="py-3 px-4 text-sm text-gray-900 dark:text-white text-right">${page.views.toLocaleString()}</td>
                      <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">${page.percentage}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `,
    })}`;
  }

  /**
   * Render the reports panel
   */
  private async renderReportsPanel(context: any) {
    const { user, pluginPanels = [] } = context;

    // Filter panels for menu
    const menuPanels = pluginPanels
      .filter((p: any) => p.showInMenu !== false)
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        pluginName: p.pluginName,
        path: p.path,
        icon: p.icon,
      }));

    return html`${AdminLayout({
      title: 'Reportes',
      activePage: 'plugin.analytics-dashboard.reports',
      user,
      pluginPanels: menuPanels,
      children: html`
        <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

          <div class="mb-8">
            <h1 class="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
              📈 Reportes Detallados
            </h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Genera y exporta reportes personalizados
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sistema de Reportes
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Esta funcionalidad está en desarrollo. Pronto podrás generar reportes personalizados.
            </p>
            <button class="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors">
              Configurar Reportes
            </button>
          </div>

        </div>
      `,
    })}`;
  }

  /**
   * Get simulated analytics data
   */
  private async getAnalyticsData() {
    // In a real implementation, this would query the database
    return {
      totalViews: 45238,
      viewsGrowth: 12.5,
      uniqueVisitors: 12847,
      visitorsGrowth: 8.3,
      avgSessionDuration: '3:24',
      bounceRate: 42.3,
      bounceRateChange: 3.2,
      last7Days: [
        { label: 'Lun', views: 3245 },
        { label: 'Mar', views: 4123 },
        { label: 'Mié', views: 3876 },
        { label: 'Jue', views: 5234 },
        { label: 'Vie', views: 6543 },
        { label: 'Sáb', views: 4321 },
        { label: 'Dom', views: 3456 },
      ],
      topPages: [
        { path: '/', views: 12543, percentage: 27.7 },
        { path: '/blog', views: 8234, percentage: 18.2 },
        { path: '/productos', views: 6543, percentage: 14.5 },
        { path: '/contacto', views: 4321, percentage: 9.5 },
        { path: '/sobre-nosotros', views: 3456, percentage: 7.6 },
      ],
    };
  }
}
