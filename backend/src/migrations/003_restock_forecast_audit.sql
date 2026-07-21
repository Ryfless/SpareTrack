-- SpareTrack Additional Tables Migration

-- 8. RESTOCK RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.restock_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sparepart_id UUID REFERENCES public.spareparts(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  current_stock INT NOT NULL DEFAULT 0,
  reorder_point INT NOT NULL DEFAULT 20,
  recommended_qty INT NOT NULL DEFAULT 0,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ordered')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sparepart_id, branch_id)
);

ALTER TABLE public.restock_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restock recommendations are readable by authenticated users" ON public.restock_recommendations;
CREATE POLICY "Restock recommendations are readable by authenticated users"
  ON public.restock_recommendations FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Restock recommendations are insertable by authenticated users" ON public.restock_recommendations;
CREATE POLICY "Restock recommendations are insertable by authenticated users"
  ON public.restock_recommendations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Restock recommendations are updatable by authenticated users" ON public.restock_recommendations;
CREATE POLICY "Restock recommendations are updatable by authenticated users"
  ON public.restock_recommendations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 9. PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id),
  branch_id UUID REFERENCES public.branches(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'received', 'cancelled')),
  total_amount NUMERIC(14,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  requested_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Purchase orders are readable by authenticated users" ON public.purchase_orders;
CREATE POLICY "Purchase orders are readable by authenticated users"
  ON public.purchase_orders FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Purchase orders are insertable by authenticated users" ON public.purchase_orders;
CREATE POLICY "Purchase orders are insertable by authenticated users"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Purchase orders are updatable by authenticated users" ON public.purchase_orders;
CREATE POLICY "Purchase orders are updatable by authenticated users"
  ON public.purchase_orders FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 9a. PURCHASE ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  sparepart_id UUID REFERENCES public.spareparts(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_price NUMERIC(14,2) DEFAULT 0,
  received_qty INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PO items are readable by authenticated users" ON public.purchase_order_items;
CREATE POLICY "PO items are readable by authenticated users"
  ON public.purchase_order_items FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "PO items are insertable by authenticated users" ON public.purchase_order_items;
CREATE POLICY "PO items are insertable by authenticated users"
  ON public.purchase_order_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "PO items are updatable by authenticated users" ON public.purchase_order_items;
CREATE POLICY "PO items are updatable by authenticated users"
  ON public.purchase_order_items FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 10. FORECAST RUNS
CREATE TABLE IF NOT EXISTS public.forecast_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id),
  method TEXT DEFAULT 'moving_average' CHECK (method IN ('moving_average', 'exponential_smoothing', 'linear_regression')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  generated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.forecast_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forecast runs are readable by authenticated users" ON public.forecast_runs;
CREATE POLICY "Forecast runs are readable by authenticated users"
  ON public.forecast_runs FOR SELECT
  USING (auth.role() = 'authenticated');

-- 11. FORECAST SERIES
CREATE TABLE IF NOT EXISTS public.forecast_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_run_id UUID REFERENCES public.forecast_runs(id) ON DELETE CASCADE,
  sparepart_id UUID REFERENCES public.spareparts(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id),
  month DATE NOT NULL,
  predicted_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  confidence_lower NUMERIC(12,2) DEFAULT 0,
  confidence_upper NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.forecast_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forecast series are readable by authenticated users" ON public.forecast_series;
CREATE POLICY "Forecast series are readable by authenticated users"
  ON public.forecast_series FOR SELECT
  USING (auth.role() = 'authenticated');

-- 12. ACTIVITIES
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  branch_id UUID REFERENCES public.branches(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activities are readable by authenticated users" ON public.activities;
CREATE POLICY "Activities are readable by authenticated users"
  ON public.activities FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Activities are insertable by authenticated users" ON public.activities;
CREATE POLICY "Activities are insertable by authenticated users"
  ON public.activities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB DEFAULT '{}',
  new_data JSONB DEFAULT '{}',
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs are readable by authenticated users" ON public.audit_logs;
CREATE POLICY "Audit logs are readable by authenticated users"
  ON public.audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 15. API TOKENS
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own API tokens" ON public.api_tokens;
CREATE POLICY "Users can manage own API tokens"
  ON public.api_tokens FOR ALL
  USING (auth.uid() = user_id);

-- 16. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, key)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are readable by authenticated users" ON public.settings;
CREATE POLICY "Settings are readable by authenticated users"
  ON public.settings FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Settings are updatable by authenticated users" ON public.settings;
CREATE POLICY "Settings are updatable by authenticated users"
  ON public.settings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ========================================
-- STOCK CONSISTENCY TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION public.update_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    INSERT INTO public.branch_stocks (sparepart_id, branch_id, quantity)
    VALUES (NEW.sparepart_id, NEW.branch_id, NEW.quantity)
    ON CONFLICT (sparepart_id, branch_id)
    DO UPDATE SET quantity = branch_stocks.quantity + NEW.quantity, updated_at = NOW();

  ELSIF NEW.type = 'out' THEN
    INSERT INTO public.branch_stocks (sparepart_id, branch_id, quantity)
    VALUES (NEW.sparepart_id, NEW.branch_id, 0)
    ON CONFLICT (sparepart_id, branch_id)
    DO UPDATE SET quantity = GREATEST(branch_stocks.quantity - NEW.quantity, 0), updated_at = NOW();

  ELSIF NEW.type = 'transfer' THEN
    INSERT INTO public.branch_stocks (sparepart_id, branch_id, quantity)
    VALUES (NEW.sparepart_id, NEW.branch_id, 0)
    ON CONFLICT (sparepart_id, branch_id)
    DO UPDATE SET quantity = GREATEST(branch_stocks.quantity - NEW.quantity, 0), updated_at = NOW();

  ELSIF NEW.type = 'adjustment' THEN
    INSERT INTO public.branch_stocks (sparepart_id, branch_id, quantity)
    VALUES (NEW.sparepart_id, NEW.branch_id, NEW.quantity)
    ON CONFLICT (sparepart_id, branch_id)
    DO UPDATE SET quantity = NEW.quantity, updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_stock_on_movement ON public.stock_movements;
CREATE TRIGGER trg_update_stock_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_movement();

-- ========================================
-- SEED DATA: SPAREPARTS
-- ========================================

INSERT INTO public.spareparts (code, name, category_id, supplier_id, price, min_stock, reorder_point, safety_stock, lead_time, unit)
SELECT * FROM (VALUES
  ('OIL-10W40', 'Oli Mesin 10W-40 1L', (SELECT id FROM public.categories WHERE name = 'Pelumas'), (SELECT id FROM public.suppliers WHERE name = 'Pertamina'), 45000, 15, 30, 10, 3, 'pcs'),
  ('OIL-20W50', 'Oli Mesin 20W-50 1L', (SELECT id FROM public.categories WHERE name = 'Pelumas'), (SELECT id FROM public.suppliers WHERE name = 'Pertamina'), 42000, 15, 30, 10, 3, 'pcs'),
  ('OIL-GEAR', 'Oli Gardan 1L', (SELECT id FROM public.categories WHERE name = 'Pelumas'), (SELECT id FROM public.suppliers WHERE name = 'Pertamina'), 55000, 10, 20, 5, 3, 'pcs'),
  ('OIL-MATIC', 'Oli Transmisi Matik 1L', (SELECT id FROM public.categories WHERE name = 'Pelumas'), (SELECT id FROM public.suppliers WHERE name = 'Sakura'), 65000, 10, 20, 5, 5, 'pcs'),
  ('FLT-OIL', 'Filter Oli', (SELECT id FROM public.categories WHERE name = 'Filter'), (SELECT id FROM public.suppliers WHERE name = 'Sakura'), 35000, 20, 40, 10, 5, 'pcs'),
  ('FLT-AIR', 'Filter Udara', (SELECT id FROM public.categories WHERE name = 'Filter'), (SELECT id FROM public.suppliers WHERE name = 'Sakura'), 40000, 15, 30, 8, 5, 'pcs'),
  ('FLT-FUEL', 'Filter Bensin', (SELECT id FROM public.categories WHERE name = 'Filter'), (SELECT id FROM public.suppliers WHERE name = 'Sakura'), 30000, 10, 20, 5, 5, 'pcs'),
  ('FLT-CABIN', 'Filter Kabin', (SELECT id FROM public.categories WHERE name = 'Filter'), (SELECT id FROM public.suppliers WHERE name = 'Sakura'), 50000, 10, 20, 5, 5, 'pcs'),
  ('BRK-FRONT', 'Kampas Rem Depan', (SELECT id FROM public.categories WHERE name = 'Rem'), (SELECT id FROM public.suppliers WHERE name = 'Bendix'), 85000, 10, 20, 5, 7, 'set'),
  ('BRK-REAR', 'Kampas Rem Belakang', (SELECT id FROM public.categories WHERE name = 'Rem'), (SELECT id FROM public.suppliers WHERE name = 'Bendix'), 80000, 10, 20, 5, 7, 'set'),
  ('BRK-FLUID', 'Minyak Rem DOT4', (SELECT id FROM public.categories WHERE name = 'Rem'), (SELECT id FROM public.suppliers WHERE name = 'Bendix'), 30000, 10, 20, 5, 7, 'pcs'),
  ('BAT-MF', 'Aki MF 12V 40Ah', (SELECT id FROM public.categories WHERE name = 'Kelistrikan'), (SELECT id FROM public.suppliers WHERE name = 'GS Astra'), 450000, 5, 10, 3, 4, 'pcs'),
  ('BAT-MF60', 'Aki MF 12V 60Ah', (SELECT id FROM public.categories WHERE name = 'Kelistrikan'), (SELECT id FROM public.suppliers WHERE name = 'GS Astra'), 550000, 5, 10, 3, 4, 'pcs'),
  ('LMP-H7', 'Bohlam H7 12V 55W', (SELECT id FROM public.categories WHERE name = 'Kelistrikan'), (SELECT id FROM public.suppliers WHERE name = 'GS Astra'), 25000, 15, 30, 10, 4, 'pcs'),
  ('LMP-LED', 'Bohlam LED H4', (SELECT id FROM public.categories WHERE name = 'Kelistrikan'), (SELECT id FROM public.suppliers WHERE name = 'GS Astra'), 75000, 10, 20, 5, 4, 'pcs'),
  ('SPK-NGK', 'Busi NGK Standard', (SELECT id FROM public.categories WHERE name = 'Pengapian'), (SELECT id FROM public.suppliers WHERE name = 'NGK'), 20000, 20, 40, 15, 3, 'pcs'),
  ('SPK-IRID', 'Busi Iridium NGK', (SELECT id FROM public.categories WHERE name = 'Pengapian'), (SELECT id FROM public.suppliers WHERE name = 'NGK'), 60000, 10, 20, 5, 3, 'pcs'),
  ('SPK-CABLE', 'Kabel Busi Set', (SELECT id FROM public.categories WHERE name = 'Pengapian'), (SELECT id FROM public.suppliers WHERE name = 'NGK'), 90000, 5, 10, 3, 3, 'set'),
  ('SHP-KYB', 'Shockbreaker Depan KYB', (SELECT id FROM public.categories WHERE name = 'Suspensi'), (SELECT id FROM public.suppliers WHERE name = 'KYB'), 350000, 3, 8, 2, 10, 'pcs'),
  ('SHP-KYB-R', 'Shockbreaker Belakang KYB', (SELECT id FROM public.categories WHERE name = 'Suspensi'), (SELECT id FROM public.suppliers WHERE name = 'KYB'), 320000, 3, 8, 2, 10, 'pcs'),
  ('CLT-KIT', 'Set Kopling + Plat', (SELECT id FROM public.categories WHERE name = 'Kopling'), (SELECT id FROM public.suppliers WHERE name = 'Exedy'), 450000, 3, 5, 2, 8, 'set'),
  ('CLT-CABLE', 'Kabel Kopling', (SELECT id FROM public.categories WHERE name = 'Kopling'), (SELECT id FROM public.suppliers WHERE name = 'Exedy'), 35000, 5, 10, 3, 8, 'pcs'),
  ('RAD-OEM', 'Radiator Original', (SELECT id FROM public.categories WHERE name = 'Pendingin'), (SELECT id FROM public.suppliers WHERE name = 'Toyota Genuine'), 750000, 2, 5, 2, 3, 'pcs'),
  ('HOSE-UP', 'Selang Radiator Atas', (SELECT id FROM public.categories WHERE name = 'Pendingin'), (SELECT id FROM public.suppliers WHERE name = 'Gates'), 45000, 5, 10, 3, 6, 'pcs'),
  ('COOLANT', 'Coolant 1L', (SELECT id FROM public.categories WHERE name = 'Pendingin'), (SELECT id FROM public.suppliers WHERE name = 'Pertamina'), 25000, 10, 20, 5, 3, 'pcs'),
  ('TBE-OUTER', 'Ban Luar 185/65 R14', (SELECT id FROM public.categories WHERE name = 'Mesin'), (SELECT id FROM public.suppliers WHERE name = 'Dayco'), 450000, 5, 10, 3, 12, 'pcs'),
  ('TBE-INNER', 'Ban Dalam 185/65 R14', (SELECT id FROM public.categories WHERE name = 'Mesin'), (SELECT id FROM public.suppliers WHERE name = 'Dayco'), 75000, 5, 10, 3, 12, 'pcs'),
  ('V-BELT', 'V-Belt Fan', (SELECT id FROM public.categories WHERE name = 'Mesin'), (SELECT id FROM public.suppliers WHERE name = 'Gates'), 35000, 10, 20, 5, 6, 'pcs'),
  ('TIMING-BELT', 'Timing Belt Kit', (SELECT id FROM public.categories WHERE name = 'Mesin'), (SELECT id FROM public.suppliers WHERE name = 'Gates'), 250000, 3, 5, 2, 6, 'set'),
  ('WL-MOUNT', 'Engine Mounting', (SELECT id FROM public.categories WHERE name = 'Mesin'), (SELECT id FROM public.suppliers WHERE name = 'Toyota Genuine'), 180000, 3, 5, 2, 3, 'pcs')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM public.spareparts LIMIT 1);
