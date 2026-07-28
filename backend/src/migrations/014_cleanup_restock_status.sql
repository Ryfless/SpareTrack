ALTER TABLE public.restock_recommendations
DROP CONSTRAINT IF EXISTS restock_recommendations_status_check;

ALTER TABLE public.restock_recommendations
ADD CONSTRAINT restock_recommendations_status_check
CHECK (status IN ('pending', 'ordered', 'postponed'));

UPDATE public.restock_recommendations
SET status = 'pending', updated_at = NOW()
WHERE status IN ('approved', 'rejected');
