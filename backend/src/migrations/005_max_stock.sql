-- Add max_stock column for configurable overstock threshold
ALTER TABLE public.spareparts
ADD COLUMN IF NOT EXISTS max_stock INT DEFAULT NULL;
