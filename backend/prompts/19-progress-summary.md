# SpareTrack — Progress Summary

**Multi-Branch Spare Parts Management System**  
React + TypeScript (Frontend) · Express 5 + Supabase (Backend) · Flask + XGBoost (ML)

---

## 1. Ringkasan Project

SpareTrack adalah sistem manajemen sparepart multi-cabang dengan fitur:

- Manajemen inventory & stok per cabang
- Transaksi stok masuk/keluar/transfer/adjustment
- Rekomendasi restock otomatis + Purchase Order
- Forecasting XGBoost dengan dynamic thresholds + hyperparameter tuning
- Dashboard, laporan, dan pengaturan sistem
- Otentikasi via Google OAuth + Supabase Auth
- Audit log untuk tracking aktivitas
- Dark mode dengan persistensi database

---

## 2. Progress per Prompt

| Prompt | Fokus | Status |
|--------|-------|--------|
| **01 – Overview & Architecture** | Struktur project, tech stack, konvensi | ✅ Selesai |
| **02 – Auth Supabase** | Google OAuth, session management, RLS | ✅ Selesai |
| **03 – Database & Migration** | Migration files, tabel, trigger, seed | ✅ Selesai |
| **04 – REST API Spec** | Module routes, controllers, services | ✅ Selesai |
| **05 – Frontend Integration** | Service layer, pages API-connected | ✅ Selesai |
| **06 – Module Inventory** | Filter, transfer fix, pagination, stock adjustment, DetailDrawer | ✅ Selesai |
| **07 – Module Restock & Forecast** | Generate rekomendasi, SMA forecast, PO, overstock schema | ✅ Selesai |
| **08 – Progress Summary** | Ringkasan pertama | ✅ Selesai |
| **09 – Audit Log** | Backend audit log service + frontend viewer di Settings | ✅ Selesai |
| **10 – Receive PO** | Receive endpoint + stock update + ConfirmReceiveModal | ✅ Selesai |
| **11 – Cancel PO** | Cancel endpoint + revert recommendation status + ConfirmCancelModal | ✅ Selesai |
| **12 – IP Handling** | `getClientIp()` utility + audit log IP recording | ✅ Selesai |
| **13 – Transaction Audit** | Insert audit_logs on transaction create | ✅ Selesai |
| **14 – PO Receipt** | ReceiptView component + Struk button di semua status PO | ✅ Selesai |
| **15 – Inventory Fixes** | Unmount fix, stock modal prefill, pagination+status filter, status counts | ✅ Selesai |
| **16 – Dark Mode Persistence** | Migration 007, profile CRUD via supabaseAdmin, localStorage init | ✅ Selesai |
| **17 – Branch Filter** | BranchSelect per-page, filter Transactions/Restock/Reports | ✅ Selesai |
| **18 – Loading Skeleton** | Standarisasi skeleton di Transactions, Restock, Dashboard, Branches | ✅ Selesai |
| **19 – XGBoost Full Integration** | Forecast ML pipeline, dynamic thresholds, auto-predict, live restock dari forecast | ✅ Selesai |

---

## 3. Detail Capaian per Modul

### 3.1. ML Pipeline — XGBoost (Python Flask)

| Komponen | Detail |
|----------|--------|
| **Training** | `/api/train` — fetch data, feature engineering (lag 1-12, rolling mean 3/6/12), train XGBoost with tunable params |
| **Hyperparameter Tuning** | 8 params slider UI (learning_rate, max_depth, n_estimators, subsample, colsample_bytree, min_child_weight, gamma, reg_lambda), persisted in localStorage, sent as JSON with train request |
| **Prediction** | `/api/predict` — 3 months forward, confidence interval (predicted ± 1.96×RMSE), safety_stock (z×RMSE×√(LT/30)), ROP (demand_LT + safety), EOQ, max_stock |
| **Dynamic Thresholds** | `_save_dynamic_params()` — average 3-month predictions → `UPDATE branch_stocks` per (sparepart, branch) as INT |
| **Auto-Predict Scheduler** | APScheduler every 1 hour, checks `stock_movements.created_at` for new data, triggers predict if found, state in `models/last_predict.json` |
| **Training Log & Stats** | `/api/train-log` — paginated history; `/api/model-stats` — best_iteration, best_score, num_features, num_trees; feature importance bar chart |
| **Metrics** | `/api/metrics` — MAE, MSE, RMSE, MAPE, residuals_std; `/api/feature-importance` — gain × weight |
| **Dashboard Output** | `/api/output` — reads thresholds from `branch_stocks` (via `bs_map`), status logic (Kritis/Menipis/Aman/Overstock), month filter, sorted A-Z by name then branch |

