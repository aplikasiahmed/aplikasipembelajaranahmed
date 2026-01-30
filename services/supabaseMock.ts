
import { createClient } from '@supabase/supabase-js';
import { Student, AttendanceRecord, GradeRecord, Material, GradeLevel, TaskSubmission, AdminUser, Exam, Question, ExamResult } from '../types';

const SUPABASE_URL = 'https://irqphggbsncuplifywul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2MlaJJX4yWGwaxU5qIVADA_4N1bqqZ-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // --- EXAM & QUESTION FUNCTIONS (REAL DATABASE IMPLEMENTATION) ---
  
  // 1. Manage Exams (Tabel: ujian)
  async getExams(): Promise<Exam[]> {
    const { data, error } = await supabase.from('ujian').select('*').order('created_at', { ascending: false });
    return (data || []) as Exam[];
  }

  async getExamById(id: string): Promise<Exam | undefined> {
    const { data, error } = await supabase.from('ujian').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return data as Exam;
  }

  async createExam(exam: Omit<Exam, 'id' | 'created_at'>): Promise<Exam> {
    const { data, error } = await supabase.from('ujian').insert([exam]).select().single();
    if (error) throw error;
    return data as Exam;
  }
  
  async updateExam(id: string, updates: Partial<Exam>): Promise<void> {
    const { error } = await supabase.from('ujian').update(updates).eq('id', id);
    if (error) throw error;
  }

  async updateExamStatus(id: string, status: 'draft' | 'active' | 'closed'): Promise<void> {
    const { error } = await supabase.from('ujian').update({ status }).eq('id', id);
    if (error) throw error;
  }
  
  async deleteExam(id: string): Promise<void> {
    const { error } = await supabase.from('ujian').delete().eq('id', id);
    if (error) throw error;
  }

  // 2. Manage Questions (Tabel: bank_soal)
  async getQuestionsByExamId(examId: string): Promise<Question[]> {
    const { data, error } = await supabase.from('bank_soal').select('*').eq('exam_id', examId);
    return (data || []) as Question[];
  }

  async addQuestion(question: Omit<Question, 'id'>): Promise<Question> {
    const { data, error } = await supabase.from('bank_soal').insert([question]).select().single();
    if (error) throw error;
    return data as Question;
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    const { error } = await supabase.from('bank_soal').update(updates).eq('id', id);
    if (error) throw error;
  }

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase.from('bank_soal').delete().eq('id', id);
    if (error) throw error;
  }
  
  async deleteAllQuestionsByExamId(examId: string): Promise<void> {
    const { error } = await supabase.from('bank_soal').delete().eq('exam_id', examId);
    if (error) throw error;
  }

  // 3. Student Public Exam (Tabel: ujian & hasil_ujian)
  async getActiveExamsByGrade(grade: string, semester: string): Promise<Exam[]> {
    const semString = String(semester);
    const { data, error } = await supabase
        .from('ujian')
        .select('*')
        .eq('status', 'active')
        .eq('grade', grade)
        .eq('semester', semString); 

    return (data || []) as Exam[];
  }

  async checkStudentExamResult(nis: string, examId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('hasil_ujian')
        .select('id')
        .eq('student_nis', nis)
        .eq('exam_id', examId)
        .limit(1); 
    
    if (error) return false;
    return data && data.length > 0;
  }
  
  async hasExamResults(examId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from('hasil_ujian')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId);
    
    if (error) return false;
    return (count || 0) > 0;
  }

  async submitExamResult(result: Omit<ExamResult, 'id' | 'submitted_at'>): Promise<ExamResult> {
    // 1. Simpan Hasil Ujian ke tabel 'hasil_ujian'
    const { data, error } = await supabase.from('hasil_ujian').insert([result]).select().single();
    if (error) throw error;
    const newResult = data as ExamResult;

    // 2. INTEGRASI AUTO-GRADING KE BUKU NILAI
    try {
      const student = await this.getStudentByNIS(result.student_nis);
      const exam = await this.getExamById(result.exam_id);

      if (student && exam) {
        await this.addGrade({
          student_id: student.id!,
          subject_type: exam.category, 
          score: result.score,
          description: `Ujian Online: ${exam.title}`,
          kelas: result.student_class,
          semester: exam.semester, 
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Auto-grading failed:", error);
    }

    return newResult;
  }
}

export const db = new DatabaseService();
