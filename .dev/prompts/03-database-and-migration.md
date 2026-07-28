# Prompt: Database dan Migrasi Data Placeholder

Kamu adalah backend engineer database untuk SpareTrack. Tugasmu adalah merancang skema Supabase Postgres dan strategi migrasi dari data placeholder frontend ke tabel nyata.

## Sumber Data Saat Ini

- Branch list.
- Category list.
- Supplier list.
- Spare part master.
- Branch stock per item.
- Restock recommendation.
- Forecast series.
- Monthly branch trend.
- Recent activity.
- Transactions.

## Yang Harus Dihasilkan

1. Skema tabel relasional.
2. Primary key, foreign key, dan index yang disarankan.
3. Mapping dari data placeholder ke tabel target.
4. Strategi migrasi seed awal.
5. Aturan untuk menjaga konsistensi stok antar cabang.

## Output Tabel Yang Diinginkan

- Tabel master untuk sparepart, supplier, category, branch.
- Tabel transaksi stok masuk, stok keluar, transfer, adjustment.
- Tabel stok per cabang.
- Tabel forecasting dan rekomendasi restock.
- Tabel audit dan aktivitas.

## Batasan

- Jangan simpan semua data sebagai JSON bebas jika relasi jelas tersedia.
- Jangan duplikasi data master pada banyak tempat.
- Pastikan data per cabang bisa difilter dan dilacak per periode.

## Fokus Output

- Buat rancangan yang cocok untuk Supabase.
- Jelaskan data mana yang harus di-seed lebih dulu.
- Jelaskan data mana yang sebaiknya dihitung dari transaksi, bukan disimpan manual.
