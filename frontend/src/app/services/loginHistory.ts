import { api } from './client';

export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  login_at: string;
  logout_at: string | null;
}

export async function getLoginHistory(): Promise<LoginHistoryEntry[]> {
  const response = await api.get<LoginHistoryEntry[]>('/auth/login-history');
  return response.data;
}
