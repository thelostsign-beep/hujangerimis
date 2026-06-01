
Catatan Sesi: Integrasi Supabase & Perbaikan Website Insentif Ujian SMP ABBS
=======================================================================
Tanggal: 1 Juni 2026
Project: `sample-website/` — SMP ABBS Surakarta
Deploy: https://gerimismengundang.vercel.app (Vercel, via GitHub)
Repo: https://github.com/thelostsign-beep/hujangerimis.git

---

## Yang sudah dikerjakan

### 1. Integrasi Supabase
- **Supabase URL**: https://humbozgfoxttkocqssrz.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **Config file**: `js/supabase.js` (export SUPABASE_URL + SUPABASE_ANON_KEY)
- **CDN**: `@supabase/supabase-js@2` via unpkg, ditambah ke semua halaman HTML

### 2. Rewrite `js/db.js`
- **init() jadi async** — `await DB.init()` di semua halaman (pakai async IIFE)
- In-memory cache (`_data`) mirip struktur localStorage lama
- Semua getter synchronous (baca dari cache)
- Semua setter update cache + fire-and-forget `_saveToSupabase()`
- **`_loadFromSupabase()`**: coba RPC `get_all_data()` dulu, fallback 11 parallel queries
- **`_saveToSupabase()`**: parallel batch upsert per tabel
- **sessionStorage cache** (`siiu_cache`) — navigasi antar halaman admin jadi instan
- Fallback ke localStorage kalau Supabase gagal
- Auto-seed data awal kalau Supabase kosong

### 3. File SQL Baru
- `supabase.sql` — lengkap: tabel + seed + RLS disable + RPC function
- `supabase_rpc.sql` — fungsi `get_all_data()` untuk 1 query semua tabel
- `supabase_rls_fix.sql` — disable RLS semua tabel

### 4. SQL yang Harus Dijalankan di Supabase Dashboard
```sql
-- Jalankan fungsi RPC agar 1 query bukan 11
CREATE OR REPLACE FUNCTION get_all_data() ... (lihat supabase_rpc.sql)

-- Disable RLS agar anon key bisa write
ALTER TABLE ... DISABLE ROW LEVEL SECURITY; (lihat supabase_rls_fix.sql)
```

### 5. Perbaikan UI
- Sticky header tabel rekap (`position: sticky` pada `<thead>`)
- Overflow scroll di card summary (max-height 70vh)
- Fixed header No, Nama Guru, Mapel, Panitia, Total (rowspan)
- Sticky columns kiri (No, Nama Guru) tetap berfungsi
- Favicon (data URI emoji) di semua halaman — hilangkan 404

### 6. Data Seed (41 Guru + 18 Kelas + Komponen)
- Guru: 41 guru, Tri Wijayanti hidden, sisanya aktif
- Kelas: 7A–9F (18 kelas) dengan jumlah siswa
- Komponen: 10 aktivitas (Membuat soal s.d. Input nilai leger)
- Roles: Ketua Panitia, Sekretaris, Tim Teknis
- Mapel: Social, Civic, English, Indonesian, Math, Science, Qur'an, IFE, Javanese, ICT, Sport

### 7. Git & GitHub
- Init repo, remote origin, push ke `thelostsign-beep/hujangerimis`
- PAT token digunakan (sudah di-reset dari remote URL setelah push)

---

## Yang masih pending / diketahui

### Performa lambat
- Disebabkan query ke Supabase (cold start serverless + latensi jaringan)
- **Solusi maksimal dari kode**: 1 RPC query + batch upsert + session cache — sudah dilakukan
- **Solusi lanjutan**: hosting VPS region Indonesia, atau upgrade Supabase Pro
- Browser mungkin batasi concurrent requests (6 per domain), Promise.all tetap antri

### Supabase Auth (login)
- Login admin masih manual dari tabel `admins` (username `admin`, password `admin123`)
- Belum pakai Supabase Auth. Kalau mau upgrade, perlu:
  - Migrasi tabel `admins` ke Supabase Auth users
  - Ganti flow login pake `supabase.auth.signInWithPassword()`
  - RLS policies untuk user-based access

### Fitur belum
- (tidak ada yang ditambahkan sesi ini selain Supabase integration)

---

## Cara develop lanjutan
1. Buka repo di VSCode: `E:\smp abbs\dokumen kurikulum\2025 2026\paten insentif ujian\sample-website`
2. Edit file, commit, push:
```powershell
git add -A; git commit -m "pesan"; git push
```
3. Vercel auto-deploy dari GitHub
4. Cek console browser (F12) untuk error
5. Data di Supabase dashboard: https://supabase.com/dashboard/project/humbozgfoxttkocqssrz
