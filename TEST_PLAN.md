# Whitebox Test Plan — SpareTrack

## Ringkasan

| Lapisan | Tool | Estimasi Test | Estimasi Waktu |
|---|---|---|---|
| Backend Services | Jest + Supertest | ~90 | 2–3 hari |
| Backend Routes | Supertest | ~30 | 1–2 hari |
| Frontend Utils & Services | Vitest | ~20 | 1 hari |
| Frontend Components | Vitest + RTL | ~40 | 2 hari |
| Inventory ML (Python) | pytest | ~10 | 1 hari |
| **Total** | | **~190** | **~7 hari** |

---

## Fase 1: Backend — Setup

### DevDependencies (backend)

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0"
  }
}
```

### jest.config.js (backend)

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterSetup: ['<rootDir>/src/__tests__/setup.js'],
};
```

### Mock Pattern — Supabase

Semua service meng-import `supabaseAdmin` dari `config/supabase` (beberapa meng-alias sebagai `supabase`).

```js
// src/__tests__/setup.js
jest.mock('../config/supabase', () => {
  const mockChain = () => mockChain; // default chain return self
  const methods = [
    'select', 'eq', 'neq', 'in_', 'or', 'order', 'limit', 'range',
    'single', 'maybeSingle', 'execute',
    'insert', 'update', 'delete', 'upsert',
  ];
  const mockChain = {};
  for (const m of methods) {
    mockChain[m] = jest.fn().mockReturnValue(mockChain);
  }
  mockChain.then = undefined;

  return {
    supabaseAdmin: mockChain,
    supabase: {
      auth: {
        getUser: jest.fn(),
        signInWithPassword: jest.fn(),
        signInWithOtp: jest.fn(),
        verifyOtp: jest.fn(),
        signInWithOAuth: jest.fn(),
        admin: {
          createUser: jest.fn(),
          signOut: jest.fn(),
          updateUserById: jest.fn(),
        },
      },
    },
  };
});
```

---

## Fase 1A: Backend — Utility Test (~5 test)

**File:** `src/__tests__/utils/stockStatus.test.js`

| Fungsi | Test Case |
|---|---|
| `computeStatus(qty, rop, safety)` | qty = 0 → `"critical"`; qty < safety → `"low"`; qty di antara → `"low"`; qty > rop → `"safe"`; qty >> rop → `"overstock"`; null safety → `"safe"` |
| `computeWorstStatus([])` | Empty → `null` |
| `computeWorstStatus(['safe', 'low'])` | `"low"` (prioritas: critical > low > overstock > safe) |

---

## Fase 1B: Backend — Service Test (~55 test)

### authService (~8 test)

**File:** `src/__tests__/services/authService.test.js`

| Test | Skenario |
|---|---|
| `registerUser` success | `supabaseAdmin.auth.admin.createUser` + insert profile |
| `registerUser` duplicate email | throw error.status 409 |
| `loginUser` success | signInWithPassword + getProfile |
| `loginUser` wrong password | throw invalid login |
| `getProfile` found | return profile object |
| `getProfile` not found | return null |
| `updateProfile` success | update profile + sync metadata |
| `updateProfile` partial | only update provided keys |

### inventoryService (~12 test)

**File:** `src/__tests__/services/inventoryService.test.js`

| Test | Skenario |
|---|---|
| `list` default | return paginated spareparts with branch stocks |
| `list` with filters | search, status, category, branch_id |
| `list` empty | return empty data |
| `detail` found | return sparepart with movements |
| `detail` not found | return null |
| `create` success | insert sparepart |
| `create` duplicate code | throw 409 |
| `create` missing required | throw 400 |
| `update` success | update + audit log |
| `adjustStock` success | create movement + activity |
| `adjustStock` invalid branch | throw 404 |
| `bulkTransfer` role check | branch_admin hanya bisa dari branch sendiri |

### transactionsService (~6 test)

**File:** `src/__tests__/services/transactionsService.test.js`

| Test | Skenario |
|---|---|
| `create` type 'in' | insert movement + update stock |
| `create` type 'out' | insert movement + update stock |
| `create` type 'transfer' | insert movement + destination_branch_id |
| `create` invalid sparepart | throw 404 |
| `list` paginated | return movements with joins |
| `list` empty | return empty |

