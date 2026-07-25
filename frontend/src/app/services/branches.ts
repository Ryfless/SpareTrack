import { api } from './client';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface BranchStockItem {
  id: string;
  code: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  quantity: number;
  reorder_point: number;
  safety_stock: number;
  status: string;
}

export interface BranchStocksResponse {
  branch: Branch;
  stocks: BranchStockItem[];
}

export async function list(): Promise<Branch[]> {
  const response = await api.get<Branch[]>('/branches');
  return response.data;
}

export async function getStocks(branchId: string, query?: { search?: string; category_id?: string; status?: string }): Promise<BranchStocksResponse> {
  const response = await api.get<BranchStocksResponse>(`/branches/${branchId}/stocks`, query as Record<string, string | number | undefined>);
  return response.data;
}
