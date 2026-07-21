import { api } from './client';

export interface ForecastRun {
  id: string;
  method: string;
  period_start: string;
  period_end: string;
  status: string;
  branch: string;
  generated_by: string;
  created_at: string;
}

export interface ForecastSeries {
  id: string;
  month: string;
  predicted_quantity: number;
  confidence_lower: number;
  confidence_upper: number;
  sparepart: string;
  sparepart_code: string;
  branch: string;
}

export interface ForecastQuery {
  branch_id?: string;
  limit?: number;
}

export async function getRuns(query: ForecastQuery = {}): Promise<ForecastRun[]> {
  const response = await api.get<ForecastRun[]>('/forecast/runs', query as Record<string, string | number | undefined>);
  return response.data;
}

export interface CreateRunData {
  branch_id?: string;
  method?: string;
  period_start: string;
  period_end: string;
}

export async function createRun(data: CreateRunData): Promise<ForecastRun> {
  const response = await api.post<ForecastRun>('/forecast/runs', data);
  return response.data;
}

export interface SeriesQuery {
  sparepart_id?: string;
  branch_id?: string;
  forecast_run_id?: string;
  limit?: number;
}

export async function getSeries(query: SeriesQuery = {}): Promise<ForecastSeries[]> {
  const response = await api.get<ForecastSeries[]>('/forecast/series', query as Record<string, string | number | undefined>);
  return response.data;
}
