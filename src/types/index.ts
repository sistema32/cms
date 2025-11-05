// Tipos de respuesta API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipo de usuario seguro (sin password)
export interface SafeUser {
  id: number;
  email: string;
  name: string | null;
  role?: {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

// Respuesta de autenticación
export interface AuthResponse {
  user: SafeUser;
  token: string;
}

// Paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
