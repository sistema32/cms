export interface SafeUser {
  id: number;
  email: string;
  name?: string | null;
  roleId?: number | null;
  status?: string;
  twoFactorEnabled?: boolean;
  avatar?: string | null;
  role?: { id: number; name?: string } | null;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  token: string;
  user: SafeUser;
  requires2FA?: boolean;
}
