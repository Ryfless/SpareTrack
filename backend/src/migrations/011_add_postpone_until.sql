ALTER TABLE public.restock_recommendations
ADD COLUMN IF NOT EXISTS postpone_until DATE DEFAULT NULL;
