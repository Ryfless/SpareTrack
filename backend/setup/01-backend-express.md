# Setup Backend Express Node.js

Panduan ini menyiapkan backend API untuk SpareTrack menggunakan Express Node.js.

## Target

- Server API berjalan terpisah dari frontend.
- Menyediakan REST API dengan versioning seperti `/api/v1`.
- Menangani auth middleware, validation, logging, error handling, dan CORS.
- Menjadi satu-satunya lapisan bisnis untuk modul inventory, transaction, restock, forecasting, branch, report, dan settings.

## Langkah Setup

1. Inisialisasi project Node.js di folder `backend/`.
2. Pasang paket inti seperti `express`, `cors`, `dotenv`, `helmet`, `morgan`, dan validator pilihan kamu.
3. Buat struktur dasar:
   - `src/server.js` atau `src/index.ts`
   - `src/app.js`
   - `src/routes/`
   - `src/controllers/`
   - `src/services/`
   - `src/middlewares/`
   - `src/utils/`
   - `src/config/`
4. Buat middleware global untuk JSON parsing, CORS, auth guard, request logging, dan error handler.
5. Buat route health check seperti `GET /health`.
6. Siapkan pola response standar untuk sukses dan error.
7. Siapkan layer service untuk akses Supabase dan logika bisnis.

## Konfigurasi Environment

- `PORT`
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET` jika kamu tetap memerlukan token internal backend.

## Keamanan Minimum

- Aktifkan CORS hanya untuk origin frontend yang valid.
- Jangan expose service role key ke frontend.
- Validasi semua body request.
- Lindungi endpoint admin dengan middleware role-based access control.

## Output yang Diharapkan

- API server siap menerima request dari frontend.
- Struktur kode mudah dipisah per modul.
- Siap dihubungkan ke Supabase dan migrasi data.
