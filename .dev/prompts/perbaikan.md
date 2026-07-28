- [x] stat yang ditampilkan pada card cabang yakni berupa:
      - total Stok
      - Item kritis (ambil dari branch_stocks)
      - Nilai inventory pada cabang (ambil dari branch_stocks dan dikalikan dengan harga sparepart)
      - jumlah penjualan unit perbulan (ambil dari stock_movements dengan filter type = OUT, group by sparepart_id, sum quantity, filter by branch_id dan transaction_date bulan ini)
      - Segmen baru: top 3 sparepart yang paling banyak terjual di cabang tersebut (ambil dari stock_movements dengan filter type = OUT, group by sparepart_id, sum quantity, filter by branch_id dan transaction_date bulan ini, urutkan desc, ambil 3 teratas)

- [x] buatkan card baru bersebelahan dengan card matrix stok antar cabang, berisi grafik perbandingan penjualan sparepart dari 6 bulan terakhir, filter by branch_id, group by month, sum quantity, type = OUT, urutkan bulan terbaru ke lama. Gunakan chart bar untuk menampilkan data ini. ada tiap bulannya berisi 3 bar, masing-masing mewakili 3 cabang dengan total penjualan terbanyak di bulan tersebut. sesuaikan ukuran card matrix stok antar cabang agar muat dengan card baru ini.