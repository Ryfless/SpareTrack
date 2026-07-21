-- SpareTrack Indexes for Performance

-- Spareparts
CREATE INDEX IF NOT EXISTS idx_spareparts_category ON public.spareparts(category_id);
CREATE INDEX IF NOT EXISTS idx_spareparts_supplier ON public.spareparts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_spareparts_code ON public.spareparts(code);
CREATE INDEX IF NOT EXISTS idx_spareparts_name ON public.spareparts(name);

-- Branch Stocks
CREATE INDEX IF NOT EXISTS idx_branch_stocks_sparepart ON public.branch_stocks(sparepart_id);
CREATE INDEX IF NOT EXISTS idx_branch_stocks_branch ON public.branch_stocks(branch_id);

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch ON public.stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_sparepart ON public.stock_movements(sparepart_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(type);

-- Restock Recommendations
CREATE INDEX IF NOT EXISTS idx_restock_rec_sparepart ON public.restock_recommendations(sparepart_id);
CREATE INDEX IF NOT EXISTS idx_restock_rec_branch ON public.restock_recommendations(branch_id);
CREATE INDEX IF NOT EXISTS idx_restock_rec_status ON public.restock_recommendations(status);

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_branch ON public.purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_created ON public.purchase_orders(created_at DESC);

-- Purchase Order Items
CREATE INDEX IF NOT EXISTS idx_po_items_po ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_sparepart ON public.purchase_order_items(sparepart_id);

-- Forecast
CREATE INDEX IF NOT EXISTS idx_forecast_runs_branch ON public.forecast_runs(branch_id);
CREATE INDEX IF NOT EXISTS idx_forecast_series_run ON public.forecast_series(forecast_run_id);
CREATE INDEX IF NOT EXISTS idx_forecast_series_sparepart ON public.forecast_series(sparepart_id);
CREATE INDEX IF NOT EXISTS idx_forecast_series_branch ON public.forecast_series(branch_id);
CREATE INDEX IF NOT EXISTS idx_forecast_series_month ON public.forecast_series(month);

-- Activities & Audit
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- API Tokens
CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON public.api_tokens(user_id);

-- Settings
CREATE INDEX IF NOT EXISTS idx_settings_branch ON public.settings(branch_id);
