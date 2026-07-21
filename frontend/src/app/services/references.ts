import { api } from './client';

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/categories');
  return response.data;
}

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await api.get<Supplier[]>('/suppliers');
  return response.data;
}
