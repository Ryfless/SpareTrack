-- Migration: Pindahkan kolom dinamis dari spareparts ke branch_stocks
-- Nilai safety_stock, reorder_point, eoq, max_stock, min_stock
-- bersifat per-cabang dan diisi oleh ML forecasting (rata-rata 3 bulan prediksi)

ALTER TABLE public.spareparts
DROP COLUMN IF EXISTS min_stock,
DROP COLUMN IF EXISTS safety_stock,
DROP COLUMN IF EXISTS reorder_point,
DROP COLUMN IF EXISTS max_stock;

ALTER TABLE public.branch_stocks
ADD COLUMN IF NOT EXISTS safety_stock   INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_point  INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS eoq            INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock      INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock      INT DEFAULT 0;
