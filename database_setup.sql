
-- ==========================================================
-- SCRIPT RESET TOTAL DATABASE - PORTAL PAI
-- JALANKAN INI DI SQL EDITOR SUPABASE UNTUK MEMBERSIHKAN ERROR
-- ==========================================================

-- 1. HAPUS TABEL LAMA (MEMBERSIHKAN CACHE SCHEMA)
DROP TABLE IF EXISTS "data_siswa" CASCADE;

-- 2. BUAT ULANG TABEL SISWA DENGAN STRUKTUR BARU
CREATE TABLE "data_siswa" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nis TEXT UNIQUE NOT NULL,
    namalengkap TEXT NOT NULL,
    jeniskelamin TEXT,
    kelas TEXT NOT NULL, -- Format: 7.A, 7.B, dst (Sesuai Excel Bapak)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PASTIKAN TABEL PENDUKUNG MENGGUNAKAN KOLOM KELAS
-- (Menjalankan ALTER agar tabel kehadiran, nilai, dan tugas sinkron)

DO $$ 
BEGIN 
    -- Update tabel kehadiran
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kehadiran' AND column_name='grade') THEN
        ALTER TABLE "kehadiran" DROP COLUMN "grade";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kehadiran' AND column_name='kelas') THEN
        ALTER TABLE "kehadiran" ADD COLUMN "kelas" TEXT;
    END IF;

    -- Update tabel Nilai
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Nilai' AND column_name='grade') THEN
        ALTER TABLE "Nilai" DROP COLUMN "grade";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Nilai' AND column_name='kelas') THEN
        ALTER TABLE "Nilai" ADD COLUMN "kelas" TEXT;
    END IF;

    -- Update tabel data_TugasSiswa
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='data_TugasSiswa' AND column_name='grade') THEN
        ALTER TABLE "data_TugasSiswa" DROP COLUMN "grade";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='data_TugasSiswa' AND column_name='rombel') THEN
        ALTER TABLE "data_TugasSiswa" DROP COLUMN "rombel";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='data_TugasSiswa' AND column_name='kelas') THEN
        ALTER TABLE "data_TugasSiswa" ADD COLUMN "kelas" TEXT;
    END IF;
END $$;

-- 4. PASTIKAN TABEL ADMIN TETAP AMAN
CREATE TABLE IF NOT EXISTS "admin_users" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullname TEXT NOT NULL,
    role TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
