-- Fix overstock CHECK constraint to include 'overstock'
ALTER TABLE public.restock_recommendations
DROP CONSTRAINT IF EXISTS restock_recommendations_urgency_check;

ALTER TABLE public.restock_recommendations
ADD CONSTRAINT restock_recommendations_urgency_check
CHECK (urgency IN ('low', 'medium', 'high', 'critical', 'overstock'));
