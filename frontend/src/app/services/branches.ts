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

export interface TopSellingItem {
  sparepart_id: string;
  sparepart_name: string;
  sparepart_code: string;
  total: number;
}

export interface BranchStocksResponse {
  branch: Branch;
  stocks: BranchStockItem[];
  total_value: number;
  monthly_sales: number;
  top_selling: TopSellingItem[];
}

export async function list(): Promise<Branch[]> {
  const response = await api.get<Branch[]>('/branches');
  return response.data;
}

export async function getStocks(branchId: string, query?: { search?: string; category_id?: string; status?: string }): Promise<BranchStocksResponse> {
  const response = await api.get<BranchStocksResponse>(`/branches/${branchId}/stocks`, query as Record<string, string | number | undefined>);
  return response.data;
}

export interface SalesTrendBranch {
  rank: number;
  branch_id: string;
  branch_name: string;
  total: number;
}

export interface SalesTrendItem {
  month_key: string;
  month_label: string;
  top_branches: SalesTrendBranch[];
}

export async function getSalesTrend(): Promise<SalesTrendItem[]> {
  const response = await api.get<SalesTrendItem[]>('/branches/sales-trend');
  return response.data;
}
