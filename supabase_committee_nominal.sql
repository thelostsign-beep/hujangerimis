-- ============================================================
-- MIGRASI: Nominal Kepanitiaan
-- Jalankan SEKALI di Supabase SQL Editor (project settings → SQL).
-- Aman & additif: hanya menambah kolom baru + memperbarui fungsi RPC.
-- ============================================================

-- 1. Tambah kolom nominal di committee_roles (default 0)
ALTER TABLE committee_roles
  ADD COLUMN IF NOT EXISTS nominal INTEGER NOT NULL DEFAULT 0;

-- 2. Perbarui fungsi get_all_data agar ikut mengirim kolom nominal
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
