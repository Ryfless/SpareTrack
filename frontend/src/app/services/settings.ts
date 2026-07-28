import { api } from './client';

export interface SettingsProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  branch: string;
  role: string;
  avatar_url: string;
}

export interface SettingsResponse {
  profile: SettingsProfile;
  branches: Array<{ id: string; name: string }>;
  settings: Record<string, unknown>;
  api_tokens: Array<{
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    last_used_at: string | null;
  }>;
}

export async function getSettings(): Promise<SettingsResponse> {
  const response = await api.get<SettingsResponse>('/settings');
  return response.data;
}

export interface UpdateSettingsData {
  key: string;
  value: unknown;
  branch_id?: string;
}

export async function updateSettings(data: UpdateSettingsData): Promise<unknown> {
  const response = await api.patch<unknown>('/settings', data);
  return response.data;
}
