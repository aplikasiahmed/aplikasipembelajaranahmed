import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Award, 
  ClipboardCheck, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  Clock,
  ArrowRight,
  FileEdit
} from 'lucide-react';
import { db } from '../services/supabaseMock';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    tasksToday: 0,
    attendanceDone: false
  });

  useEffect(() => {
    // Simulasi loading data statistik
    const loadStats = async () => {
      const s7 = await db.getStudentsByGrade('7');
      const s8 = await db.getStudentsByGrade('8');
      const s9 = await db.getStudentsByGrade('9');
      const tasks = await db.getTaskSubmissions();
      
      setStats({
        totalStudents: s7.length + s8.length + s9.length,
        tasksToday: tasks.length,
        attendanceDone: true
      });
    };
    loadStats();
  }, []);

  const menuItems = [
    { title: 'Input Nilai', path: '/guru/nilai', icon: Award, color: 'bg-emerald-600', desc: 'Kelola nilai harian & ujian' },
    { title: 'Input Absensi', path: '/guru/absensi', icon: ClipboardCheck, color: 'bg-amber-600', desc: 'Rekap kehadiran harian' },
    { title: 'Cek Tugas', path: '/guru/tugas-masuk', icon: FileText, color: 'bg-purple-600', desc: 'Koreksi pengumpulan tugas' },
    // REVISI: MENGHAPUS mobileOnly AGAR MUNCUL DI DESKTOP
    { title: 'Bank Soal', path: '/guru/ujian', icon: FileEdit, color: 'bg-pink-600', desc: 'Buat & Kelola Soal Ujian' },
    { title: 'Laporan', path: '/guru/laporan', icon: TrendingUp, color: 'bg-red-600', desc: 'Export PDF & Excel' },
    { title: 'Kelola Admin', path: '/guru/admin', icon: ShieldCheck, color: 'bg-blue-600', desc: 'Manajemen akun pengajar' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Dashboard Utama</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Selamat datang kembali di Panel Pengajar PAI.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100">
          <Clock size={16} />
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Siswa</p>
            <p className="text-xl font-black text-slate-800">{stats.totalStudents}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tugas Masuk</p>
            <p className="text-xl font-black text-slate-800">{stats.tasksToday}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Absensi</p>
            <p className="text-sm font-black text-emerald-600 uppercase">Sudah Terisi</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group text-left relative overflow-hidden active:scale-95`}
          >
            <div className={`w-12 h-12 ${item.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.title}</h3>
            <p className="text-slate-400 text-[11px] mt-1">{item.desc}</p>
            
            <div className="absolute right-6 bottom-6 text-slate-200 group-hover:text-emerald-500 transition-colors">
              <ArrowRight size={24} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TeacherDashboard;