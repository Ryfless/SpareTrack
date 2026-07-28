# Prompt: Spesifikasi REST API

Kamu adalah backend engineer yang harus membuat spesifikasi REST API untuk frontend SpareTrack.

## Tujuan

- Semua fitur frontend berbicara ke backend melalui REST API.
- Gunakan method HTTP yang sesuai: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`.
- Setiap endpoint harus punya request, response, validasi, dan error format yang jelas.

## Modul Yang Harus Dipetakan

- Auth
- Dashboard summary
- Inventory
- Detail sparepart
- Branch monitoring
- Transaction management
- Restock recommendation
- Forecasting
- Reports
- Settings

## Yang Harus Dihasilkan

1. Daftar endpoint per modul.
2. Contoh body request untuk create dan update.
3. Contoh response paginated.
4. Daftar status code yang dipakai.
5. Aturan filter, sort, dan pagination.

## Format Yang Diinginkan

- Gunakan versi API seperti `/api/v1`.
- Gunakan parameter query untuk filter, sort, branch scope, dan search.
- Gunakan response data yang stabil agar frontend mudah dihubungkan.

## Output Tambahan

- Jelaskan endpoint mana yang read-only.
- Jelaskan endpoint mana yang butuh role admin pusat atau admin cabang.
- Jelaskan endpoint mana yang perlu audit log.
