# Prompt: Integrasi Frontend ke Backend

Kamu adalah engineer full-stack. Integrasikan frontend SpareTrack yang sudah ada dengan backend Express dan Supabase API.

## Konteks Frontend

- Ada auth flow: landing, login, register, forgot, OTP.
- Ada halaman dashboard, inventory, restock, branches, transactions, reports, settings.
- Ada komponen detail drawer, command palette, modal stok masuk/keluar/transfer, dan profil.
- Data placeholder harus diganti ke data API.

## Yang Harus Dihasilkan

1. Peta file frontend yang perlu diganti dari mock ke API.
2. Strategi client API untuk fetch, cache, loading, dan error state.
3. Daftar hook atau service layer yang perlu dibuat.
4. Cara mem-attach access token auth ke request backend.
5. Urutan migrasi paling aman agar UI tidak rusak.

## Prinsip Implementasi

- Jangan mengubah design language frontend tanpa alasan.
- Jaga UX loading skeleton, empty state, dan toast.
- Gunakan service layer agar komponen UI tetap tipis.
- Pecah per modul: auth dulu, lalu dashboard, inventory, restock, transaksi, reports, settings.

## Fokus Output

- Berikan contoh pola request API untuk komponen utama.
- Berikan mapping data UI ke DTO backend.
- Berikan daftar titik integrasi paling penting pada frontend.
