import { html, raw } from "hono/html";
import type { DevBarData } from "./types.ts";

/**
 * DevBar Component
 * Development toolbar similar to Laravel Debugbar
 */

export const DevBar = (data: DevBarData) => {
  const duration = data.request.duration || 0;
  const memoryMB = (data.performance.memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
  const queryCount = data.queries.length;
  const logCount = data.logs.length;
  const errorCount = data.logs.filter(l => l.level === 'error').length;

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return html`
    ${raw(`
    <style>
      #lexcms-devbar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 999999;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 13px;
        background: #1e1e1e;
        color: #d4d4d4;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
      }

      #lexcms-devbar.collapsed {
        transform: translateY(calc(100% - 36px));
      }

      .devbar-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 1rem;
        background: #252526;
        border-bottom: 1px solid #3e3e42;
        cursor: pointer;
        user-select: none;
      }

      .devbar-logo {
        font-weight: 700;
        font-size: 12px;
        color: #4ec9b0;
        letter-spacing: 0.5px;
      }

      .devbar-stats {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex: 1;
        font-size: 12px;
      }

      .devbar-stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .devbar-stat-label {
        color: #858585;
      }

      .devbar-stat-value {
        font-weight: 600;
        color: #d4d4d4;
      }

      .devbar-stat-value.success { color: #4ec9b0; }
      .devbar-stat-value.warning { color: #dcdcaa; }
      .devbar-stat-value.error { color: #f48771; }
      .devbar-stat-value.info { color: #569cd6; }

      .devbar-toggle {
        background: none;
        border: none;
        color: #858585;
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        transition: color 0.2s;
      }

      .devbar-toggle:hover {
        color: #d4d4d4;
      }

      .devbar-content {
        max-height: 400px;
        overflow: hidden;
      }

      .devbar-tabs {
        display: flex;
        gap: 0;
        background: #2d2d30;
        border-bottom: 1px solid #3e3e42;
        padding: 0 1rem;
      }

      .devbar-tab {
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        color: #858585;
        cursor: pointer;
        font-family: inherit;
        font-size: 12px;
        font-weight: 500;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }

      .devbar-tab:hover {
        color: #d4d4d4;
        background: rgba(255, 255, 255, 0.05);
      }

      .devbar-tab.active {
        color: #4ec9b0;
        border-bottom-color: #4ec9b0;
      }

      .devbar-panel {
        display: none;
        padding: 1rem;
        max-height: 350px;
        overflow-y: auto;
        background: #1e1e1e;
      }

      .devbar-panel.active {
        display: block;
      }

      .devbar-panel::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .devbar-panel::-webkit-scrollbar-track {
        background: #1e1e1e;
      }

      .devbar-panel::-webkit-scrollbar-thumb {
        background: #3e3e42;
        border-radius: 4px;
      }

      .devbar-panel::-webkit-scrollbar-thumb:hover {
        background: #4e4e52;
      }

      .devbar-section {
        margin-bottom: 1.5rem;
      }

      .devbar-section-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #858585;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }

      .devbar-table {
        width: 100%;
        border-collapse: collapse;
      }

      .devbar-table th {
        text-align: left;
        padding: 0.5rem;
        font-size: 11px;
        color: #858585;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #3e3e42;
      }

      .devbar-table td {
        padding: 0.5rem;
        border-bottom: 1px solid #2d2d30;
        vertical-align: top;
      }

      .devbar-table tr:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      .devbar-code {
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 12px;
        color: #ce9178;
        background: #2d2d30;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        word-break: break-all;
      }

      .devbar-badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .devbar-badge.success { background: #0e639c; color: #4ec9b0; }
      .devbar-badge.warning { background: #635a3d; color: #dcdcaa; }
      .devbar-badge.error { background: #5a1e1e; color: #f48771; }
      .devbar-badge.info { background: #1e3a5a; color: #569cd6; }
      .devbar-badge.default { background: #2d2d30; color: #858585; }

      .devbar-log-entry {
        margin-bottom: 0.75rem;
        padding: 0.5rem;
        background: #252526;
        border-left: 3px solid #3e3e42;
        border-radius: 3px;
      }

      .devbar-log-entry.error { border-left-color: #f48771; }
      .devbar-log-entry.warn { border-left-color: #dcdcaa; }
      .devbar-log-entry.info { border-left-color: #569cd6; }

      .devbar-log-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
        font-size: 11px;
        color: #858585;
      }

      .devbar-log-message {
        color: #d4d4d4;
        font-size: 12px;
      }

      .devbar-kv {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.5rem 1rem;
        font-size: 12px;
      }

      .devbar-kv-key {
        color: #9cdcfe;
        font-weight: 600;
      }

      .devbar-kv-value {
        color: #ce9178;
      }

      .devbar-query {
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: #252526;
        border-radius: 3px;
        border-left: 3px solid #569cd6;
      }

      .devbar-query-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 11px;
        color: #858585;
      }

      .devbar-query-sql {
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 12px;
        color: #ce9178;
        word-break: break-all;
        line-height: 1.6;
      }

      .devbar-empty {
        text-align: center;
        padding: 2rem;
        color: #858585;
        font-size: 12px;
      }
    </style>

    <div id="lexcms-devbar">
      <!-- Header -->
      <div class="devbar-header" onclick="toggleDevBar()">
        <div class="devbar-logo">⚡ LEXCMS DEVBAR</div>
        <div class="devbar-stats">
          <div class="devbar-stat">
            <span class="devbar-stat-label">${data.request.method}</span>
            <span class="devbar-stat-value info">${data.response.status}</span>
          </div>
          <div class="devbar-stat">
            <span class="devbar-stat-label">Time</span>
            <span class="devbar-stat-value ${duration > 1000 ? 'error' : duration > 500 ? 'warning' : 'success'}">
              ${duration.toFixed(2)}ms
            </span>
          </div>
          <div class="devbar-stat">
            <span class="devbar-stat-label">Memory</span>
            <span class="devbar-stat-value">${memoryMB} MB</span>
          </div>
          <div class="devbar-stat">
            <span class="devbar-stat-label">Queries</span>
            <span class="devbar-stat-value ${queryCount > 10 ? 'warning' : 'success'}">${queryCount}</span>
          </div>
          <div class="devbar-stat">
            <span class="devbar-stat-label">Logs</span>
            <span class="devbar-stat-value ${errorCount > 0 ? 'error' : 'info'}">${logCount}</span>
          </div>
          ${data.session ? `
            <div class="devbar-stat">
              <span class="devbar-stat-label">User</span>
              <span class="devbar-stat-value">${data.session.userName || data.session.email || 'Guest'}</span>
            </div>
          ` : ''}
        </div>
        <button class="devbar-toggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="devbar-content">
        <!-- Tabs -->
        <div class="devbar-tabs">
          <button class="devbar-tab active" onclick="switchDevBarTab(event, 'overview')">Overview</button>
          <button class="devbar-tab" onclick="switchDevBarTab(event, 'queries')">Queries (${queryCount})</button>
          <button class="devbar-tab" onclick="switchDevBarTab(event, 'logs')">Logs (${logCount})</button>
          <button class="devbar-tab" onclick="switchDevBarTab(event, 'request')">Request</button>
          <button class="devbar-tab" onclick="switchDevBarTab(event, 'response')">Response</button>
          ${data.session ? '<button class="devbar-tab" onclick="switchDevBarTab(event, \'session\')">Session</button>' : ''}
        </div>

        <!-- Overview Panel -->
        <div class="devbar-panel active" id="devbar-panel-overview">
          <div class="devbar-section">
            <div class="devbar-section-title">Request Information</div>
            <div class="devbar-kv">
              <span class="devbar-kv-key">Method:</span>
              <span class="devbar-kv-value">${data.request.method}</span>

              <span class="devbar-kv-key">URL:</span>
              <span class="devbar-kv-value">${data.request.url}</span>

              <span class="devbar-kv-key">Path:</span>
              <span class="devbar-kv-value">${data.request.path}</span>

              <span class="devbar-kv-key">Status:</span>
              <span class="devbar-kv-value">${data.response.status} ${data.response.statusText}</span>

              <span class="devbar-kv-key">Duration:</span>
              <span class="devbar-kv-value">${duration.toFixed(2)}ms</span>
            </div>
          </div>

          <div class="devbar-section">
            <div class="devbar-section-title">Performance</div>
            <div class="devbar-kv">
              <span class="devbar-kv-key">Heap Used:</span>
              <span class="devbar-kv-value">${formatBytes(data.performance.memoryUsage.heapUsed)}</span>

              <span class="devbar-kv-key">Heap Total:</span>
              <span class="devbar-kv-value">${formatBytes(data.performance.memoryUsage.heapTotal)}</span>

              <span class="devbar-kv-key">RSS:</span>
              <span class="devbar-kv-value">${formatBytes(data.performance.memoryUsage.rss)}</span>

              <span class="devbar-kv-key">External:</span>
              <span class="devbar-kv-value">${formatBytes(data.performance.memoryUsage.external)}</span>

              <span class="devbar-kv-key">Deno Version:</span>
              <span class="devbar-kv-value">${data.performance.denoVersion}</span>
            </div>
          </div>
        </div>

        <!-- Queries Panel -->
        <div class="devbar-panel" id="devbar-panel-queries">
          ${queryCount === 0 ? `
            <div class="devbar-empty">No database queries recorded</div>
          ` : `
            ${data.queries.map((query, index) => `
              <div class="devbar-query">
                <div class="devbar-query-meta">
                  <span>#${index + 1}</span>
                  <span>${query.duration.toFixed(2)}ms</span>
                </div>
                <div class="devbar-query-sql">${query.sql}</div>
                ${query.params && query.params.length > 0 ? `
                  <div style="margin-top: 0.5rem; font-size: 11px; color: #858585;">
                    Params: ${JSON.stringify(query.params)}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          `}
        </div>

        <!-- Logs Panel -->
        <div class="devbar-panel" id="devbar-panel-logs">
          ${logCount === 0 ? `
            <div class="devbar-empty">No logs recorded</div>
          ` : `
            ${data.logs.map(log => `
              <div class="devbar-log-entry ${log.level}">
                <div class="devbar-log-meta">
                  <span class="devbar-badge ${log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'info'}">
                    ${log.level.toUpperCase()}
                  </span>
                  <span>${new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="devbar-log-message">${log.message}</div>
              </div>
            `).join('')}
          `}
        </div>

        <!-- Request Panel -->
        <div class="devbar-panel" id="devbar-panel-request">
          <div class="devbar-section">
            <div class="devbar-section-title">Headers</div>
            <table class="devbar-table">
              <thead>
                <tr>
                  <th style="width: 200px;">Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(data.request.headers).map(([key, value]) => `
                  <tr>
                    <td><code class="devbar-code">${key}</code></td>
                    <td>${value}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${Object.keys(data.request.query).length > 0 ? `
            <div class="devbar-section">
              <div class="devbar-section-title">Query Parameters</div>
              <div class="devbar-kv">
                ${Object.entries(data.request.query).map(([key, value]) => `
                  <span class="devbar-kv-key">${key}:</span>
                  <span class="devbar-kv-value">${value}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Response Panel -->
        <div class="devbar-panel" id="devbar-panel-response">
          <div class="devbar-section">
            <div class="devbar-section-title">Headers</div>
            <table class="devbar-table">
              <thead>
                <tr>
                  <th style="width: 200px;">Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(data.response.headers).map(([key, value]) => `
                  <tr>
                    <td><code class="devbar-code">${key}</code></td>
                    <td>${value}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Session Panel -->
        ${data.session ? `
          <div class="devbar-panel" id="devbar-panel-session">
            <div class="devbar-section">
              <div class="devbar-section-title">User Information</div>
              <div class="devbar-kv">
                ${data.session.userId ? `
                  <span class="devbar-kv-key">User ID:</span>
                  <span class="devbar-kv-value">${data.session.userId}</span>
                ` : ''}
                ${data.session.userName ? `
                  <span class="devbar-kv-key">Name:</span>
                  <span class="devbar-kv-value">${data.session.userName}</span>
                ` : ''}
                ${data.session.email ? `
                  <span class="devbar-kv-key">Email:</span>
                  <span class="devbar-kv-value">${data.session.email}</span>
                ` : ''}
                ${data.session.role ? `
                  <span class="devbar-kv-key">Role:</span>
                  <span class="devbar-kv-value">${data.session.role}</span>
                ` : ''}
                ${data.session.sessionId ? `
                  <span class="devbar-kv-key">Session ID:</span>
                  <span class="devbar-kv-value">${data.session.sessionId}</span>
                ` : ''}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <script>
      function toggleDevBar() {
        document.getElementById('lexcms-devbar').classList.toggle('collapsed');
      }

      function switchDevBarTab(event, tabName) {
        // Remove active from all tabs and panels
        document.querySelectorAll('.devbar-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.devbar-panel').forEach(panel => panel.classList.remove('active'));

        // Add active to clicked tab and corresponding panel
        event.target.classList.add('active');
        document.getElementById('devbar-panel-' + tabName).classList.add('active');
      }
    </script>
    `)}
  `;
};

export default DevBar;
