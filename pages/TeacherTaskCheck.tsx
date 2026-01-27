
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ExternalLink, Image as ImageIcon, Link as LinkIcon, Trash2, Loader2, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { TaskSubmission, GradeLevel } from '../types';
import Swal from 'sweetalert2';

const TeacherTaskCheck: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States Filter
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'all'>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Load Tugas & Kelas saat Filter Jenjang Berubah
  useEffect(() => {
    loadTasks();
    loadClasses();
  }, [filterGrade]);

  const loadClasses = async () => {
    // Reset pilihan kelas ke 'all' saat jenjang berubah
    setFilterClass('all'); 
    
    // Ambil daftar kelas dari database sesuai jenjang
    if (filterGrade === 'all') {
      setAvailableClasses([]);
    } else {
      const classes = await db.getAvailableKelas(filterGrade);
      setAvailableClasses(classes);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    const data = await db.getTaskSubmissions(filterGrade === 'all' ? undefined : filterGrade);
    setTasks(data);
    setLoading(false);
  };

  const viewContent = (task: TaskSubmission) => {
    if (task.submission_type === 'link') {
      window.open(task.content, '_blank');
    } else {
      Swal.fire({
        title: `Tugas: ${task.task_name}`,
        text: `Dari: ${task.student_name} (${task.kelas})`,
        imageUrl: task.content,
        imageAlt: 'Tugas Siswa',
        confirmButtonColor: '#059669',
        customClass: { popup: 'rounded-3xl' }
      });
    }
  };

  // Filter tugas berdasarkan dropdown kelas yang dipilih
  const filteredTasks = tasks.filter(task => {
    if (filterClass === 'all') return true;
    return task.kelas === filterClass;
  });

  return (
    <div className="space-y-3 md:space-y-6 animate-fadeIn pb-10">
      {/* Mobile Back Button */}
      <button 
        onClick={() => navigate('/guru')}
        className="md:hidden flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-tight mb-1"
      >
        <ArrowLeft size={14} /> Kembali ke Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Cek Tugas Masuk</h1>
          <p className="text-slate-400 text-[10px] md:text-sm font-medium">Monitoring pengumpulan tugas siswa secara real-time.</p>
        </div>
        
        {/* Filter Area */}
        <div className="flex flex-col md:flex-row gap-2">
          {/* Filter Jenjang */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(['all', '7', '8', '9'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGrade(g)}
                className={`px-3 py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${
                  filterGrade === g ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {g === 'all' ? 'Semua Jenjang' : `Kelas ${g}`}
              </button>
            ))}
          </div>

          {/* Filter Nama Kelas (Muncul jika jenjang dipilih) */}
          {filterGrade !== 'all' && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 transition-all"
            >
              <option value="all">Semua Kelas {filterGrade}</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 md:p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="animate-spin text-emerald-600" size={24} />
            <p className="text-slate-400 text-[9px] md:text-xs font-bold uppercase tracking-widest">Memuat Data...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</th>
                  <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Judul</th>
                  <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe</th>
                  <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">{task.student_name}</span>
                        <span className="text-[8px] md:text-[10px] text-slate-400 uppercase font-black tracking-tighter">Kelas {task.kelas}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm font-medium text-slate-600 truncate max-w-[150px] inline-block">{task.task_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      {task.submission_type === 'link' ? (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[8px] md:text-[10px] font-black border border-blue-100">
                          <LinkIcon size={10} /> Link
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[8px] md:text-[10px] font-black border border-emerald-100">
                          <ImageIcon size={10} /> Foto
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => viewContent(task)}
                        className="bg-slate-900 text-white px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                      >
                        {task.submission_type === 'link' ? <ExternalLink size={10} /> : <Search size={10} />}
                        <span className="hidden md:inline">Lihat Konten</span>
                        <span className="md:hidden">Cek</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 md:p-20 text-center space-y-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <FileText className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-xs md:text-sm">Belum ada tugas</p>
              <p className="text-slate-400 text-[10px] md:text-xs">
                {filterClass !== 'all' ? `Tidak ada tugas dari kelas ${filterClass}.` : 'Tugas yang dikumpulkan siswa akan muncul di sini.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherTaskCheck;
