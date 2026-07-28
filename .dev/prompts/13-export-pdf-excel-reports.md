# Prompt: Export PDF/Excel Reports

Kamu adalah backend engineer yang bertanggung jawab mengimplementasikan export laporan dalam format PDF dan Excel di SpareTrack.

## Ruang Lingkup

- Backend: endpoint export PDF dan Excel untuk laporan dari halaman Reports.
- Format laporan: summary stok, transaksi per periode, item kritis.
- Download file dari frontend ReportsPage.

## Yang Harus Dihasilkan (Backend)

1. **Export PDF** — `GET /reports/export/pdf`
   - Parameter query: `type` (summary/transactions/critical), `start_date`, `end_date`, `branch_id`.
   - Generate PDF menggunakan library `pdfkit` atau `jspdf` (cek package.json, install jika belum).
   - Layout: kop SpareTrack, judul laporan, periode, tabel data, footer tanggal cetak.
   - Response: `Content-Type: application/pdf` + `Content-Disposition: attachment; filename="laporan-{type}-{date}.pdf"`.

2. **Export Excel** — `GET /reports/export/excel`
   - Parameter dan filter sama dengan PDF.
   - Generate XLSX menggunakan library `exceljs`.
   - Sheet: data laporan dengan header bold, auto-width column, border.
   - Response: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

3. **Data source**:
   - `type=summary`: data dari `reportsService.summary()`.
   - `type=transactions`: data transaksi per periode dari `transactionsService.list()`.
   - `type=critical`: data item kritis dari `restockService.summary()` bagian critical_items.

4. **Modifikasi** `reportsController.js` — tambah handler `exportPdf` dan `exportExcel`.
5. **Modifikasi** `src/routes/reports.js` — daftarkan endpoint baru.

## Yang Harus Dihasilkan (Frontend)

1. **Tombol Export** di `ReportsPage.tsx`:
   - Dropdown atau dua tombol: "Export PDF" dan "Export Excel".
   - Filter yang aktif (date range, branch) ikut dikirim ke backend.
   - Loading spinner saat proses export.
   - Download file otomatis setelah response diterima.

2. **Fungsi download** — gunakan fetch → blob → `URL.createObjectURL` → `<a>` click.

## Aturan Bisnis

- Export dibatasi maksimal 30 hari per request (validasi di backend).
- Hanya user `super_admin` yang bisa export.
- File PDF: gunakan font standalone (jangan tergantung system font) agar konsisten.
- File Excel: gunakan styling minimal (header bold, border tipis).
- Generate file di memory (buffer), jangan simpan di disk.

## Output Yang Diinginkan

- Backend: 2 endpoint export PDF & Excel dengan filter date range, branch, type.
- Frontend: tombol export di ReportsPage yang trigger download.
- File laporan siap cetak dengan format profesional.
