# Prompt: Integrasi XGBoost ke SpareTrack

Kamu adalah full-stack engineer untuk mengintegrasikan model XGBoost forecasting ke dalam sistem SpareTrack.

## Ruang Lingkup

- Model XGBoost sudah dibuat di `inventory_ml/` (Python Flask on port 5001).
- Dataset training: seluruh `stock_movements` (in, out, transfer) dari Jan–Jul 2026.
- Model menyimpan prediksi ke `forecast_series` dengan `method='xgboost'` dan `forecast_runs`.
- Target: gunakan prediksi XGBoost untuk meningkatkan akurasi restock recommendation.

## Data Terkait

### 1. Stock Movements (Sumber Data Training)

| Tabel | Kolom | Kegunaan |
|-------|-------|----------|
| `stock_movements` | `sparepart_id` | ID sparepart |
| | `branch_id` | ID cabang |
| | `type` | `'in'`, `'out'`, `'transfer'` — semua dipakai sebagai aktivitas |
| | `quantity` | Nilai absolut dipakai sebagai target demand |
| | `created_at` | Dikelompokkan per bulan untuk time-series |

### 2. Spareparts (Feature)

| Kolom | Kegunaan |
|-------|----------|
| `id` | Join key |
| `price` | Feature: harga mempengaruhi pola pembelian |
| `is_active` | Filter: hanya sparepart aktif |

### 3. Branches (Feature)

| Kolom | Kegunaan |
|-------|----------|
| `id` | Join key |
| `name` | Label untuk dashboard |

### 4. Forecast Runs (Output)

| Kolom | Kegunaan |
|-------|----------|
| `id` | Run ID — di-join oleh `forecast_series` |
| `method` | `'xgboost'` — membedakan dari SMA |
| `period_start`, `period_end` | Rentang prediksi |
| `status` | `'completed'` jika sukses |

### 5. Forecast Series (Output Prediksi)

| Kolom | Kegunaan |
|-------|----------|
| `id` | Primary key |
| `forecast_run_id` | FK ke `forecast_runs` |
| `sparepart_id` | FK ke `spareparts` |
| `branch_id` | FK ke `branches` |
| `month` | Bulan prediksi (DATE, first day of month) |
| `predicted_quantity` | Demand prediksi XGBoost |
| `confidence_lower` | Batas bawah (70% dari predicted) |
| `confidence_upper` | Batas atas (130% dari predicted) |

### 6. Branch Stocks (Kondisi Saat Ini)

| Kolom | Kegunaan |
|-------|----------|
| `sparepart_id` + `branch_id` | Composite unique |
| `quantity` | Stok aktual saat ini |

### 7. Restock Recommendations (Target Integrasi)

| Kolom | Kegunaan |
|-------|----------|
| `sparepart_id` + `branch_id` | Composite unique |
| `current_stock` | Stok saat ini |
| `reorder_point` | Threshold reorder |
| `recommended_qty` | Jumlah yang direkomendasikan |
| `urgency` | `critical`, `high`, `medium`, `low`, `overstock` |

## Hubungan dengan Laman Restock

```
                    ┌─────────────────────┐
                    │  inventory_ml/      │
                    │  XGBoost Model      │
                    │  (Python:5001)      │
                    └────────┬────────────┘
                             │ POST /api/predict?months=6
                             ▼
                    ┌─────────────────────┐
                    │  forecast_runs       │
                    │  method='xgboost'    │
                    └────────┬────────────┘
                             │ 1:N
                    ┌────────▼────────────┐
                    │  forecast_series     │
                    │  predicted_quantity │────┐
                    │  sparepart_id       │    │
                    │  branch_id          │    │
                    │  month              │    │
                    └─────────────────────┘    │
                                               ▼
                              ┌────────────────────────────┐
                              │  restockService.generate() │
                              │                            │
                              │  1. Ambil branch_stocks     │
                              │  2. Ambil forecast_series   │
                              │     method='xgboost'        │
                              │     GROUP BY sparepart_id   │
                              │  3. Hitung monthly_demand   │
                              │     = AVG(predicted_qty)    │
                              │  4. Bandingkan current_stock│
                              │     vs demand               │
                              │  5. Tentukan urgency + qty  │
                              └───────────┬────────────────┘
                                          ▼
                              ┌────────────────────────────┐
                              │  restock_recommendations    │
                              │  • urgency berbasis prediksi│
                              │  • recommended_qty akurat   │
                              └────────────────────────────┘
```