**Key fixes**:
- Training data filtered to `type = 'out'` only; NaN lags filled with 0 instead of dropped
- `round()` used for all ML values (no decimals in DB)
- `residual_std()` added to metrics
- Status logic: Kritis (stock ≤ ROP), Menipis (ROP < stock ≤ ROP+safety), Overstock (stock ≥ max_stock), Aman otherwise

### 3.2. Database & Migration

| File | Isi |
|------|-----|
| `001_core_tables.sql` | Tabel: profiles, branches, categories, suppliers, spareparts, branch_stocks, stock_movements + seed data branch/category/supplier |
| `003_restock_forecast_audit.sql` | Tabel: restock_recommendations, purchase_orders, purchase_order_items, forecast_runs, forecast_series, activities, audit_logs, notifications, api_tokens, settings + seed |
| `004_indexes.sql` | 30+ performance indexes |
| `005_max_stock.sql` | Kolom `max_stock` di spareparts |
| `006_fix_overstock.sql` | Fix CHECK constraint tambah `overstock` |
| `007_theme_preference.sql` | Kolom `theme_preference TEXT` di profiles |
| `011_add_postpone_until.sql` | Kolom `postpone_until DATE` di restock_recommendations |
| `012_branch_stocks_int.sql` | Migrasi `branch_stocks` columns (safety_stock, reorder_point, eoq, max_stock, min_stock) dari NUMERIC ke INT |

### 3.3. Backend REST API Changes

**restockService.js** — `getLiveRecommendations()` rewritten:
- Data source: `forecast_series` (latest run, 3-month `predicted_quantity`), not `branch_stocks`
- Average predicted_quantity per (sparepart, branch) → `reorder_point`
- Urgency: critical (stock ≤ avg), high (stock ≤ avg×2)
- `recommended_qty`: critical = `avg×2 - stock` (target 2 bulan), high = `avg - stock` (target 1 bulan)
- Setiap refresh: pending records di-delete dulu (clean slate), lalu re-insert dari forecast
- Response dibangun langsung dari computed values + sparepart/branch info + DB id (untuk postpone/PO)
- Fix `NUMERIC` → string type: `Number(f.predicted_quantity)` mencegah string concatenation

**inventoryService.js** — `detail()`: `stock_by_branch` now includes `safety_stock`, `reorder_point`, `max_stock`, `min_stock` per branch

**dashboardService.js** / **branchesService.js**: All threshold reads from `branch_stocks`

**Transactions**: Explicit `sort_by=created_at&order=desc`

### 3.4. Frontend Changes

| Halaman | Perubahan |
|---------|-----------|
| **InventoryPage** | Branch filter pindah dari pill buttons ke filter dropdown panel; `filterBranch` state di-lift ke App.tsx |
| **DetailDrawer** | Menerima `filterBranch` prop; tampilkan threshold grid (Stok/Safety Stok/Reorder Point/Max Stok) 2×2 saat branch filter aktif |
| **RestockPage** | Hapus "Generate" button; hapus `LiveCard` component (diganti `RecommendCard`); live data dari `getLiveRecommendations()` → `RestockRecommendation[]`; 2 segmen (Kritis red pulse, Menipis amber); Tunda button aktif; colored header (`h-1.5`) hanya di card postponed (amber) |
| **TransactionsPage** | `sort_by: 'created_at'`, `order: 'desc'` eksplisit |
| **App.tsx** | `inventoryBranch` state, passing ke InventoryPage dan DetailDrawer |
| **restock.ts** | Hapus `LiveRestockItem`/`LiveRestockResponse`; `getLiveRecommendations()` return `RestockRecommendation[]` |

### 3.5. Perbaikan Kunci

