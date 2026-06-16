-- ============================================================
-- Supabase Migration: Insentif Ujian SMP ABBS Surakarta
-- Execute di SQL Editor Supabase (project settings → SQL)
-- ============================================================

-- 1. TABEL ADMIN
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL
);

-- 2. TABEL SUBJECT LIST (master mapel)
CREATE TABLE IF NOT EXISTS subject_list (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 3. TABEL COMMITTEE ROLES (opsi kepanitiaan)
CREATE TABLE IF NOT EXISTS committee_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  nominal INTEGER NOT NULL DEFAULT 0
);

-- 4. TABEL CLASSES (kelas dengan jumlah siswa)
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  total INTEGER NOT NULL DEFAULT 0
);

-- 5. TABEL TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABEL ACTIVITIES (komponen)
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  rate INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 7. TABEL PERIODS
CREATE TABLE IF NOT EXISTS periods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_open BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABEL PERIOD_ACTIVITIES (link periode → komponen)
CREATE TABLE IF NOT EXISTS period_activities (
  id SERIAL PRIMARY KEY,
  period_id TEXT REFERENCES periods(id) ON DELETE CASCADE,
  activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE,
  UNIQUE(period_id, activity_id)
);

-- 9. TABEL INCOMES
CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY,
  period_id TEXT REFERENCES periods(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT DEFAULT '',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABEL SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  period_id TEXT REFERENCES periods(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  subjects TEXT[] DEFAULT '{}',
  committee_role TEXT DEFAULT '',
  status TEXT DEFAULT 'submitted',
  total INTEGER DEFAULT 0,
  admin_notes TEXT DEFAULT '',
  submitted_by TEXT DEFAULT 'guru',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABEL SUBMISSION_ITEMS (detail aktivitas per submission)
CREATE TABLE IF NOT EXISTS submission_items (
  id TEXT PRIMARY KEY,
  submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE,
  activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE,
  activity_name TEXT,
  quantity INTEGER DEFAULT 0,
  rate INTEGER DEFAULT 0,
  subtotal INTEGER DEFAULT 0,
  approved_qty INTEGER DEFAULT NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin default
INSERT INTO admins (id, username, password, name) VALUES
  ('a1', 'admin', 'admin123', 'Admin Utama')
ON CONFLICT (id) DO NOTHING;

-- Subject list (mapel)
INSERT INTO subject_list (name) VALUES
  ('Social'), ('Civic'), ('English'), ('Indonesian'), ('Math'), ('Science'),
  ('Qur''an'), ('IFE'), ('Javanese'), ('ICT'), ('Sport')
ON CONFLICT (name) DO NOTHING;

-- Committee roles
INSERT INTO committee_roles (name, nominal) VALUES
  ('Ketua Panitia', 0), ('Sekretaris', 0), ('Tim Teknis', 0)
ON CONFLICT (name) DO NOTHING;

-- Classes (kelas dengan jumlah siswa)
INSERT INTO classes (name, total) VALUES
  ('7A', 34), ('7B', 33), ('7C', 33),
  ('7D', 25), ('7E', 24), ('7F', 27),
  ('8A', 33), ('8B', 33), ('8C', 33),
  ('8D', 25), ('8E', 24), ('8F', 28),
  ('9A', 26), ('9B', 33), ('9C', 28),
  ('9D', 28), ('9E', 35), ('9F', 34)
ON CONFLICT (name) DO NOTHING;

-- Teachers (sorted ascending, Tri Wijayanti hidden)
INSERT INTO teachers (id, name, hidden) VALUES
  ('g1',  'Adila Rahmah, M.Pd',                          false),
  ('g2',  'Ahmad Bayu Abdullah, M.Pd',                    false),
  ('g3',  'Amien Nur Wicaksono, S.Ag',                    false),
  ('g4',  'Andi wijayanto, S.Pd',                         false),
  ('g5',  'Arvino Nurvieri Kusuma, S.Pd',                 false),
  ('g6',  'Asnia Novitasari AM, M.E',                     false),
  ('g7',  'Aulia Qisthi Rosyada, S.Pd',                   false),
  ('g8',  'Binti Qoeroti, S.Pd., M.Si',                   false),
  ('g9',  'Charlieta Nova Putri Fedito, S.Pd',            false),
  ('g10', 'Daffa Danendra Rizqi Nugraha, S.Pd',           false),
  ('g11', 'Danang Dwi Pambudi, S.Pd., Gr.',               false),
  ('g12', 'Fadlan Rifai AL-Irsyad, S.Pd',                 false),
  ('g13', 'Farida Nur Hidayati,S.Pd',                     false),
  ('g14', 'Fatma Roudhotul Rafida Kolis, S.Pd., Gr.',     false),
  ('g15', 'Febri Cahya Syahputra, S.Pd., M.Pd.',          false),
  ('g16', 'Fitri Nur Kolifah, S.Pd., Gr.',                false),
  ('g17', 'Hang Sakti Abdullah, S.Pd',                    false),
  ('g18', 'Hari Rohmah, S.Pd',                            false),
  ('g19', 'Ida aryani S, Sos',                            false),
  ('g20', 'Ifan Destya Adi Tama, S. Pd',                  false),
  ('g21', 'Iin Indah Saputri, S.Pd',                      false),
  ('g22', 'Isti Qomah Nurul Izzati, S.Pd',                false),
  ('g23', 'Joko Ariyanto, ST., Gr.',                      false),
  ('g24', 'Muamar Fariq Salafy, S.Pd, Gr.',               false),
  ('g25', 'Muhammad Fahmi Aziz, S.Psi',                   false),
  ('g26', 'Muhammad Syafiq, S.Pd.',                       false),
  ('g27', 'Mulloh, S.Pd',                                 false),
  ('g28', 'Nur rohmah hidayanti, S.Akun',                 false),
  ('g29', 'Ramadanti Prativi, S.Pd',                      false),
  ('g30', 'Scundy Nourma Pratiwi, S.Pd., M.Pd',           false),
  ('g31', 'Sharih Shadri, S.S., Gr.',                     false),
  ('g32', 'Siti Khoimah, S.Pd., Gr.',                     false),
  ('g33', 'Siti Robiatul Adawiyah, S.Si.',                false),
  ('g34', 'Siti Sirril Inayah',                           false),
  ('g35', 'Siti Zamrotun Rizqiah, S.Pd.I',                false),
  ('g36', 'Syahrul Abdi Narotama, S.Ag',                  false),
  ('g37', 'Syarah Karina Putri, S.Pd.',                   false),
  ('g38', 'Tri Wijayanti, M.P',                           true),
  ('g39', 'Wafda Salsabila, S.Pd.',                       false),
  ('g40', 'Yoki Wirawan, S.Pd',                           false),
  ('g41', 'Yona Puspa Ningtias, S.Pd',                    false)
ON CONFLICT (id) DO NOTHING;

-- Activities (komponen)
INSERT INTO activities (id, name, unit, rate, sort_order) VALUES
  ('k1',  'Membuat soal',              'paket', 100000, 1),
  ('k2',  'Memasukkan soal ke LMS',     'paket', 30000,  2),
  ('k3',  'Memindahkan soal ke Google Form', 'paket', 20000, 3),
  ('k4',  'Koreksi siswa',              'siswa', 1500,   4),
  ('k5',  'Menguji praktek',            'siswa', 1500,   5),
  ('k6',  'Mengawasi TO',               'sesi',  10000,  6),
  ('k7',  'Mengawasi ujian',            'sesi',  16000,  7),
  ('k8',  'Membuat raport',             'siswa', 3000,   8),
  ('k9',  'Matrikulasi',                'kali',  0,      9),
  ('k10', 'Input nilai leger',          'siswa', 0,      10)
ON CONFLICT (id) DO NOTHING;

-- Default period
INSERT INTO periods (id, name, is_open) VALUES
  ('p1', 'PSAS 1 2526', true)
ON CONFLICT (id) DO NOTHING;

-- Link semua aktivitas ke p1
INSERT INTO period_activities (period_id, activity_id)
  SELECT 'p1', id FROM activities WHERE is_active = true
ON CONFLICT (period_id, activity_id) DO NOTHING;

-- ============================================================
-- DISABLE RLS (app pakai auth sederhana sendiri, bukan Supabase Auth)
-- ============================================================
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE subject_list DISABLE ROW LEVEL SECURITY;
ALTER TABLE committee_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE period_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE submission_items DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- RPC FUNCTION: get_all_data (1 query = semua tabel, super cepat)
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'admins',            (SELECT json_agg(row_to_json(t)) FROM (SELECT id, username, password, name FROM admins) t),
    'subject_list',      (SELECT json_agg(row_to_json(t)) FROM (SELECT name FROM subject_list ORDER BY name) t),
    'committee_roles',   (SELECT json_agg(row_to_json(t)) FROM (SELECT name, nominal FROM committee_roles ORDER BY name) t),
    'classes',           (SELECT json_agg(row_to_json(t)) FROM (SELECT id, name, total FROM classes ORDER BY name) t),
    'teachers',          (SELECT json_agg(row_to_json(t)) FROM (SELECT id, name, is_active, hidden FROM teachers ORDER BY name) t),
    'activities',        (SELECT json_agg(row_to_json(t)) FROM (SELECT id, name, unit, rate, sort_order, is_active FROM activities ORDER BY sort_order) t),
    'periods',           (SELECT json_agg(row_to_json(t)) FROM (SELECT id, name, is_open, created_at FROM periods ORDER BY created_at) t),
    'period_activities', (SELECT json_agg(row_to_json(t)) FROM (SELECT period_id, activity_id FROM period_activities) t),
    'incomes',           (SELECT json_agg(row_to_json(t)) FROM (SELECT id, period_id, amount, description, date FROM incomes ORDER BY date) t),
    'submissions',       (SELECT json_agg(row_to_json(t)) FROM (SELECT id, period_id, teacher_name, subjects, committee_role, status, total, admin_notes, submitted_by, submitted_at, approved_at FROM submissions ORDER BY submitted_at DESC) t),
    'submission_items',  (SELECT json_agg(row_to_json(t)) FROM (SELECT id, submission_id, activity_id, activity_name, quantity, rate, subtotal, approved_qty FROM submission_items) t)
  ) INTO result;
  RETURN result;
END;
$$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_submissions_period ON submissions(period_id);
CREATE INDEX IF NOT EXISTS idx_submissions_teacher ON submissions(teacher_name);
CREATE INDEX IF NOT EXISTS idx_submission_items_submission ON submission_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_period_activities_period ON period_activities(period_id);
CREATE INDEX IF NOT EXISTS idx_incomes_period ON incomes(period_id);
