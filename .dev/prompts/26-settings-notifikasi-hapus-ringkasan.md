# Prompt: Settings — Notifikasi: Hapus Ringkasan Mingguan

Kamu adalah frontend engineer yang bertanggung jawab menghapus opsi "Ringkasan Mingguan" dari tab Notifikasi di SettingsPage.tsx.

## Perubahan

1. **Hapus baris "Ringkasan Mingguan"** — hapus baris `Row` yang berisi `label="Ringkasan Mingguan"` dan `sub="Laporan performa tiap Senin pagi"` dari tab notifikasi.
2. **Hapus state `weekly`** — hapus properti `weekly` dari state `notif` di `useState({ emailKritis: true, emailRestock: true, browser: false, weekly: true })`.

## File yang Diubah

- `frontend/src/app/pages/app/SettingsPage.tsx`

## Catatan

- Jangan hapus baris `Row` lainnya (Email Stok Kritis, Email Restock, Notifikasi Browser).
- Jangan hapus tombol "Simpan".
