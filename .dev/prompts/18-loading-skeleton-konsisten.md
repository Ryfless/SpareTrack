# Prompt: Loading Skeleton Konsisten

Kamu adalah frontend engineer yang bertanggung jawab menstandarisasi loading state di semua halaman SpareTrack menggunakan komponen `Skeleton`.

---

## Latar Belakang

Saat ini beberapa halaman menggunakan loading spinner, teks "Loading...", atau tidak ada loading state sama sekali. Semua halaman harus konsisten menggunakan komponen `Skeleton` yang sudah ada di `components/shared/Skeleton.tsx`.

## Yang Harus Diperbaiki

Audit dan perbaiki semua halaman berikut:

### 1. InventoryPage.tsx
- [ ] Cek apakah sudah pakai Skeleton.
- [ ] Tabel loading: 5-8 baris Skeleton dengan lebar bervariasi.
- [ ] Filter/sort loading: skeleton untuk dropdown dan input.

### 2. TransactionsPage.tsx
- [ ] Cek apakah sudah pakai Skeleton.
- [ ] Tabel loading: Skeleton per baris (kolom: tipe, sparepart, cabang, qty, user, waktu).
- [ ] Filter loading: skeleton untuk date range dan dropdown.

### 3. ReportsPage.tsx
- [ ] Summary cards loading: 3-4 card Skeleton.
- [ ] Tabel item kritis loading: Skeleton per baris.
- [ ] Export buttons: nonaktif saat loading (disabled).

### 4. BranchesPage.tsx
- [ ] Daftar cabang loading: Skeleton card per cabang.
- [ ] Tabel stok loading: Skeleton per baris.

### 5. RestockPage.tsx
- [ ] Rekomendasi cards loading: Skeleton card sesuai grid (3 kolom).
- [ ] PO table loading: Skeleton per baris.
- [ ] Tombol Generate: disabled + spinner saat generating (sudah ada, verifikasi).

### 6. DashboardPage.tsx
- [ ] KPI cards loading: 4 Skeleton card.
- [ ] Chart loading: Skeleton dengan tinggi chart.
- [ ] Aktivitas terbaru loading: Skeleton per baris.
- [ ] Rekomendasi restock loading: Skeleton card.

### 7. SettingsPage.tsx
- [ ] Tab content loading: Skeleton sesuai layout masing-masing tab.

## Yang Harus Dihasilkan

1. **Standarisasi pola** — setiap halaman harus punya pola yang sama:
   ```tsx
   {loading ? (
     <div className="space-y-3">
       {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12" />)}
     </div>
   ) : (
     // konten asli
   )}
   ```

2. **`Skeleton` component** — sudah ada, pastikan properti `className` untuk mengatur dimensi.

3. **Hilangkan semua**:
   - Teks "Loading..." (kecuali untuk keperluan aksesibilitas `sr-only`).
   - Spinner manual (`<Loader2 className="animate-spin" />`) — ganti dengan Skeleton.
   - Fragment yang tidak konsisten.

## Aturan Bisnis

- Skeleton harus merepresentasikan layout asli (tabel → baris, card → kotak, dll).
- Jangan tampilkan Skeleton setelah data pertama kali dimuat (gunakan cache state jika perlu).
- Animasi skeleton: pakai Tailwind `animate-pulse` (bawaan komponen).

## Output Yang Diinginkan

- Semua halaman konsisten menggunakan Skeleton.
- Tidak ada loading spinner atau teks "Loading..." yang tidak perlu.
- Transisi loading → konten terasa halus.
