-- SpareTrack Core Tables Migration
-- Run this in Supabase SQL Editor or via psql

-- 1. PROFILES (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'branch_admin' CHECK (role IN ('super_admin', 'branch_admin')),
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, branch, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'branch_admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. BRANCHES
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branches are readable by authenticated users"
  ON public.branches FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are readable by authenticated users"
  ON public.categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  lead_time_days INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers are readable by authenticated users"
  ON public.suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5. SPAREPARTS
CREATE TABLE IF NOT EXISTS public.spareparts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  price NUMERIC(12,2) DEFAULT 0,
  min_stock INT DEFAULT 10,
  reorder_point INT DEFAULT 20,
  safety_stock INT DEFAULT 5,
  lead_time INT DEFAULT 3,
  unit TEXT DEFAULT 'pcs',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.spareparts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spareparts are readable by authenticated users"
  ON public.spareparts FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. BRANCH_STOCKS
CREATE TABLE IF NOT EXISTS public.branch_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sparepart_id UUID REFERENCES public.spareparts(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sparepart_id, branch_id)
);

ALTER TABLE public.branch_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branch stocks are readable by authenticated users"
  ON public.branch_stocks FOR SELECT
  USING (auth.role() = 'authenticated');

-- 7. STOCK_MOVEMENTS
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sparepart_id UUID REFERENCES public.spareparts(id),
  branch_id UUID REFERENCES public.branches(id),
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'transfer', 'adjustment')),
  quantity INT NOT NULL,
  reference_id TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock movements are readable by authenticated users"
  ON public.stock_movements FOR SELECT
  USING (auth.role() = 'authenticated');

-- Grant permissions for service_role and authenticated roles
GRANT USAGE ON SCHEMA public TO service_role, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Seed data: Branches
INSERT INTO public.branches (name, code, city) VALUES
  ('Cabang A - Jakpus', 'CAB-A', 'Jakarta Pusat'),
  ('Cabang B - Bekasi', 'CAB-B', 'Bekasi'),
  ('Cabang C - Tangerang', 'CAB-C', 'Tangerang')
ON CONFLICT (name) DO NOTHING;

-- Seed data: Categories
INSERT INTO public.categories (name) VALUES
  ('Pelumas'), ('Filter'), ('Rem'), ('Kelistrikan'), ('Transmisi'),
  ('Pengapian'), ('Suspensi'), ('Kopling'), ('Pendingin'), ('Mesin')
ON CONFLICT (name) DO NOTHING;

-- Seed data: Suppliers
INSERT INTO public.suppliers (name, lead_time_days) VALUES
  ('Pertamina', 3), ('Sakura', 5), ('Bendix', 7), ('GS Astra', 4),
  ('Gates', 6), ('NGK', 3), ('KYB', 10), ('Exedy', 8), ('SKF', 9),
  ('Toyota Genuine', 3), ('Dayco', 12)
ON CONFLICT (name) DO NOTHING;
