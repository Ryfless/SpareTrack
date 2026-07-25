# Prompt Implementasi Modul Machine Learning (XGBoost Regressor) untuk Sistem Inventory

## Tujuan

Implementasikan modul Machine Learning secara terpisah dari frontend dan backend utama untuk melakukan:

1. Forecasting demand (permintaan sparepart)
2. Training model XGBoost Regressor
3. Evaluasi performa model
4. Monitoring hasil training
5. Menyimpan model
6. Memberikan rekomendasi stok optimal menggunakan:
   - Safety Stock
   - Reorder Point (ROP)
   - Economic Order Quantity (EOQ)

Seluruh modul Machine Learning harus ditempatkan pada folder terpisah bernama:

```
inventory_ml/
```

Modul ini berjalan sebagai service sendiri menggunakan FastAPI sehingga dapat diakses oleh backend melalui REST API.

---

# Dataset

Gunakan dataset transaksi stock movement yang sudah tersedia.

Dataset terakhir memiliki karakteristik:

- ±232 transaksi
- sekitar 30 sparepart
- 3 cabang
- periode Januari 2026 – Juli 2026

Kolom yang tersedia kurang lebih terdiri dari:

```
transaction_date
branch_id
branch_name
sparepart_id
sparepart_name
transaction_type
quantity
reference_number
created_at
```

Jenis transaksi:

- IN
- OUT
- TRANSFER

Forecast hanya menggunakan transaksi OUT sebagai representasi demand.

Jangan menggunakan transaksi mentah secara langsung untuk training.

---

# Tahapan Preprocessing

Sebelum training lakukan preprocessing berikut.

## 1. Cleaning

- Hilangkan data kosong
- Pastikan format tanggal valid
- Pastikan quantity bertipe integer
- Urutkan berdasarkan tanggal

---

## 2. Agregasi

Ubah transaksi menjadi demand harian.

Contoh

Tanggal

2026-01-01

OUT

```
3
2
5
```

Menjadi

```
date
sparepart
branch
daily_demand

2026-01-01
Brake Pad
Bogor
10
```

Lakukan untuk seluruh sparepart dan seluruh cabang.

---

## 3. Feature Engineering

Buat feature berikut.

### Time Feature

- day
- week
- month
- day_of_week
- is_weekend

---

### Lag Feature

- lag_1
- lag_3
- lag_7
- lag_14
- lag_30

---

### Rolling Feature

- rolling_mean_3
- rolling_mean_7
- rolling_mean_14
- rolling_std_7

---

### Target

Target training adalah

```
Demand Hari Berikutnya
```

---

# Model

Gunakan

```
XGBoost Regressor
```

Contoh parameter awal

```
n_estimators = 300

learning_rate = 0.05

max_depth = 5

subsample = 0.8

colsample_bytree = 0.8

random_state = 42
```

Parameter dapat diubah melalui dashboard.

---

# Split Dataset

Gunakan

Time Series Split

Jangan menggunakan shuffle.

Contoh

70%

Training

30%

Testing

---

# Evaluasi

Hitung metrik berikut

MAE

RMSE

MAPE

R² Score

Simpan seluruh history evaluasi.

---

# Penyimpanan Model

Gunakan

joblib

atau

pickle

Simpan model pada

```
inventory_ml/models/
```

Misal

```
xgboost_latest.pkl
```

---

# Forecasting

Sediakan endpoint untuk melakukan forecasting.

Input

```
sparepart

branch

forecast_horizon
```

Output

```
Forecast 1 hari

Forecast 7 hari

Forecast 30 hari
```

Gunakan recursive forecasting.

---

# Inventory Optimization

Gunakan hasil forecasting untuk menghitung

## Safety Stock

Input

- Forecast Demand
- Lead Time
- Service Level
- Standard Deviation

---

## Reorder Point

ROP

=

Demand selama Lead Time

+

Safety Stock

---

## EOQ

Input

Annual Demand

Ordering Cost

Holding Cost

Output

EOQ

---

## Stock Recommendation

Jika

```
Current Stock < ROP
```

maka

