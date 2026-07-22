import { api, type ApiResponse } from './client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  branch: string;
  role: string;
  is_active: boolean;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: string;
}

export interface CreateUserData {
  email: string;
  full_name: string;
  password: string;
  role?: string;
  branch?: string;
  phone?: string;
}

export interface UpdateUserData {
  full_name?: string;
  role?: string;
  branch?: string;
  phone?: string;
  is_active?: boolean;
}

export async function getUsers(query: UserQuery = {}): Promise<ApiResponse<User[]>> {
  return api.get<User[]>('/users', query as Record<string, string | number | undefined>);
}

export async function getUser(id: string): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

export async function createUser(data: CreateUserData): Promise<User> {
  const response = await api.post<User>('/users', data);
  return response.data;
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const response = await api.patch<User>(`/users/${id}`, data);
  return response.data;
}

export async function toggleUserActive(id: string): Promise<{ id: string; is_active: boolean }> {
  const response = await api.patch<{ id: string; is_active: boolean }>(`/users/${id}/toggle`);
  return response.data;
}
