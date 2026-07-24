# SpareTrack — Progress Summary

**Multi-Branch Spare Parts Management System**  
React + TypeScript (Frontend) · Express 5 + Supabase (Backend)

---

## 1. Ringkasan Project

SpareTrack adalah sistem manajemen sparepart multi-cabang dengan fitur:

- Manajemen inventory & stok per cabang
- Transaksi stok masuk/keluar/transfer/adjustment
- Rekomendasi restock otomatis + Purchase Order
- Forecasting (Simple Moving Average)
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

---

## 3. Detail Capaian per Modul

### 3.1. Database & Migration

7 file migration berjalan idempotent:

| File | Isi |
|------|-----|
| `001_core_tables.sql` | Tabel: profiles, branches, categories, suppliers, spareparts, branch_stocks, stock_movements + seed data branch/category/supplier |
| `003_restock_forecast_audit.sql` | Tabel: restock_recommendations, purchase_orders, purchase_order_items, forecast_runs, forecast_series, activities, audit_logs, notifications, api_tokens, settings + stock consistency trigger + 30 sparepart seed |
| `004_indexes.sql` | 30+ performance indexes |
| `005_max_stock.sql` | Kolom `max_stock` di spareparts |
| `006_fix_overstock.sql` | Fix CHECK constraint tambah `overstock` |
| `007_theme_preference.sql` | Kolom `theme_preference TEXT` di profiles |

### 3.2. Auth

- Google OAuth via Supabase — **redirect flow** (bukan popup)
- `onAuthStateChange` listener di `App.tsx` untuk auto-sync session
- Session management: login, logout, protected routes
- Role-based: `super_admin`, `branch_admin`
- Profile CRUD via `supabaseAdmin` (service role) — bypass RLS
- Dark mode tersimpan di `profiles.theme_preference`

### 3.3. REST API (Backend)

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/login`, `/auth/google`, `/auth/logout`, `GET /me` |
| **Dashboard** | `GET /dashboard/summary`, `/dashboard/activities` |
| **Inventory** | `GET /inventory`, `GET /inventory/:id`, `POST /inventory`, `PATCH /inventory/:id`, `POST /inventory/:id/stock` |
| **Branches** | `GET /branches`, `GET /branches/:id/stocks` |
| **Transactions** | `GET /transactions`, `POST /transactions` |
| **Restock** | `GET /restock/summary`, `POST /restock/recommendations/generate`, `GET /restock/recommendations`, `GET /restock/recommendations/:id`, `POST /restock/recommendations/:id/approve`, `POST /restock/recommendations/:id/reject`, `GET /restock/purchase-orders`, `POST /restock/purchase-orders`, `POST /restock/purchase-orders/:id/approve`, `POST /restock/purchase-orders/:id/receive`, `DELETE /restock/purchase-orders/:id` |
| **Forecast** | `GET /forecast/runs`, `GET /forecast/runs/:id`, `POST /forecast/runs`, `GET /forecast/series` |
| **Reports** | `GET /reports/summary`, `GET /reports/export/pdf`, `GET /reports/export/excel` |
| **Audit Logs** | `GET /audit-logs` |
| **Settings** | `GET /settings`, `PATCH /settings` |
| **References** | `GET /categories`, `GET /suppliers` |
| **Users** | `GET /users`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/toggle-active` |

Semua service menggunakan `supabaseAdmin` (service role key) untuk bypass RLS, kecuali auth operations yang tetap pakai `supabase`.

### 3.4. Frontend Pages

| Halaman | Data dari API | Fitur Kunci |
|---------|--------------|-------------|
| **DashboardPage** | KPI, aktivitas, forecast, rekomendasi, branches | Action center, quick actions, demand forecast chart, restock urgent list |
| **InventoryPage** | List sparepart + server-side filter + pagination | Search debounce, filter status/kategori/supplier/sort, DetailDrawer, stock modals, bulk transfer |
| **TransactionsPage** | List transaksi + filter type + branch filter | Modals in/out/transfer, BranchSelect filter |
| **RestockPage** | Rekomendasi restock + Purchase Orders | Group by urgency, generate, approve/reject, PO lifecycle (pending→approve→receive→cancel), Struk receipt |
| **BranchesPage** | Cabang + stok per cabang + heatmap | Risk indicator, stock matrix heatmap |
| **ReportsPage** | Summary laporan + date range + branch filter | KPI cards, critical items list, export PDF/Excel |
| **SettingsPage** | Profil, settings, users, audit logs | Tabs general/appearance/notifikasi/parameter/pengguna/audit |

### 3.5. Perbaikan Kunci