```
Status

Reorder

Recommended Order

EOQ
```

Jika

Current Stock masih aman

berikan

```
Stock Normal
```

---

# Struktur Folder

```
inventory_ml/

│

├── api/

│     main.py

│     routes.py

│

├── preprocessing/

│     clean.py

│     aggregate.py

│     feature_engineering.py

│

├── training/

│     trainer.py

│     evaluator.py

│

├── forecasting/

│     predictor.py

│

├── optimizer/

│     safety_stock.py

│     reorder_point.py

│     eoq.py

│

├── models/

│     xgboost_latest.pkl

│

├── data/

│     stock_movements.csv

│

├── dashboard/

│     templates/

│     static/

│

├── logs/

│

├── requirements.txt

│

└── config.py
```

---

# Backend Service

Gunakan

FastAPI

Port

```
8001
```

Contoh endpoint

```
POST

/api/train
```

Melatih model.

---

```
POST

/api/retrain
```

Melatih ulang model.

---

```
GET

/api/status
```

Status model.

---

```
GET

/api/metrics
```

MAE

RMSE

MAPE

R²

---

```
POST

/api/predict
```

Forecast demand.

---

```
POST

/api/recommendation
```

Menghasilkan

Forecast

Safety Stock

ROP

EOQ

Stock Recommendation

---

```
GET

/api/history
```

History seluruh training.

---

# Dashboard

Dashboard dibuat menggunakan

Flask

Port

```
5001
```

Dashboard hanya untuk monitoring.

Jangan digabung dengan frontend utama.

Gunakan Bootstrap 5 atau Tailwind CSS.

---

## Halaman Dashboard

### Dashboard

Menampilkan

- Status Model
- Last Training
- Total Training
- Dataset Size
- Model Version
- Accuracy

---

### Training

Berisi

Button

```
Start Training
```

Button

```
Retrain
```

Progress Bar Training

Training Log

Training Time

---

### Evaluation

Menampilkan

Card

```
MAE
```

Card

```
RMSE
```

Card

```
MAPE
```

Card

```
R²
```

Grafik Prediksi vs Aktual.

Grafik Error.

---

### Forecast

Form

- Sparepart
- Cabang
- Horizon

Button

Forecast

Hasil

Forecast

Tabel

Grafik

---

### Inventory Recommendation

Menampilkan

Current Stock

Forecast

Safety Stock

ROP

EOQ

Recommendation

Status

Gunakan warna

Hijau

Stock Aman

Kuning

Segera Restock

Merah

Stock Kritis

---

### Training History

Tabel

- Training Date
- Duration
- Dataset Size
- MAE
- RMSE
- MAPE
- R²
- Model Version

---

### Model Management

Button

Download Model

Upload Model

Delete Model

Model Information

---

### System Logs

Menampilkan

Training Log

Prediction Log

API Request Log

---

# Library

Gunakan

Machine Learning

- xgboost
- scikit-learn
- pandas
- numpy
- scipy
- joblib

Visualisasi

- matplotlib
- plotly

API

- fastapi
- uvicorn
- pydantic

Dashboard

- flask
- jinja2
- bootstrap

Monitoring

- psutil

Konfigurasi

- python-dotenv

Logging

- loguru

---

# Integrasi dengan Backend

Backend utama **tidak melakukan training model secara langsung**.

Backend cukup memanggil REST API dari service Machine Learning.

Contoh alur:

```
Frontend
        │
        ▼
Backend Utama
(port existing)
        │
        ▼
HTTP Request
        │
        ▼
FastAPI ML
(port 8001)
        │
        ▼
XGBoost
        │
        ▼
Forecast
        │
        ▼
Safety Stock
ROP
EOQ
        │
        ▼
JSON Response
        │
        ▼
Backend
        │
        ▼
Frontend
```

Dashboard Flask (port 5001) hanya digunakan oleh administrator untuk memantau proses training, evaluasi, dan performa model. Frontend aplikasi utama tidak bergantung pada dashboard ini, sehingga arsitektur tetap modular dan mudah dikembangkan maupun di-deploy.