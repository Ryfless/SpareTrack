# design.md — Prompt Desain Website

## Sistem Demand Forecasting & Optimasi Stok Sparepart Bengkel Multi-Cabang

Buatkan desain antarmuka **website full responsive** untuk sistem **manajemen stok sparepart bengkel multi-cabang** yang terintegrasi dengan **demand forecasting** dan **rekomendasi restock**. Website ini bukan hanya dashboard sederhana, tetapi sebuah **produk web profesional** yang digunakan oleh admin gudang, admin cabang, dan owner/manager untuk memantau stok, penjualan sparepart, prediksi permintaan, serta rekomendasi stok optimal untuk beberapa cabang bengkel.

---

# 1. Tujuan Produk

Website ini digunakan untuk:

* memonitor stok sparepart di **3 cabang bengkel**
* melihat pergerakan stok masuk/keluar
* memantau penjualan sparepart per cabang
* melakukan **forecasting demand** berdasarkan data historis
* menampilkan **rekomendasi restock** berdasarkan hasil forecasting, safety stock, dan reorder point
* memberi peringatan stok kritis / stockout risk / overstock risk
* membantu owner mengambil keputusan stok dengan cepat melalui dashboard visual yang informatif

Desain harus terasa seperti perpaduan antara:

* **inventory management system**
* **analytics dashboard**
* **forecasting & decision support platform**

Bukan seperti website company profile. Fokus utama adalah **dashboard product design** dengan visual data yang kuat, clean, modern, dan profesional.

---

# 2. Karakter Visual yang Diinginkan

Gunakan gaya desain yang:

* **modern, clean, premium, dan profesional**
* cocok untuk **dashboard SaaS / enterprise web app**
* terasa **data-driven**, rapi, tidak norak, dan tidak terlalu ramai
* memiliki **visual hierarchy** yang sangat jelas
* tetap menarik secara estetika, tidak kaku seperti dashboard lama
* menampilkan kesan **cerdas, presisi, operasional, dan terpercaya**

Nuansa visual yang diinginkan:

* gabungan antara **supply chain dashboard**, **inventory analytics**, dan **forecasting dashboard**
* gunakan elemen visual yang memberi kesan:

  * real-time monitoring
  * branch comparison
  * inventory health
  * predictive analytics
  * decision support

---

# 3. Persona Pengguna

Desain harus mempertimbangkan beberapa tipe user:

1. **Owner / Manager**

   * ingin melihat ringkasan bisnis dan kondisi stok semua cabang
   * fokus pada KPI, peringatan, rekomendasi restock, dan performa cabang

2. **Admin Pusat**

   * mengelola data sparepart, cabang, stok, supplier, dan approval restock
   * perlu dashboard operasional yang lengkap

3. **Admin Cabang**

   * input stok masuk/keluar
   * melihat stok cabang sendiri
   * memantau sparepart yang menipis
   * melihat rekomendasi kebutuhan stok cabangnya

---

# 4. Konsep Layout Besar Website

Desain website sebagai **web app dashboard multi-page** dengan struktur berikut:

## A. Main App Shell

Gunakan layout aplikasi modern:

* **sidebar kiri** untuk navigasi utama
* **topbar/header** untuk pencarian, filter cabang, notifikasi, profil user
* **main content area** yang fleksibel
* tampilan desktop harus terasa luas dan rapi
* tampilan mobile harus berubah menjadi **drawer navigation + stacked cards**

Sidebar bisa berisi:

* Dashboard
* Inventory
* Forecasting
* Restock Recommendation
* Branch Monitoring
* Transactions
* Reports
* Settings

---

# 5. Halaman / Section yang Wajib Didesain

## 5.1 Dashboard Utama

Ini adalah halaman paling penting. Buat sangat menarik dan informatif.

### Isi dashboard:

1. **Hero summary / top KPI section**
   tampilkan KPI cards seperti:

   * Total Sparepart
   * Total Stock Value
   * Low Stock Items
   * Predicted Demand This Month
   * Stockout Risk Items
   * Overstock Items
   * Active Branches
   * Forecast Accuracy Summary

2. **Branch overview panel**
   panel perbandingan 3 cabang:

   * total stok per cabang
   * item kritis per cabang
   * cabang dengan penjualan tertinggi
   * cabang dengan risiko stockout tertinggi

3. **Demand forecasting chart**
   visual line chart / area chart:

   * histori penjualan
   * hasil prediksi periode berikutnya
   * pembeda warna antara actual vs forecast
   * bisa per sparepart / kategori / cabang

4. **Inventory health section**
   tampilkan status:

   * Aman
   * Menipis
   * Overstock
   * Perlu Restock
     dengan progress, badge, dan warning visual

5. **Restock recommendation panel**
   tampilkan daftar rekomendasi:

   * nama sparepart
   * cabang
   * stok saat ini
   * forecast demand
   * safety stock
   * rekomendasi jumlah restock
   * priority badge (High / Medium / Low)

