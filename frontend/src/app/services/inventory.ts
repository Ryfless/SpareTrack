import { api, type ApiResponse } from './client';
import { supabase } from './supabase';

export interface SparepartListItem {
  id: string;
  code: string;
  name: string;
  category: string;
  supplier: string;
  price: number;
  lead_time: number;
  unit: string;
  is_active: boolean;
  total_stock: number;
  stock_by_branch: Array<{
    branch_id: string;
    branch_name: string;
    quantity: number;
  }>;
  status: string;
  created_at: string;
}

export interface SparepartDetail {
  id: string;
  code: string;
  name: string;
  category: string;
  supplier: string;
  category_id?: string;
  supplier_id?: string;
  price: number;
  lead_time: number;
  unit: string;
  is_active: boolean;
  total_stock: number;
  stock_by_branch: Array<{
    branch_id: string;
    branch_name: string;
    quantity: number;
    safety_stock: number;
    reorder_point: number;
    max_stock: number;
    min_stock: number;
  }>;
  status: string;
  recent_movements: Array<{
    id: string;
    type: string;
    quantity: number;
    notes: string;
    created_by: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface InventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  supplier_id?: string;
  branch_id?: string;
  status?: string;
  is_active?: boolean;
  sort_by?: string;
  order?: string;
}

export async function list(query: InventoryQuery = {}): Promise<ApiResponse<SparepartListItem[]>> {
  return api.get<SparepartListItem[]>('/inventory', query as Record<string, string | number | undefined>);
}

export async function getById(id: string): Promise<SparepartDetail> {
  const response = await api.get<SparepartDetail>(`/inventory/${id}`);
  return response.data;
}

export interface CreateSparepartData {
  code: string;
  name: string;
  category_id?: string;
  supplier_id?: string;
  price?: number;
  reorder_point?: number;
  safety_stock?: number;
  lead_time?: number;
  unit?: string;
}

export async function create(data: CreateSparepartData): Promise<SparepartDetail> {
  const response = await api.post<SparepartDetail>('/inventory', data);
  return response.data;
}

export async function update(id: string, data: Partial<CreateSparepartData>): Promise<SparepartDetail> {
  const response = await api.patch<SparepartDetail>(`/inventory/${id}`, data);
  return response.data;
}

export async function exportCsv(query: InventoryQuery = {}): Promise<Blob> {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();

  const API_URL = import.meta.env.VITE_API_URL;
  const url = `${API_URL}/inventory/export/csv${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) throw new Error('Gagal export CSV');
  return response.blob();
}

export interface BulkTransferItem {
  sparepart_id: string;
  quantity: number;
}

export interface BulkTransferData {
  items: BulkTransferItem[];
  source_branch_id: string;
  destination_branch_id: string;
  notes?: string;
}

export async function bulkTransfer(data: BulkTransferData): Promise<{ items_transferred: number; items: Array<{ code: string; name: string; quantity: number }> }> {
  const response = await api.post<{ items_transferred: number; items: Array<{ code: string; name: string; quantity: number }> }>('/inventory/bulk/transfer', data);
  return response.data;
}