### restockService (~12 test)

**File:** `src/__tests__/services/restockService.test.js`

| Test | Skenario |
|---|---|
| `generate` success | create recommendations + notify critical |
| `getLiveRecommendations` with forecast | return enriched recs |
| `getLiveRecommendations` no forecast | return empty |
| `createPurchaseOrder` success | insert PO + update recommendations |
| `createPurchaseOrder` no items | throw 400 |
| `approvePurchaseOrder` success | update status + notify |
| `approvePurchaseOrder` already approved | throw 400 |
| `receivePurchaseOrder` success | create movements + update stock |
| `receivePurchaseOrder` not approved | throw 400 |
| `cancelPurchaseOrder` success | reset recommendation status |
| `cancelPurchaseOrder` not pending | throw 400 |
| `postponeRecommendation` | toggle postponed status |

### notificationService (~5 test)

**File:** `src/__tests__/services/notificationService.test.js`

| Test | Skenario |
|---|---|
| `sendNotification` | insert row |
| `sendNotificationToRole` | bulk insert by role |
| `sendNotificationToBranch` | bulk insert by branch_id |
| `listNotifications` paginated | ordered by created_at desc |
| `markAsRead` | set is_read = true |

### branchesService, dashboardService, reportsService, settingsService, usersService, loginHistoryService, auditLogService (~12 test)

Minimum 1 test per fungsi utama (smoke test).

---

## Fase 1C: Backend — Middleware Test (~5 test)

**File:** `src/__tests__/middlewares/auth.test.js`

| Test | Skenario |
|---|---|
| `authenticate` no header | return 401 |
| `authenticate` invalid token | return 401 |
| `authenticate` valid token | call next() with req.user |
| `authorize` matching role | call next() |
| `authorize` insufficient role | return 403 |

---

## Fase 1D: Backend — Route Integration Test (~30 test via Supertest)

### Setup

```js
// src/__tests__/routes/helpers/setup.js
const request = require('supertest');
const app = require('../../app');

// Mock authenticate — inject test user
jest.mock('../../middlewares/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@test.com' };
    req.userRole = 'super_admin';
    next();
  },
  authorize: (...roles) => (req, res, next) => { req.userRole = roles[0]; next(); },
}));
```

### Route Groups

| Group | Endpoint | Test |
|---|---|---|
| Auth | `POST /api/v1/auth/login` | 200 with session, 400 missing fields, 401 wrong password |
| Auth | `POST /api/v1/auth/logout` | 200 success |
| Me | `GET /api/v1/me` | 200 with profile |
| Me | `PATCH /api/v1/me` | 200 updated profile |
| Inventory | `GET /api/v1/inventory` | 200 with pagination, 400 invalid params |
| Inventory | `POST /api/v1/inventory` | 201 created, 409 duplicate |
| Inventory | `GET /api/v1/inventory/:id` | 200 detail, 404 not found |
| Inventory | `POST /api/v1/inventory/bulk/transfer` | 201 transferred, 400 insufficient stock |
| Inventory | `POST /api/v1/inventory/:id/stock` | 201 adjusted |
| Transactions | `POST /api/v1/transactions` | 201 created |
| Transactions | `GET /api/v1/transactions` | 200 list |
| Dashboard | `GET /api/v1/dashboard/summary` | 200 with KPIs |
| Branches | `GET /api/v1/branches` | 200 list |
| Restock | `POST /api/v1/restock/recommendations/generate` | 201 created |
| Restock | `POST /api/v1/restock/purchase-orders` | 201 with items |
| Users | `GET /api/v1/users` | 200 list |
| Settings | `GET /api/v1/settings` | 200 settings |
| Reports | `GET /api/v1/reports/summary` | 200 summary |

---

## Fase 2: Frontend — Setup

### DevDependencies (frontend)

```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^25.0.0"
  }
}
```

### Vitest Config (di `vite.config.ts`)

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    css: true,
  },
});
```

### Mock Pattern — API Client

```ts
// src/__tests__/setup.ts
import '@testing-library/jest-dom';

