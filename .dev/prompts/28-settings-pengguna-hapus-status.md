# Prompt: Settings — Pengguna: Hapus Kolom Status Aktif/Nonaktif

Kamu adalah frontend engineer yang bertanggung jawab menghapus fitur status aktif/nonaktif dari tabel Manajemen Pengguna di SettingsPage.tsx.

## Perubahan

1. **Hapus kolom "Status" dari header tabel** — di baris `<thead>`, hapus `"Status"` dari array string header.
2. **Hapus kolom status dari body tabel** — hapus `<td>` yang berisi badge "Aktif"/"Nonaktif" (`<span className=...>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>`).
3. **Hapus kolom aksi "Nonaktifkan"/"Aktifkan"** — hapus `<td>` yang berisi tombol `toggleUserActive` (tombol "Edit" tetap dipertahankan).
4. **Hapus import dan fungsi `toggleUserActive`** — jika tidak dipakai di tempat lain, hapus `toggleUserActive` dari import `services/users`.

## File yang Diubah

- `frontend/src/app/pages/app/SettingsPage.tsx`

## Catatan

- Tombol "Edit" (yang membuka `ManageUserModal`) tetap ada.
- Fungsi `loadUsers` dan state `users`, `usersMeta`, `usersLoading`, `usersPage` tetap dipertahankan.
- Pastikan `colSpan` tidak bermasalah setelah pengurangan kolom.
