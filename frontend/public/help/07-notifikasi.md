## Notifikasi apa saja yang tersedia?

| Jenis | Trigger | Channel |
|---|---|---|
| **Email Stok Kritis** | Stok turun di bawah safety stock | Email |
| **Email Restock** | Stok mencapai reorder point | Email |
| **Notifikasi Browser** | Event real-time (PO, restok, dll.) | Push notification |

---

## Bagaimana cara mengatur notifikasi?

1. Buka **Settings → Notifikasi**
2. Aktifkan/nonaktifkan toggle untuk setiap jenis notifikasi:
   - **Email — Stok Kritis**
   - **Email — Restock**
   - **Notifikasi Browser**
3. Klik **Simpan**

Perubahan akan langsung diterapkan.

---

## Apa yang memicu notifikasi stok kritis?

Sistem secara otomatis memeriksa stok setiap sparepart setiap kali ada transaksi masuk/keluar. Jika kondisi `stok ≤ safety_stock` terpenuhi, sistem akan:

1. Menandai item sebagai **Kritis** (🔴)
2. Mengirim **email** ke user yang memiliki akses ke cabang tersebut
3. Menampilkan badge/indikator di dashboard dan halaman terkait

---

## Apakah notifikasi browser perlu izin khusus?

Ya. Saat pertama kali mengaktifkan **Notifikasi Browser**, browser akan meminta izin. Klik **"Izinkan"** untuk menerima notifikasi. Jika ditolak, aktifkan ulang melalui pengaturan browser.
