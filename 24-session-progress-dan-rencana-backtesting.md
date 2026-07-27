# Sesi 24 — Progress Summary & Rencana Backtesting ML

## Ringkasan Sesi Ini

### Restock Lifecycle
- `handlePOCreated` di RestockPage memanggil `fetchLive()` bersamaan dengan `fetchPOList()` agar rekomendasi langsung refresh setelah PO dibuat.

### Branch Monitoring
- **Branch Stats Cards**: Nilai Inventory (Rp Jt/M/Rb), Terjual/Bln, Top 3 Terlaris bulan ini (ranked dengan badge biru rounded-square).
- **Sales Trend Chart**: Bar chart (kiri) di samping stock matrix (kanan) dalam `lg:grid-cols-2`. 6 bulan oldest-first, exclude bulan berjalan. 3 bar per bulan (A=#1d4ed8, B=#0d9488, C=#22c55e). Legend + custom tooltip.
- **Matrix Table**: Scrollable `max-h-[215px] overflow-y-auto` dengan sticky header, 6 row visible.
- Endpoint baru `GET /api/branches/sales-trend`.

### Reports — Real API Data
- Grafik Bar (revenue) dan Area (units) pakai `data.monthly_trend` dari API, bukan data hardcoded.
- `total_items` respect branch filter.
- Critical items pakai `safety_stock` via `computeStatus() === 'critical'`.
- Trend prefix `+` hanya muncul saat `up=true`.

### Centralized Stock Status Utility
- `backend/src/utils/stockStatus.js`: `computeStatus(qty, safety, reorder, max)` → `'critical'|'low'|'safe'|'overstock'`.
- `computeWorstStatus(statuses)` dengan prioritas: `['critical', 'low', 'overstock', 'safe']` (overstock lebih buruk dari safe).
- Overstock: `quantity > max_stock` (bukan `>=`).
- Utility dipakai di: `inventoryService.js` (5 tempat), `restockService.js`, `branchesService.js`, `reportsService.js`.
- Frontend mirror: `frontend/src/app/utils/stockStatus.ts`.
- `DetailDrawer.tsx` ganti `branchStatus()` inline dengan `computeStatus()`.

### KPI Terlaris di Reports
- Backend: `top_sparepart { name, total_sold, avg_monthly }` — sparepart dengan total penjualan terbanyak dalam periode filter, dihitung rata-rata per bulan.
- Frontend: KPI "Item Kritis" diganti dengan "Terlaris" (icon Star), value = nama sparepart, sub = `"X unit/bulan"`.

---

## State Model ML Saat Ini

### Arsitektur
- Service Python Flask di `inventory_ml/` port 5001.
- Model: **XGBoost Regressor** (`xgboost.XGBRegressor`).
- Fitur: lag_1, lag_2, lag_3, rolling_mean_3, month_sin, month_cos, quarter, price, sparepart_encoded, branch_encoded.
- Data: `stock_movements` (type=out), limit 5000 baris, di-aggregate per `(sparepart_id, branch_id, month)`.

### Evaluasi yang Sudah Ada
| Komponen | Path |
|---|---|
| Fungsi metrik | `inventory_ml/models/metrics.py` |
| Perhitungan otomatis | `xgboost.py:train_model()` — split 80/20 time-ordered, eval di test set |
| 5 metrik | MAE, RMSE, R², MAPE, residuals_std |
| Penyimpanan | `models/metrics.json` — metrics + feature_importance + n_train + n_test + timestamp |
| API endpoint | `GET /api/metrics` — return isi metrics.json |
| Model stats | `GET /api/model-stats` — best_iteration, best_score, num_features, num_trees |

---

## Rencana Pengembangan: Backtesting / Forecast Evaluation

### Masalah
Saat ini model hanya dievaluasi **sekali saat training** (split 80/20). Tidak ada mekanisme untuk:
- Membandingkan prediksi sebelumnya dengan nilai aktual setelah periode berlalu.
- Melacak akurasi prediksi dari waktu ke waktu.
- Mengetahui apakah model makin baik atau makin buruk.

### Solusi: Backtesting Pipeline

#### 1. Database — Tabel `forecast_accuracy` (baru)

```sql
CREATE TABLE forecast_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_run_id UUID REFERENCES forecast_runs(id),
  sparepart_id UUID REFERENCES spareparts(id),
  branch_id UUID REFERENCES branches(id),
  month DATE NOT NULL,            -- bulan yang diprediksi
  predicted_quantity DECIMAL NOT NULL,
  actual_quantity DECIMAL,        -- diisi setelah bulan berlalu
  error_abs DECIMAL,
  error_pct DECIMAL,
  is_backfilled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  backfilled_at TIMESTAMPTZ
);
```

#### 2. Backfill Job — `backfill_accuracy.py` (script terpisah / cron)

```
Flow:
1. Ambil semua forecast_series yang bulannya <= bulan lalu (already passed)
2. Untuk setiap (sparepart_id, branch_id, month):
   - Query SUM(quantity) FROM stock_movements WHERE type='out' AND month = target_month
   - Hitung error = |predicted - actual|
   - Hitung error_pct = error / actual * 100
   - INSERT / UPDATE ke forecast_accuracy
```

- Trigger: jalankan otomatis setiap 1 jam via scheduler yang sudah ada (APScheduler di `api.py`).
- Atau: script CLI terpisah `python backfill_accuracy.py`.

#### 3. API — Endpoint Baru

| Endpoint | Fungsi |
|---|---|
| `GET /api/accuracy?sparepart_id=&branch_id=&limit=` | Riwayat accuracy per sparepart/branch |
| `GET /api/accuracy/summary` | Agregasi MAE, RMSE, MAPE overall — tren error per bulan |
| `POST /api/accuracy/backfill` | Trigger manual backfill |

#### 4. Dashboard / Frontend — Halaman Monitoring ML

Tambahan di halaman baru atau tab di Reports:

```
Kartu Metrik:
┌─────────────────────────────────────────┐
│  Model Accuracy Overview                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌──────────┐ │
│  │ MAE │ │RMSE │ │MAPE │ │ R² (last)│ │
│  │ 2.3 │ │ 3.1 │ │12.5%│ │  0.87    │ │
│  └─────┘ └─────┘ └─────┘ └──────────┘ │
│                                         │
│  Tren Error per Bulan (line chart)      │
│  ┌─────────────────────────────────┐    │
│  │   MAPE turun? → model membaik   │    │
│  │   MAPE naik?  → drift / stale   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Bottom-5 Sparepart (MAPE tertinggi)    │
│  ┌─────────────────────────────────┐    │
│  │ Oli Mesin → MAPE 45%            │    │
│  │ Filter Udara → MAPE 38%         │    │
│  │ ...                             │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

#### 5. Retrain Trigger

- Jika MAPE rata-rata 3 bulan terakhir > threshold (misal 30%) → trigger retrain otomatis.
- Atau: schedule retrain bulanan + manual button di dashboard.

#### 6. Peringatan (Alert)

- Notifikasi di app: "Akurasi prediksi turun — MAPE saat ini X%, di atas threshold Y%."
- Bisa integrasi dengan sistem notifikasi yang sudah ada.

### Prioritas Implementasi

| # | Item | Estimasi |
|---|---|---|
| 1 | Buat tabel `forecast_accuracy` + migration | 1 jam |
| 2 | Script backfill (`backfill_accuracy.py`) | 3 jam |
| 3 | API endpoints accuracy | 2 jam |
| 4 | Tambah accuracy ke scheduler (auto backfill tiap jam) | 1 jam |
| 5 | Frontend dashboard monitoring ML | 4 jam |
| 6 | Retrain trigger & alert | 2 jam |
| | **Total** | **~13 jam** |
