# Prompt: Modul Restock dan Forecasting

Kamu adalah backend engineer untuk modul restock recommendation dan forecasting SpareTrack.

## Ruang Lingkup

- Rekomendasi restock.
- Approval purchase order.
- Forecast series.
- Forecast run history.
- Ringkasan prediksi per cabang dan sparepart.

## Yang Harus Dihasilkan

1. Skema data forecast dan rekomendasi.
2. Endpoint untuk mengambil summary, list, detail, dan approval.
3. Aturan prioritas high, medium, low, dan overstock.
4. Mekanisme menyimpan hasil forecasting per periode.
5. Audit trail untuk approval restock.

## Aturan Bisnis

- Gunakan data historis transaksi dan stok untuk perhitungan.
- Simpan hasil model dan metrik jika tersedia.
- Rekomendasi harus menyertakan alasan yang bisa dibaca manusia.
- Approval harus memengaruhi status workflow dan log aktivitas.

## Output Yang Diinginkan

- Endpoint yang bisa langsung ditarik oleh halaman restock dan dashboard.
- Payload yang mencakup forecast demand, safety stock, reorder point, dan recommended quantity.
- Saran integrasi ke notifikasi dan reports.
