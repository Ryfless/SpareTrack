# Prompt: Auto-refresh Data

Kamu adalah backend & frontend engineer yang bertanggung jawab mengimplementasikan auto-refresh data di SpareTrack.

## Ruang Lingkup

- Auto-refresh data inventory (list sparepart + stok) secara periodik tanpa reload manual.
- Auto-refresh data Purchase Orders di halaman Restock.
- Opsi toggle enable/disable auto-refresh dengan interval yang bisa dipilih user.
- Cleanup interval saat komponen unmount.

## Yang Harus Dihasilkan (Backend)

1. **Opsional — Supabase Realtime subscriptions** untuk tabel yang relevan:
   - Subscribe channel `spareparts`, `branch_stocks`, `stock_movements`, `purchase_orders`.
   - Idealnya tiap user hanya terima perubahan untuk cabang yang relevan.

2. **Tidak perlu endpoint baru** — auto-refresh cukup memanfaatkan endpoint yang sudah ada:
   - `GET /inventory` untuk refresh data inventory.
   - `GET /restock/purchase-orders` untuk refresh data PO.
   - `GET /notifications/unread-count` untuk refresh badge notifikasi.

## Yang Harus Dihasilkan (Frontend)

1. **Auto-refresh hook** — `useAutoRefresh(fetchFn, intervalMs, enabled)`:
   - File baru `frontend/src/app/hooks/useAutoRefresh.ts`.
   - Menerima callback fetch function, interval dalam ms, dan flag enabled.
   - Gunakan `useEffect` + `setInterval` + `clearInterval` pada cleanup.
   - `useRef` untuk menyimpan latest fetchFn agar tidak re-subscribe interval saat fetchFn berubah.

2. **Auto-refresh toggle + interval selector** di halaman Inventory & Restock:
   - Tombol toggle (on/off) dengan ikon refresh.
   - Dropdown interval: 15 detik, 30 detik, 60 detik (default: mati).
   - Tooltip atau label yang menunjukkan status auto-refresh.
   - State tersimpan di localStorage per halaman agar tidak reset saat navigasi.

3. **Integrasi di InventoryPage**:
   - Panggil `useAutoRefresh(loadData, interval, autoRefreshEnabled)`.
   - Tampilkan indikator visual (animasi subtle) saat auto-refresh sedang berjalan.
   - Jangan trigger ulang filter/sort/pagination — auto-refresh harus mempertahankan state UI saat ini.
   - Pastikan tidak terjadi race condition: request baru batalkan request sebelumnya jika belum selesai (gunakan AbortController).

4. **Integrasi di RestockPage**:
   - Auto-refresh untuk daftar Purchase Orders.
   - Gunakan `useAutoRefresh` yang sama.
   - Toggle terpisah untuk halaman Restock (disimpan terpisah di localStorage).

5. **Integrasi di DashboardPage (opsional)**:
   - Auto-refresh untuk KPI cards dan aktivitas terbaru.
   - Interval lebih panjang (60 detik).

## Aturan Bisnis

- Auto-refresh WAJIB berhenti saat komponen unmount (cleanup `clearInterval`).
- Auto-refresh WAJIB berhenti saat modal/dialog terbuka untuk mencegah state conflict.
- Jangan trigger auto-refresh saat user sedang mengisi form.
- Gunakan `useCallback` dan `useRef` untuk menghindari memory leak dan stale closure.
- AbortController untuk membatalkan fetch sebelumnya jika interval lebih cepat dari response.
- Tampilkan toast warning jika auto-refresh gagal (jangan spam — cukup 1x dalam 30 detik).

## Output Yang Diinginkan

- Custom hook `useAutoRefresh.ts` yang reusable di semua halaman.
- Auto-refresh toggle + interval selector di InventoryPage dan RestockPage.
- State persist per halaman di localStorage.
- Animasi/indikator visual saat auto-refresh aktif.
- Race condition handling dengan AbortController.
