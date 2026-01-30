
import { createClient } from '@supabase/supabase-js';
import { Student, AttendanceRecord, GradeRecord, Material, GradeLevel, TaskSubmission, AdminUser, Exam, Question, ExamResult } from '../types';

const SUPABASE_URL = 'https://irqphggbsncuplifywul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2MlaJJX4yWGwaxU5qIVADA_4N1bqqZ-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mock Data Storage
let mockExams: Exam[] = [];
let mockQuestions: Question[] = [];
let mockExamResults: ExamResult[] = [];

class DatabaseService {
  // ADMIN FUNCTIONS
  async verifyAdminLogin(username: string, password: string): Promise<AdminUser | null> {
    const { data, error } = await supabase.from('admin_users').select('*').eq('username', username).eq('password', password).single();
    if (error || !data) return null;
    return data as AdminUser;
  }

  async getAdmins(): Promise<AdminUser[]> {
    const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
    return (data || []) as AdminUser[];
  }

  async addAdmin(admin: Partial<AdminUser>): Promise<void> {
    const { error } = await supabase.from('admin_users').insert([admin]);
    if (error) throw error;
  }

  async deleteAdmin(id: string): Promise<void> {
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) throw error;
  }

  // STUDENT FUNCTIONS
  async getStudentByNIS(nis: string): Promise<Student | null> {
    const { data, error } = await supabase.from('data_siswa').select('*').eq('nis', nis).single();
    if (error) return null;
    return data as Student;
  }

  async getStudentByNISN(nis: string): Promise<Student | null> {
    return this.getStudentByNIS(nis);
  }

  async getStudentsByKelas(kelas: string): Promise<Student[]> {
    const { data, error } = await supabase.from('data_siswa').select('*').eq('kelas', kelas).order('namalengkap', { ascending: true });
    return (data || []) as Student[];
  }

  async getStudentsByGrade(grade: string): Promise<Student[]> {
    const { data, error } = await supabase.from('data_siswa').select('*').like('kelas', `${grade}.%`);
    return (data || []) as Student[];
  }

  async getAvailableKelas(grade?: string): Promise<string[]> {
    let query = supabase.from('data_siswa').select('kelas');
    if (grade) query = query.like('kelas', `${grade}.%`);
    const { data, error } = await query;
    if (error || !data) return [];
    
    // Explicitly type the set to ensure we get a string[]
    const uniqueKelas = Array.from(new Set<string>(data.map((item: any) => item.kelas as string))).sort();
    return uniqueKelas;
  }

  async upsertStudents(students: Student[]): Promise<void> {
    const { error } = await supabase.from('data_siswa').upsert(students, { onConflict: 'nis' });
    if (error) throw error;
  }

  // GRADE FUNCTIONS
  async addGrade(grade: Partial<GradeRecord>): Promise<void> {
    const { error } = await supabase.from('Nilai').insert([grade]);
    if (error) throw error;
  }

  async getGradesByStudent(studentId: string): Promise<GradeRecord[]> {
    const { data, error } = await supabase.from('Nilai').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
    return (data || []) as GradeRecord[];
  }

  async getGradesByKelas(kelas: string, semester?: string): Promise<any[]> {
    let query = supabase.from('Nilai').select('*').eq('kelas', kelas);
    if (semester) query = query.eq('semester', semester);
    
    const { data: grades, error: gError } = await query.order('created_at', { ascending: false });
    if (gError || !grades) return [];

    const { data: students } = await supabase.from('data_siswa').select('*').eq('kelas', kelas);
    
    return grades.map(g => ({
      ...g,
      data_siswa: students?.find(s => s.id === g.student_id) || { namalengkap: 'Siswa', nis: '-' }
    }));
  }

  // ATTENDANCE FUNCTIONS
  async addAttendance(records: Partial<AttendanceRecord>[]): Promise<void> {
    const { error } = await supabase.from('kehadiran').insert(records);
    if (error) throw error;
  }

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('kehadiran').select('*').eq('student_id', studentId).order('date', { ascending: false });
    return (data || []) as AttendanceRecord[];
  }

  async getAttendanceByKelas(kelas: string, semester?: string, month?: string, year?: string): Promise<any[]> {
    let query = supabase.from('kehadiran').select('*').eq('kelas', kelas);
    
    if (semester) query = query.eq('semester', String(semester));
    
    if (month) {
      const selectedYear = year || new Date().getFullYear().toString();
      const monthNum = parseInt(month);
      const startDate = `${selectedYear}-${month.padStart(2, '0')}-01`;
      const lastDay = new Date(parseInt(selectedYear), monthNum, 0).getDate();
      const endDate = `${selectedYear}-${month.padStart(2, '0')}-${lastDay}`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data: attendance, error: aError } = await query.order('date', { ascending: true });
    
    if (aError || !attendance) return [];

    return attendance.map(a => ({
      ...a,
      data_siswa: { namalengkap: a.nama_siswa, nis: a.nis }
    }));
  }

  // RESET FUNCTIONS
  async resetAttendance(): Promise<void> { await supabase.from('kehadiran').delete().neq('id', '00000000-0000-0000-0000-000000000000'); }
  async resetGrades(): Promise<void> { await supabase.from('Nilai').delete().neq('id', '00000000-0000-0000-0000-000000000000'); }
  async resetTasks(): Promise<void> { await supabase.from('data_TugasSiswa').delete().neq('id', '00000000-0000-0000-0000-000000000000'); }
  async resetStudents(): Promise<void> { await supabase.from('data_siswa').delete().neq('id', '00000000-0000-0000-0000-000000000000'); }
  async resetMaterials(): Promise<void> { await supabase.from('materi_belajar').delete().neq('id', '00000000-0000-0000-0000-000000000000'); }
  async resetAllData(): Promise<void> {
    await Promise.all([this.resetAttendance(), this.resetGrades(), this.resetTasks(), this.resetStudents(), this.resetMaterials()]);
  }

  // TASK FUNCTIONS
  async addTaskSubmission(submission: Partial<TaskSubmission>): Promise<void> {
    const { error } = await supabase.from('data_TugasSiswa').insert([submission]);
    if (error) throw error;
  }

  async getTaskSubmissions(grade?: string): Promise<TaskSubmission[]> {
    let query = supabase.from('data_TugasSiswa').select('*').order('created_at', { ascending: false });
    if (grade) query = query.like('kelas', `${grade}.%`);
    const { data, error } = await query;
    return (data || []) as TaskSubmission[];
  }

  async getMaterials(grade?: GradeLevel): Promise<Material[]> {
    let query = supabase.from('materi_belajar').select('*');
    if (grade) query = query.eq('grade', grade);
    const { data, error } = await query;
    return (data || []) as Material[];
  }

  // --- EXAM & QUESTION FUNCTIONS (MOCK IMPLEMENTATION) ---
  
  // 1. Manage Exams
  async getExams(): Promise<Exam[]> {
    // Return all exams sorted by created_at desc
    return [...mockExams].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getExamById(id: string): Promise<Exam | undefined> {
    return mockExams.find(e => e.id === id);
  }

  async createExam(exam: Omit<Exam, 'id' | 'created_at'>): Promise<Exam> {
    const newExam: Exam = {
      ...exam,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    mockExams.push(newExam);
    return newExam;
  }

  async updateExamStatus(id: string, status: 'draft' | 'active' | 'closed'): Promise<void> {
    const exam = mockExams.find(e => e.id === id);
    if (exam) exam.status = status;
  }
  
  async deleteExam(id: string): Promise<void> {
    mockExams = mockExams.filter(e => e.id !== id);
    mockQuestions = mockQuestions.filter(q => q.exam_id !== id);
  }

  // 2. Manage Questions
  async getQuestionsByExamId(examId: string): Promise<Question[]> {
    return mockQuestions.filter(q => q.exam_id === examId);
  }

  async addQuestion(question: Omit<Question, 'id'>): Promise<Question> {
    const newQ: Question = {
      ...question,
      id: crypto.randomUUID()
    };
    mockQuestions.push(newQ);
    return newQ;
  }

  async deleteQuestion(id: string): Promise<void> {
    mockQuestions = mockQuestions.filter(q => q.id !== id);
  }

  // 3. Student Public Exam
  async getActiveExamsByGrade(grade: string): Promise<Exam[]> {
    // Return exams that are active AND match the grade level
    return mockExams.filter(e => e.status === 'active' && e.grade === grade);
  }

  async submitExamResult(result: Omit<ExamResult, 'id' | 'submitted_at'>): Promise<ExamResult> {
    const newResult: ExamResult = {
      ...result,
      id: crypto.randomUUID(),
      submitted_at: new Date().toISOString()
    };
    mockExamResults.push(newResult);

    // --- REVISI: INTEGRASI AUTO-GRADING ---
    // Ketika siswa submit ujian, nilai otomatis masuk ke Tabel 'Nilai' (GradeRecord)
    try {
      // 1. Ambil data Siswa asli dari Database (untuk mendapatkan ID Siswa UUID)
      const student = await this.getStudentByNIS(result.student_nis);
      
      // 2. Ambil data Ujian (untuk tahu kategori & judul)
      const exam = await this.getExamById(result.exam_id);

      if (student && exam) {
        // 3. Simpan ke Tabel Nilai (Layaknya Guru input manual)
        await this.addGrade({
          student_id: student.id!,
          subject_type: exam.category, // 'harian' | 'uts' | 'uas' | 'praktik'
          score: result.score,
          description: `Ujian Online: ${exam.title}`, // Deskripsi otomatis
          kelas: result.student_class,
          semester: exam.semester,
          created_at: new Date().toISOString()
        });
        console.log("Auto-grading successful: Score saved to Nilai table.");
      }
    } catch (error) {
      console.error("Auto-grading failed:", error);
      // Jangan throw error agar siswa tetap bisa melihat hasil ujiannya,
      // meskipun gagal simpan ke buku nilai (fallback).
    }

    return newResult;
  }
}

export const db = new DatabaseService();
