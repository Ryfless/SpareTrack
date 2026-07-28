# Prompt: Edit Sparepart

Kamu adalah backend & frontend engineer yang bertanggung jawab mengimplementasikan fitur edit sparepart di SpareTrack.

## Ruang Lingkup

- Backend: endpoint `PATCH /inventory/:id` sudah siap — hanya perlu review.
- Frontend: buat `EditItemModal` untuk mengedit data sparepart.
- Integrasi: tombol "Edit" di `DetailDrawer` dan/atau di baris tabel inventory.
- Validasi input dan konfirmasi sebelum submit.

## Yang Harus Dihasilkan (Backend)

1. **Review endpoint yang sudah ada** — `PATCH /inventory/:id` di `backend/src/routes/inventory.js`:
   - Pastikan semua field yang bisa diedit sudah di-handle: `name`, `category_id`, `supplier_id`, `price`, `min_stock`, `max_stock`, `reorder_point`, `safety_stock`, `lead_time`, `unit`, `is_active`.
   - Validasi: jika `category_id` atau `supplier_id` diubah, pastikan referensi valid.
   - Audit log: catat perubahan sparepart di `audit_logs`.

2. **Get by ID** — pastikan `GET /inventory/:id` mengembalikan data lengkap untuk pre-populate form edit.

## Yang Harus Dihasilkan (Frontend)

1. **EditItemModal** — file baru `frontend/src/app/components/modals/EditItemModal.tsx`:
   - Props: `{ open: boolean; sparepartId: string; onClose: () => void; onSuccess: () => void }`.
   - Ambil data sparepart via `getById(sparepartId)` dari `services/inventory` saat modal terbuka.
   - Pre-populate form dengan data yang ada:
     - Nama sparepart (text input)
     - Kategori (dropdown — load dari `services/references`)
     - Supplier (dropdown — load dari `services/references`)
     - Harga (number input)
     - Min stok, max stok, reorder point, safety stock, lead time (number inputs)
     - Unit (text input)
     - Status aktif (toggle/checkbox)
   - Loading skeleton saat fetching data.
   - Validasi: nama wajib diisi, kategori & supplier wajib dipilih, angka tidak boleh negatif.
   - Submit: panggil `update(id, data)` dari `services/inventory`.
   - Loading state pada tombol simpan.
   - Toast sukses/gagal.
   - `onSuccess()` callback untuk refresh data di halaman induk.

2. **Tombol "Edit" di DetailDrawer**:
   - Tambah tombol "Edit Sparepart" di footer `DetailDrawer.tsx` (sejajar dengan tombol Stok Masuk / Stok Keluar).
   - Ikon pensil (`<FiEdit2 />` atau `<LuPencil />`).
   - Klik → buka `EditItemModal` dengan `sparepartId` dari drawer.

3. **Tombol "Edit" di baris tabel Inventory (opsional)**:
   - Icon button di kolom aksi setiap baris sparepart.
   - Langsung buka `EditItemModal`.

4. **State sync setelah edit**:
   - Setelah sukses edit, panggil ulang `loadData()` di InventoryPage.
   - Update data di DetailDrawer tanpa nutup drawer.

## Aturan Bisnis

- Hanya `super_admin` yang bisa edit sparepart (sesuai otorisasi endpoint `PATCH /inventory/:id`).
- Field `code` sparepart TIDAK bisa diedit (primary identifier).
- Field `is_active` jika diubah ke `false`, sparepart tidak muncul di list (kecuali filter status "all").
- Jika sparepart dinonaktifkan (`is_active = false`) yang sedang memiliki stok > 0, tampilkan konfirmasi peringatan.
- Pastikan `AddItemModal.tsx` dan `EditItemModal.tsx` menggunakan komponen bersama (`FormField`, `inputCls`, `Modal`) agar konsisten.

## Output Yang Diinginkan

- `EditItemModal.tsx` — modal edit sparepart lengkap dengan form, validasi, loading state.
- Tombol "Edit" di DetailDrawer (dan opsional di tabel inventory).
- Integrasi penuh dengan backend (PATCH endpoint).
- Data ter-refresh otomatis setelah edit sukses.
