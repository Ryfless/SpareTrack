import { api } from './client';

export interface ReportSummary {
  period: { start: string; end: string };
  stock_movements: {
    total_in: number;
    total_out: number;
    total_adjustment: number;
    total_transfer: number;
    net_flow: number;
  };
  inventory: {
    total_items: number;
    critical_items: number;
    critical_list: Array<{
      name: string;
      code: string;
      branch: string;
      quantity: number;
    }>;
  };
}

export interface ReportQuery {
  branch_id?: string;
  start_date?: string;
  end_date?: string;
}

export async function getSummary(query: ReportQuery = {}): Promise<ReportSummary> {
  const response = await api.get<ReportSummary>('/reports/summary', query as Record<string, string | number | undefined>);
  return response.data;
}
