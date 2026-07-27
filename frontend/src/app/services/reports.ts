import { api } from './client';
import { supabase } from './supabase';

export interface MonthlyTrendItem {
  month: string;
  units: number;
  revenue: number;
}

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
  monthly_trend: MonthlyTrendItem[];
  top_sparepart: {
    name: string;
    total_sold: number;
    avg_monthly: number;
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

const API_URL = import.meta.env.VITE_API_URL;

async function exportBlob(endpoint: string, query: ReportQuery & { type: string }): Promise<Blob> {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  const url = `${API_URL}/reports/export/${endpoint}${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Gagal export' }));
    throw new Error(err.message || 'Gagal export');
  }
  return response.blob();
}

export async function exportPdf(query: ReportQuery & { type: string }): Promise<Blob> {
  return exportBlob('pdf', query);
}

export async function exportExcel(query: ReportQuery & { type: string }): Promise<Blob> {
  return exportBlob('excel', query);
}
