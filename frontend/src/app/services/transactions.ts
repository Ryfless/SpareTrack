import { api, type ApiResponse } from './client';

export interface Transaction {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  notes: string;
  reference_id: string;
  sparepart_id: string;
  sparepart_code: string;
  sparepart_name: string;
  branch_id: string;
  branch_name: string;
  created_by: string;
  created_at: string;
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: string;
  branch_id?: string;
  sparepart_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  order?: string;
}

export async function list(query: TransactionQuery = {}): Promise<ApiResponse<Transaction[]>> {
  return api.get<Transaction[]>('/transactions', query as Record<string, string | number | undefined>);
}

export interface CreateTransactionData {
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  sparepart_id: string;
  branch_id: string;
  quantity: number;
  notes?: string;
  reference_id?: string;
  destination_branch_id?: string;
}

export async function create(data: CreateTransactionData): Promise<Transaction> {
  const response = await api.post<Transaction>('/transactions', data);
  return response.data;
}
