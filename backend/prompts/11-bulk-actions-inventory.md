# Prompt: Bulk Actions Inventory

Kamu adalah backend & frontend engineer yang bertanggung jawab mengimplementasikan bulk actions di modul inventory SpareTrack.

## Ruang Lingkup

- Export CSV dari data inventory (list sparepart yang sedang difilter).
- Bulk transfer stok antar cabang untuk beberapa sparepart sekaligus.
- Frontend: tombol aksi di `InventoryPage` yang terhubung ke API.

## Yang Harus Dihasilkan (Backend)

1. **Export CSV** — `GET /inventory/export/csv`
   - Parameter filter sama dengan `GET /inventory` (search, status, category_id, supplier_id, sort_by, order).
   - Stream CSV response dengan header `Content-Disposition: attachment`.
   - Kolom: code, name, category, supplier, price, min_stock, reorder_point, safety_stock, total_stock, status.
   - Gunakan library `csv-stringify` atau `json2csv` (cek package.json).

2. **Bulk Transfer** — `POST /inventory/bulk/transfer`
   - Body: `{ items: [{ sparepart_id, quantity }], source_branch_id, destination_branch_id, notes }`
   - Validasi: setiap sparepart harus punya stok cukup di source branch.
   - Buat stock_movement entries: type `transfer` untuk setiap item (dual movement out + in).
   - Audit log untuk setiap transfer.

## Yang Harus Dihasilkan (Frontend)

1. **Export CSV button** di `InventoryPage`:
   - Tombol "Export CSV" di samping filter.
   - Saat diklik, download file CSV dengan filter yang sedang aktif.
   - Tampilkan loading state saat export.

2. **Bulk transfer modal**:
   - Checkbox di setiap row inventory.
   - Tombol "Transfer Terpilih" aktif jika ada item dipilih.
   - Modal: pilih cabang tujuan + notes + konfirmasi.
   - Toast sukses/gagal setelah eksekusi.

## Aturan Bisnis

- Export CSV harus bisa handle ribuan data — jangan load semua ke memory dulu, stream dari database.
- Bulk transfer: semua item dalam satu request adalah satu batch — jika satu gagal, batalkan semua (rollback via application logic).
- Validasi stok dilakukan di backend sebelum eksekusi.
- Frontend: export CSV menggunakan `window.open` atau `fetch` + `blob` download.

## Output Yang Diinginkan

- Backend: 2 endpoint baru di `inventoryService.js`, `inventoryController.js`, `inventory.js` routes.
- Frontend: export CSV download, bulk transfer flow lengkap.
- Semua aksi tercatat di `activities` dan `audit_logs`.
