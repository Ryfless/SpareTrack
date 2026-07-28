import { api, type ApiResponse } from './client';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  link: string;
  created_at: string;
}

export async function list(page = 1, limit = 20): Promise<ApiResponse<NotificationItem[]>> {
  return api.get<NotificationItem[]>('/notifications', { page, limit });
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const res = await api.get<{ count: number }>('/notifications/unread-count');
  return res.data;
}

export async function markRead(id: string): Promise<NotificationItem> {
  const res = await api.patch<NotificationItem>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