#### NUMERIC to INT Migration
- Kolom `safety_stock`, `reorder_point`, `eoq`, `max_stock`, `min_stock` di `branch_stocks` diubah dari NUMERIC ke INT
- Semua ML values menggunakan `round()` → integer
- Mencegah floating point issues di frontend

#### Supabase NUMERIC String Handling
- `forecast_series.predicted_quantity` = `NUMERIC(12,2)` → Supabase JS client return sebagai string
- Fix: `Number(f.predicted_quantity)` sebelum arithmetic
- Mencegah `NaN` values di card rekomendasi

#### Restock Recommendation Reset
- Setiap refresh tab restock: semua pending records di-delete, re-insert dari forecast_series
- Non-pending (postponed/ordered/approved) tetap aman
- Branch filter scoped delete jika branch filter aktif

---

## 4. Roadmap — Yang Perlu Ditambahkan / Diperbaiki

### 🔴 High Priority

| Item | Alasan | Saran Implementasi |
|------|--------|-------------------|
| **XGBoost model saving & versioning** | Model saat ini hanya in-memory, hilang saat Flask restart | Save model to file/S3 + version tracking per run |
| **Training data date range selector** | Pelatihan selalu pakai semua data, tidak ada filter periode | Tambah `start_date`/`end_date` di train request + slider UI |
| **Scheduler auto-predict dashboard** | Status scheduler hanya lewat `/api/auto-status` tanpa UI | Dashboard card menampilkan last predict + trigger button |
| **Notifikasi real-time** | Push notification belum terhubung | WebSocket atau Supabase Realtime untuk restock critical + PO events |
| **max_stock UI** | Kolom max_stock ada di DB tapi belum ada form di frontend | Tambah field di AddItemModal / EditItemModal |

### 🟡 Medium Priority

| Item | Alasan | Saran Implementasi |
|------|--------|-------------------|
| **Dashboard per-cabang** | Dashboard saat ini aggregate semua cabang | Tambah branch filter + KPI per cabang |
| **Edit sparepart** | Belum ada modal edit untuk sparepart | PATCH endpoint + EditItemModal |
| **Inline PO item pricing** | unit_price di PO items bisa diisi manual + auto dari sparepart | Update CreatePOModal untuk set unit_price dari sparepart price |
| **Inventory stock history chart** | DetailDrawer sparkline masih terbatas | Integrasi dengan stock_movements untuk grafik historis |
| **Validasi predictions** | Prediksi tidak divalidasi sebelum disimpan | Bandingkan prediction vs actual, feedback loop ke model |

### 🟢 Low Priority

| Item | Saran Implementasi |
|------|-------------------|
| **CPU/GPU fallback untuk model** | XGBoost bisa GPU-accelerated, fallback ke CPU |
| **Export training report** | Export training results sebagai CSV/PDF |
| **Unit test backend + ML** | Jest + supertest untuk Express, pytest untuk Flask |
| **Docker setup** | Dockerfile + docker-compose (backend + frontend + ML) |
| **CI/CD pipeline** | GitHub Actions untuk lint + build + test |
| **API documentation** | OpenAPI/Swagger spec untuk Express + Flask |
| **Error tracking** | Sentry untuk frontend + backend |
| **Cache layer** | Redis untuk dashboard/reports/Forecast output caching |

---

## 5. Catatan Teknis

### Env Variables (`.env` — Backend)

```
PORT=3001
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWKS_URL=...
DATABASE_URL=postgresql://postgres.[ref]:[password]@[host]:6543/postgres
JWT_SECRET=...
```

### Env Variables (`.env` — ML)

```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
PREDICTION_MONTHS=3
SERVICE_LEVEL_Z=1.96
HOLDING_COST_PCT=0.15
LAST_PREDICT_PATH=models/last_predict.json
```

### Migration Runner

```bash
npm run migrate
```

Support `DATABASE_URL` env var, auto-fallback ke pooler Supabase.

### Development

```bash
# Backend (Express)
cd backend && npm start

# Frontend (Vite)
cd frontend && npm run dev

# ML (Flask)
cd inventory_ml && python api.py
```

### Status Build

✅ Backend: Semua file JS lolos `node --check`  
✅ Frontend: Vite build sukses (2300+ modules)  
✅ ML: Flask app running di port 5001, all endpoints responsive  
✅ Database: 8 migration sukses (001–012)
