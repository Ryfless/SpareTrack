# Prompt: Notifikasi Real-time

Kamu adalah backend & frontend engineer yang bertanggung jawab mengimplementasikan sistem notifikasi real-time di SpareTrack.

## Ruang Lingkup

- Backend: WebSocket server atau integrasi Supabase Realtime untuk push notifikasi.
- Backend: endpoint REST untuk notifikasi (list, mark read, mark all read).
- Frontend: notifikasi bell icon di sidebar/header + dropdown notifikasi.
- Frontend: real-time update tanpa refresh halaman.
- Notifikasi untuk: stok kritis, restock selesai, PO received, transfer stok.

## Yang Harus Dihasilkan (Backend)

1. **WebSocket server** menggunakan `ws` atau `socket.io`:
   - Integrasi di `src/server.js` — upgrade HTTP server ke WebSocket.
   - Autentikasi via token JWT (verify token saat koneksi).
   - Event: `notification:new` — kirim notifikasi real-time ke user spesifik.

   ATAU jika menggunakan Supabase Realtime:
   - Subscribe channel `notifications` dengan filter `user_id = auth.uid()`.

2. **REST endpoint notifikasi**:
   - `GET /notifications` — list notifikasi user, paginated, sort by created_at desc.
   - `PATCH /notifications/:id/read` — mark satu notifikasi sebagai read.
   - `PATCH /notifications/read-all` — mark semua notifikasi user sebagai read.
   - `GET /notifications/unread-count` — hitung notifikasi unread.

3. **Trigger notifikasi otomatis**:
   - Fungsi helper `sendNotification(userId, title, message, type, link)`.
   - Panggil dari: restock generate selesai, stock critical, PO received, transfer completed.
   - Insert ke tabel `notifications` + emit WebSocket event.

4. File baru `src/services/notificationService.js`, `src/controllers/notificationController.js`, `src/routes/notifications.js`.

## Yang Harus Dihasilkan (Frontend)

1. **Notification bell icon** di komponen sidebar/header:
   - Icon lonceng + badge jumlah unread.
   - Warna badge merah jika ada notifikasi unread.

2. **Dropdown notification panel**:
   - List notifikasi (10 terbaru).
   - Setiap item: icon sesuai type (info/warning/success/error), title, message, timestamp.
   - Klik item → navigasi ke link terkait + mark as read.
   - Tombol "Mark all as read" di footer dropdown.

3. **Real-time update**:
   - Jika pakai WebSocket: connect saat login, disconnect saat logout.
   - Jika pakai polling: interval 30 detik untuk cek unread count.
   - Update badge + dropdown otomatis saat notifikasi baru masuk.

4. **Service baru** `src/services/notifications.ts`.

## Aturan Bisnis

- Notifikasi stok kritis: trigger saat generate restock selesai dan ada item `critical`.
- Notifikasi restock: "Generate rekomendasi selesai — X item kritis ditemukan".
- Notifikasi PO: "PO #XXX telah diterima — Y item masuk stok".
- Notifikasi transfer: "Transfer X item ke Cabang Y selesai".
- Notifikasi > 30 hari otomatis dihapus (via cron atau trigger SQL).
- User hanya bisa lihat notifikasi miliknya sendiri.

## Output Yang Diinginkan

- Backend: WebSocket/Supabase Realtime integration + notification service + REST endpoints.
- Frontend: bell icon + dropdown + unread badge + real-time updates.
- Notifikasi otomatis dari event-event sistem yang sudah ada.
- Semua endpoint terdaftar di `src/routes/index.js`.
