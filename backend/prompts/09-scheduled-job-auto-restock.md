# Prompt: Scheduled Job Auto-Generate Restock

Kamu adalah backend engineer yang bertanggung jawab mengimplementasikan scheduled job untuk auto-generate rekomendasi restock di SpareTrack.

## Ruang Lingkup

- Cron job / scheduler untuk menjalankan generate restock secara otomatis.
- Integrasi dengan endpoint `POST /restock/recommendations/generate` yang sudah ada.
- Notifikasi hasil generate ke user (via tabel `notifications`).
- Konfigurasi jadwal (daily, cron expression) via environment variable atau tabel settings.
- Logging riwayat eksekusi job.

## Yang Harus Dihasilkan

1. File scheduler baru `src/services/schedulerService.js` yang berisi:
   - Fungsi `startScheduler()` untuk memulai job.
   - Fungsi `scheduleRestockJob(cronExpression)` untuk daftarkan job.
   - Fungsi `executeRestockGeneration()` — panggil `restockService.generate(systemUserId)`.
2. Integrasi di `src/server.js` — panggil `startScheduler()` saat server start.
3. Setiap selesai generate, simpan notifikasi ke tabel `notifications` untuk user dengan role `super_admin`.
4. Simpan log eksekusi ke tabel `activities` dan `audit_logs`.
5. Konfigurasi cron expression via `.env` variable `RESTOCK_CRON_SCHEDULE` (default `0 6 * * *` — setiap jam 6 pagi).
6. Endpoint baru untuk admin:
   - `GET /restock/scheduler/status` — lihat status scheduler (active, last_run, next_run).
   - `POST /restock/scheduler/trigger` — trigger manual.

## Aturan Bisnis

- Gunakan library `node-cron` untuk scheduling (cek package.json, install jika belum ada).
- System user ID untuk audit trail: gunakan user super_admin pertama yang ditemukan di tabel `profiles`, atau buat constant khusus.
- Jika generate gagal, catat error jangan throw — agar server tidak crash.
- Scheduler hanya aktif di environment production, skip di development kecuali ada flag `FORCE_SCHEDULER=true`.
- **Wajib**: Scheduler hanya memanggil fungsi yang sudah ada (`restockService.generate()`) — yaitu **menghitung dan menyimpan rekomendasi** (stok saat ini, reorder point, recommended_qty, urgency, notes). Scheduler **tidak boleh menambah/mengubah stok**, tidak boleh insert `stock_movements`, dan tidak boleh mengubah `branch_stocks`. Proses pembelian (approve → PO → receive) tetap 100% manual oleh user.

## Output Yang Diinginkan

- File `src/services/schedulerService.js` lengkap.
- Modifikasi `src/server.js` untuk start scheduler.
- Modifikasi `src/routes/restock.js` untuk endpoint scheduler status/trigger.
- Controller `schedulerStatus` dan `triggerGenerate` di `src/controllers/restockController.js`.
- Cron job berjalan otomatis tanpa perlu restart manual setelah konfigurasi.
