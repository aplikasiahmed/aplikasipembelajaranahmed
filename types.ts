
export type GradeLevel = '7' | '8' | '9';

export interface Student {
  id?: string;
  nis: string;
  namalengkap: string;
  jeniskelamin: string;
  grade: GradeLevel;
  rombel: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alfa';
  grade: GradeLevel;
  semester: string;
}

export interface GradeRecord {
  id: string;
  student_id: string;
  subject_type: 'harian' | 'uts' | 'uas' | 'praktik';
  score: number;
  description: string;
  grade: GradeLevel;
  semester: string;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  nisn: string;
  student_name: string;
  grade: GradeLevel;
  rombel: string;
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

export interface TeacherProfile {
  name: string;
  title: string;
  bio: string;
  nip: string;
  photo_url: string;
  socials: {
    instagram?: string;
    whatsapp?: string;
    email?: string;
  };
}
