# API Contract

Panduan ini mendefinisikan bentuk komunikasi frontend dan backend melalui REST API.

## Prinsip

- Gunakan HTTP method yang benar.
- Gunakan URI yang konsisten.
- Gunakan format response yang seragam.
- Semua fitur bisnis berjalan lewat backend, bukan logic frontend.

## Response Standar

### Success

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

## Endpoint Minimum

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/inventory`
- `GET /api/v1/inventory/:id`
- `POST /api/v1/inventory`
- `PATCH /api/v1/inventory/:id`
- `GET /api/v1/branches`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `GET /api/v1/restock/recommendations`
- `POST /api/v1/restock/recommendations/:id/approve`
- `GET /api/v1/forecast/runs`
- `POST /api/v1/forecast/runs`
- `GET /api/v1/reports/summary`
- `GET /api/v1/settings`
- `PATCH /api/v1/settings`

## Header yang Disarankan

- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`
- `X-Branch-Id` jika request perlu scope cabang tertentu.

## Output yang Diharapkan

- Frontend bisa memanggil API dengan satu pola.
- Backend lebih mudah diuji dan didokumentasikan.
- Endpoint siap dipetakan ke modul UI.
