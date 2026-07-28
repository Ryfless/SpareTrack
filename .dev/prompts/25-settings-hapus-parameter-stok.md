# Prompt: Settings — Hapus Parameter Stok, Ganti dengan Bantuan

Kamu adalah frontend engineer yang bertanggung jawab mengubah tab navigasi dan konten di SettingsPage.tsx.

## Perubahan

1. **Hapus tab "Parameter Stok"** — hapus entry `{ id:"parameter", label:"Parameter Stok", icon:Sliders }` dari array `tabs`.
2. **Ganti dengan tab "Bantuan"** — tambah entry baru `{ id:"bantuan", label:"Bantuan", icon:HelpCircle }` di array `tabs`.
3. **Implementasi konten tab "Bantuan"** — buat section baru untuk `tab === "bantuan"` dengan informasi:
   - Judul "Pusat Bantuan"
   - Daftar topik bantuan (accordion sederhana atau list dengan chevron):
     - "Cara Mengelola Stok" — deskripsi singkat
     - "Cara Membuat PO" — deskripsi singkat
     - "Cara Membaca Laporan" — deskripsi singkat
     - "Menghubungi Dukungan" — email/telepon/alamat
   - Gunakan komponen Card yang sama, styling konsisten dengan tab lain.
   - Ikon: import `HelpCircle` dari `lucide-react`.

## File yang Diubah

- `frontend/src/app/pages/app/SettingsPage.tsx`

## Catatan

- Layout dan styling harus konsisten dengan tab-tab lain di SettingsPage.
- Tambahkan Tab ke array tabs di posisi yang sesuai (antara "Notifikasi" dan "Keamanan", atau di akhir).
- Jangan hapus import `Sliders` jika masih dipakai di tempat lain; jika tidak, hapus.
