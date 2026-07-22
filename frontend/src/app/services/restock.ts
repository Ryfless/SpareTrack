import { api, type ApiResponse } from './client';

export interface RestockRecommendation {
  id: string;
  sparepart_id: string;
  code: string;
  name: string;
  price: number;
  unit: string;
  min_stock: number;
  lead_time: number;
  branch_id: string;
  branch_name: string;
  supplier: string;
  current_stock: number;
  reorder_point: number;
  recommended_qty: number;
  urgency: string;
  status: string;
  notes: string;
  days_to_stockout: number;
  created_at: string;
}

export interface RestockQuery {
  branch_id?: string;
  status?: string;
  urgency?: string;
  limit?: number;
}

export async function getRecommendations(query: RestockQuery = {}): Promise<RestockRecommendation[]> {
  const response = await api.get<RestockRecommendation[]>('/restock/recommendations', query as Record<string, string | number | undefined>);
  return response.data;
}

export async function approveRecommendation(id: string): Promise<RestockRecommendation> {
  const response = await api.post<RestockRecommendation>(`/restock/recommendations/${id}/approve`);
  return response.data;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier: string;
  branch: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  approved_at: string | null;
  received_at: string | null;
}

export interface POItem {
  id: string;
  sparepart_id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_qty: number | null;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  items: POItem[];
  requested_by: string;
}

export interface POQuery {
  page?: number;
  limit?: number;
  status?: string;
  branch_id?: string;
}

export async function getPurchaseOrders(query: POQuery = {}): Promise<ApiResponse<PurchaseOrder[]>> {
  return api.get<PurchaseOrder[]>('/restock/purchase-orders', query as Record<string, string | number | undefined>);
}

export interface CreatePOData {
  supplier_id: string;
  branch_id: string;
  notes?: string;
  items?: Array<{
    sparepart_id: string;
    quantity: number;
    unit_price: number;
  }>;
  recommendation_id?: string;
}

export async function createPurchaseOrder(data: CreatePOData): Promise<PurchaseOrder> {
  const response = await api.post<PurchaseOrder>('/restock/purchase-orders', data);
  return response.data;
}

export async function generateRecommendations(): Promise<RestockRecommendation[]> {
  const response = await api.post<RestockRecommendation[]>('/restock/recommendations/generate');
  return response.data;
}

export async function getPurchaseOrderDetail(id: string): Promise<PurchaseOrderDetail> {
  const response = await api.get<PurchaseOrderDetail>(`/restock/purchase-orders/${id}`);
  return response.data;
}

export async function approvePurchaseOrder(id: string): Promise<{ status: string; items_processed: number }> {
  const response = await api.post<{ status: string; items_processed: number }>(`/restock/purchase-orders/${id}/approve`);
  return response.data;
}
