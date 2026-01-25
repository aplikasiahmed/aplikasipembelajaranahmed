
import { createClient } from '@supabase/supabase-js';
import { Student, AttendanceRecord, GradeRecord, Material, GradeLevel, TaskSubmission } from '../types';

const SUPABASE_URL = 'https://irqphggbsncuplifywul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2MlaJJX4yWGwaxU5qIVADA_4N1bqqZ-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class DatabaseService {
  async upsertStudents(students: Omit<Student, 'id'>[]) {
    const { data, error } = await supabase
      .from('data_siswa')
      .upsert(students, { onConflict: 'nis' })
      .select();

    if (error) {
      console.error("Supabase Error (upsertStudents):", error);
      throw error;
    }
    return data;
  }

  async addTaskSubmission(submission: Omit<TaskSubmission, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('data_TugasSiswa')
      .insert([submission])
      .select();

    if (error) throw error;
    return data ? data[0] : null;
  }

  async getStudentsByGrade(grade: GradeLevel) {
    const { data, error } = await supabase
      .from('data_siswa')
      .select('*')
      .eq('grade', grade);
    
    if (error) {
      console.warn("Error fetching students by grade:", error.message);
      return [];
    }
    return data as Student[];
  }

  async getStudentByNIS(nis: string) {
    const { data, error } = await supabase
      .from('data_siswa')
      .select('*')
      .eq('nis', nis)
      .single();
    
    if (error) return null;
    return data as Student;
  }

  async getStudentByNISN(nisn: string) {
    const { data, error } = await supabase
      .from('data_siswa')
      .select('*')
      .eq('nis', nisn)
      .single();
    
    if (error) return null;
    return data as Student;
  }

  async addAttendance(records: Omit<AttendanceRecord, 'id'>[]) {
    const { data, error } = await supabase
      .from('kehadiran') // Diperbarui dari 'attendance'
      .insert(records)
      .select();
    if (error) throw error;
    return data;
  }

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('kehadiran') // Diperbarui dari 'attendance'
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });
    if (error) return [];
    return data as AttendanceRecord[];
  }

  async addGrade(record: Omit<GradeRecord, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('Nilai') // Diperbarui dari 'grades'
      .insert([record])
      .select();
    if (error) throw error;
    return data ? data[0] : null;
  }

  async getGradesByStudent(studentId: string): Promise<GradeRecord[]> {
    const { data, error } = await supabase
      .from('Nilai') // Diperbarui dari 'grades'
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data as GradeRecord[];
  }

  async getMaterials(grade?: GradeLevel) {
    let query = supabase.from('materials').select('*');
    if (grade) query = query.eq('grade', grade);
    const { data, error } = await query;
    if (error) {
      return [{ id: 'm1', title: 'Materi Belum Tersedia', description: 'Silakan isi tabel materials.', grade: '7', category: 'Aqidah', content_url: '#', thumbnail: 'https://picsum.photos/seed/pai1/400/250' }] as Material[];
    }
    return data as Material[];
  }

  async resetAllData() {
    await supabase.from('kehadiran').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('Nilai').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return true;
  }
}

export const db = new DatabaseService();
