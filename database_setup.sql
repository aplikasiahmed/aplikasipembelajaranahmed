
-- ==========================================================
-- SCRIPT DATABASE PORTAL PAI & BUDI PEKERTI (VERSI REVISI)
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

-- 2. TABEL KEHADIRAN (Sebelumnya: attendance)
CREATE TABLE IF NOT EXISTS kehadiran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES data_siswa(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL, -- 'hadir', 'sakit', 'izin', 'alfa'
    grade TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL NILAI (Sebelumnya: grades)
CREATE TABLE IF NOT EXISTS "Nilai" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES data_siswa(id) ON DELETE CASCADE,
    subject_type TEXT NOT NULL, -- 'harian', 'uts', 'uas', 'praktik'
    score NUMERIC NOT NULL,
    description TEXT,
    grade TEXT NOT NULL,
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
    submission_type TEXT, -- 'link' atau 'photo'
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

-- Contoh Data Awal
INSERT INTO materials (title, description, grade, category, content_url, thumbnail)
VALUES ('Adab Menuntut Ilmu', 'Pembahasan dasar untuk siswa SMP.', '7', 'Akhlak', '#', 'https://picsum.photos/seed/pai1/400/250');
