
export type GradeLevel = '7' | '8' | '9';

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  fullname: string;
  email?: string;
  role: 'Super Admin' | 'Admin';
  created_at: string;
}

export interface Student {
  id?: string;
  nis: string;
  namalengkap: string;
  jeniskelamin: string;
  kelas: string; // Pengganti grade dan rombel (Contoh: 7.A)
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alfa';
  kelas: string;
  semester: string;
}

export interface GradeRecord {
  id: string;
  student_id: string;
  subject_type: 'harian' | 'uts' | 'uas' | 'praktik';
  score: number;
  description: string;
  kelas: string;
  semester: string;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  nisn: string;
  student_name: string;
  kelas: string;
  task_name: string;
  submission_type: 'link' | 'photo';
  content: string; 
  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  grade: GradeLevel;
  category: 'Aqidah' | 'Fiqih' | 'Sejarah' | 'Akhlak' | 'Al-Quran';
  content_url: string;
  thumbnail?: string;
}
