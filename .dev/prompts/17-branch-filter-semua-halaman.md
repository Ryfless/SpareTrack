# Prompt: Branch Filter di Semua Halaman

Kamu adalah backend & frontend engineer yang bertanggung jawab menambahkan filter cabang (branch) di halaman Transactions, Restock, dan Reports di SpareTrack.

---

## Latar Belakang

Saat ini hanya halaman Inventory yang punya filter    branch. Halaman Transactions, Restock (PO list), dan Reports menampilkan data dari semua cabang tanpa filter. User super_admin perlu bisa memfilter per cabang.

## Yang Harus Dihasilkan (Backend)

1. **transactionsService.js** — `list(query)` sudah support `branch_id`, pastikan query param `branch_id` diteruskan dengan benar.

2. **restockService.js** — `purchaseOrders(query)` sudah support `branch_id`, pastikan query param `branch_id` diteruskan.

3. **reportsService.js** — `summary()` perlu tambahan parameter `branch_id`:
   ```js
   async function summary(branchId = null)
   ```
   - Filter `stock_movements` by branch untuk transaksi.
   - Filter `restock_recommendations` by branch untuk item kritis.
   - Filter `purchase_orders` by branch untuk PO stats.

4. **reportsController.js** — teruskan `req.query.branch_id` ke `reportsService.summary()`.

5. Pastikan semua endpoint mengembalikan data yang sudah difilter.

## Yang Harus Dihasilkan (Frontend)

1. Buat komponen `BranchSelect` reusable di `components/shared/BranchSelect.tsx`:
   - Dropdown daftar cabang dari API `GET /branches`.
   - Opsi pertama "Semua Cabang".
   - Props: `value`, `onChange`, `className`.
   - Gunakan di header halaman Transactions, Restock, Reports.

2. **TransactionsPage.tsx**:
   - Tambah `BranchSelect` di filter bar.
   - Saat cabang berubah, reload data transaksi dengan `branch_id` baru.
   - Simpan `selectedBranch` di state.

3. **RestockPage.tsx** (bagian Purchase Orders):
   - Tambah `BranchSelect` di atas tabel PO.
   - Filter PO list via `getPurchaseOrders({ branch_id })`.

4. **ReportsPage.tsx**:
   - Tambah `BranchSelect` di samping date range picker.
   - Kirim `branch_id` ke `GET /reports/summary`.

## Aturan Bisnis

- User `branch_admin` hanya bisa melihat data cabangnya sendiri (filter otomatis dari profil).
- User `super_admin` bisa melihat semua cabang, atau memilih cabang tertentu.
- Pilihan cabang tidak perlu persist — default "Semua Cabang" setiap kali buka halaman.

## Output Yang Diinginkan

- Dropdown cabang di halaman Transactions, Restock, Reports.
- Data berubah sesuai cabang yang dipilih.
- Branch admin otomatis terfilter ke cabangnya.
