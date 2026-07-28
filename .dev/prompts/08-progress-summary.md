# SpareTrack — Progress Summary

**Multi-Branch Spare Parts Management System**  
React + TypeScript (Frontend) · Express 5 + Supabase (Backend)

---

## 1. Ringkasan Project

SpareTrack adalah sistem manajemen sparepart multi-cabang dengan fitur:

- Manajemen inventory & stok per cabang
- Transaksi stok masuk/keluar/transfer/adjustment
- Rekomendasi restock otomatis
- Forecasting (Simple Moving Average)
- Dashboard, laporan, dan pengaturan sistem
- Otentikasi via Google OAuth + Supabase Auth

---

## 2. Progress per Prompt

| Prompt | Fokus | Status |
|--------|-------|--------|
| **01 – Overview & Architecture** | Struktur project, tech stack, konvensi | ✅ Selesai |
| **02 – Auth Supabase** | Google OAuth, session management, RLS | ✅ Selesai |
| **03 – Database & Migration** | 6 migration files, 20+ tabel, trigger, seed | ✅ Selesai |
| **04 – REST API Spec** | 8 module routes, controllers, services | ✅ Selesai |
| **05 – Frontend Integration** | Service layer, 7 pages API-connected | ✅ Selesai |
| **06 – Module Inventory** | Filter supplier, transfer fix, pagination, stock adjustment, max_stock, DetailDrawer | ✅ Selesai |
| **07 – Module Restock & Forecast** | Generate rekomendasi, SMA forecast, summary/detail/reject, PO fix, overstock schema | ✅ Selesai |

---

## 3. Detail Capaian per Modul

### 3.1. Database & Migration

6 file migration berjalan idempotent:

| File | Isi |
|------|-----|
| `001_core_tables.sql` | Tabel: profiles, branches, categories, suppliers, spareparts, branch_stocks, stock_movements + seed data branch/category/supplier |
| `003_restock_forecast_audit.sql` | Tabel: restock_recommendations, purchase_orders, purchase_order_items, forecast_runs, forecast_series, activities, audit_logs, notifications, api_tokens, settings + stock consistency trigger + 30 sparepart seed |
| `004_indexes.sql` | 30+ performance indexes |
| `005_max_stock.sql` | Kolom `max_stock` di spareparts |
| `006_fix_overstock.sql` | Fix CHECK constraint tambah `overstock` |

### 3.2. Auth

- Google OAuth via Supabase — **redirect flow** (bukan popup)
- `onAuthStateChange` listener di `App.tsx` untuk auto-sync session
- Session management: login, logout, protected routes
- Role-based: `super_admin`, `branch_admin`

### 3.3. REST API (Backend)

