# Prompt: Manajemen Users CRUD

Kamu adalah backend & frontend engineer yang bertanggung jawab mengimplementasikan fitur manajemen pengguna (users CRUD) di SpareTrack.

## Ruang Lingkup

- Backend: endpoint CRUD untuk users (list, detail, create, update, delete/nonaktifkan).
- Frontend: halaman Settings → tab "Pengguna" yang terintegrasi dengan API (saat ini masih hardcoded).
- Role management: `super_admin`, `branch_admin`.
- Integrasi dengan Supabase Auth untuk create user (admin membuat akun user baru).

## Yang Harus Dihasilkan (Backend)

1. File baru `src/services/usersService.js` dengan fungsi:
   - `list(query)` — paginasi, filter role, status, search nama/email.
   - `detail(id)` — profil + cabang + last login.
   - `create(data)` — buat user di Supabase Auth + insert profile di tabel `profiles`.
   - `update(id, data)` — update profil, role, branch.
   - `toggleActive(id)` — nonaktifkan/aktifkan user (set `is_active` di profile atau block di Auth).
2. File baru `src/controllers/usersController.js`.
3. File baru `src/routes/users.js`.
4. Daftarkan di `src/routes/index.js` dengan prefix `/users`.
5. Proteksi: semua endpoint hanya untuk `super_admin`.

## Yang Harus Dihasilkan (Frontend)

1. Modifikasi `SettingsPage.tsx` tab `pengguna` — ganti data hardcoded dengan panggilan API.
2. Service baru `src/services/users.ts` dengan fungsi:
   - `getUsers(query)` — ambil list user.
   - `createUser(data)` — buat user baru.
   - `updateUser(id, data)` — update user.
   - `toggleUserActive(id)` — aktif/nonaktifkan.
3. Form modal tambah user: nama, email, role (dropdown), branch (dropdown).
4. Row actions: Edit (buka modal edit), Nonaktifkan (dengan konfirmasi).
5. Status badge: Aktif / Nonaktif dengan warna sesuai.
6. Refresh table setelah create/update/toggle.

## Aturan Bisnis

- Saat create user: gunakan `supabaseAdmin.auth.admin.createUser()` untuk buat akun Auth, lalu insert profile.
- Email user baru bisa pakai password random + flag `email_confirm: false` agar admin yang tentukan.
- Jangan tampilkan password di response API.
- Role `super_admin` hanya bisa dibuat oleh `super_admin` yang sudah ada.
- User yang dinonaktifkan tidak bisa login (gunakan `banUser` atau manage metadata).
- Field `branch` di profile: pilihan dari tabel `branches`.

## Output Yang Diinginkan

- Backend: service + controller + routes untuk users CRUD, terdaftar di index routes.
- Frontend: service layer users.ts, SettingsPage tab pengguna real dari API, modal create/edit.
- Data konsisten antara Supabase Auth + tabel `profiles`.
