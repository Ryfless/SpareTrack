-- Ubah kolom branch_stocks dari NUMERIC ke INT
ALTER TABLE public.branch_stocks
ALTER COLUMN safety_stock   TYPE INT USING safety_stock::int,
ALTER COLUMN reorder_point  TYPE INT USING reorder_point::int,
ALTER COLUMN eoq            TYPE INT USING eoq::int,
ALTER COLUMN max_stock      TYPE INT USING max_stock::int,
ALTER COLUMN min_stock      TYPE INT USING min_stock::int;
