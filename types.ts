
export type GradeLevel = '7' | '8' | '9';

export interface Student {
  id: string;
  nis: string;
  name: string;
  grade: GradeLevel;
  class: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alfa';
  grade: GradeLevel;
}

export interface GradeRecord {
  id: string;
  student_id: string;
  subject_type: 'harian' | 'uts' | 'uas' | 'praktik';
  score: number;
  description: string;
  grade: GradeLevel;
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