vi.mock('../services/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
```

---

## Fase 2A: Frontend — Utility Test (~3 test)

**File:** `src/app/utils/stockStatus.test.ts`

- `computeStatus` boundary conditions (sama dengan backend)
- `computeWorstStatus` priority ordering

---

## Fase 2B: Frontend — Service Test (~15 test)

**File:** `src/__tests__/services/inventory.test.ts`
**File:** `src/__tests__/services/transactions.test.ts`
**File:** `src/__tests__/services/branches.test.ts`
**File:** `src/__tests__/services/auth.test.ts`

| Service | Test |
|---|---|
| `inventory.list()` | return data, handle error, empty response |
| `inventory.bulkTransfer()` | success toast, error toast |
| `inventory.exportCsv()` | return Blob, download triggers |
| `inventory.create()` | success, validation error |
| `transactions.create()` | success, error |
| `branches.list()` | return branches, error |
| `auth.login()` | success with profile, failure |

---

## Fase 2C: Frontend — Component Test (~25 test)

### Mock Pattern

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkTransferModal } from '../components/modals/BulkTransferModal';
import { ToastProvider } from '../__mocks__/sonner';

const mockItems = [
  { id: '1', code: 'OLI-10W40', name: 'Oli Mesin', stock_by_branch: [{ branch_id: 'b1', branch_name: 'Cabang A', quantity: 10 }] },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  selectedItems: mockItems,
  userProfile: null,
  currentRole: 'super_admin',
};
```

### BulkTransferModal (~8 test)

**File:** `src/__tests__/components/BulkTransferModal.test.tsx`

| Test | Skenario |
|---|---|
| Render with items | Tampilkan jumlah item, tabel item, tombol Transfer |
| Super admin | Cabang Asal berupa `<select>` |
| Branch admin | Cabang Asal berupa `<div>` readonly + lock icon, auto-pilih branch user |
| Branch admin — match branch | findByText menampilkan nama branch |
| Branch admin — no match | Tampilkan "Memuat..." |
| Validasi submit — no source | toast.error "Pilih cabang asal" |
| Validasi submit — same branch | toast.error "tidak boleh sama" |
| Submit sukses | panggil bulkTransfer(), toast.success, onSuccess(), dispatch refresh |
| Submit gagal | toast.error "Gagal" |

### TransferModal (~5 test)

**File:** `src/__tests__/components/TransferModal.test.tsx`

| Test | Skenario |
|---|---|
| Render form | sparepart select, dari/ke branch, jumlah, catatan |
| Branch admin lock | Dari field readonly |
| Pilih sparepart | fetch detail + tampilkan stock info |
| Submit sukses | create transaction + dispatch refresh |

### Shared Components (~5 test)

**File:** `src/__tests__/components/Modal.test.tsx`
**File:** `src/__tests__/components/StatusBadge.test.tsx`

| Komponen | Test |
|---|---|
| Modal | open/close, children render, Escape close, backdrop click close |
| StatusBadge | render safe/low/critical/overstock dengan label dan class yang benar |

### CommandPalette (~5 test)

**File:** `src/__tests__/components/CommandPalette.test.tsx`

| Test | Skenario |
|---|---|
| Open state | render input dan kategori default |
| Search filter | filter nav & actions berdasarkan query |
| Select sparepart | navigasi ke inventory + onSelectPart dipanggil |
| Escape close | panggil onClose |
| No results | tampilkan "Tidak ada hasil" |

---

## Fase 2D: Frontend — Page Test (~10 test)

### LoginPage (~4 test)

**File:** `src/__tests__/pages/LoginPage.test.tsx`

| Test | Skenario |
|---|---|
| Render form | email & password input, tombol Masuk, tombol Google |
| Empty validation | toast.error jika email/password kosong |
| Submit loading | button disabled + spinner |
| Error display | network error → WifiOff icon; invalid → AlertTriangle |

### SettingsPage (~3 test)

**File:** `src/__tests__/pages/SettingsPage.test.tsx`

| Test | Skenario |
|---|---|
| Tab navigation | klik tab → render konten sesuai |
| About tab | brand, deskripsi, versi, copyright 2026, tidak ada KPI |
| Security tab | form ganti password |

---

## Fase 3: Inventory ML — Python (opsional, ~10 test)

### Setup

```bash
pip install pytest pytest-mock
```

### Test Files

| File | Fungsi | Test |
|---|---|---|
| `tests/test_data.py` | `build_features()` | output shape, kolom lengkap, handling empty |
| `tests/test_data.py` | `build_prediction_features()` | future dates, lag dari history |
| `tests/test_xgboost.py` | `train_model()` | training tidak error, metrics > 0 |
| `tests/test_xgboost.py` | `predict_future()` | output same length as input, no negative values |
| `tests/test_metrics.py` | MAE, RMSE, R², MAPE | hitung dengan data known |
| `tests/test_api.py` | `check_and_predict()` | skip when no new data, run when new data |

---

## Prioritas Eksekusi

| Urutan | Fase | Test | Rationale |
|---|---|---|---|
| 1 | Backend services: auth, inventory, transactions | ~30 | Logika bisnis paling critical |
| 2 | Backend services: restock (PO lifecycle) | ~12 | Paling kompleks |
| 3 | Backend routes (supertest) | ~30 | End-to-end validation |
| 4 | Frontend: BulkTransferModal + TransferModal | ~13 | Paling sering diubah, banyak bug |
| 5 | Frontend: services + utils | ~18 | API layer |
| 6 | Frontend: LoginPage + CommandPalette + shared | ~14 | Halaman utama |
| 7 | Backend middleware + remaining services | ~15 | Pelengkap |

---

## Catatan Penting

1. **Mock Supabase chain** — Pastikan semua method `.select()`, `.eq()`, `.single()`, `.order()`, `.limit()`, `.in_()`, `.or()`, `.execute()`, `.insert()`, `.update()`, `.delete()` di-mock dengan `mockReturnThis()` atau return object chain itu sendiri.

2. **Express v5 export** — `backend/src/app.js` perlu di-refactor untuk export `app` instance agar bisa di-test via supertest.

3. **CommonJS** — Backend pakai `require`; Jest handle ini secara default.

4. **Vitest + Vite alias** — Path alias (`@/`) akan otomatis dikenali Vitest karena menggunakan Vite config.

5. **CustomEvent refresh** — Window event `sparetrack:refresh` di-dispatch oleh modal setelah sukses; spy `window.dispatchEvent` untuk verifikasi.

6. **Toast sonner** — Mock `sonner` untuk memverifikasi toast.success / toast.error dipanggil dengan pesan yang benar.

---

## Struktur Direktori Test

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── setup.js
│   │   ├── utils/
│   │   │   └── stockStatus.test.js
│   │   ├── services/
│   │   │   ├── authService.test.js
│   │   │   ├── inventoryService.test.js
│   │   │   ├── transactionsService.test.js
│   │   │   ├── branchesService.test.js
│   │   │   ├── notificationService.test.js
│   │   │   ├── restockService.test.js
│   │   │   ├── reportsService.test.js
│   │   │   ├── dashboardService.test.js
│   │   │   ├── settingsService.test.js
│   │   │   ├── usersService.test.js
│   │   │   ├── loginHistoryService.test.js
│   │   │   └── auditLogService.test.js
│   │   ├── middlewares/
│   │   │   └── auth.test.js
│   │   └── routes/
│   │       ├── auth.test.js
│   │       ├── inventory.test.js
│   │       ├── transactions.test.js
│   │       ├── dashboard.test.js
│   │       ├── restock.test.js
│   │       ├── branches.test.js
│   │       ├── users.test.js
│   │       ├── reports.test.js
│   │       └── settings.test.js

frontend/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts
│   │   ├── utils/
│   │   │   └── stockStatus.test.ts
│   │   ├── services/
│   │   │   ├── inventory.test.ts
│   │   │   ├── transactions.test.ts
│   │   │   ├── branches.test.ts
│   │   │   └── auth.test.ts
│   │   ├── components/
│   │   │   ├── BulkTransferModal.test.tsx
│   │   │   ├── TransferModal.test.tsx
│   │   │   ├── Modal.test.tsx
│   │   │   ├── StatusBadge.test.tsx
│   │   │   └── CommandPalette.test.tsx
│   │   └── pages/
│   │       ├── LoginPage.test.tsx
│   │       └── SettingsPage.test.tsx
```
