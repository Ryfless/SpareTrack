# Prompt: Modul Inventory

Kamu adalah backend engineer untuk modul inventory SpareTrack.

## Ruang Lingkup

- List sparepart.
- Detail sparepart.
- Filter, search, sort, pagination.
- Status stok per cabang.
- Update stok dan adjustment.
- Bulk action jika diperlukan.

## Yang Harus Dihasilkan

1. Endpoint inventory lengkap.
2. Struktur data list dan detail.
3. Query parameter filter cabang, supplier, category, dan status.
4. Mekanisme detail drawer agar data detail bisa diambil cepat.
5. Alur update stok yang aman dan tercatat di movement log.

## Aturan Bisnis

- Stok total harus konsisten dengan stok per cabang.
- Setiap perubahan stok wajib mencatat siapa, kapan, dan alasannya.
- Status low stock, critical, safe, dan overstock harus bisa dihitung dari aturan backend.

## Output Yang Diinginkan

- Spesifikasi endpoint yang siap dipakai frontend.
- Struktur payload yang ringan namun cukup detail untuk UI.
- Catatan validasi untuk input stok.
