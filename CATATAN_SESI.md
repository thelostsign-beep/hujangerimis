
Catatan Sesi: Integrasi Supabase & Perbaikan Website Insentif Ujian SMP ABBS
=======================================================================
Tanggal: 1 Juni 2026
Project: `sample-website/` — SMP ABBS Surakarta
Deploy: https://gerimismengundang.vercel.app (Vercel, via GitHub)
Repo: https://github.com/thelostsign-beep/hujangerimis.git

---

# Sesi 16 Juni 2026 — Nominal Kepanitiaan, Perbaikan Total & Freeze Tabel Rekap

## 1. Nominal Kepanitiaan (fitur baru)
- Tiap peran kepanitiaan kini punya **nominal** (sebelumnya cuma label).
- Diatur admin di **Komponen → Opsi Kepanitiaan** (kolom Nominal, bisa edit) **dan** di **Rekap → Pagu per Komponen & Kepanitiaan** (edit langsung).
- Konsep: nominal **tetap per peran, ditambahkan 1×** ke total insentif guru yang memegang peran tsb.
- Form guru tetap **tidak** menampilkan nominal (admin-only) — hanya nama peran.
- **Migrasi DB** (sudah dijalankan user di Supabase SQL Editor): `supabase_committee_nominal.sql`
  - `ALTER TABLE committee_roles ADD COLUMN nominal INTEGER DEFAULT 0`
  - update RPC `get_all_data` agar ikut mengirim `nominal`
  - aman/additif, tidak mengubah data lama.
- `committee_roles` di `db.js` kini array objek `{name, nominal}` (sebelumnya array string) — backward-compatible.

## 2. Perbaikan Input/Output/Selisih (bug "tidak nyambung")
- Penyebab: kartu Outcome/Selisih pakai `total` tersimpan (rate beku), tabel pakai rate terbaru → tidak sinkron.
- Solusi: satu sumber hitung `_recalcSubmission()` / `_recalcAll()` di `db.js` — sinkronkan rate item ke rate komponen terbaru + tambah nominal panitia.
- Dipakai di semua titik (submit, edit qty, edit panitia, approve, ubah rate, ubah nominal panitia). Ubah rate/nominal → semua total + Outcome + Selisih otomatis menyesuaikan & tersimpan.

## 3. Input Manual di Rekap
- Semua baris guru bisa diedit langsung (qty & panitia), **termasuk guru yang belum mengisi** — otomatis dibuatkan submission baru (`submittedBy: 'admin'`).
- Guru **tersembunyi** (hidden) kini **tetap muncul di rekap** (via `DB.getRekapTeachers()` — sertakan hidden, kecualikan yang dihapus) dengan label "tersembunyi", tapi **tetap disembunyikan di form guru**.

## 4. Form Guru
- Validasi "isi minimal satu aktivitas" **dihapus** — guru boleh kirim tanpa mengisi komponen apa pun.

## 5. Tampilan Tabel Rekap
- Kolom **Panitia** jadi 2 sub-kolom: **Amanah | Nominal** (pola sama seperti komponen aktivitas).
- **Freeze pane aman semua browser** (tidak pakai sticky bertingkat pada `<thead>`):
  - Header 2 baris sticky per-sel (baris 1 `top:0` tinggi 46px, baris 2 `top:46px`).
  - Kolom kiri No (lebar dikunci 50px) & Nama Guru sticky kiri, latar **solid** (`--bg-card-alt`) + bayangan pemisah → tidak tembus pandang saat scroll.
  - Sudut header No/Nama Guru sticky atas+kiri (z-index tertinggi).
  - Baris **TOTAL** (tfoot) sticky **bawah**; sel TOTAL kiri sticky **kiri** seperti kolom Nama Guru.

## File tersentuh
`js/db.js`, `admin/rekap.html`, `admin/komponen.html`, `guru/index.html`, `css/style.css`, `supabase.sql`, `supabase_rpc.sql`, `supabase_committee_nominal.sql` (baru).

> Catatan: project Supabase (`humbozgfoxttkocqssrz`) **tidak** ada di akun Supabase MCP yang terhubung ke Claude — migrasi DB harus dijalankan manual oleh user di SQL Editor.

## Status commit & deploy
- Commit lokal: `0dc9933` "Nominal kepanitiaan + perbaikan total & freeze tabel rekap" di branch `main`.
- **Push GAGAL (403)** — git/`gh` login sebagai akun **`smpabbs`** yang **bukan collaborator** di repo `thelostsign-beep/hujangerimis`. Commit masih lokal (`main` ahead 1), **belum sampai GitHub → Vercel belum deploy**.
- Cara menyelesaikan (pilih satu):
  - **A.** `gh auth login` ulang sebagai akun pemilik `thelostsign-beep` (atau akun ber-izin tulis), lalu `git push origin main`.
  - **B.** Tambah `smpabbs` sebagai collaborator (Write) di repo settings → access, terima undangan, lalu push.
  - **C.** Push pakai PAT akun ber-izin: `git push https://<TOKEN>@github.com/thelostsign-beep/hujangerimis.git main`.
- Migrasi `supabase_committee_nominal.sql` **sudah dijalankan** user di Supabase (DB siap; tinggal kode ter-deploy).

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

## Rencana Fitur: Guru Bisa Koreksi Data Mandiri (via WA)
*Direncanakan: 2 Juni 2026 — belum diimplementasikan*

### Konsep yang dipilih
**Opsi: Minta Koreksi via WhatsApp (Fonnte)**
- Guru klik "Minta Koreksi" di form mereka
- Sistem kirim WA otomatis ke nomor Waka Kurikulum
- Waka klik link di WA → halaman approve sederhana (tanpa login)
- Waka klik Izinkan → guru bisa edit data
- Setelah guru submit ulang → status kembali `submitted`

### Alur status submission
```
submitted → revision_requested → can_revise → submitted (ulang)
                                            → rejected (kalau Waka tolak)
```

### Arsitektur teknis
- **WA Gateway**: Fonnte (sudah punya akun)
- **Pengirim WA**: 1 nomor admin terdaftar di Fonnte
- **Penerima WA**: nomor Waka Kurikulum (1 nomor)
- **Deploy**: Vercel (sudah ada, auto-deploy dari GitHub)
- **Backend**: Vercel Serverless Functions di folder `api/`

### File yang perlu dibuat
| File | Fungsi |
|---|---|
| `api/send-wa.js` | Terima request dari guru, kirim WA via Fonnte, simpan token |
| `api/approve.js` | Validasi token dari link WA, update status submission |
| `approve.html` | Halaman sederhana untuk Waka: Izinkan / Tolak |
| Tabel Supabase baru | `revision_tokens (id, token, submission_id, expires_at, used)` |

### Environment Variables di Vercel (perlu ditambahkan)
- `FONNTE_TOKEN` — dari dashboard Fonnte
- `WAKA_WA_NUMBER` — nomor WA Waka Kurikulum (format: 628xxx)

### Catatan penting
- Panggilan ke Fonnte HARUS dari server (`api/`) — bukan dari browser, supaya token Fonnte tidak bocor ke publik
- Token approve di-expire setelah 24 jam
- Link approve format: `https://gerimismengundang.vercel.app/approve.html?token=xxx`
- Perlu cek apakah folder `api/` sudah ada di project atau belum (kemungkinan belum — ini pertama kali pakai Vercel Functions)

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
