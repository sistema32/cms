/**
 * DevBar Types
 * Type definitions for the development toolbar
 */

export interface DevBarData {
  // Request info
  request: {
    method: string;
    url: string;
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    startTime: number;
    endTime?: number;
    duration?: number;
  };

  // Response info
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    size?: number;
  };

  // Database queries
  queries: QueryInfo[];

  // Logs captured
  logs: LogEntry[];

  // Session/User info
  session?: {
    userId?: number;
    userName?: string;
    email?: string;
    role?: string;
    sessionId?: string;
  };

  // Memory and performance
  performance: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    denoVersion: string;
  };

  // Route info
  route?: {
    handler: string;
    params: Record<string, string>;
    middlewares: string[];
  };

  // View info
  view?: {
    template: string;
    layout?: string;
    data: Record<string, any>;
  };
}

export interface QueryInfo {
  sql: string;
  params?: any[];
  duration: number;
  timestamp: number;
  stackTrace?: string;
}

export interface LogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
  args?: any[];
  stackTrace?: string;
}

export interface DevBarConfig {
  enabled: boolean;
  captureQueries: boolean;
  captureLogs: boolean;
  captureSession: boolean;
  maxQueries: number;
  maxLogs: number;
}
