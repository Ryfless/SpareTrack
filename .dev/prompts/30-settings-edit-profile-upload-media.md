# Prompt: Settings — Edit Profile: Upload Media ke Supabase Storage

Kamu adalah frontend engineer yang bertanggung jawab mengimplementasikan upload foto profil ke Supabase Storage di `EditProfileModal.tsx`.

## Konteks

- `supabase` client sudah siap di `frontend/src/app/services/supabase.ts`
- `EditProfileModal` saat ini hanya menampilkan avatar berupa lingkaran dengan inisial (`${initial}`)
- Backend endpoint `PATCH /me` sudah menerima data profil (full_name, phone)
- Field `avatar_url` sudah tersedia di tabel `profiles` dan di `SettingsProfile` interface

## Yang Harus Dihasilkan

1. **Upload foto profil** di EditProfileModal:
   - Avatar saat ini (lingkaran inisial) bisa diklik untuk mengganti foto.
   - Input file tersembunyi (`<input type="file" accept="image/*" hidden />`) yang dipicu oleh klik pada avatar.
   - Saat file dipilih:
     a. Generate path unik: `avatars/{userId}/{timestamp}-{filename}`.
     b. Upload ke Supabase Storage bucket `avatars` pake `supabase.storage.from('avatars').upload(path, file)`.
     c. Dapatkan public URL: `supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl`.
     d. Simpan `avatar_url` ke backend via `api.patch('/me', { avatar_url })`.
   - Tampilkan preview gambar setelah upload (ganti lingkaran inisial dengan `<img>`).
   - Loading state selama upload (spinner overlay di avatar).

2. **State avatar di SettingsPage**:
   - Saat `EditProfileModal` sukses (`onSaved`), reload data settings agar avatar baru tampil di halaman utama.
   - Tampilkan avatar (jika ada `avatar_url`) sebagai `<img>` di lingkaran profil, bukan inisial.

3. **Supabase Storage bucket**:
   - Pastikan bucket `avatars` sudah dibuat di Supabase dashboard (ataal tambahkan migration/script).
   - Set policy bucket: `INSERT, SELECT, UPDATE` untuk `owner = auth.uid()` (hanya user sendiri yang bisa upload/ubah avatar sendiri).

## File yang Diubah

- `frontend/src/app/components/modals/EditProfileModal.tsx`
- `frontend/src/app/pages/app/SettingsPage.tsx`
- Opsional: migration SQL untuk membuat bucket `avatars` dan policy RLS.

## Catatan

- Ukuran file maksimal 2 MB.
- Hanya terima format gambar: jpeg, png, webp.
- Jika upload gagal, tampilkan toast error dan jangan tutup modal.
- Jika user tidak memilih file baru, avatar_url tetap seperti sebelumnya.
- Jangan gunakan library pihak ketiga untuk upload — cukup `supabase-js` yang sudah terinstall.