6. **Recent activity / stock movement**
   timeline atau tabel ringkas:

   * stok masuk
   * stok keluar
   * transfer antar cabang
   * update prediksi
   * perubahan rekomendasi restock

Dashboard harus terasa “hidup” dan sangat informatif, bukan sekadar tumpukan card.

---

## 5.2 Halaman Inventory Management

Halaman untuk melihat dan mengelola sparepart.

### Fitur visual:

* tabel modern dengan sticky header
* search, filter, sort, pagination
* filter berdasarkan:

  * cabang
  * kategori
  * supplier
  * status stok
* kolom penting:

  * kode sparepart
  * nama sparepart
  * kategori
  * stok per cabang
  * total stok
  * minimum stock
  * reorder point
  * status
* gunakan status chip/badge:

  * In Stock
  * Low Stock
  * Critical
  * Overstock

Tambahkan panel ringkasan di atas tabel:

* total item
* item kritis
* item aman
* item overstock

---

## 5.3 Halaman Detail Sparepart

Saat user klik sparepart, buka halaman detail yang kaya informasi.

### Isi:

* identitas sparepart
* foto / placeholder image sparepart
* kategori, supplier, harga, lead time
* stok di masing-masing cabang
* histori stok masuk/keluar
* histori penjualan
* grafik demand historis
* hasil forecasting per periode
* safety stock & reorder point
* rekomendasi restock terbaru
* insight panel seperti:

  * “permintaan meningkat 18% dibanding bulan lalu”
  * “stok cabang A berpotensi habis dalam 12 hari”

---

## 5.4 Halaman Forecasting

Halaman khusus analitik prediksi.

### Harus menampilkan:

* pemilihan metode forecasting:

  * SMA
  * ARIMA
  * metode lain jika tersedia
* filter cabang / sparepart / rentang waktu
* chart actual vs predicted
* tabel hasil forecast per periode
* metrik evaluasi model:

  * MAE
  * MAPE
  * RMSE
* perbandingan performa model
* insight otomatis:

  * metode terbaik
  * sparepart dengan pola permintaan stabil/fluktuatif
  * tren naik/turun

Desain halaman ini harus terasa seperti **analytics lab + business dashboard**, bukan halaman statistik yang kering.

---

## 5.5 Halaman Restock Recommendation / Inventory Optimization

Halaman ini adalah pusat keputusan stok.

### Konten:

* daftar rekomendasi restock yang dihasilkan sistem
* ranking prioritas sparepart
* alasan rekomendasi:

  * forecast demand
  * stok saat ini
  * safety stock
  * reorder point
  * lead time
* simulasi “jika tidak restock” vs “jika restock sekarang”
* visual indikator risiko
* kartu rekomendasi yang mudah dipahami owner

Buat section yang sangat jelas:

* **Urgent Restock**
* **Monitor Closely**
* **Overstock Warning**
* **Safe Stock**

---

## 5.6 Halaman Branch Monitoring

Halaman untuk membandingkan kondisi cabang.

### Tampilkan:

* 3 card cabang besar
* per cabang ada:

  * total stok
  * item kritis
  * nilai inventori
  * penjualan bulan ini
  * prediksi demand bulan depan
* branch comparison chart
* daftar sparepart paling laris per cabang
* cabang dengan risiko stockout tertinggi
* heatmap / matrix perbandingan stok antar cabang

---

## 5.7 Halaman Transactions

Untuk stok masuk, stok keluar, transfer cabang.

### UI:

* tabel transaksi modern
* filter by date, branch, type
* jenis transaksi:

  * stok masuk
  * stok keluar
  * transfer antar cabang
  * penyesuaian stok
* gunakan visual distinction untuk tiap tipe transaksi
* tambahkan quick action button:

  * Tambah Stok Masuk
  * Tambah Stok Keluar
  * Transfer Stok

---

## 5.8 Halaman Reports

Halaman laporan dengan visual yang bisa diekspor.

### Konten:

* ringkasan penjualan
* laporan stok
* laporan forecasting
* laporan rekomendasi restock
* filter rentang tanggal
* card insight otomatis
* tombol export PDF / Excel

---

# 6. Responsiveness & Mobile Friendly

Website harus **fully responsive** dan tetap usable di:

* desktop besar
* laptop
* tablet
* mobile

## Aturan responsive:

### Desktop

* gunakan grid dashboard yang lega
* sidebar fixed/collapsible
* chart dan table punya ruang yang cukup

### Tablet

* grid menyesuaikan 2 kolom
* sidebar bisa collapse
* chart tetap terbaca
* filter dan tabel tidak rusak

### Mobile

* sidebar menjadi drawer
* topbar lebih ringkas
* KPI card menjadi stacked cards
* tabel besar diubah menjadi:

  * card list, atau
  * horizontally scrollable table dengan prioritas readability
