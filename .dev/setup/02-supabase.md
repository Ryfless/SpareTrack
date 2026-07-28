# Setup Supabase

Panduan ini menyiapkan Supabase untuk autentikasi dan database SpareTrack.

## Tujuan

- Memakai Supabase Auth untuk email login, OTP via email, dan Google login.
- Menyimpan data aplikasi ke tabel terpisah di Postgres Supabase.
- Menyediakan storage, audit, dan policy yang aman.

## Langkah Setup Auth

1. Buat project Supabase baru.
2. Aktifkan provider:
   - Email auth.
   - OTP / magic link via email.
   - Google OAuth provider.
3. Set redirect URL ke domain frontend dan backend callback yang diperlukan.
4. Atur email template OTP agar sesuai branding SpareTrack.
5. Pastikan pengguna baru diberi profil dasar pada tabel aplikasi setelah sign-up.

## Skema Tabel Inti yang Disarankan

- `profiles`
- `roles`
- `branches`
- `suppliers`
- `categories`
- `spareparts`
- `branch_stocks`
- `stock_movements`
- `restock_recommendations`
- `purchase_orders`
- `forecast_series`
- `forecast_runs`
- `activities`
- `notifications`
- `audit_logs`
- `api_tokens`
- `settings`

## Aturan Desain Data

- Simpan identitas auth di tabel auth Supabase, lalu data profil aplikasi di `profiles`.
- Relasi stok harus per cabang, bukan hanya total global.
- Data forecasting dan rekomendasi restock harus dapat dilacak per periode.
- Audit log harus menyimpan aktor, aksi, entitas, dan timestamp.

## Row Level Security

- Aktifkan RLS untuk tabel yang berisi data bisnis.
- Batasi akses berdasarkan role dan branch scope.
- Admin pusat dapat melihat seluruh cabang.
- Admin cabang hanya dapat melihat cabangnya sendiri.

## Output yang Diharapkan

- Auth siap dipakai frontend.
- Database siap dipakai backend Express.
- Struktur data siap untuk migrasi placeholder data.
