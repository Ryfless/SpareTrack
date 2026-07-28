## Bagaimana cara melihat stok per cabang?

Buka **Cabang** → pilih cabang dari daftar → lihat daftar stok lengkap dengan:
- **Jumlah stok** per sparepart
- **Status** (Aman / Kritis / Rendah / Overstock)
- **Safety stock** dan **reorder point**
- **Harga** dan **nilai total**

---

## Apa arti badge status di kartu cabang?

| Badge | Warna | Kondisi |
|---|---|---|
| **Normal** | 🟢 Hijau | Item kritis ≤ 3 — performa baik |
| **Tinggi** | 🔴 Merah (pulse) | Item kritis > 3 — perlu perhatian segera |

Animasi **pulse** pada badge merah memberikan alert visual bahwa cabang tersebut memerlukan tindakan.

---

## Apa itu Branch Monitoring?

Halaman yang menampilkan performa setiap cabang secara komprehensif:

1. **Kartu Statistik:**
   - Total stok (quantity)
   - Jumlah item kritis
   - Nilai inventaris (dalam rupiah)
   - Rata-rata terjual per bulan

2. **Grafik Tren Penjualan:**
   - Bar chart 6 bulan, setiap warna mewakili cabang
   - Hover untuk detail nilai

3. **Tabel Matriks Stok:**
   - Daftar lengkap sparepart dengan stok, status, dan harga
   - Scrollable dengan sticky header
   - 6 baris visible per scroll

---

## Bagaimana cara membandingkan performa antar cabang?

**Dashboard** menampilkan 3 kartu cabang teratas (berdasarkan urutan) dengan KPI masing-masing. Setiap kartu menampilkan:
- Nama cabang
- Badge status (Normal/Tinggi)
- 4 metrik KPI dalam grid
- Detail lengkap saat diklik (mengarah ke halaman Cabang)
