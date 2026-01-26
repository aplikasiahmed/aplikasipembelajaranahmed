
import { createClient } from '@supabase/supabase-js';
import { Student, AttendanceRecord, GradeRecord, Material, GradeLevel, TaskSubmission, AdminUser } from '../types';

const SUPABASE_URL = 'https://irqphggbsncuplifywul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2MlaJJX4yWGwaxU5qIVADA_4N1bqqZ-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class DatabaseService {
  // ADMIN FUNCTIONS (Tetap Aman)
  async verifyAdminLogin(username: string, password: string): Promise<AdminUser | null> {
    const { data, error } = await supabase.from('admin_users').select('*').eq('username', username).eq('password', password).single();
    if (error || !data) return null;
    return data as AdminUser;
  }

  async getAdmins(): Promise<AdminUser[]> {
    const { data, error } = await supabase.from('admin