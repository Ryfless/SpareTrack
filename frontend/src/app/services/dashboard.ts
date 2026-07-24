import { api } from './client';

export interface DashboardSummary {
  kpi: {
    total_spareparts: number;
    total_branches: number;
    total_stock: number;
    total_value: number;
    critical_stock: number;
    low_stock: number;
    overstock: number;
    safe: number;
  };
  recent_activity: Array<{
    id: string;
    action: string;
    description: string;
    entity_type: string;
    created_at: string;
  }>;
  monthly_trend: Array<{
    created_at: string;
    quantity: number;
    type: string;
  }>;
  forecast_status: string | null;
}

export async function getSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user_id: string;
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const response = await api.get<ActivityItem[]>('/dashboard/recent-activity');
  return response.data;
}