#### Inventory (Prompt 6 & 15)
- Filter `supplier_id`, server-side filtering (status/kategori/supplier/search/sort)
- Transfer flow: `destination_branch_id` → dual movement (`out` + `in`)
- Pagination real dengan page/limit/total_pages
- DetailDrawer: stok buttons buka modal, sparkline real, insight real
- **Fix unmount**: `!selectedPart` dihapus dari kondisi render → page tetap mounted saat drawer terbuka
- **Stock modal prefill**: sparepart otomatis terisi, dropdown sparepart disembunyikan, stok cabang tampil
- **Pagination + status filter**: backend fetch all, enrich, filter in-memory, `.slice()` pagination → count akurat
- **Status counts**: `computeStatusCounts()` → `meta.counts` di response → card baca dari sana

#### Restock (Prompt 7, 10, 11, 14)
- Generate rekomendasi: hitung stok, konsumsi 3 bulan, urgency, upsert
- SMA forecast: 3-periode dari `stock_movements` (out) real, bukan random
- PO lifecycle: **pending** → **approved** → **received** | **cancelled**
- Approve: update status, **tidak update stock**
- Receive: update stock per item + `stock_movements` insert
- Cancel: validasi pending only, revert recommendation status ke `active`
- **PO receipt (Struk)**: button di semua status PO, canvas-based ReceiptView

#### Branch Filter (Prompt 17)
- `BranchSelect.tsx` — shared component di semua halaman
- Filter by `branch_id` di Transactions, Restock (PO), Reports
- Backend `reportsService.summary`: critical_items sekarang filter by `branch_id`
- Branch admin auto-force ke cabangnya + disabled
- Mock BRANCHES dropdown di navbar **dihapus**

#### Dark Mode (Prompt 16)
- Migration 007 tambah `theme_preference TEXT` di `profiles`
- `authService.js`: profile ops pakai `supabaseAdmin`
- `App.tsx`: init dari localStorage, fetch profile baca theme_preference, sync effect ke API
- Error toast jika PATCH gagal

#### Loading Skeleton (Prompt 18)
- Semua halaman pakai `Skeleton` konsisten
- Transactions: row-per-bar skeleton (6 baris × 7 kolom dengan lebar bervariasi)
- Restock: ganti Loader2 spinner header PO → inline Skeleton
- Dashboard: skeleton meliputi action center, quick actions, KPI cards, branch cards, chart, activity list, restock items
- Tidak ada unused `Loader2` imports (kecuali action button processing)

---

## 4. Roadmap — Yang Perlu Ditambahkan / Diperbaiki

### 🔴 High Priority

| Item | Alasan | Saran Implementasi |
|------|--------|-------------------|
| **Scheduled job auto-generate restock** | Rekomendasi masih manual via generate endpoint | Cron job / Supabase pg_cron harian |
| **Notifikasi real-time** | Push notification belum terhubung | WebSocket atau Supabase Realtime |
| **Bulk actions inventory** | Export/transfer/QR masih placeholder | Export CSV via backend, bulk transfer endpoint |
| **max_stock UI** | Kolom max_stock ada di DB tapi belum ada form | Tambah field di AddItemModal / Edit sparepart form |

### 🟡 Medium Priority

| Item | Alasan | Saran Implementasi |
|------|--------|-------------------|
| **Dashboard per-cabang** | Dashboard saat ini aggregate semua cabang | Tambah branch filter + KPI per cabang |
| **Filter cabang di halaman Inventory** | InventoryPage belum punya BranchSelect | Tambah BranchSelect + filter by `branch_id` di inventoryService |
| **Edit sparepart** | Belum ada modal edit untuk sparepart | PATCH endpoint + EditItemModal |
| **PO item pricing** | unit_price di PO items bisa diisi manual + auto dari sparepart | Update CreatePOModal untuk set unit_price |
| **Confirm dialog sebelum aksi** | Hapus PO, cancel, dll perlu konfirmasi | Standarisasi ConfirmModal untuk semua destructive action |
| **Auto-refresh data** | Perlu refresh manual setelah aksi | WebSocket atau polling interval untuk stok/PO |

### 🟢 Low Priority

| Item | Saran Implementasi |
|------|-------------------|
| **Unit test backend** | Jest + supertest untuk semua service |
| **Integration test frontend** | Vitest + React Testing Library |
| **Docker setup** | Dockerfile + docker-compose untuk production |
| **CI/CD pipeline** | GitHub Actions untuk lint + build + test |
| **API documentation** | OpenAPI/Swagger spec |
| **Error tracking** | Sentry atau layanan monitoring |
| **Cache layer** | Redis untuk dashboard/reports caching |
| **Activity log di dashboard** | Recent activity masih terbatas |

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
✅ Database: 7 migration sukses
