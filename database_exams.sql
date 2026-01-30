
-- ============================================================================
-- SCRIPT FULL RESET & SETUP BANK SOAL ONLINE (RAP & LENGKAP)
-- SILAKAN COPY DAN JALANKAN DI SQL EDITOR SUPABASE (KLIK "RUN")
-- ============================================================================

-- 1. BERSIHKAN TABEL LAMA (Agar tidak error saat dibuat ulang)
-- Urutan drop penting: Hapus 'anak' dulu (hasil & soal), baru 'induk' (ujian)
DROP TABLE IF EXISTS "hasil_ujian";
DROP TABLE IF EXISTS "bank_soal";
DROP TABLE IF EXISTS "ujian";

-- 2. BUAT TABEL UJIAN (INDUK)
-- Menyimpan informasi header ujian seperti judul, kelas, semester, durasi
CREATE TABLE "ujian" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,          -- Judul Ujian (misal: PH Bab 1)
    grade TEXT NOT NULL,          -- Jenjang Kelas ('7', '8', '9')
    category TEXT NOT NULL,       -- Kategori ('harian', 'uts', 'uas', 'praktik')
    semester TEXT NOT NULL,       -- Semester ('1' atau '2') -> INI PENTING!
    duration INTEGER NOT NULL,    -- Durasi dalam menit
    status TEXT DEFAULT 'draft',  -- Status ('draft' = sembunyi, 'active' = muncul di siswa)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUAT TABEL BANK SOAL (ANAK 1)
-- Menyimpan butir soal yang terhubung ke tabel ujian
CREATE TABLE "bank_soal" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES "ujian"(id) ON DELETE CASCADE, -- Jika ujian dihapus, soal ikut terhapus
    type TEXT DEFAULT 'pg',       -- Tipe soal ('pg')
    text TEXT NOT NULL,           -- Isi Pertanyaan
    image_url TEXT,               -- Link Gambar (jika ada)
    options JSONB,                -- Pilihan Jawaban ["A", "B", "C", "D"]
    correct_answer TEXT NOT NULL, -- Kunci Jawaban ('0','1','2','3')
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUAT TABEL HASIL UJIAN (ANAK 2)
-- Menyimpan log pengerjaan siswa
CREATE TABLE "hasil_ujian" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES "ujian"(id) ON DELETE CASCADE,
    student_nis TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    semester TEXT NOT NULL,       -- REVISI: Tambahan Kolom Semester
    answers JSONB,                -- Jawaban yang dipilih siswa
    score NUMERIC NOT NULL,       -- Nilai akhir (0-100)
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PENGATURAN KEAMANAN (RLS - ROW LEVEL SECURITY)
-- Agar siswa (publik) bisa membaca soal tapi tidak bisa mengedit soal

-- Aktifkan RLS di semua tabel
ALTER TABLE "ujian" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_soal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hasil_ujian" ENABLE ROW LEVEL SECURITY;

-- BERSIHKAN POLICY LAMA (JIKA ADA)
DROP POLICY IF EXISTS "Public Select Ujian" ON "ujian";
DROP POLICY IF EXISTS "Teacher Full Access Ujian" ON "ujian";
DROP POLICY IF EXISTS "Public Select Soal" ON "bank_soal";
DROP POLICY IF EXISTS "Teacher Full Access Soal" ON "bank_soal";
DROP POLICY IF EXISTS "Public Insert Hasil" ON "hasil_ujian";
DROP POLICY IF EXISTS "Teacher Select Hasil" ON "hasil_ujian";

-- === POLICY UNTUK TABEL UJIAN ===
-- Siswa/Publik boleh LIHAT ujian yang statusnya 'active'
CREATE POLICY "Public Select Ujian" ON "ujian" 
FOR SELECT USING (status = 'active' OR auth.role() = 'authenticated');

-- Guru (Authenticated) boleh melakukan SEMUANYA (Insert, Update, Delete)
CREATE POLICY "Teacher Full Access Ujian" ON "ujian" 
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- === POLICY UNTUK TABEL BANK SOAL ===
-- Siswa/Publik boleh LIHAT soal
CREATE POLICY "Public Select Soal" ON "bank_soal" 
FOR SELECT USING (true);

-- Guru boleh SEMUANYA
CREATE POLICY "Teacher Full Access Soal" ON "bank_soal" 
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- === POLICY UNTUK TABEL HASIL UJIAN ===
-- Siswa boleh MENGIRIM (INSERT) hasil ujian
CREATE POLICY "Public Insert Hasil" ON "hasil_ujian" 
FOR INSERT WITH CHECK (true);

-- Guru boleh MELIHAT hasil ujian
CREATE POLICY "Teacher Select Hasil" ON "hasil_ujian" 
FOR SELECT USING (true);
