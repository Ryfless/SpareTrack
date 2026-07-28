# Prompt: Settings — Keamanan: Hanya Ganti Password & Riwayat Login

Kamu adalah frontend engineer yang bertanggung jawab menyederhanakan tab Keamanan di SettingsPage.tsx.

## Perubahan

1. **Hapus item "Autentikasi 2FA"** — hapus entry `{ icon:Smartphone, title:"Autentikasi 2FA", desc:"..." }` dari array di tab keamanan.
2. **Hapus item "API Token"** — hapus entry `{ icon:KeyRound, title:"API Token", desc:"..." }` dari array di tab keamanan.
3. **Hapus seluruh section API Token Aktif** — hapus blok yang dimulai dengan `{settingsData?.api_tokens && settingsData.api_tokens.length > 0 && (` (seluruh konten manajemen token).
4. Yang tersisa hanya: **"Ubah Password"** dan **"Riwayat Login"**.

## File yang Diubah

- `frontend/src/app/pages/app/SettingsPage.tsx`

## Catatan

- Jangan hapus import `Smartphone` atau `KeyRound` jika masih dipakai di tempat lain.
- Layout grid tetap rapi dengan 2 item.
