
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ExternalLink, Image as ImageIcon, Link as LinkIcon, Trash2, Loader2, Calendar, FileText, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { TaskSubmission, GradeLevel } from '../types';
import Swal from 'sweetalert2';

const TeacherTaskCheck: React.FC = () => {
  const navigate = useNavigate();
  
  // --- STATE TABS & DATA ---
  const [activeTab, setActiveTab] = useState<'tasks' | 'exams'>('tasks');
  const [loading, setLoading] = useState(true);
  
  const [tasks, setTasks] = useState<TaskSubmission[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  
  // --- STATE FILTER ---
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'all'>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all'); // Khusus Tab Ujian
  
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Load Data saat Tab atau Filter berubah
  useEffect(() => {
    loadClasses();
    if (activeTab === 'tasks') {
      loadTasks();
    } else {
      loadExamResults();
    }
  }, [activeTab, filterGrade, filterSemester]); // Trigger saat filter berubah

  const loadClasses = async () => {
    // Reset kelas ke 'all' saat jenjang berubah (kecuali initial load)
    if (filterClass !== 'all' && !filterClass.startsWith(filterGrade === 'all' ? '' : filterGrade)) {
         setFilterClass('all');
    }
    
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

  const loadExamResults = async () => {
      setLoading(true);
      const gradeParam = filterGrade === 'all' ? undefined : filterGrade;
      const semParam = filterSemester === 'all' ? undefined : filterSemester;
      
      const data = await db.getExamResults(gradeParam, semParam);
      setExamResults(data);
      setLoading(false);
  };

  // --- ACTIONS: TASKS ---
  const viewContent = async (task: TaskSubmission) => {
    if (task.submission_type === 'link') {
      window.open(task.content, '_blank');
    } else {
      const dateStr = new Date(task.created_at).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric'
      });

      const result = await Swal.fire({
        title: `Tugas: ${task.task_name}`,
        text: `Dari: ${task.student_name} (${task.kelas}) • Tanggal: ${dateStr}`,
        imageUrl: task.content,
        imageAlt: 'Tugas Siswa',
        showCancelButton: true,
        confirmButtonText: 'INPUT NILAI',
        cancelButtonText: 'TUTUP',
        confirmButtonColor: '#059669',
        cancelButtonColor: '#dc2626',
        reverseButtons: true,
        customClass: { popup: 'rounded-3xl' }
      });

      if (result.isConfirmed) {
         navigate('/guru/nilai', {
             state: {
                 prefill: {
                     student_name: task.student_name,
                     kelas: task.kelas,
                     task_name: task.task_name,
                     date: task.created_at
                 }
             }
         });
      }
    }
  };

  // --- ACTIONS: EXAMS ---
  const handleDeleteResult = async (id: string, name: string) => {
      const confirm = await Swal.fire({
          title: 'Hapus Hasil Ujian?',
          text: `Menghapus data hasil ujian milik ${name}. Siswa dapat mengerjakan ulang setelah dihapus.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Ya, Hapus',
          heightAuto: false
      });

      if (confirm.isConfirmed) {
          await db.deleteExamResult(id);
          loadExamResults();
          Swal.fire({icon: 'success', title: 'Terhapus', timer: 1000, showConfirmButton: false, heightAuto: false});
      }
  };

  // Filter Lokal untuk Kelas (Karena DB kadang hanya filter grade)
  const getFilteredData = () => {
    if (activeTab === 'tasks') {
        return tasks.filter(t => filterClass === 'all' || t.kelas === filterClass);
    } else {
        return examResults.filter(r => filterClass === 'all' || r.student_class === filterClass);
    }
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-3 md:space-y-6 animate-fadeIn pb-20">
      {/* Mobile Back Button */}
      <button 
        onClick={() => navigate('/guru')}
        className="md:hidden flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-tight mb-1"
      >
        <ArrowLeft size={14} /> Kembali ke Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Monitoring Siswa</h1>
          <p className="text-slate-400 text-[10px] md:text-sm font-medium">Cek pengumpulan tugas harian dan hasil ujian online.</p>
        </div>
        
        {/* TABS SWITCHER */}
        <div className="bg-slate-100 p-1 rounded-xl flex">
            <button 
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'tasks' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <FileText size={14} /> Tugas Upload
            </button>
            <button 
                onClick={() => setActiveTab('exams')}
                className={`flex-1 px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'exams' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <CheckCircle2 size={14} /> Hasil Ujian
            </button>
        </div>
      </div>
      
      {/* FILTER AREA */}
      <div className="flex flex-col md:flex-row gap-2 overflow-x-auto pb-2 md:pb-0">
          {/* 1. Filter Jenjang */}
          <div className="flex gap-1.5 shrink-0">
            {(['all', '7', '8', '9'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGrade(g)}
                className={`px-3 py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap border ${
                  filterGrade === g 
                  ? (activeTab === 'tasks' ? 'bg-purple-600 text-white border-purple-600' : 'bg-emerald-600 text-white border-emerald-600') 
                  : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {g === 'all' ? 'Semua Jenjang' : `Kelas ${g}`}
              </button>
            ))}
          </div>

          {/* 2. Filter Nama Kelas */}
          {filterGrade !== 'all' && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 transition-all shrink-0"
            >
              <option value="all">Semua Kelas {filterGrade}</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          )}

          {/* 3. Filter Semester (KHUSUS TAB UJIAN) */}
          {activeTab === 'exams' && (
             <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-3 py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 transition-all shrink-0"
             >
                <option value="all">Semua Semester</option>
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
             </select>
          )}
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 overflow-hidden shadow-sm min-h-[300px]">
        {loading ? (
          <div className="p-10 md:p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className={`animate-spin ${activeTab === 'tasks' ? 'text-purple-600' : 'text-emerald-600'}`} size={24} />
            <p className="text-slate-400 text-[9px] md:text-xs font-bold uppercase tracking-widest">Memuat Data...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            {activeTab === 'tasks' ? (
                /* ================= TABEL TUGAS UPLOAD ================= */
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
                    {filteredData.map((task: TaskSubmission) => (
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
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-purple-50 text-purple-600 text-[8px] md:text-[10px] font-black border border-purple-100">
                              <ImageIcon size={10} /> Foto
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => viewContent(task)}
                            className="bg-slate-900 text-white px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold hover:bg-purple-600 transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
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
            ) : (
                /* ================= TABEL HASIL UJIAN (BARU) ================= */
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</th>
                      <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Nama Ujian</th>
                      <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nilai</th>
                      <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                      <th className="px-4 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.map((res: any) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">{res.student_name}</span>
                            <span className="text-[8px] md:text-[10px] text-slate-400 uppercase font-black tracking-tighter">Kelas {res.student_class}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm font-medium text-slate-600">{res.ujian?.title || '-'}</span>
                          <span className="block text-[10px] text-slate-400 uppercase font-bold">{res.ujian?.category} • Sem {res.semester}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                           <span className={`inline-block w-8 py-1 rounded-lg font-black text-[10px] md:text-xs ${res.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {res.score}
                           </span>
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex flex-col text-[10px] md:text-xs text-slate-500">
                              <span className="font-bold">{new Date(res.submitted_at).toLocaleDateString('id-ID')}</span>
                              <span className="flex items-center gap-1 text-[9px]"><Clock size={10}/> {new Date(res.submitted_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteResult(res.id, res.student_name)}
                            className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all active:scale-95"
                            title="Hapus Hasil (Siswa bisa ujian ulang)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
          </div>
        ) : (
          <div className="p-10 md:p-20 text-center space-y-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              {activeTab === 'tasks' ? <FileText className="w-6 h-6 md:w-8 md:h-8" /> : <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" />}
            </div>
            <div>
              <p className="text-slate-800 font-bold text-xs md:text-sm">Belum ada data</p>
              <p className="text-slate-400 text-[10px] md:text-xs">
                {filterClass !== 'all' ? `Tidak ada data dari kelas ${filterClass}.` : (activeTab === 'tasks' ? 'Tugas yang dikumpulkan siswa akan muncul di sini.' : 'Hasil ujian siswa akan muncul di sini.')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherTaskCheck;
