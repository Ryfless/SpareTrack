# Prompt: Receive Purchase Order Endpoint

Kamu adalah backend & frontend engineer yang bertanggung jawab mengimplementasikan fitur Receive PO di SpareTrack.

---

## Ruang Lingkup

- Backend: endpoint untuk menerima purchase order dan mengupdate stok.
- Update status PO dari `pending`/`approved` menjadi `received`.
- Update stok cabang via stock_movement + branch_stocks.

## Yang Harus Dihasilkan (Backend)

1. Fungsi baru di `restockService.js`:
   - `receivePurchaseOrder(poId, userId, ip_address = '')` — terima PO.
   - Validasi: PO harus berstatus `pending` atau `approved`.
   - Untuk setiap `purchase_order_items`:
     - update `received_qty = quantity`.
     - Insert stock_movement type `in` ke branch PO.
     - Update `branch_stocks` quantity + `quantity`.
   - Update `purchase_orders.status = 'received'`, `received_at = NOW()`.
   - Insert activity + audit log (pakai `getClientIp` dari `utils/ip.js`).

2. Endpoint baru di `restockController.js`:
   - `receivePO` — ambil `poId` dari params, `userId` dari req.user, `ip` dari `getClientIp(req)`.

3. Route baru di `restock.js`:
   - `POST /purchase-orders/:id/receive` — proteksi `super_admin`.

## Yang Harus Dihasilkan (Frontend)

1. Tombol "Terima" di list Purchase Orders (`RestockPage.tsx`):
   - Muncul jika status `pending` atau `approved`.
   - Jika `pending`: tampilkan "Terima Langsung" (tanpa approve).
   - Jika `approved`: tampilkan "Terima".
   - Konfirmasi via modal `ConfirmReceiveModal` atau konfirmasi inline.
   - Toast sukses + refresh list setelah berhasil.
   - Kolom `received_at` tampil setelah berhasil.

2. Service baru atau tambahan di `restock.ts`:
   - `receivePurchaseOrder(id)` → `POST /restock/purchase-orders/:id/receive`.

## Aturan Bisnis

- Jika `total_amount` PO belum diisi, hitung ulang dari items.
- Trigger notifikasi "PO #XXX telah diterima" ke requester via `notificationService.sendNotification` jika sudah ada.
- Semua aksi receive PO tercatat di `activities` dan `audit_logs`.

## Output Yang Diinginkan

- Backend: receive PO endpoint yang update stock, movement, dan status.
- Frontend: tombol Receive di PO list dengan konfirmasi.
- Kolom `received_at` muncul setelah PO diterima.
