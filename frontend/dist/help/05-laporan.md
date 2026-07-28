## Laporan apa saja yang tersedia?

| Laporan | Deskripsi |
|---|---|
| **Ringkasan Stok** | Total item, nilai inventaris, jumlah item kritis |
| **Tren Penjualan** | Grafik penjualan per bulan, bisa difilter per cabang |
| **Performa Stok** | Breakdown status stok (Kritis/Rendah/Aman/Overstock) |
| **Aktivitas** | Riwayat transaksi dan mutasi stok |

---

## Bagaimana cara mengekspor laporan?

1. Buka **Laporan**
2. Atur **periode** (tanggal mulai & selesai)
3. Pilih **filter** (cabang, kategori, dll.)
4. Klik **Export PDF** atau **Export Excel**
5. File akan terunduh otomatis

Format ekspor:
- **PDF** — menggunakan library **PDFKit**, cocok untuk cetak/ditandatangani
- **Excel** — menggunakan library **ExcelJS**, cocok untuk analisis lanjutan

---

## Bagaimana cara membaca grafik di Dashboard?

**Area Chart (Demand Forecast):**
- Sumbu X: bulan
- Sumbu Y: jumlah unit
- **Garis biru solid** — data aktual penjualan
- **Garis teal putus-putus** — prediksi ML
- Hover untuk melihat nilai detail

**Bar Chart (Penjualan per Cabang):**
- Setiap **warna** mewakili cabang berbeda
- Hover untuk melihat nilai per cabang
- Legend di bawah chart

---

## Apa itu Audit Log?

Catatan seluruh aktivitas penting dalam sistem, meliputi:
- Pembuatan PO
- Persetujuan / penolakan PO
- Generate restok
- Persetujuan / penolakan restok

Berguna untuk **audit** dan **tracing masalah**.

**Cara akses:** Buka **Settings → Audit Log**

Fitur:
- Filter berdasarkan aksi, tanggal, dan kata kunci
- Lihat detail perubahan (old_data vs new_data)
- Ekspor audit log
- Pagination untuk data dalam jumlah besar

---

## Bagaimana cara melihat riwayat transaksi?

Buka **Transaksi** → seluruh PO dan mutasi stok ditampilkan dalam tabel. Bisa difilter berdasarkan:
- Status (semua / menunggu / disetujui / dibatalkan)
- Tanggal
- Cabang
- Tipe transaksi
