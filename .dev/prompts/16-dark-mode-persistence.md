# Prompt: Dark Mode Persistence

Kamu adalah backend & frontend engineer yang bertanggung jawab mengimplementasikan persistensi dark mode di SpareTrack.

---

## Latar Belakang

Saat ini dark mode hanya disimpan di `localStorage` — hilang jika ganti browser/hapus cache. Preferensi harus tersimpan di database agar persisten lintas sesi dan perangkat.

## Yang Harus Dihasilkan (Backend)

1. Tambah kolom `theme_preference` di tabel `profiles` (via migration file baru `007_theme_preference.sql`):
   ```sql
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark'));
   ```

2. Perbarui `settingsService.js` atau `authService.js`:
   - Saat login/me, sertakan `theme_preference` di response profil.
   - Endpoint baru atau reuse `PATCH /me` untuk update `theme_preference`.

3. Jika ada endpoint `PATCH /me` di `authController.js`, tambahkan logika update `theme_preference`.

## Yang Harus Dihasilkan (Frontend)

1. Di `App.tsx` atau `Layout.tsx`:
   - Saat app mount, baca `theme_preference` dari profil user (API `GET /me`).
   - Set dark mode sesuai preferensi dari DB.
   - Jika user belum login, fallback ke `localStorage` / `prefers-color-scheme`.

2. Di `SettingsPage.tsx` tab `appearance`:
   - Saat toggle dark mode, kirim `PATCH /me` dengan `{ theme_preference: 'dark' }` atau `{ theme_preference: 'light' }`.
   - Optimis update: toggle UI dulu, baru kirim ke API.
   - Jika gagal, rollback toggle + tampilkan toast error.

3. Service `auth.ts` atau `settings.ts`:
   - `updateThemePreference(theme)` → `PATCH /me` dengan body `{ theme_preference: theme }`.

## Aturan Bisnis

- Preferensi theme milik user, tidak per cabang.
- Guest (belum login) tetap pakai localStorage.
- `super_admin` dan `branch_admin` sama-sama bisa set theme sendiri.

## Output Yang Diinginkan

- Dark mode tetap menyala setelah refresh/ganti browser.
- Toggle di Settings langsung persist ke database.
- Tidak ada flashing light-to-dark saat pertama load (baca preferensi sebelum render).
