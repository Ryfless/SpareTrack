import { supabase } from './supabase';
import { api } from './client';

export interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  branch: string;
  role: 'super_admin' | 'branch_admin';
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  branch?: string;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  try {
    await api.post('/auth/login-history/login', { user_agent: navigator.userAgent });
  } catch (e) {
    console.error('[LoginHistory] Gagal mencatat login:', e);
  }

  return data;
}

export async function register(data: RegisterData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        phone: data.phone || '',
        branch: data.branch || '',
        role: 'branch_admin'
      }
    }
  });
  if (error) throw error;
  return authData;
}

export async function requestOtp(email: string) {
  await api.post('/auth/otp/request', { email });
}

export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  }
}

export async function logout() {
  try {
    await api.post('/auth/login-history/logout');
  } catch (e) {
    console.error('[LoginHistory] Gagal mencatat logout:', e);
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getMe() {
  const response = await api.get<{ user: Record<string, unknown>; profile: ProfileData }>('/me');
  return response.data;
}

