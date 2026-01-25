
-- ==========================================================
-- SCRIPT DATABASE PORTAL PAI & BUDI PEKERTI (VERSI REVISI SEMESTER)
-- Jalankan script ini di SQL Editor Supabase
-- ==========================================================

-- 1. TABEL DATA SISWA
CREATE TABLE IF NOT EXISTS data_siswa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nis TEXT UNIQUE NOT NULL,
    namalengkap TEXT NOT NULL,
    jeniskelamin TEXT,
    grade TEXT NOT NULL,
    rombel TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL KEHADIRAN
CREATE TABLE IF NOT EXISTS kehadiran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES data_siswa(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL, 
    grade TEXT NOT NULL,
    semester TEXT DEFAULT '1', -- Kolom baru untuk semester
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL NILAI
CREATE TABLE IF NOT EXISTS "Nilai" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES data_siswa(id) ON DELETE CASCADE,
    subject_type TEXT NOT NULL, 
    score NUMERIC NOT NULL,
    description TEXT,
    grade TEXT NOT NULL,
    semester TEXT DEFAULT '1', -- Kolom baru untuk semester
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PENGUMPULAN TUGAS SISWA
CREATE TABLE IF NOT EXISTS "data_TugasSiswa" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nisn TEXT,
    student_name TEXT,
    grade TEXT,
    rombel TEXT,
    task_name TEXT,
    submission_type TEXT, 
    content TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL MATERI PEMBELAJARAN
CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    grade TEXT NOT NULL,
    category TEXT,
    content_url TEXT,
    thumbnail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom semester jika tabel sudah ada sebelumnya
ALTER TABLE "Nilai" ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '1';
ALTER TABLE kehadiran ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '1';

-- ==========================================================
-- KEAMANAN (RLS)
-- ==========================================================
ALTER TABLE data_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Nilai" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "data_TugasSiswa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON data_siswa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON kehadiran FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "Nilai" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON "data_TugasSiswa" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON materials FOR ALL USING (true) WITH CHECK (true);
