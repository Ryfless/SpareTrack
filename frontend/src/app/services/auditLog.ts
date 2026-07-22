import { api, type ApiResponse } from './client';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown>;
  new_data: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: string;
  entity_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export async function getAuditLogs(query: AuditLogQuery = {}): Promise<ApiResponse<AuditLogEntry[]>> {
  return api.get<AuditLogEntry[]>('/audit-logs', query as Record<string, string | number | undefined>);
}

export async function getAuditLogDetail(id: string): Promise<AuditLogEntry> {
  const response = await api.get<AuditLogEntry>(`/audit-logs/${id}`);
  return response.data;
}
