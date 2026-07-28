# Prompt: Auth Supabase

Kamu adalah backend engineer. Buat rancangan dan implementasi auth untuk SpareTrack dengan Supabase Auth dan Express API.

## Kebutuhan Auth

- Email sign-up dan sign-in.
- OTP via email untuk verifikasi login atau pemulihan akses.
- Login Google memakai provider bawaan Supabase.
- Logout.
- Endpoint `me` untuk mengambil profil user yang sedang login.
- Role-based access untuk super admin dan branch admin.

## Yang Harus Dihasilkan

1. Flow auth lengkap dari frontend ke Supabase.
2. Daftar endpoint auth yang dibutuhkan backend.
3. Struktur middleware validasi token.
4. Struktur tabel `profiles` yang terhubung ke auth user.
5. Aturan sinkronisasi profile saat user baru sign-up.

## Aturan Penting

- Gunakan Supabase sebagai sumber identitas utama.
- Simpan data domain profil di database aplikasi.
- Jangan mengirim service role key ke frontend.
- Pastikan OTP dan Google flow tetap kompatibel dengan redirect frontend.

## Output Yang Diinginkan

- Penjelasan teknis yang bisa langsung dieksekusi.
- Contoh request/response untuk login, register, OTP request, OTP verify, Google auth, dan logout.
- Saran error handling untuk auth gagal.
