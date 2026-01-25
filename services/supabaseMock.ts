
import { Student, AttendanceRecord, GradeRecord, Material, GradeLevel } from '../types';

// In a real app, you would use @supabase/supabase-js
// This mock simulates the behavior for UI/UX demonstration

const MOCK_STUDENTS: Student[] = [
  { id: '1', nis: '1001', name: 'Ahmad Fauzi', grade: '7', class: '7-A' },
  { id: '2', nis: '1002', name: 'Siti Aminah', grade: '7', class: '7-A' },
  { id: '3', nis: '2001', name: 'Budi Santoso', grade: '8', class: '8-B' },
  { id: '4', nis: '3001', name: 'Dewi Lestari', grade: '9', class: '9-C' },
];

const MOCK_MATERIALS: Material[] = [
  { id: 'm1', title: 'Indahnya Kebersamaan dengan Shalat Berjamaah', description: 'Materi tentang tata cara dan keutamaan shalat berjamaah.', grade: '7', category: 'Fiqih', content_url: '#', thumbnail: 'https://picsum.photos/seed/pai1/400/250' },
  { id: 'm2', title: 'Meneladani Sifat-Sifat Mulia Para Rasul', description: 'Mengenal sifat wajib, mustahil, dan jaiz bagi Rasul.', grade: '8', category: 'Aqidah', content_url: '#', thumbnail: 'https://picsum.photos/seed/pai2/400/250' },
  { id: 'm3', title: 'Adab Bergaul dengan Teman Sebaya', description: 'Materi akhlak dalam pergaulan sehari-hari.', grade: '9', category: 'Akhlak', content_url: '#', thumbnail: 'https://picsum.photos/seed/pai3/400/250' },
];

class DatabaseService {
  private students: Student[] = MOCK_STUDENTS;
  private attendance: AttendanceRecord[] = [];
  private grades: GradeRecord[] = [];

  async getStudentsByGrade(grade: GradeLevel) {
    return this.students.filter(s => s.grade === grade);
  }

  async getStudentByNIS(nis: string) {
    return this.students.find(s => s.nis === nis);
  }

  async addAttendance(records: Omit<AttendanceRecord, 'id'>[]) {
    const newRecords = records.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
    this.attendance.push(...newRecords);
    return newRecords;
  }

  async addGrade(record: Omit<GradeRecord, 'id' | 'created_at'>) {
    const newRecord = { 
      ...record, 
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.grades.push(newRecord);
    return newRecord;
  }

  async getAttendanceByStudent(studentId: string) {
    return this.attendance.filter(a => a.student_id === studentId);
  }

  async getGradesByStudent(studentId: string) {
    return this.grades.filter(g => g.student_id === studentId);
  }

  async getAllAttendance() {
    return this.attendance;
  }

  async getAllGrades() {
    return this.grades;
  }

  async getMaterials(grade?: GradeLevel) {
    if (grade) return MOCK_MATERIALS.filter(m => m.grade === grade);
    return MOCK_MATERIALS;
  }

  resetAllData() {
    this.attendance = [];
    this.grades = [];
    return true;
  }
}

export const db = new DatabaseService();
