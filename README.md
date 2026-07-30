# SpareTrack — Multi-Branch Inventory Management System

<p align="center">
  <img src="frontend/public/icon/Sparetrack.svg" alt="SpareTrack Logo" width="120" />
</p>

<p align="center">
  <strong>Sistem Manajemen Inventori Multi-Cabang dengan Prediksi Permintaan Berbasis XGBoost</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production-blue" />
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB" />
  <img src="https://img.shields.io/badge/Backend-Express%205-000000" />
  <img src="https://img.shields.io/badge/ML-XGBoost-FF6600" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E" />
  <img src="https://img.shields.io/badge/CICD-GitHub%20Actions-2088FF" />
  <img src="https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-000000" />
</p>

---

## Daftar Isi

- [1. Gambaran Umum](#1-gambaran-umum)
- [2. Teknologi yang Digunakan](#2-teknologi-yang-digunakan)
- [3. Arsitektur Sistem](#3-arsitektur-sistem)
- [4. Business Process](#4-business-process)
- [5. Alur Aplikasi (Application Flow)](#5-alur-aplikasi-application-flow)
- [6. Basis Data (Database Schema)](#6-basis-data-database-schema)
- [7. API Endpoints](#7-api-endpoints)
- [8. Training Model Machine Learning](#8-training-model-machine-learning)
- [9. Sistem Prediksi (Forecasting)](#9-sistem-prediksi-forecasting)
- [10. Sistem Restock & Purchase Order](#10-sistem-restock--purchase-order)
- [11. Pengembangan dengan Metode Prototyping](#11-pengembangan-dengan-metode-prototyping)
- [12. Skenario Testing](#12-skenario-testing)
- [13. CI/CD Pipeline](#13-cicd-pipeline)
- [14. Deployment & Cara Mengakses](#14-deployment--cara-mengakses)
- [15. Environment Variables](#15-environment-variables)
- [16. Pengaturan Keamanan](#16-pengaturan-keamanan)

---

## 1. Gambaran Umum

**SpareTrack** adalah sistem manajemen inventori multi-cabang yang dirancang untuk toko sparepart kendaraan. Sistem ini membantu mengelola stok sparepart di beberapa cabang, memberikan rekomendasi restock otomatis berdasarkan prediksi permintaan menggunakan algoritma **XGBoost**, serta memfasilitasi proses pembelian (Purchase Order) dari awal hingga penerimaan barang.

### Masalah yang Dipecahkan

| Masalah | Solusi SpareTrack |
|---------|-------------------|
| Stok habis di satu cabang sementara cabang lain kelebihan stok | Monitoring stok per cabang real-time + fitur transfer antar cabang |
| Kesulitan menentukan kapan harus restock | Rekomendasi restock otomatis berbasis prediksi ML |
| Proses PO manual dan tidak terpantau | Sistem PO end-to-end: draft → pending → approved → received |
| Tidak ada riwayat aktivitas dan audit trail | Log aktivitas + audit log untuk setiap transaksi |
| Data tersebar tidak terpusat | Database terpusat (Supabase) dengan akses multi-cabang |

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Manajemen Inventori Multi-Cabang** | Kelola stok sparepart di berbagai cabang dengan visibilitas penuh |
| **Dashboard Interaktif** | KPI real-time: total stok, nilai inventori, status kritis, tren permintaan |
| **Rekomendasi Restock Otomatis** | Generate rekomendasi restock berbasis aturan (safety stock, reorder point) |
| **Prediksi Permintaan (ML)** | Prediksi permintaan 3 bulan ke depan menggunakan XGBoost + auto-scheduler |
| **Purchase Order (PO) Management** | Buat, setujui, terima, dan batalkan PO dengan notifikasi otomatis |
| **Transfer Antar Cabang** | Pindahkan stok antar cabang dengan pencatatan otomatis |
| **Laporan & Ekspor** | Laporan stok, transaksi, item kritis dalam format PDF dan Excel |
| **Notifikasi Real-time** | Notifikasi push via Supabase Realtime + polling periodik |
| **Login History & Audit Log** | Riwayat login/logout + audit log perubahan data |
| **Role-Based Access Control** | Dua role: `super_admin` (full akses) dan `branch_admin` (terbatas ke cabang sendiri) |
| **Dark Mode** | Tema gelap/terang yang dapat diatur |
| **Idle Session Timeout** | Logout otomatis setelah 15 menit tidak ada aktivitas |
| **Command Palette** | Cepat navigasi menu, aksi, dan sparepart dengan `Ctrl+K` |

---

## 2. Teknologi yang Digunakan

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 18.3.1 | Library UI komponen |
| **TypeScript** | ~5.x | Type safety untuk JavaScript |
| **Vite** | 6.4.3 | Build tool & dev server |
| **Tailwind CSS** | 4.1.12 | Utility-first CSS framework |
| **Radix UI** | ~1.x | Headless UI primitives (dialog, dropdown, popover, dll) |
| **Recharts** | 2.15.2 | Charting library untuk grafik |
| **Lucide React** | 0.487.0 | Icon library |
| **Supabase JS** | 2.110.2 | Client library untuk autentikasi & realtime |
| **React Router** | 7.18.1 | Routing client-side |
| **Sonner** | 2.0.3 | Toast notifications |
| **date-fns** | 3.6.0 | Manipulasi tanggal |
| **MUI Material** | 7.3.5 | Material Design components (terbatas) |
| **Vitest** | 4.1.10 | Unit testing |
| **Testing Library** | ~16.x | React component testing |

### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Node.js** | 22 | Runtime JavaScript |
| **Express** | 5.2.1 | Web framework REST API |
| **Supabase JS** | 2.49.4 | Client database + autentikasi |
| **Helmet** | 8.0.0 | Security headers |
| **Morgan** | 1.10.0 | HTTP request logging |
| **CORS** | 2.8.6 | Cross-Origin Resource Sharing |
| **node-cron** | 4.6.0 | Scheduled task (generate rekomendasi otomatis) |
| **PDFKit** | 0.19.1 | Generate PDF laporan |
| **ExcelJS** | 4.4.0 | Generate Excel laporan |
| **csv-stringify** | 6.8.1 | Export CSV inventori |
| **Jest** | 29.7.0 | Unit testing |
| **Supertest** | 7.2.2 | HTTP integration testing |

### Machine Learning (inventory_ml)

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Python** | 3.11 | Bahasa pemrograman ML |
| **Flask** | 3.0+ | Web server untuk API ML |
| **XGBoost** | 2.0+ | Algoritma gradient boosting untuk prediksi time series |
| **scikit-learn** | 1.3+ | Train-test split, evaluasi model |
| **Pandas** | 2.0+ | Manipulasi data |
| **NumPy** | 1.24+ | Komputasi numerik |
| **APScheduler** | 3.10+ | Auto-predict scheduler setiap 1 jam |
| **Supabase Python** | 2.0+ | Client database |
| **Pytest** | 8.0+ | Unit testing |

### Database

| Teknologi | Fungsi |
|-----------|--------|
| **Supabase (PostgreSQL)** | Database utama, autentikasi, realtime subscriptions |
| **Row Level Security (RLS)** | Keamanan tingkat baris (opsional, backend pakai service_role) |

### DevOps & Deployment

| Teknologi | Fungsi |
|-----------|--------|
| **GitHub Actions** | CI/CD pipeline |
| **Docker** | Containerization |
| **GHCR (GitHub Container Registry)** | Registry image Docker |
| **Vercel** | Hosting frontend (SPA) |
| **Render** | Hosting backend + ML service (via Docker) |
| **cron-job.org** | Keep-alive untuk Render services |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                           │
│  React 18 + TypeScript + Vite + Tailwind CSS + Radix UI + Recharts │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────────┐ │
│  │ Auth Pages│  │ App Pages │  │Components │  │ Services (API)  │ │
│  │ · Landing │  │·Dashboard │  │·Modals    │  │·client.ts       │ │
│  │ · Login   │  │·Inventory│  │·Shared    │  │·auth.ts         │ │
│  │ · Register│  │·Restock  │  │·UI        │  │·restock.ts      │ │
│  │ · Forgot  │  │·Branches │  │·KPICard   │  │·inventory.ts    │ │
│  │ · OTP     │  │·Transactions│·DetailDrawer │·notifications.ts│ │
│  │ · Reset PW│  │·Reports  │  │·CmdPalette│  └─────────────────┘ │
│  └───────────┘  │·Settings │  └───────────┘                       │
│                 └──────────┘                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS / REST API
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Render — Docker)                         │
│  Express 5 + Supabase JS + Helmet + Morgan + node-cron              │
│  Port: 3001                                                         │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │Routes (13)│→│Controllers(12)│→│ Services(13) │                   │
│  │·auth      │  │·auth        │  │·authService   │                   │
│  │·dashboard │  │·dashboard   │  │·dashboardSvc  │                   │
│  │·inventory │  │·inventory   │  │·inventorySvc  │                   │
│  │·branches  │  │·branches    │  │·branchesSvc   │                   │
│  │·transactions│ ·transactions│  │·transactionsSvc│                  │
│  │·restock   │  │·restock     │  │·restockSvc    │                   │
│  │·reports   │  │·reports     │  │·reportsSvc    │                   │
│  │·settings  │  │·settings    │  │·settingsSvc   │                   │
│  │·users     │  │·users       │  │·usersSvc      │                   │
│  │·notifications│·notif       │  │·notifSvc      │                   │
│  │·audit-logs│  │·auditLog    │  │·auditLogSvc   │                   │
│  │·references│  │·loginHistory│  │·loginHistSvc  │                   │
│  └──────────┘  └──────────────┘  │·schedulerSvc  │                   │
│                                   └──────────────┘                   │
│  Middlewares: authenticate (JWT) → authorize (role) → errorHandler   │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ Supabase SDK (service_role)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                            │
│  Auth: JWT, Email/Password, Google OAuth, OTP                       │
│  Database: 18+ tables dengan RLS                                    │
│  Realtime: Notifications push                                       │
│  Storage: (opsional) avatar upload                                  │
└──────┬───────────────────────────────────────────────────────────────┘
       │ HTTP
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  INVENTORY ML (Render — Docker)                      │
│  Flask + XGBoost + Pandas + APScheduler                             │
│  Port: 5001                                                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ /api/train   │→│ Models: xgboost.py │→│ Data: fetch from     │   │
│  │ /api/predict │  │ - train_model()   │  │  Supabase + feature  │   │
│  │ /api/output  │  │ - load_model()    │  │  engineering         │   │
│  │ /api/health  │  │ - predict_future()│  │  (lag features,      │   │
│  │ /api/metrics │  └──────────────────┘  │   seasonal encoding)  │   │
│  │ /dashboard   │                       └──────────────────────┘   │
│  └──────────────┘                                                   │
│  Auto-scheduler: /api/predict every 1 jam jika ada data movement baru│
└──────────────────────────────────────────────────────────────────────┘
```

### Alur Data Restock + ML

```
┌──────────┐    ┌──────────────────────┐    ┌─────────────────┐
│  User    │    │  Backend Restock     │    │  Inventory ML   │
│ Transaksi│    │  Service             │    │  Service        │
│ (out)    │    │                      │    │                 │
└────┬─────┘    └──────────────────────┘    └────────┬────────┘
     │              ┌──────────────────────┐          │
     │  INSERT      │  Scheduler (node-    │          │
     └─────────────►│  cron @ 06:00 daily  │          │
                    │  generate()          │          │
                    │  · Iterasi tiap       │          │
                    │    sparepart × branch  │          │
                    │  · Hitung konsumsi    │          │
                    │    bulanan (90 hari)   │          │
                    │  · Bandingkan stok    │          │
                    │    vs safety stock /  │          │
                    │    reorder point      │          │
                    │  · Simpan rekomendasi │          │
                    └──────────┬───────────┘          │
                               │                       │
                    ┌──────────▼───────────┐          │
                    │  restock_recommend   │          │
                    │  ations table        │          │
                    └──────────┬───────────┘          │
                               │                       │
                    ┌──────────▼───────────┐          │
                    │  GET /recommendations │          │
                    │  User lihat & pilih   │          │
                    │  → Create PO          │          │
                    └──────────┬───────────┘          │
                               │                       │
                    ┌──────────▼───────────┐  ┌────────┴────────┐
                    │  Purchase Order      │  │  Auto-predict   │
                    │  approve → receive   │◄─┤  (tiap 1 jam)   │
                    │  → stok bertambah    │  │  Save to        │
                    └──────────────────────┘  │  forecast_series│
                                              └─────────────────┘
```

---

## 4. Business Process

### 4.1 Manajemen Inventori Multi-Cabang

```
                   ┌─────────────────────────────────────────┐
                   │           SUPER ADMIN                   │
                   │  Melihat & mengelola SEMUA cabang       │
                   └────────────┬────────────────────────────┘
                                │
        ┌───────────────────────┼────────────────────────────┐
        │                       │                            │
┌───────▼───────┐      ┌───────▼───────┐          ┌─────────▼──────────┐
│ Branch Admin  │      │ Branch Admin  │          │   Branch Admin     │
│ Cabang A      │      │ Cabang B      │          │   Cabang C         │
│ · Kelola stok │      │ · Kelola stok │          │ · Kelola stok     │
│   cabang A    │      │   cabang B    │          │   cabang C        │
│ · Restock utk │      │ · Restock utk │          │ · Restock utk     │
│   cabang A    │      │   cabang B    │          │   cabang C        │
└───────────────┘      └───────────────┘          └───────────────────┘
```

### 4.2 Siklus Restock & Purchase Order

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SIKLUS RESTOCK + PO                                │
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐        │
│  │ 1. Generate  │───►│ 2. Review    │───►│ 3. Create PO    │        │
│  │ Rekomendasi  │    │ Rekomendasi  │    │ (Pending)       │        │
│  │ (Auto/M anual)│   │ · Urgensi    │    │ · Pilih supplier │        │
│  │              │    │ · Qty        │    │ · Pilih items   │        │
│  └─────────────┘    └──────────────┘    └────────┬────────┘        │
│                                                   │                  │
│  ┌──────────────────┐    ┌──────────────┐         │                  │
│  │ 6. Stok Masuk ◄──┤───►│ 5. Receive   │◄────────┘                  │
│  │ (branch_stocks)  │    │ PO (Received)│                            │
│  └──────────────────┘    └──────────────┘                            │
│                                ▲                                     │
│                          ┌─────┴──────┐                             │
│                          │ 4. Approve  │                             │
│                          │ (Approved)  │                             │
│                          └────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
        │                                                ▲
        │ Transaksi out (penjualan)                      │
        ▼                                                │
  ┌─────────────┐    ┌──────────────────────┐    ┌───────┴──────────┐
  │Stok Berkurang│───►│ Stok ≤ Reorder Point│───►│ Rekomendasi     │
  │              │    │ → Kritis / Menipis  │    │ Restock Baru    │
  └─────────────┘    └──────────────────────┘    └──────────────────┘
```

### 4.3 Alur Prediksi ML

```
┌────────────────────────────────────────────────────────────────────────┐
│                     PREDIKSI PERMINTAAN (XGBoost)                      │
│                                                                        │
│  ┌──────────────┐    ┌─────────────────┐    ┌────────────────────┐    │
│  │ Data History │───►│ Feature         │───►│ Train XGBoost      │    │
│  │ Stock        │    │ Engineering     │    │ Model              │    │
│  │ Movements    │    │ · Lag 1,2,3     │    │ · Time-series split│    │
│  │ (90-180 hari)│    │ · Rolling mean  │    │ · Early stopping   │    │
│  └──────────────┘    │ · Month sin/cos │    │ · RMSE, MAE, R²    │    │
│                      │ · Quarter       │    └─────────┬──────────┘    │
│                      │ · Price         │              │               │
│                      │ · Encoded IDs   │              ▼               │
│                      └─────────────────┘    ┌────────────────────┐    │
│                                              │ Predict Future     │    │
│                                              │ · 3 months ahead   │    │
│                                              │ · Per (sparepart ×  │   │
│                                              │   branch)          │   │
│                                              │ · Confidence interval│  │
│                                              └─────────┬──────────┘    │
│                                                        │               │
│                                                        ▼               │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    OUTPUT KE SISTEM                           │    │
│  │                                                               │    │
│  │  forecast_series  ──►  restock LIVE recommendations           │    │
│  │  (prediksi per bulan per sparepart per cabang)                │    │
│  │                                                               │    │
│  │  branch_stocks update:                                        │    │
│  │  · safety_stock  = z × RMSE × √(lead_time/30)                │    │
│  │  · reorder_point = demand_lead_time + safety_stock            │    │
│  │  · eoq           = √(2 × annual_demand × order_cost/holding)  │    │
│  │  · max_stock     = reorder_point + eoq                        │    │
│  └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Alur Aplikasi (Application Flow)

### 5.1 Flow Diagram (Login → Proses → Logout)

```
┌──────────────────────────────────────────────────────────────────────┐
│                     ALUR APLIKASI SPARETRACK                         │
│                                                                      │
│ ┌─────────┐                                                         │
│ │ LANDING │                                                         │
│ │  PAGE   │────┐                                                    │
│ └─────────┘    │                                                    │
│                ▼                                                    │
│ ┌──────────────────┐                  ┌──────────────────┐          │
│ │ LOGIN PAGE       │ ◄─────────────── │ FORGOT PASSWORD  │          │
│ │ · Email/Password │                  │ · Request OTP    │          │
│ │ · Google OAuth   │                  │ · Verify OTP     │          │
│ │ · Daftar         │                  │ · Reset Password │          │
│ └────────┬─────────┘                  └──────────────────┘          │
│          │                                                           │
│          ▼ Login Sukses                                              │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │                   MAIN APPLICATION (App)                      │    │
│ │                                                               │    │
│ │  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐            │    │
│ │  │ DASHBOARD   │ │ INVENTORY   │ │ RESTOCK      │            │    │
│ │  │ · KPI Cards │ │ · List      │ │ · Rekomendasí│            │    │
│ │  │ · Grafik    │ │ · Filter    │ │ · Purchase   │            │    │
│ │  │  Demand     │ │ · Detail    │ │   Orders     │            │    │
│ │  │ · Aktivitas │ │ · Export    │ │ · Buat PO    │            │    │
│ │  │  Terbaru    │ │ · Transfer  │ │ · Approve    │            │    │
│ │  └─────────────┘ └─────────────┘ │ · Receive    │            │    │
│ │                                  └──────────────┘            │    │
│ │  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐            │    │
│ │  │ BRANCHES    │ │TRANSACTIONS  │ │ REPORTS      │            │    │
│ │  │ (super_     │ │ · Stok      │ │ · Laporan    │            │    │
│ │  │  admin)     │ │   Masuk/    │ │   PDF/Excel  │            │    │
│ │  │ · Stocks    │ │   Keluar    │ │ · Grafik     │            │    │
│ │  │ · Top-     │ │ · Transfer  │ │   Tren        │            │    │
│ │  │   Selling   │ │ · Penyesuaian│ │ · Item Kritis│            │    │
│ │  └─────────────┘ └─────────────┘ └──────────────┘            │    │
│ │                                                               │    │
│ │  ┌──────────────────────────────────────────────────────────┐ │    │
│ │  │ SETTINGS (super_admin)                                   │ │    │
│ │  │ · Edit Profil · Theme · Users (CRUD) · Audit Log        │ │    │
│ │  └──────────────────────────────────────────────────────────┘ │    │
│ └──────────────────────────────────────────────────────────────┘    │
│          │                                                           │
│          ▼ Logout (Manual / Timeout 15 menit / 401)                 │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │                   LOGOUT HANDLER                               │    │
│ │  1. Catat logout ke login_history                              │    │
│  2. Sign out dari Supabase Auth                                 │    │
│  3. Redirect ke Landing Page                                    │    │
│  4. Hapus state user & profile                                  │    │
│ └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Detil Alur Per Role

#### Super Admin Flow
```
Landing → Login → Dashboard (lihat semua cabang)
         → Inventory (CRUD sparepart, lihat stok semua cabang)
         → Restock (generate rekomendasi, buat/approve/receive PO semua cabang)
         → Branch Monitoring (heatmap stok per cabang, tren penjualan)
         → Transactions (lihat semua transaksi semua cabang)
         → Reports (laporan summary, PDF, Excel)
         → Settings (kelola users, audit log, theme)
         → Profile (edit profil)
         → Logout
```

#### Branch Admin Flow
```
Landing → Login → Dashboard (hanya stok cabang sendiri)
         → Inventory (lihat + transfer, filter cabang sendiri)
         → Restock (rekomendasi + buat PO cabang sendiri)
         → Transactions (transaksi cabang sendiri)
         → Settings (theme, edit profil)
         → Logout
```

### 5.3 Idle Session Timeout

```
┌─────────────────────────────────────────────────────────────────────┐
│                   IDLE TIMEOUT MECHANISM                             │
│                                                                     │
│  14 menit tanpa aktivitas                                           │
│  ┌────────────────────────────────────────────────────┐             │
│  │ Warning Toast: "Sesi akan berakhir 1 menit lagi"   │             │
│  │ [Saya disini]                                      │             │
│  └────────────────────────┬───────────────────────────┘             │
│                           │                                         │
│       Klik "Saya disini"  │     30 detik (tidak ada klik)          │
│       ┌───────────────────┘      ┌────────────────────┐            │
│       ▼                          ▼                     │            │
│  Reset Timer              ┌──────────────┐            │            │
│  (14 menit baru)          │  Auto-logout  │◄───────────┘            │
│                           │  (15 menit)   │                         │
│                           └──────┬───────┘                         │
│                                  ▼                                 │
│                      Landing Page                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 Handler 401 (Token Expired)

```
API Response 401
  ┌──────────┐
  │ client.ts│──► dispatch CustomEvent('auth:expired')
  └──────────┘
       │
       ▼
  App.tsx listener
       │
       ▼
  handleLogout()
       │
       ▼
  Landing Page
```

---

## 6. Basis Data (Database Schema)

### 6.1 Entity Relationship Diagram (Text)

```
┌──────────────────┐       ┌──────────────────────┐
│   auth.users     │       │      profiles         │
│  (Supabase Auth) │──1:1──│  id (PK,FK)           │
│                  │       │  email, full_name      │
│                  │       │  phone, branch         │
│                  │       │  role (super_admin |   │
│                  │       │        branch_admin)    │
│                  │       │  avatar_url            │
│                  │       │  created_at, updated_at│
└──────────────────┘       └──────────────────────┘
       │ 1                        │ 1
       │                          │ *
       ▼                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      TABEL-TABEL UTAMA                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐   ┌────────────┐   ┌───────────────┐            │
│  │ branches   │   │categories  │   │  suppliers     │           │
│  ├────────────┤   ├────────────┤   ├───────────────┤            │
│  │ id (PK)    │   │ id (PK)    │   │ id (PK)       │            │
│  │ name       │   │ name       │   │ name          │            │
│  │ code       │   │ description│   │ contact_person│            │
│  │ address    │   │ created_at │   │ phone, email  │            │
│  │ city       │   └────────────┘   │ is_active     │            │
│  │ is_active  │                   └───────────────┘            │
│  └────────────┘                                                │
│       │ *                        │ *                           │
│       │                          │                             │
│       ▼                          ▼                             │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                    spareparts                         │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ id (PK) │ code │ name │ category_id (FK) │ supplier_id(FK) │
│  │ price │ min_stock │ reorder_point │ safety_stock │        │
│  │ lead_time │ unit │ is_active │ created_at │              │
│  └──────────────────┬───────────────────────────────────┘      │
│                     │ *                                       │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                  branch_stocks                        │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ id (PK) │ sparepart_id(FK) │ branch_id(FK) │ quantity│      │
│  │ safety_stock │ reorder_point │ eoq │ max_stock │ min_stock│
│  │ UNIQUE(sparepart_id, branch_id)                      │      │
│  └──────────┬───────────────────────────────────────────┘      │
│             │ *                                               │
│             ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                 stock_movements                       │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ id(PK) │ type(in/out/transfer/adjustment) │ quantity │      │
│  │ sparepart_id(FK) │ branch_id(FK) │ destination_branch_id  │
│  │ reference_id │ notes │ created_by(FK) │ created_at │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              restock_recommendations                  │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ id(PK) │ sparepart_id(FK) │ branch_id(FK)            │      │
│  │ current_stock │ reorder_point │ recommended_qty      │      │
│  │ urgency(low/med/high/critical) │ status(pending/     │      │
│  │   ordered/postponed) │ notes | postpone_reason       │      │
│  │ postpone_until │ UNIQUE(sparepart_id, branch_id)     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                purchase_orders                        │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ id(PK) │ po_number │ supplier_id(FK) │ branch_id(FK) │      │
│  │ status(draft/pending/approved/received/cancelled)    │      │
│  │ total_amount │ notes │ requested_by(FK) │ approved_by│      │
│  │ approved_at │ received_at │ created_at │ updated_at  │      │
│  └────────────────────────┬─────────────────────────────┘      │
│                           │ 1                                 │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              purchase_order_items                    │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ id(PK) │ purchase_order_id(FK) │ sparepart_id(FK)    │      │
│  │ quantity │ unit_price │ total_price │ received_qty   │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              forecast_runs                            │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ id(PK) │ method(xgboost) │ period_start │ period_end │      │
│  │ status(completed) │ created_at                       │      │
│  └────────────────────────┬─────────────────────────────┘      │
│                           │ 1                                 │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              forecast_series                         │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ id(PK) │ forecast_run_id(FK) │ sparepart_id(FK)     │      │
│  │ branch_id │ month │ predicted_quantity               │      │
│  │ confidence_lower │ confidence_upper                  │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                               │
│  ┌────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ activities │  │  audit_logs    │  │  notifications │       │
│  ├────────────┤  ├────────────────┤  ├────────────────┤       │
│  │ id(PK)     │  │ id(PK)         │  │ id(PK)         │       │
│  │ user_id    │  │ user_id        │  │ user_id        │       │
│  │ action     │  │ action         │  │ title          │       │
│  │ entity_type│  │ entity_type    │  │ message        │       │
│  │ entity_id  │  │ entity_id      │  │ type           │       │
│  │ description│  │ old_data(JSONB)│  │ is_read        │       │
│  │ created_at │  │ new_data(JSONB)│  │ link           │       │
│  └────────────┘  │ ip_address     │  │ created_at     │       │
│                  │ created_at     │  └────────────────┘       │
│                  └────────────────┘                           │
│  ┌────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ settings   │  │ login_history  │  │ api_tokens     │       │
│  ├────────────┤  ├────────────────┤  ├────────────────┤       │
│  │ id(PK)     │  │ id(PK)         │  │ id(PK)         │       │
│  │ branch_id  │  │ user_id        │  │ user_id        │       │
│  │ key        │  │ ip_address     │  │ name           │       │
│  │ value(JSONB)│  │ user_agent     │  │ token_hash     │       │
│  │ updated_by │  │ login_at       │  │ is_active      │       │
│  └────────────┘  │ logout_at      │  └────────────────┘       │
│                  └────────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Daftar Tabel

| No | Tabel | Fungsi |
|----|-------|--------|
| 1 | `profiles` | Data profil pengguna (role, branch, dll) |
| 2 | `branches` | Data cabang toko |
| 3 | `categories` | Kategori sparepart |
| 4 | `suppliers` | Pemasok sparepart |
| 5 | `spareparts` | Data master sparepart |
| 6 | `branch_stocks` | Stok per sparepart per cabang |
| 7 | `stock_movements` | Riwayat pergerakan stok (in/out/transfer/adjustment) |
| 8 | `restock_recommendations` | Rekomendasi restock otomatis |
| 9 | `purchase_orders` | Data Purchase Order |
| 10 | `purchase_order_items` | Item dalam Purchase Order |
| 11 | `forecast_runs` | Riwayat eksekusi prediksi ML |
| 12 | `forecast_series` | Hasil prediksi per bulan per sparepart per cabang |
| 13 | `activities` | Log aktivitas pengguna |
| 14 | `audit_logs` | Audit trail perubahan data |
| 15 | `notifications` | Notifikasi untuk pengguna |
| 16 | `login_history` | Riwayat login/logout |
| 17 | `settings` | Pengaturan sistem (global & per cabang) |
| 18 | `api_tokens` | Token API untuk integrasi eksternal |

### 6.3 Trigger Database

```sql
-- Trigger: Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update stock otomatis saat stock_movements di-INSERT
CREATE TRIGGER trg_update_stock_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_movement();
```

---

## 7. API Endpoints

### 7.1 Health Check

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/health` | ❌ | Status server backend |

### 7.2 Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/auth/register` | ❌ | - | Register user baru (via Supabase Admin API) |
| POST | `/auth/login` | ❌ | - | Login email/password |
| POST | `/auth/otp/request` | ❌ | - | Request kode OTP ke email |
| POST | `/auth/otp/verify` | ❌ | - | Verifikasi OTP |
| POST | `/auth/google` | ❌ | - | Login dengan Google OAuth |
| POST | `/auth/logout` | ✅ | - | Logout (sign out dari Supabase) |
| POST | `/auth/login-history/login` | ✅ | - | Catat login ke history |
| POST | `/auth/login-history/logout` | ✅ | - | Catat logout ke history |
| GET | `/auth/login-history` | ✅ | - | Riwayat login user |

### 7.3 User Profile (`/api/v1`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/me` | ✅ | - | Profile user saat ini |
| PATCH | `/me` | ✅ | - | Update profile sendiri |

### 7.4 Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/dashboard/summary` | ✅ | - | KPI summary (total stock, value, status, dll) |
| GET | `/dashboard/demand-forecast` | ✅ | - | Data grafik permintaan (actual vs predicted) |
| GET | `/dashboard/recent-activity` | ✅ | - | 10 aktivitas terbaru |

### 7.5 Inventory (`/api/v1/inventory`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/inventory` | ✅ | - | List sparepart (filter, search, pagination) |
| GET | `/inventory/export/csv` | ✅ | - | Export inventori ke CSV |
| GET | `/inventory/:id` | ✅ | - | Detail sparepart + stock movements |
| POST | `/inventory` | ✅ | super_admin | Buat sparepart baru |
| PATCH | `/inventory/:id` | ✅ | super_admin | Update sparepart |
| POST | `/inventory/:id/stock` | ✅ | - | Penyesuaian stok |
| POST | `/inventory/bulk/transfer` | ✅ | super_admin / branch_admin | Transfer stok antar cabang |

### 7.6 Branches (`/api/v1/branches`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/branches` | ✅ | - | List cabang aktif |
| GET | `/branches/sales-trend` | ✅ | - | Tren penjualan per bulan per cabang |
| GET | `/branches/:id/stocks` | ✅ | - | Stok + top selling di cabang tertentu |

### 7.7 Transactions (`/api/v1/transactions`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/transactions` | ✅ | - | List stock movements (filter, merge transfer, pagination) |
| POST | `/transactions` | ✅ | - | Catat transaksi baru (in/out/transfer/adjustment) |

### 7.8 Restock (`/api/v1/restock`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/restock/live-recommendations` | ✅ | - | Rekomendasi restock live (dari prediksi ML) |
| GET | `/restock/summary` | ✅ | - | Summary restock (by urgency, by status, critical items) |
| GET | `/restock/recommendations` | ✅ | - | List rekomendasi restock |
| GET | `/restock/recommendations/:id` | ✅ | - | Detail rekomendasi |
| POST | `/restock/recommendations/generate` | ✅ | super_admin | Generate rekomendasi otomatis (rule-based) |
| POST | `/restock/recommendations/:id/postpone` | ✅ | - | Tunda/aktifkan rekomendasi |
| GET | `/restock/purchase-orders` | ✅ | - | List PO (pagination, filter) |
| GET | `/restock/purchase-orders/:id` | ✅ | - | Detail PO + items |
| POST | `/restock/purchase-orders` | ✅ | super_admin / branch_admin | Buat PO baru |
| POST | `/restock/purchase-orders/:id/approve` | ✅ | super_admin / branch_admin | Approve PO |
| POST | `/restock/purchase-orders/:id/receive` | ✅ | super_admin / branch_admin | Terima PO (stok masuk) |
| DELETE | `/restock/purchase-orders/:id` | ✅ | super_admin / branch_admin | Batalkan PO |
| GET | `/restock/scheduler/status` | ✅ | super_admin | Status scheduler |
| POST | `/restock/scheduler/trigger` | ✅ | super_admin | Trigger generate manual |

### 7.9 Reports (`/api/v1/reports`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/reports/summary` | ✅ | super_admin | Laporan summary (movements, inventory, trends) |
| GET | `/reports/export/pdf` | ✅ | super_admin | Ekspor PDF (summary/transactions/critical) |
| GET | `/reports/export/excel` | ✅ | super_admin | Ekspor Excel (summary/transactions/critical) |

### 7.10 Settings (`/api/v1/settings`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/settings` | ✅ | - | Settings user (profile, branches, api_tokens) |
| PATCH | `/settings` | ✅ | super_admin | Update settings global |

### 7.11 Users (`/api/v1/users`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/users` | ✅ | super_admin | List users (pagination, filter) |
| GET | `/users/:id` | ✅ | super_admin | Detail user |
| POST | `/users` | ✅ | super_admin | Buat user baru (via Supabase Admin API) |
| PATCH | `/users/:id` | ✅ | super_admin | Update user (role, branch, dll) |
| PATCH | `/users/:id/toggle` | ✅ | super_admin | Aktifkan/nonaktifkan user |

### 7.12 Notifications (`/api/v1/notifications`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/notifications` | ✅ | - | List notifikasi user |
| GET | `/notifications/unread-count` | ✅ | - | Jumlah notifikasi belum dibaca |
| PATCH | `/notifications/read-all` | ✅ | - | Tandai semua sudah dibaca |
| PATCH | `/notifications/:id/read` | ✅ | - | Tandai satu notifikasi sudah dibaca |

### 7.13 Audit Logs (`/api/v1/audit-logs`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/audit-logs` | ✅ | super_admin | List audit logs (filter, pagination) |
| GET | `/audit-logs/:id` | ✅ | super_admin | Detail audit log |

### 7.14 References (`/api/v1`)

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/categories` | ✅ | - | List kategori (untuk dropdown) |
| GET | `/suppliers` | ✅ | - | List supplier aktif |

### 7.15 Inventory ML (`/api` — port 5001)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/health` | ❌ | Status service |
| GET | `/api/metrics` | ❌ | Metrics training (MAE, RMSE, R², MAPE) |
| GET | `/api/model-stats` | ❌ | Statistik model (num trees, features) |
| GET | `/api/feature-importance` | ❌ | Feature importance dari model |
| GET | `/api/predictions` | ❌ | Hasil prediksi terbaru (dari DB) |
| GET | `/api/output` | ❌ | Output enriched (stok + safety stock + eoq + dll) |
| GET | `/api/spareparts` | ❌ | List spareparts (dari Supabase) |
| GET | `/api/branches` | ❌ | List branches (dari Supabase) |
| POST | `/api/train` | ❌ | Training model XGBoost |
| GET | `/api/train-status` | ❌ | Status training (async mode) |
| GET | `/api/train-log` | ❌ | Log training (async mode) |
| GET | `/api/train-params` | ❌ | Parameter training yang bisa di-tuning |
| POST | `/api/predict` | ❌ | Generate prediksi + simpan ke DB |
| GET | `/api/auto-status` | ❌ | Status auto-predict scheduler |
| GET | `/dashboard` | ❌ | HTML dashboard monitoring |

---

## 8. Training Model Machine Learning

### 8.1 Feature Engineering

Model XGBoost menggunakan fitur-fitur berikut:

| Fitur | Deskripsi | Cara Hitung |
|-------|-----------|-------------|
| `lag_1` | Permintaan bulan sebelumnya | `shift(1)` per (sparepart, branch) |
| `lag_2` | Permintaan 2 bulan sebelumnya | `shift(2)` per (sparepart, branch) |
| `lag_3` | Permintaan 3 bulan sebelumnya | `shift(3)` per (sparepart, branch) |
| `rolling_mean_3` | Rata-rata 3 bulan terakhir | `rolling(3).mean()` |
| `month_sin` | Encoding siklus musiman | `sin(2π × month / 12)` |
| `month_cos` | Encoding siklus musiman | `cos(2π × month / 12)` |
| `quarter` | Kuartal (1-4) | `dt.quarter` |
| `price` | Harga sparepart | Dari tabel spareparts |
| `sparepart_encoded` | Target encoding per sparepart | Rata-rata demand per sparepart ID |
| `branch_encoded` | Target encoding per cabang | Rata-rata demand per branch ID |

### 8.2 Arsitektur Training

```
Data Flow Training:
───────────────────

fetch_out_movements() ──┐
   SELECT * FROM         │
   stock_movements       │
   WHERE type = 'out'    │
   LIMIT 5000            │
                         ▼
                 ┌──────────────────┐
                 │  Group by        │
                 │  (sparepart_id,  │
                 │   branch_id,     │
                 │   month)         │
                 │  → SUM(quantity) │
                 └────────┬─────────┘
                          ▼
                 ┌──────────────────┐
                 │  Feature         │
                 │  Engineering     │
                 │  · lag_1,2,3     │
                 │  · rolling_mean  │
                 │  · month sin/cos │
                 │  · quarter       │
                 │  · price         │
                 │  · encoded ID    │
                 └────────┬─────────┘
                          ▼
                 ┌──────────────────┐
                 │  Train/Test Split│
                 │  80% / 20%       │
                 │  (time-series)   │
                 └────────┬─────────┘
                          ▼
                 ┌──────────────────┐
                 │  XGBRegressor    │
                 │  · n_estimators: │
                 │    300           │
                 │  · early_stop: 20│
                 │  · eval: rmse   │
                 └────────┬─────────┘
                          ▼
           ┌──────────────┴──────────────┐
           │                             │
           ▼                             ▼
  ┌──────────────────┐         ┌──────────────────┐
  │  Save Model      │         │  Save Metrics    │
  │  xgboost_model   │         │  metrics.json    │
  │  .json           │         │  MAE, RMSE, R²,  │
  │                  │         │  MAPE, residuals │
  └──────────────────┘         └──────────────────┘
```

### 8.3 XGBoost Tunable Parameters

| Parameter | Default | Range | Deskripsi |
|-----------|---------|-------|-----------|
| `max_depth` | 6 | 2-12 | Kedalaman pohon. Besar → kompleks, risiko overfitting |
| `learning_rate` | 0.08 | 0.01-0.5 | Langkah koreksi. Kecil → lebih teliti butuh lebih banyak rounds |
| `subsample` | 0.8 | 0.3-1.0 | Fraksi sampel per pohon. Kecil → random, kurangi overfitting |
| `colsample_bytree` | 0.8 | 0.3-1.0 | Fraksi fitur per pohon. Kecil → tiap pohon lihat subset berbeda |
| `min_child_weight` | 1 | 1-10 | Minimal sampel per leaf. Naikkan untuk cegah overfitting |
| `gamma` | 0 | 0-5 | Minimal loss reduction. Filter split tidak signifikan |
| `reg_alpha` | 0 | 0-10 | Regularisasi L1. Membuat model lebih sparse |
| `reg_lambda` | 1 | 0-10 | Regularisasi L2. Bobot kecil → model lebih stabil |

### 8.4 Metrik Evaluasi

| Metrik | Rumus | Interpretasi |
|--------|-------|--------------|
| **MAE** | `mean(|y_true - y_pred|)` | Rata-rata kesalahan absolut. Semakin kecil semakin baik |
| **RMSE** | `sqrt(mean((y_true - y_pred)²))` | Kesalahan RMS. Memberi bobot lebih pada error besar |
| **R²** | `1 - SS_res / SS_tot` | Proporsi varians yang dijelaskan model. Makin dekat ke 1 makin baik |
| **MAPE** | `mean(|(y_true - y_pred) / y_true|) × 100` | Persentase error rata-rata |
| **Residuals Std** | `std(residuals, ddof=1)` | Standar deviasi residual. Digunakan untuk confidence interval |

---

## 9. Sistem Prediksi (Forecasting)

### 9.1 Auto-Predict Scheduler

Sistem prediksi berjalan **otomatis setiap 1 jam** di service `inventory_ml`. Flow:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  APScheduler (interval=1 jam)                                           │
│                                                                         │
│  1. Cek last_movement_date dari Supabase                                │
│  2. Cek last_predict_state dari file last_predict.json                  │
│  3. Bandingkan: apakah ada movement BARU?                               │
│     ┌─── Tidak → SKIP (tidak perlu predict ulang)                      │
│     └─── Ya →                                                          │
│          4. Load model XGBoost dari file                               │
│          5. Fetch: movements, spareparts, branches, stocks             │
│          6. Build features untuk prediction                            │
│          7. Predict future (3 bulan ke depan)                          │
│          8. Hitung: safety_stock, reorder_point, eoq, max_stock       │
│          9. Hapus forecast_series lama                                │
│         10. Insert forecast_runs baru + forecast_series baru           │
│         11. Update branch_stocks dengan parameter baru                 │
│         12. Simpan last_predict_state                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Inventory Optimization Parameters (Dinamis)

Setelah prediksi, sistem menghitung parameter inventori optimal per (sparepart × branch):

| Parameter | Rumus | Fungsi |
|-----------|-------|--------|
| **Safety Stock** | `Z × RMSE × √(lead_time / 30)` | Stok pengaman untuk mengantisipasi variasi permintaan |
| **Reorder Point (ROP)** | `demand_during_lead_time + safety_stock` | Titik dimana harus order ulang |
| **EOQ** | `√(2 × annual_demand × order_cost / holding_cost)` | Kuantitas pesanan ekonomis |
| **Max Stock** | `ROP + EOQ` | Batas stok maksimum |
| **Confidence Interval** | `predicted ± Z × RMSE` | Rentang kepercayaan 95% untuk prediksi |

Dimana:
- `Z = 1.96` (tingkat kepercayaan 95%)
- `holding_cost = price × 15%`
- `demand_during_lead_time = predicted × (lead_time / 30)`
- `annual_demand = predicted × 12`

### 9.3 Live Recommendations

Setelah prediksi ML selesai, endpoint `/restock/live-recommendations` akan:

1. Mengambil forecast_series terbaru
2. Mengagregasi prediksi per (sparepart, branch)
3. Membandingkan dengan stok saat ini
4. Mengecek apakah ada PO aktif yang pending/approved (exclude dari rekomendasi)
5. Menghapus rekomendasi pending lama
6. Membuat rekomendasi baru untuk item dengan status `critical` atau `high`
7. Mengembalikan sorted list berdasarkan urgensi

---

## 10. Sistem Restock & Purchase Order

### 10.1 Generate Rekomendasi (Rule-Based)

Selain dari ML, sistem memiliki `generate()` rule-based yang dijalankan via:

- **Scheduler otomatis**: `node-cron` setiap pukul 06:00 (konfigurabel via `RESTOCK_CRON_SCHEDULE`)
- **Manual trigger**: super_admin via tombol "Generate" atau API `/restock/recommendations/generate`

Logika generate:

```
Untuk setiap (sparepart × branch):
  1. Hitung konsumsi bulanan (rata-rata 90 hari terakhir)
  2. Hitung days_to_stockout
  3. Tentukan urgensi:
     - stok ≤ safety_stock          → CRITICAL (qty = 2×ROP - stok)
     - stok ≤ reorder_point         → HIGH     (qty = 2×ROP - stok)
     - stok ≤ ROP × 1.5            → MEDIUM   (qty = ROP - stok)
     - stok ≥ 5×min_stock          → OVERSTOCK (qty = 0)
     - lainnya                     → LOW      (qty = 0)
  4. Simpan/cache ke restock_recommendations
  5. Jika ada item critical → kirim notifikasi ke super_admin
```

### 10.2 Purchase Order Lifecycle

```
          ┌─────────────────────────────────────────────────────────┐
          │              PURCHASE ORDER LIFECYCLE                    │
          │                                                         │
          │  ┌──────────┐                                           │
          │  │  PENDING  │  (status awal setelah dibuat)             │
          │  └────┬─────┘                                           │
          │       │                                                  │
          │       ├───────────[Cancel]───► ┌──────────────┐        │
          │       │                        │  CANCELLED   │        │
          │       │                        └──────────────┘        │
          │       │                                                  │
          │       ▼                                                  │
          │  ┌──────────┐                                           │
          │  │ APPROVED │  (disetujui, menunggu penerimaan)          │
          │  └────┬─────┘                                           │
          │       │                                                  │
          │       ▼                                                  │
          │  ┌──────────┐                                           │
          │  │ RECEIVED │  (barang diterima → stok bertambah)        │
          │  └──────────┘                                           │
          │                                                         │
          │  Validasi status:                                       │
          │  · PENDING  → APPROVED (via approve)                     │
          │  · PENDING  → CANCELLED (via cancel)                     │
          │  · APPROVED → RECEIVED (via receive)                     │
          │  · APPROVED tidak bisa cancel                            │
          │  · RECEIVED → final (tidak bisa diubah)                  │
          └─────────────────────────────────────────────────────────┘
```

### 10.3 Branch Validation

**branch_admin**:
- Hanya bisa membuat PO untuk cabang sendiri (`profiles.branch`)
- Hanya bisa approve/cancel/receive PO milik cabang sendiri
- Tidak bisa melihat/mengelola cabang lain

**super_admin**:
- Bisa membuat PO untuk cabang mana pun
- Bisa approve/cancel/receive PO cabang mana pun
- Bisa melihat semua cabang

---

## 11. Pengembangan dengan Metode Prototyping

### Fase 1: Prototipe Awal (Core CRUD)

| Iterasi | Fokus | Output |
|---------|-------|--------|
| 1.1 | Database Schema | SQL migrations + Supabase setup |
| 1.2 | Backend Auth + Profile | Register, Login, JWT, Profile API |
| 1.3 | Manajemen Sparepart | CRUD spareparts + branch_stocks |
| 1.4 | Frontend Landing + Login | Landing page, Login, Register UI |

### Fase 2: Prototipe Fungsional (Transaksi & Inventori)

| Iterasi | Fokus | Output |
|---------|-------|--------|
| 2.1 | Stock Movements | In/Out/Transfer/Adjustment API + Trigger DB |
| 2.2 | Dashboard | KPI cards, grafik, recent activity |
| 2.3 | Branches Page | Stok per cabang, top selling, sales trend |
| 2.4 | Frontend Improvements | Sidebar, navigation, filter, search |

### Fase 3: Prototipe Lanjutan (Restock & Purchase Order)

| Iterasi | Fokus | Output |
|---------|-------|--------|
| 3.1 | Generate Rekomendasi | Rule-based restock + scheduler |
| 3.2 | Purchase Order | CRUD PO + approve/receive workflow |
| 3.3 | Notifications | Notifikasi realtime + unread count |
| 3.4 | Frontend Restock Page | Recommendations + PO tabs |

### Fase 4: Machine Learning Integration

| Iterasi | Fokus | Output |
|---------|-------|--------|
| 4.1 | Data Pipeline | Fetch data dari Supabase → feature engineering |
| 4.2 | XGBoost Training | Train model + save metrics |
| 4.3 | Prediction API | `/api/predict` + save forecast_series |
| 4.4 | Live Recommendations | ML-based recommendations di frontend |

### Fase 5: Enhancement & Deployment

| Iterasi | Fokus | Output |
|---------|-------|--------|
| 5.1 | Reports | PDF + Excel export |
| 5.2 | Settings & Admin | Users CRUD, audit log, settings |
| 5.3 | Security | Role-based access, idle timeout, 401 handler |
| 5.4 | CI/CD | GitHub Actions, Docker, Vercel, Render |
| 5.5 | Responsive UI | Mobile-friendly pages, dark mode |
| 5.6 | Polish | Command palette, detail drawer, OTP, forgot password |

---

## 12. Skenario Testing

### 12.1 Backend (Jest + Supertest)

**Unit Tests** (`backend/src/__tests__/`):

| File | Test | Deskripsi |
|------|------|-----------|
| `middlewares/auth.test.js` | `authenticate` middleware | Token valid → next(), Token invalid → 401 |
| `middlewares/auth.test.js` | `authorize` middleware | Role sesuai → next(), Role tidak sesuai → 403 |
| `routes/restock.test.js` | `createPurchaseOrder` | Buat PO sukses, validasi branch, role |
| `services/authService.test.js` | `registerUser` | Register sukses, duplicate email error |
| `utils/stockStatus.test.js` | `computeStatus` | Kritis, rendah, aman, overstock |
| `utils/stockStatus.test.js` | `computeWorstStatus` | Status terburuk dari array |

### 12.2 Frontend (Vitest + Testing Library)

**Unit Tests** (`frontend/src/__tests__/`):

| File | Test | Deskripsi |
|------|------|-----------|
| `stockStatus.test.ts` | `computeStatus` | Semua kondisi stok |
| `LoginPage.test.tsx` | Render form | Email/password field muncul |
| `InventoryPage.test.tsx` | Render list | Daftar sparepart muncul |

### 12.3 Inventory ML (Pytest)

**Unit Tests** (`inventory_ml/tests/`):

| File | Test | Deskripsi |
|------|------|-----------|
| `test_api.py` | `test_health` | Health endpoint returns 200 |
| `test_api.py` | `test_metrics` | Metrics dengan/tanpa model |
| `test_api.py` | `test_model_stats` | Model stats parsing |
| `test_api.py` | `test_feature_importance` | Feature importance return |
| `test_api.py` | `test_predictions` | Predictions API |
| `test_api.py` | `test_output` | Output enriched API |
| `test_api.py` | `test_compute_status` | Kritis/Menipis/Overstock/Aman |
| `test_api.py` | `test_train_async` | Async training |
| `test_xgboost.py` | `test_train_model_saves_files` | Training → save model + metrics |
| `test_xgboost.py` | `test_train_model_fallback_split` | Small dataset fallback |
| `test_xgboost.py` | `test_load_model` | Load model from file |
| `test_xgboost.py` | `test_predict_future` | Predict with mock model |
| `test_data.py` | `test_fetch_out_movements` | Fetch movements from DB |
| `test_data.py` | `test_build_features` | Feature engineering lengkap |
| `test_data.py` | `test_get_prediction_dates` | Date generation |
| `test_data.py` | `test_build_prediction_features` | Future features construction |

### 12.4 Skenario E2E (Manual)

| No | Skenario | Langkah | Ekspektasi |
|----|----------|---------|------------|
| 1 | Register User Baru | Isi form register | User terdaftar, profile auto-created |
| 2 | Login Email/Password | Input kredensial → Submit | Redirect ke Dashboard |
| 3 | Login Google OAuth | Klik Google → Pilih akun | Redirect ke Dashboard |
| 4 | Forgot Password | Input email → OTP → Reset | Password berubah, login sukses |
| 5 | Dashboard | Lihat KPI, grafik, aktivitas | Data sesuai role (super_admin lihat semua) |
| 6 | Create Sparepart | Isi form → Submit | Sparepart muncul di list |
| 7 | Transfer Stok | Pilih asal/tujuan → Submit | Stok terupdate, activity tercatat |
| 8 | Generate Rekomendasi | Klik Generate | Rekomendasi muncul di tab |
| 9 | Create PO | Pilih rekomendasi → Submit PO | PO pending di tab Pesanan |
| 10 | Approve PO | Klik Approve → Konfirmasi | PO approved, notifikasi terkirim |
| 11 | Receive PO | Klik Receive → Stok masuk | Stok bertambah, PO received |
| 12 | Batalkan PO | Klik Cancel → Konfirmasi | PO cancelled, rekomendasi aktif kembali |
| 13 | Report PDF | Pilih periode → Export PDF | File PDF terdownload |
| 14 | Report Excel | Pilih periode → Export Excel | File Excel terdownload |
| 15 | Settings - Users | Edit role user | Role berubah, akses sesuai |
| 16 | Idle Timeout | Diam 15 menit | Warning toast → Auto-logout |
| 17 | Unauthorized Access | Akses endpoint tanpa token | 401 → Auto-logout |
| 18 | Dark Mode | Klik toggle theme | Tema berubah, preferensi tersimpan |
| 19 | Branch Admin Restrict | Login sebagai branch_admin | Hanya lihat cabang sendiri |
| 20 | ML Training | POST /api/train | Model tersimpan, metrics terupdate |

---

## 13. CI/CD Pipeline

### 13.1 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GITHUB ACTIONS PIPELINE                           │
│                                                                         │
│  Push ke main/develop atau PR                                           │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    CI WORKFLOW (ci.yml)                         │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │    │
│  │  │ Backend (Jest)   │  │ Frontend (Vitest) │  │Inventory ML   │  │    │
│  │  │ · npm ci         │  │ · npm ci          │  │· pip install  │  │    │
│  │  │ · npm test      │  │ · npm test       │  │ · pytest      │  │    │
│  │  │ → Summary        │  │ · npm run build  │  │ · flake8 lint │  │    │
│  │  └──────────────────┘  └──────────────────┘  │ → Summary     │  │    │
│  │                                               └───────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│         │ (hanya jika push ke main && CI sukses)                        │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                DOCKER BUILD WORKFLOW (docker-build.yml)          │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  1. Checkout + fetch-depth: 2 (untuk diff)                      │    │
│  │  2. Check changed paths:                                        │    │
│  │     · backend/ berubah? → build backend image                   │    │
│  │     · inventory_ml/ berubah? → build ML image                   │    │
│  │  3. Login ke GHCR (GitHub Container Registry)                   │    │
│  │  4. Build & push image ke GHCR:                                  │    │
│  │     · ghcr.io/ryfless/sparetrack-backend:latest                 │    │
│  │     · ghcr.io/ryfless/sparetrack-backend:{sha}                  │    │
│  │     · ghcr.io/ryfless/sparetrack-inventory-ml:latest            │    │
│  │     · ghcr.io/ryfless/sparetrack-inventory-ml:{sha}             │    │
│  │  5. Trigger Render Deploy Hook (via curl POST)                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                RENDER DEPLOYMENT                                 │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  Render Web Services:                                           │    │
│  │  · sparetrack-backend (port 3001) - tarik image dari GHCR      │    │
│  │  · sparetrack-inventory-ml (port 5001) - tarik image dari GHCR │    │
│  │                                                                  │    │
│  │  Setiap deploy:                                                  │    │
│  │  1. Tarik image :latest dari GHCR                               │    │
│  │  2. Restart container                                           │    │
│  │  3. Health check (GET /health)                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│                    VERCEL DEPLOYMENT (Frontend)                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  Auto-deploy dari GitHub (connected via Vercel Git Integration) │    │
│  │  Setiap push ke main → Vercel build + deploy otomatis           │    │
│  │  Zero-config SPA (Vite output)                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Struktur Workflow CI

```yaml
name: CI
on: push/PR ke develop/main
jobs:
  backend:    # npm ci → npm test → tail summary
  frontend:   # npm ci → npm test → npm run build
  inventory-ml: # pip install → pytest → flake8
```

### 13.3 Struktur Workflow Docker Build

```yaml
name: Docker Build
on: workflow_run CI sukses di main
jobs:
  docker:
    - Checkout (fetch-depth: 2)
    - git diff HEAD~1 HEAD untuk deteksi perubahan
    - Login GHCR
    - Build + push backend (jika backend/ berubah)
    - Build + push inventory_ml (jika inventory_ml/ berubah)
    - Trigger Render Deploy Hook via curl POST
```

### 13.4 Render Deploy Hooks

Setiap service di Render memiliki Deploy Hook URL yang disimpan di GitHub Secrets:
- `RENDER_DEPLOY_HOOK_BACKEND` → `curl -X POST https://api.render.com/deploy/srv-xxx?key=yyy`
- `RENDER_DEPLOY_HOOK_INVENTORY_ML` → `curl -X POST https://api.render.com/deploy/srv-zzz?key=www`

### 13.5 Keep-Alive (Prevent Sleep)

Render free tier akan sleep setelah 15 menit idle. Untuk mencegah:
- **cron-job.org**: Setiap 10 menit panggil `GET /health` backend dan `GET /api/health` ML
- **Render Cron Job**: Alternatif jika sudah upgrade ke paid tier

---

## 14. Deployment & Cara Mengakses

### 14.1 Prasyarat

| Layanan | Akun | Biaya |
|---------|------|-------|
| [GitHub](https://github.com) | Free | Gratis |
| [Supabase](https://supabase.com) | Free tier | Gratis (2 DB, 50K auth users) |
| [Vercel](https://vercel.com) | Hobby | Gratis |
| [Render](https://render.com) | Free tier | Gratis (2 services, sleep setelah idle) |
| [GitHub Container Registry](https://ghcr.io) | Included | Gratis |
| [cron-job.org](https://cron-job.org) | Free | Gratis |

### 14.2 Langkah Deployment

#### A. Setup Supabase

```bash
1. Buat project di https://supabase.com
2. SQL Editor → jalankan semua file migration:
   - backend/src/migrations/001_core_tables.sql
   - backend/src/migrations/002_grant_permissions.sql
   - backend/src/migrations/003_restock_forecast_audit.sql
   - backend/src/migrations/004_indexes.sql (s/d 016)
3. Authentication > Settings:
   - Site URL: https://[your-vercel-domain].vercel.app
   - Redirect URLs: https://[your-vercel-domain].vercel.app/**
4. Authentication > Providers:
   - Enable Google → Input Client ID & Secret
5. Project Settings > API:
   - Copy Project URL (SUPABASE_URL)
   - Copy anon public key (SUPABASE_ANON_KEY)
   - Copy service_role key (SUPABASE_SERVICE_ROLE_KEY)
```

#### B. Deploy Frontend ke Vercel

```bash
1. Buka https://vercel.com
2. Import GitHub repository (Ryfless/SpareTrack)
3. Framework: Vite
4. Root directory: frontend/
5. Environment variables:
   VITE_SUPABASE_URL = https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJxxx
   VITE_API_URL = https://[your-render-backend].onrender.com/api/v1
6. Deploy → Auto-deploy on every push to main
```

#### C. Deploy Backend & ML ke Render (via Docker)

Render menggunakan **existing image dari GHCR**. Pipeline:

```bash
1. GitHub Actions akan:
   a. Build Docker image
   b. Push ke ghcr.io/ryfless/sparetrack-backend:latest
   c. Push ke ghcr.io/ryfless/sparetrack-inventory-ml:latest
   d. Trigger Render Deploy Hook

2. Di Render Dashboard:
   - New Web Service → Deploy an existing image from a registry
   - Image: ghcr.io/ryfless/sparetrack-backend:latest
   - Port: 3001
   - Environment variables:
     SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
     ALLOWED_ORIGINS = https://[vercel-domain].vercel.app
     FRONTEND_URL = https://[vercel-domain].vercel.app
     NODE_ENV = production
     FORCE_SCHEDULER = true

   - Image: ghcr.io/ryfless/sparetrack-inventory-ml:latest
   - Port: 5001
   - Environment variables:
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

#### D. Setup Secrets di GitHub

| Secret | Value |
|--------|-------|
| `RENDER_DEPLOY_HOOK_BACKEND` | URL deploy hook backend dari Render |
| `RENDER_DEPLOY_HOOK_INVENTORY_ML` | URL deploy hook ML dari Render |

#### E. Setup Keep-Alive

1. Buka https://cron-job.org
2. Buat 2 cron job (interval 10 menit):
   - `GET https://[your-render-backend].onrender.com/health`
   - `GET https://[your-render-ml].onrender.com/api/health`

### 14.3 URL Akses

| Komponen | URL |
|----------|-----|
| **Frontend** | `https://[vercel-domain].vercel.app` |
| **Backend API** | `https://[render-backend].onrender.com` |
| **ML API** | `https://[render-ml].onrender.com` |
| **ML Dashboard** | `https://[render-ml].onrender.com/dashboard` |
| **Supabase Studio** | `https://supabase.com/dashboard/project/[ref]` |

---

## 15. Environment Variables

### 15.1 Backend (`backend/.env`)

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `PORT` | Port server (default 3001) | `3001` |
| `SUPABASE_URL` | URL project Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon public key | `eyJxxx` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (untuk admin operations) | `eyJxxx` |
| `FRONTEND_URL` | URL frontend untuk CORS | `http://localhost:5173` |
| `ALLOWED_ORIGINS` | Daftar origin CORS (comma-separated) | `http://localhost:5173,https://sparetrack.vercel.app` |
| `RESTOCK_CRON_SCHEDULE` | Cron expression untuk auto-generate | `0 6 * * *` |
| `FORCE_SCHEDULER` | Paksa scheduler jalan di non-prod | `true` |
| `NODE_ENV` | Environment mode | `production` |

### 15.2 Frontend (`frontend/.env`)

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `VITE_SUPABASE_URL` | URL project Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon public key | `eyJxxx` |
| `VITE_API_URL` | Base URL backend API | `http://localhost:3001/api/v1` |

### 15.3 Inventory ML (`inventory_ml/.env`)

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `SUPABASE_URL` | URL project Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJxxx` |

---

## 16. Pengaturan Keamanan

### 16.1 Autentikasi & Otorisasi

```
Request → [authenticate] → [authorize(roles)] → Controller
              │                     │
              ▼                     ▼
        Verify JWT token      Query profiles.role
        (Supabase Auth)       (Supabase Admin)
              │                     │
              ▼                     ▼
        req.user = user       req.userRole = role
```

- **authenticate**: Memvalidasi JWT token dari header `Authorization: Bearer <token>`
- **authorize**: Mengecek role dari database (`profiles.role`) — bukan dari JWT metadata
- **401**: Token invalid/expired → frontend dispatch `auth:expired` → auto-logout
- **403**: Role tidak memiliki akses → error "Forbidden: insufficient role"

### 16.2 Service Role vs Anon Key

| Client | Key | Akses |
|--------|-----|-------|
| `supabase` (frontend) | Anon Key | Terbatas (RLS aktif) |
| `supabaseAdmin` (backend) | Service Role Key | Bypass RLS, full akses |

### 16.3 CORS

```javascript
// Backend: Function-based origin
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
```

### 16.4 Idle Session Timeout

- 15 menit tanpa aktivitas → auto-logout
- Event listener: `mousemove`, `mousedown`, `click`, `keydown`, `touchstart`, `scroll`, `wheel`, `visibilitychange`
- Warning toast pada menit ke-14: "Sesi akan berakhir 1 menit lagi"
- Tombol "Saya disini" untuk mereset timer

### 16.5 401 Auto-Logout

Semua API request melalui `client.ts` yang secara otomatis:
```typescript
if (response.status === 401) {
  window.dispatchEvent(new CustomEvent('auth:expired'));
}
```

---

© 2026 SpareTrack. Dibangun dengan React, Express, XGBoost, dan Supabase.