8 module, masing-masing dengan routes, controller, service:

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/login`, `/auth/google`, `/auth/logout`, `GET /me` |
| **Dashboard** | `GET /dashboard/summary`, `/dashboard/activities` |
| **Inventory** | `GET /inventory`, `GET /inventory/:id`, `POST /inventory`, `PATCH /inventory/:id`, `POST /inventory/:id/stock` |
| **Branches** | `GET /branches`, `GET /branches/:id/stocks` |
| **Transactions** | `GET /transactions`, `POST /transactions` |
| **Restock** | `GET /restock/summary`, `POST /restock/recommendations/generate`, `GET /restock/recommendations`, `GET /restock/recommendations/:id`, `POST /restock/recommendations/:id/approve`, `POST /restock/recommendations/:id/reject`, `GET /restock/purchase-orders`, `POST /restock/purchase-orders` |
| **Forecast** | `GET /forecast/runs`, `GET /forecast/runs/:id`, `POST /forecast/runs`, `GET /forecast/series` |
| **Reports** | `GET /reports/summary` |
| **Settings** | `GET /settings`, `PATCH /settings` |
| **References** | `GET /categories`, `GET /suppliers` |

Semua service menggunakan `supabaseAdmin` (service role key) untuk bypass RLS.

### 3.4. Frontend Integration

7 halaman semuanya terhubung ke API:

| Halaman | Data dari API | Status Khusus |
|---------|--------------|---------------|
| **DashboardPage** | KPI, aktivitas, forecast, rekomendasi restock, branches | ✅ |
| **InventoryPage** | List sparepart + server-side filter + pagination | ✅ Search debounce, filter status/kategori/supplier, sort |
| **TransactionsPage** | List transaksi + filter type | ✅ Modals in/out/transfer |
| **RestockPage** | Rekomendasi restock + approve | ✅ Group by urgency |
| **BranchesPage** | Cabang + stok per cabang + heatmap | ✅ |
| **ReportsPage** | Summary laporan + date range | ✅ Daftar item kritis |
| **SettingsPage** | Profil, settings, API tokens | ✅ Tabs general/appearance/notifikasi/parameter |

### 3.5. Modul Inventory (Prompt 6) — Perbaikan Kunci

| Perbaikan | Detail |
|-----------|--------|
| Filter `supplier_id` | Backend `inventoryService.list()` |
| Fix transfer flow | `destination_branch_id` → dual movement (`out` + `in`) |
| Server-side filtering | Status, kategori, supplier, search, sort, pagination |
| Pagination real | Page/limit/total_pages dari API |
| DetailDrawer stok buttons | Buka modal StokMasuk/StokKeluar (bukan toast) |
| DetailDrawer sparkline | Data dari `recent_movements` real |
| DetailDrawer insight | Analisis 7 transaksi terakhir real |
| Stock adjustment endpoint | `POST /inventory/:id/stock` |
| Filter `is_active` | Backend + frontend types |
| `sort_by` status/supplier/category | Post-sorting in-memory |
| `max_stock` field | Migration + backend logic + frontend types |

### 3.6. Modul Restock & Forecast (Prompt 7) — Perbaikan Kunci

| Perbaikan | Detail |
|-----------|--------|
| Generate rekomendasi | `POST /restock/recommendations/generate` — hitung stok, konsumsi 3 bulan, urgency, upsert |
| SMA forecast real | 3-periode SMA dari `stock_movements` (out), bukan `Math.random()` |
| Fix overstock schema | `006_fix_overstock.sql` — tambah `overstock` ke CHECK constraint |
| Summary endpoint | Total per urgency/status + PO stats |
| Detail recommendation | `GET /restock/recommendations/:id` |
| Reject endpoint | `POST /restock/recommendations/:id/reject` + audit trail |
| Forecast run detail | `GET /forecast/runs/:id` + series data |
| PO → recommendation | `createPurchaseOrder` update status rekomendasi ke `ordered` |
| CreatePOModal supplier | Dropdown pilih supplier, kirim `supplier_id` |
| PostponeModal tipe | Fix `RestockItem` → `RestockRecommendation` |
| PriorityBadge critical | Tambah key `critical` di `PRIORITY_CFG` |

---

## 4. Yang Perlu Ditambahkan / Diperbaiki (Roadmap)

### 🔴 High Priority

| Item | Alasan | Saran Implementasi |
|------|--------|-------------------|
| **Scheduled job auto-generate restock** | Rekomendasi harus digenerate manual via endpoint | Cron job / Supabase pg_cron tiap hari |
| **Manajemen Users (CRUD)** | Settings → Pengguna masih hardcoded | `GET /users`, `POST /users`, `PATCH /users/:id` + backend service |
| **Bulk actions inventory** | Export/transfer/QR masih placeholder | Export CSV via backend, bulk transfer endpoint |
| **Notifikasi real-time** | Push notification belum terhubung | WebSocket atau Supabase Realtime |

### 🟡 Medium Priority

| Item | Alasan | Saran Implementasi |
|------|--------|-------------------|
| **Export PDF/Excel endpoint** | Halaman Reports masih toast stub | `GET /reports/export/pdf` + `GET /reports/export/excel` |
| **Audit log viewer** | Settings → Audit Log masih hardcoded | `GET /audit-logs` endpoint + frontend pagination |
| **Receive PO endpoint** | PO status tidak pernah jadi `received` | `POST /purchase-orders/:id/receive` → update stock + movement |
| **Dark mode persistence** | Dark mode tidak tersimpan di DB | Simpan preferensi ke `profiles` atau `settings` |
| **Branch filter di semua halaman** | Beberapa page tidak filter by branch | Tambah `branch_id` param di transactions, restock, reports |
| **Loading skeleton konsisten** | Beberapa halaman masih loader spinner | Standarisasi skeleton component |

### 🟢 Low Priority

| Item | Saran Implementasi |
|------|-------------------|
| **Unit test backend** | Jest + supertest untuk semua service |
| **Integration test frontend** | Vitest + React Testing Library |
| **Docker setup** | Dockerfile + docker-compose untuk production |
| **CI/CD pipeline** | GitHub Actions untuk lint + build + test |
| **API documentation** | OpenAPI/Swagger spec |
| **Error tracking** | Sentry atau layanan monitoring |
| **max_stock UI** | Form tambah/edit sparepart untuk kolom max_stock |
| **Cache layer** | Redis untuk dashboard/reports caching |

---

## 5. Catatan Teknis

### Env Variables (`.env`)

```
PORT=3001
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWKS_URL=...
DATABASE_URL=postgresql://postgres.[ref]:[password]@[host]:6543/postgres
JWT_SECRET=...
```

### Migration Runner

```bash
npm run migrate
```

Support `DATABASE_URL` env var, auto-fallback ke pooler Supabase.

### Development

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

### Status Build

✅ Backend: Semua file JS lolos `node --check`  
✅ Frontend: Vite build sukses (2300+ modules)  
✅ Database: 6 migration sukses