## Yang Harus Dihasilkan

### 1. Backend — Restock Service Enhancement
Modifikasi `restockService.generate()` agar:

- Setelah menghitung `monthlyConsumption` dari 90 hari historis, **ambil juga prediksi XGBoost** dari `forecast_series` untuk sparepart & branch yang sama.
- Jika data XGBoost tersedia (ada `forecast_series` dengan `method='xgboost'` untuk sparepart & branch tersebut), gunakan **rata-rata `predicted_quantity` 6 bulan ke depan** sebagai `forecasted_demand`.
- Kombinasikan: `effective_demand = max(historical_monthly, forecasted_demand)`.
- Rekomendasi qty dihitung dari `effective_demand` bukan hanya dari stok statis.
- Gunakan `confidence_lower` dan `confidence_upper` untuk menampilkan rentang keyakinan di rekomendasi.

**Perubahan data di `restock_recommendations`:**

| Kolom | Tambahan |
|-------|----------|
| Tambah kolom `forecasted_demand NUMERIC(12,2)` | Rata-rata predicted XGBoost |
| Tambah kolom `confidence_lower NUMERIC(12,2)` | Dari forecast_series |
| Tambah kolom `confidence_upper NUMERIC(12,2)` | Dari forecast_series |
| Ubah `notes` | Sertakan `"Prediksi XGBoost: X unit/bulan"` |

### 2. Backend — New Endpoint: Forecast Integration
```
GET /restock/predicted-demand
  Query: sparepart_id, branch_id, month
  Response: { sparepart, branch, month, predicted, lower, upper, source: "xgboost" }
```

```
GET /restock/forecast-metrics
  Response: { 
    last_run: timestamp,
    model_metrics: { mae, rmse, r2, mape },
    feature_importance: [{ feature, importance }],
    n_predictions: int
  }
```

### 3. Frontend — Restock Page Enhancement

Di `RestockPage.tsx`:

- **Card "Forecast Precision"**: tampilkan MAE/RMSE/R² dari model XGBoost.
- **Kolom tambahan di tabel rekomendasi**: "Prediksi Demand (XGBoost)".
- **Tooltip**: saat hover di recommended_qty, tampilkan "Berdasar prediksi XGBoost: X unit/bulan".
- **Badge** di rekomendasi yang memakai XGBoost: label `XGB`.

### 4. Frontend — Dashboard Page Enhancement

Di `DashboardPage.tsx`:

- **Forecast accuracy mini-card**: ambil dari `/restock/forecast-metrics`.
- Tampilkan MAE dan R² dengan ikon trend.

### 5. Migration SQL

```sql
ALTER TABLE public.restock_recommendations 
ADD COLUMN IF NOT EXISTS forecasted_demand NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_lower NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_upper NUMERIC(12,2) DEFAULT 0;
```

## Aturan Bisnis

1. Jika data XGBoost belum tersedia, fallback ke perhitungan existing (90-day historical avg).
2. Jika `confidence_lower <= current_stock <= confidence_upper`, anggap stok "aman" — turunkan urgency satu level.
3. Prediksi XGBoost harus diperbarui minimal 1x per bulan (manual via dashboard button atau cron).
4. Rekomendasi dengan `forecasted_demand > 0` harus mencantumkan sumber prediksi di `notes`.
5. Hanya `forecast_series` dengan `forecast_runs.method = 'xgboost'` dan `status = 'completed'` yang dipakai.

## Output Yang Diinginkan

- Restock recommendation yang mempertimbangkan prediksi ML, bukan hanya historis 90 hari.
- Dashboard yang menunjukkan performa model XGBoost (MAE, RMSE, R²).
- Kolom baru di tabel rekomendasi untuk prediksi demand.
- Saran untuk menjadwalkan training ulang model via cron job (`inventory_ml/main.py run` via scheduler).
