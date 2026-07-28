## Bagaimana sistem merekomendasikan restok?

Sistem ML (**XGBoost Regressor**) menganalisis **riwayat penjualan 6 bulan terakhir** per sparepart per cabang → memprediksi permintaan bulan depan → membandingkan dengan stok saat ini → merekomendasikan jumlah restok.

**Fitur yang digunakan model:**
- `lag_1`, `lag_2`, `lag_3` — penjualan 1, 2, 3 bulan sebelumnya
- `rolling_mean_3` — rata-rata 3 bulan terakhir
- `month_sin`, `month_cos` — siklus musiman
- `price`, `sparepart_id`, `branch_id` — data kontekstual

---

## Apa itu Demand Forecast?

Grafik **Aktual vs Prediksi** yang menampilkan tren permintaan sparepart:
- **Garis biru solid** — data aktual (penjualan riil 6 bulan)
- **Garis teal putus-putus** — hasil prediksi ML

Dapat dilihat di halaman **Dashboard** dan **Reports**.

---

## Bagaimana cara menyetujui rekomendasi restok?

1. Buka **Restock**
2. Review rekomendasi yang muncul
3. **Centang** item yang ingin direstock
4. Klik **"Setujui"**
5. Sistem **otomatis membuat PO** untuk item-item tersebut

---

## Bagaimana cara menolak rekomendasi?

1. Klik **"Tolak"** pada rekomendasi
2. Pilih alasan penolakan
3. **Konfirmasi**

Rekomendasi akan diarsipkan dan tidak muncul kembali.

---

## Apa itu Days to Stockout?

Perkiraan **jumlah hari** sampai stok habis berdasarkan rata-rata penjualan harian.

**Rumus:** `stok_saat_ini / rata-rata_penjualan_per_hari`

Semakin kecil nilainya, semakin urgent kebutuhan restok.

---

## Bagaimana cara melihat riwayat rekomendasi restok?

Buka **Restock** → tab **Riwayat** akan menampilkan rekomendasi yang sudah disetujui/ditolak sebelumnya, lengkap dengan tanggal dan status.
