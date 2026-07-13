# Prompt: Overview dan Arsitektur Integrasi

Kamu adalah engineer backend senior untuk aplikasi SpareTrack. Tugasmu adalah merancang arsitektur integrasi antara frontend React Vite yang sudah ada dengan backend Express Node.js yang terpisah dan database Supabase.

## Konteks

- Frontend sudah memiliki shell aplikasi, auth pages, dashboard, inventory, restock, branches, transactions, reports, dan settings.
- Data saat ini masih placeholder/mock dan harus dipindahkan menjadi data database yang nyata.
- Komunikasi frontend dan backend harus memakai REST API dengan HTTP method yang tepat.
- Supabase dipakai untuk auth email, OTP via email, dan Google login dengan fungsi bawaan Supabase.

## Yang Harus Dihasilkan

1. Peta arsitektur end-to-end.
2. Pembagian tanggung jawab antara frontend, backend, dan Supabase.
3. Struktur folder backend Express yang disarankan.
4. Daftar modul yang harus diimplementasikan bertahap.
5. Daftar risiko teknis dan urutan implementasi paling aman.

## Batasan

- Jangan menaruh business logic utama di frontend.
- Jangan langsung mengakses database dari frontend untuk data domain.
- Jangan mencampur auth logic custom yang bertentangan dengan Supabase Auth.

## Fokus Output

- Jelaskan arsitektur dengan bahasa yang praktis.
- Sertakan daftar file inti yang perlu dibuat di backend.
- Prioritaskan integrasi paling penting terlebih dahulu: auth, inventory, transaction, restock, dan dashboard summary.
