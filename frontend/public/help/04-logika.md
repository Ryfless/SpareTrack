## Bagaimana cara menentukan status stok?

Sistem menggunakan **4 level status** yang dihitung otomatis:

| Status | Label | Kondisi |
|---|---|---|
| 🔴 **Kritis** | `critical` | stok ≤ safety_stock |
| 🟡 **Rendah** | `low` | stok > safety_stock DAN stok ≤ reorder_point |
| 🟢 **Aman** | `safe` | stok > reorder_point DAN stok ≤ max_stock |
| 🟣 **Overstock** | `overstock` | stok > max_stock |

**Prioritas status terburuk:** `critical` > `low` > `overstock` > `safe`

Status terburuk dari seluruh item di suatu cabang menentukan badge cabang:
- **Normal** (hijau) — item kritis ≤ 3
- **Tinggi** (merah, pulse) — item kritis > 3

---

## Bagaimana nilai inventaris dihitung?

**Nilai Inventaris** = Σ (stok_saat_ini × harga_beli) untuk seluruh sparepart di cabang tersebut.

Format penampilan:
- `≥ 1.000.000.000` → ditampilkan sebagai **X,XX M** (miliaran)
- `≥ 1.000.000` → ditampilkan sebagai **X,XX Jt** (jutaan)
- `≥ 1.000` → ditampilkan sebagai **X,XX Rb** (ribuan)

---

## Apa itu Safety Stock?

**Safety Stock** adalah stok minimal pengaman untuk mengantisipasi:
- Lonjakan permintaan mendadak
- Keterlambatan pengiriman supplier

**Rumus default:** `safety_stock = default_min_stock × multiplier`

Bisa diatur manual per sparepart saat menambah/mengedit item.

---

## Apa itu Reorder Point?

**Reorder Point** adalah batas stok yang memicu rekomendasi restok. Jika stok turun ke level ini, sistem otomatis menyarankan pengadaan.

**Rumus:** `reorder_point = (permintaan_harian × lead_time) + safety_stock`

- `permintaan_harian` — rata-rata penjualan per hari
- `lead_time` — waktu tunggu pengiriman (hari)
- `safety_stock` — stok pengaman

---

## Bagaimana cara menghitung Total Penjualan Bulanan?

Menjumlahkan seluruh transaksi **stok keluar** (type = `out`) dalam periode 1 bulan, dikelompokkan per sparepart. Untuk KPI di Dashboard, ditampilkan rata-rata penjualan **6 bulan terakhir**.

---

## Apa metrik yang digunakan di KPI Dashboard?

4 KPI utama per cabang:

| KPI | Deskripsi |
|---|---|
| **Total Stok** | Jumlah semua item (quantity) |
| **Item Kritis** | Jumlah item dengan status `critical` |
| **Nilai Inventaris** | Total nilai stok dalam rupiah |
| **Penjualan Bulanan** | Rata-rata unit terjual per bulan (6 bulan) |

---

## Bagaimana cara menghitung prediksi ML XGBoost?

Model ML menggunakan algoritma **XGBoost Regressor** dengan fitur:
- **Lag features:** penjualan 1, 2, 3 bulan sebelumnya (`lag_1`, `lag_2`, `lag_3`)
- **Rolling mean:** rata-rata 3 bulan terakhir (`rolling_mean_3`)
- **Seasonal features:** `month_sin`, `month_cos` untuk menangkap pola musiman
- **Contextual:** `price`, `sparepart_id`, `branch_id`

**Training data:** 5000 transaksi penjualan terakhir, di-aggregate per (sparepart_id, branch_id, month).

Service Python Flask terpisah di port **5001** menangani inferensi.
