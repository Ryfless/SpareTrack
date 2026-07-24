-- ========================================
-- Migration 008: Add destination_branch_id to stock_movements
-- ========================================

ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS destination_branch_id UUID REFERENCES public.branches(id);

-- Update stock consistency trigger to handle destination branch for transfers
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

    INSERT INTO public.branch_stocks (sparepart_id, branch_id, quantity)
    VALUES (NEW.sparepart_id, NEW.destination_branch_id, NEW.quantity)
    ON CONFLICT (sparepart_id, branch_id)
    DO UPDATE SET quantity = branch_stocks.quantity + NEW.quantity, updated_at = NOW();

  ELSIF NEW.type = 'adjustment' THEN
    INSERT INTO public.branch_stocks (sparepart_id, branch_id, quantity)
    VALUES (NEW.sparepart_id, NEW.branch_id, NEW.quantity)
    ON CONFLICT (sparepart_id, branch_id)
    DO UPDATE SET quantity = NEW.quantity, updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
