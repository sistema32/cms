/**
 * Public REST API Types
 * API keys, documentation, and public endpoints
 */

/**
 * API Key
 */
export interface APIKey {
  id?: number;
  name: string;
  key: string;
  userId: number;
  permissions: string[]; // Array of permission strings
  rateLimit?: number; // Requests per hour
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
}

/**
 * API Key permissions
 */
export const API_PERMISSIONS = {
  READ_CONTENT: "read:content",
  READ_CATEGORIES: "read:categories",
  READ_TAGS: "read:tags",
  READ_USERS: "read:users",
  READ_MEDIA: "read:media",
  READ_COMMENTS: "read:comments",
  WRITE_CONTENT: "write:content",
  WRITE_CATEGORIES: "write:categories",
  WRITE_TAGS: "write:tags",
  WRITE_COMMENTS: "write:comments",
} as const;

export type APIPermission = typeof API_PERMISSIONS[keyof typeof API_PERMISSIONS];

/**
 * API usage stats
 */
export interface APIUsageStats {
  apiKeyId: number;
  totalRequests: number;
  requestsToday: number;
  requestsThisHour: number;
  lastRequest?: Date;
  endpoints: {
    path: string;
    method: string;
    count: number;
  }[];
}

/**
 * API rate limit result
 */
export interface APIRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * OpenAPI Schema Types
 */
export interface OpenAPIInfo {
  title: string;
  version: string;
  description: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

export interface OpenAPIServer {
  url: string;
  description?: string;
}

export interface OpenAPIPath {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
  security?: Record<string, string[]>[];
}

export interface OpenAPIParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description?: string;
  required?: boolean;
  schema: OpenAPISchema;
}

export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, { schema: OpenAPISchema }>;
}

export interface OpenAPIResponse {
  description: string;
  content?: Record<string, { schema: OpenAPISchema }>;
}

export interface OpenAPISchema {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  enum?: string[];
  example?: any;
  description?: string;
  $ref?: string;
}

export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers: OpenAPIServer[];
  paths: Record<string, Record<string, OpenAPIPath>>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
    securitySchemes?: Record<string, any>;
  };
  tags?: {
    name: string;
    description: string;
  }[];
}
