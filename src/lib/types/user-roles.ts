export type Permission = {
  id: string;
  name: string;
  description: string;
  category: string;
};

export type UserRole = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
  users?: User[];
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  roleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  role?: UserRole | null;
};

// API Response Types
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

export type RolesResponse = ApiResponse<{
  roles: UserRole[];
}>;

export type RoleResponse = ApiResponse<UserRole>;