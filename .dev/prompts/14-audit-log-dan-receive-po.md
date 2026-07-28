# Prompt: Audit Log Viewer & Receive Purchase Order

Kamu adalah backend & frontend engineer yang bertanggung jawab mengimplementasikan dua fitur: Audit Log Viewer dan Receive PO endpoint di SpareTrack.

---

## Bagian A: Audit Log Viewer

### Ruang Lingkup

- Backend: endpoint REST untuk membaca audit log dengan pagination dan filter.
- Frontend: halaman Settings → tab "Audit Log" yang terhubung ke API (saat ini masih hardcoded).

### Yang Harus Dihasilkan (Backend)

1. File baru `src/services/auditLogService.js` dengan fungsi:
   - `list(query)` — pagination, filter `action`, `entity_type`, `user_id`, `start_date`, `end_date`, search.
   - `detail(id)` — detail single audit log entry.
2. File baru `src/controllers/auditLogController.js`.
3. File baru `src/routes/auditLogs.js`.
4. Daftarkan di `src/routes/index.js` dengan prefix `/audit-logs`.
5. Proteksi: hanya `super_admin` yang bisa akses.

### Yang Harus Dihasilkan (Frontend)

1. Modifikasi `SettingsPage.tsx` tab `audit`:
   - Ganti data hardcoded dengan panggilan API.
   - Tabel: user, action, entity_type, timestamp, IP address.
   - Pagination di footer tabel.
   - Filter: action type (dropdown), date range, search.
2. Service baru `src/services/auditLog.ts`:
   - `getAuditLogs(query)` — list dengan pagination.
   - `exportAuditLogs(query)` — export (reuse endpoint export dari prompt 13).
3. Row bisa diklik → expand atau modal detail (old_data vs new_data sebagai JSON diff).

---

## Bagian B: Receive Purchase Order

### Ruang Lingkup

- Backend: endpoint untuk menerima purchase order dan mengupdate stok.
- Update status PO dari `pending`/`approved` menjadi `received`.
- Update stok cabang via stock_movement.

### Yang Harus Dihasilkan (Backend)

1. Fungsi baru di `restockService.js`:
   - `receivePurchaseOrder(poId, userId)` — terima PO.
   - Validasi: PO harus berstatus `pending` atau `approved`.
   - Untuk setiap `purchase_order_items`:
     - update `received_qty = quantity`.
     - Insert stock_movement type `in` ke branch PO.
     - Update `branch_stocks` quantity + `quantity`.
   - Update `purchase_orders.status = 'received'`, `received_at = NOW()`.
   - Insert activity + audit log.

2. Endpoint baru:
   - `POST /restock/purchase-orders/:id/receive` — di `restockController.js` dan `restock.js` routes.

### Yang Harus Dihasilkan (Frontend)

1. Tombol "Terima" di list Purchase Orders (RestockPage atau komponen PO list):
   - Hanya muncul jika status `pending` atau `approved`.
   - Konfirmasi sebelum execute.
   - Toast sukses + refresh list.
   - Tanggal received tampil di kolom setelah berhasil.

---

## Aturan Bisnis (Kedua Bagian)

- Audit log: data di tabel `audit_logs` sudah diisi oleh service lain — cukup baca saja.
- Audit log: column `old_data` dan `new_data` adalah JSONB — tampilkan sebagai formatted JSON di detail modal.
- Receive PO: jika total_amount PO belum diisi, hitung ulang dari items.
- Receive PO: trigger notifikasi "PO #XXX telah diterima" ke requester (gunakan `notificationService` jika sudah ada).

## Output Yang Diinginkan

- Backend: audit log service + controller + routes dengan pagination dan filter.
- Backend: receive PO endpoint yang update stock, movement, dan status.
- Frontend: tab Audit Log real dari API dengan filter dan pagination.
- Frontend: tombol Receive di PO list dengan konfirmasi.
- Semua aksi receive PO tercatat di activities dan audit_logs.