* chart tetap proporsional
* action button mudah disentuh
* spacing cukup lega untuk jari
* jangan membuat mobile sekadar “versi desktop yang dipaksa kecil”

Mobile UX harus tetap nyaman untuk:

* cek stok kritis
* melihat rekomendasi restock
* melihat dashboard ringkas
* memantau cabang

---

# 7. Gaya Interaksi yang Diinginkan

Tambahkan interaksi modern namun tetap profesional:

* hover states yang halus
* card lift / subtle shadow interaction
* smooth transitions
* tab switching yang rapi
* filter chips interaktif
* animated number counter untuk KPI
* collapsible panel
* empty state yang tetap cantik
* loading skeleton untuk card/chart/table
* toast notification yang elegan
* modal / drawer form yang rapi

Gunakan animasi secukupnya:

* **subtle, polished, non-gimmicky**
* jangan berlebihan
* prioritaskan performa dan keterbacaan

---

# 8. Warna & Nuansa Visual

Gunakan palet warna profesional dengan nuansa:

* **biru tua / navy / slate / steel blue** sebagai warna utama
* dikombinasikan dengan aksen:

  * cyan / teal / emerald lembut untuk status aman / analytics
  * amber / orange untuk warning
  * red lembut untuk critical / stockout risk
* background utama sebaiknya clean:

  * off-white / light gray / very soft blue-gray
  * atau dark mode enterprise jika dibuat dual-theme

Hindari warna yang terlalu neon atau terlalu playful.

### Nuansa warna yang disarankan:

* Primary: deep blue / indigo / steel blue
* Secondary: slate / cool gray
* Success: muted green / teal
* Warning: amber
* Danger: soft red
* Accent analytics: cyan / electric blue secukupnya

Pastikan kontras bagus, aksesibel, dan nyaman untuk dashboard jangka panjang.

---

# 9. Tipografi

Gunakan tipografi yang modern, bersih, dan profesional.
Karakter font:

* sangat terbaca di dashboard
* cocok untuk data, angka, label, tabel, dan heading

Saran gaya:

* heading tegas, modern, enterprise
* body text clean dan ringan
* angka KPI harus sangat mudah dibaca

Prioritaskan hierarchy:

* page title
* section title
* KPI number
* table label
* chart label
* caption / helper text

---

# 10. Komponen UI yang Wajib Ada

Rancang design system / komponen reusable untuk:

* sidebar
* topbar
* KPI card
* chart card
* data table
* filter bar
* search input
* tabs
* badges / status chips
* branch selector
* forecast summary card
* recommendation card
* stock alert card
* modal form
* empty state
* loading skeleton
* pagination
* breadcrumb
* export button
* date range picker
* notification dropdown
* profile menu

---

# 11. Kesan Visual yang Harus Dicapai

Saat user pertama kali melihat website ini, kesan yang muncul harus seperti:

* “ini sistem inventory modern yang serius”
* “dashboard ini pintar dan berbasis data”
* “owner bisa mengambil keputusan stok dari sini”
* “bukan web tugas biasa, tapi seperti produk SaaS nyata”
* “rapi, profesional, nyaman dipakai lama, dan informatif”

---

# 12. Prioritas UX

Prioritas utama desain:

1. **Kejelasan data**
2. **Kemudahan membaca status stok**
3. **Kemudahan melihat rekomendasi restock**
4. **Kemudahan membandingkan cabang**
5. **Kemudahan memahami forecasting**
6. **Responsiveness dan mobile usability**
7. **Visual modern yang profesional**

---

# 13. Deliverables yang Harus Dibuat

Buat hasil desain / implementasi UI yang mencakup:

1. desain **dashboard utama**
2. desain **inventory page**
3. desain **detail sparepart**
4. desain **forecasting page**
5. desain **restock recommendation page**
6. desain **branch monitoring page**
7. desain **transactions page**
8. desain **reports page**
9. desain **responsive mobile version** untuk halaman-halaman utama
10. **design system / reusable components** yang konsisten

---

# 14. Instruksi Gaya untuk AI / Designer

Saat membuat desain, jangan hanya membuat card dan tabel biasa. Bangun pengalaman visual yang:

* strategis
* informatif
* modern
* memiliki hierarchy kuat
* cocok untuk sistem inventory dan analytics
* terasa seperti dashboard enterprise / SaaS premium

Utamakan:

* keterbacaan
* layout yang matang
* konsistensi spacing
* ritme visual antar section
* keseimbangan antara data padat dan kenyamanan melihat

Jika perlu, gunakan kombinasi:

* dashboard analytics style
* inventory management UI pattern
* supply chain monitoring feel
* forecasting insights panel
* executive summary cards

Hasil akhir harus tampak seperti **produk web inventory + forecasting profesional untuk bengkel multi-cabang**, bukan template admin generik.
