# SpareTrack Backend Integration Guide

Dokumen ini adalah pusat koordinasi untuk integrasi frontend SpareTrack dengan backend Express Node.js, REST API, dan Supabase.

## Tujuan

- Memindahkan data placeholder frontend ke struktur tabel database yang nyata.
- Menjalankan semua fitur bisnis melalui backend.
- Menggunakan REST API dan HTTP method untuk komunikasi frontend-backend.
- Memakai Supabase untuk autentikasi email, OTP via email, dan login Google melalui fungsi bawaan Supabase.

## Struktur Folder

- `backend/prompts/` berisi prompt markdown yang dipakai untuk mengarahkan implementasi per modul.
- `backend/setup/` berisi panduan setup backend, Supabase, dan kontrak API.

## Urutan Kerja yang Disarankan

1. Baca `backend/setup/01-backend-express.md` untuk menyiapkan server Express.
2. Baca `backend/setup/02-supabase.md` untuk menyiapkan auth dan database Supabase.
3. Baca `backend/setup/03-api-contract.md` untuk menetapkan standar endpoint, response, dan error format.
4. Gunakan prompt di `backend/prompts/` untuk implementasi bertahap.

## Modul Frontend yang Harus Terhubung ke API

- Auth: landing, login, register, forgot password, OTP, dan profil user.
- Dashboard: KPI, aktivitas terakhir, branch summary, forecast summary, dan rekomendasi restock.
- Inventory: daftar sparepart, filter, detail drawer, bulk action, dan status stok.
- Restock: rekomendasi restock, approval, purchase order, dan workflow restock.
- Branches: ringkasan stok per cabang dan monitoring cabang.
- Transactions: stok masuk, stok keluar, transfer, dan adjustment.
- Reports: ringkasan analitik dan ekspor laporan.
- Settings: profil, keamanan, API token, role, notifikasi, dan audit.

## Konvensi Integrasi

- Frontend tidak boleh langsung mengakses database selain autentikasi Supabase yang memang dikelola Supabase.
- Semua data domain harus lewat Express API.
- Gunakan akses token Supabase untuk request yang butuh autentikasi.
- Simpan konfigurasi environment di `.env` terpisah untuk backend dan frontend.

## File Prompt

- `backend/prompts/01-overview-and-architecture.md`
- `backend/prompts/02-auth-supabase.md`
- `backend/prompts/03-database-and-migration.md`
- `backend/prompts/04-rest-api-spec.md`
- `backend/prompts/05-frontend-integration.md`
- `backend/prompts/06-module-inventory.md`
- `backend/prompts/07-module-restock-and-forecast.md`
