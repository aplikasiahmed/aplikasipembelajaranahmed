
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Plus, Trash2, Edit, PlayCircle, PauseCircle, Loader2, ArrowLeft, X, Save, BookOpen, Clock, Layers } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Exam, GradeLevel } from '../types';
import Swal from 'sweetalert2';

const TeacherExams: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE UNTUK FORM (INLINE) ---
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    grade: '7',
    category: 'harian', // Default
    duration: '60',
    semester: '1'
  });

  // Load Exams
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    const data = await db.getExams();
    setExams(data);
    setLoading(false);
  };

  // Toggle Form
  const toggleForm = () => {
    if (!showForm) {
      // Reset saat mau buka
      setFormData({
        title: '',
        grade: '7',
        category: 'harian',
        duration: '60',
        semester: '1'
      });
    }
    setShowForm(!showForm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.duration) {
      Swal.fire({ icon: 'warning', title: 'Data Kurang', text: 'Judul dan Durasi wajib diisi!', heightAuto: false });
      return;
    }

    setIsSubmitting(true);
    try {
      await db.createExam({
        title: formData.title,
        grade: formData.grade as GradeLevel,
        category: formData.category as any,
        semester: formData.semester,
        duration: parseInt(formData.duration),
        status: 'draft'
      });
      
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Soal baru telah dibuat.', timer: 1000, showConfirmButton: false, heightAuto: false });
      setShowForm(false); // Tutup form
      fetchExams();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem.', heightAuto: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (exam: Exam) => {
    const newStatus = exam.status === 'active' ? 'draft' : 'active';
    const actionText = newStatus === 'active' ? 'Mengaktifkan' : 'Menonaktifkan';
    
    // Konfirmasi
    const result = await Swal.fire({
      title: `${actionText} Soal?`,
      text: newStatus === 'active' ? 'Siswa dapat melihat dan mengerjakan soal ini.' : 'Soal akan disembunyikan dari siswa.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'active' ? '#059669' : '#d97706',
      confirmButtonText: 'Ya, Lakukan',
      heightAuto: false
    });

    if (result.isConfirmed) {
      await db.updateExamStatus(exam.id, newStatus);
      fetchExams();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Ujian?',
      text: 'Semua soal di dalamnya juga akan terhapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus Permanen',
      heightAuto: false
    });

    if (result.isConfirmed) {
      await db.deleteExam(id);
      fetchExams();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn pb-20 px-1 md:px-0">
      <button onClick={() => navigate('/guru')} className="md:hidden flex items-center gap-1.5 text-slate-800 text-[10px] font-black uppercase tracking-tight py-2 mb-1">
        <ArrowLeft size={14} /> Kembali ke Dashboard
      </button>

      {/* HEADER CARD */}
      <div className="flex flex-col bg-emerald-600 md:flex-row md:items-center justify-between gap-4 shadow-emerald-200 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm z-10 relative">
        <div>
          <h1 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight">Bank Soal</h1>
          <p className="text-yellow-400 text-[10px] md:text-sm font-medium">Buat dan kelola soal untuk siswa.</p>
        </div>
        <button 
          onClick={toggleForm}
          className={`px-5 py-3 rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider ${showForm ? 'text-white bg-red-600 hover:bg-red-800 shadow-red-900' : 'bg-blue-600 text-white shadow-blue-900 hover:bg-blue-800'}`}
        >
          {showForm ? <><X size={16} /> Batal</> : <><Plus size={16} /> Buat Soal Baru</>}
        </button>
      </div>

      {/* FORM CARD (INLINE, MUNCUL DI BAWAH HEADER) */}
      {showForm && (
        <div className="bg-white w-full rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-blue-100 relative overflow-hidden animate-slideUp">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <BookOpen size={120} className="text-blue-900"/>
             </div>
             
             {/* Header Form */}
             <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="bg-blue-100 text-blue-700 p-2.5 rounded-xl">
                     <FileEdit size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Form Ujian Baru</h2>
                    <p className="text-[10px] text-slate-400 font-medium leading-none">Lengkapi detail ujian di bawah ini</p>
                  </div>
             </div>

             <form onSubmit={handleCreateSubmit} className="space-y-4 relative z-10">
               {/* 1. Judul Ujian */}
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Ujian</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Contoh: Penilaian Harian Bab 1"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all placeholder:font-normal"
                  />
               </div>

               {/* 2. Grid (Kategori & Kelas) */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                    <div className="relative">
                       <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <select 
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all appearance-none"
                       >
                          <option value="harian">Harian</option>
                          <option value="uts">UTS</option>
                          <option value="uas">UAS</option>
                          <option value="praktik">Praktik</option>
                       </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
                    <select 
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                    >
                        <option value="7">Kelas 7</option>
                        <option value="8">Kelas 8</option>
                        <option value="9">Kelas 9</option>
                    </select>
                  </div>
               </div>

               {/* 3. Grid (Durasi & Semester) */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durasi (Menit)</label>
                     <div className="relative">
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                           type="number"
                           name="duration"
                           value={formData.duration}
                           onChange={handleInputChange}
                           className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                        />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                     <select 
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                     >
                        <option value="1">Ganjil (1)</option>
                        <option value="2">Genap (2)</option>
                     </select>
                  </div>
               </div>

               {/* Tombol Submit */}
               <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin"/> Proses...</> : <><Save size={16} /> Simpan Soal</>}
                  </button>
               </div>
            </form>
        </div>
      )}

      {/* EXAM LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-10 text-center"><Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" /></div>
        ) : exams.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-sm">Belum ada soal dibuat.</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-100 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                   <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${exam.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {exam.status === 'active' ? 'AKTIF' : 'DRAFT'}
                   </span>
                   <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      KELAS {exam.grade}
                   </span>
                   <span className="text-[9px] font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 uppercase">
                      {exam.category || 'Harian'}
                   </span>
                   <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {exam.duration} MENIT
                   </span>
                </div>
                <h3 className="text-sm md:text-base font-black text-slate-800 leading-tight">{exam.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium">Semester {exam.semester}</p>
              </div>

              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => toggleStatus(exam)}
                   className={`p-2.5 rounded-xl border transition-all ${exam.status === 'active' ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                   title={exam.status === 'active' ? "Non-aktifkan" : "Aktifkan"}
                 >
                   {exam.status === 'active' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                 </button>
                 
                 <button 
                   onClick={() => navigate(`/guru/ujian/edit/${exam.id}`)}
                   className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-900 shadow-sm active:scale-95 transition-all"
                 >
                   <Edit size={14} /> Kelola Soal
                 </button>

                 <button 
                   onClick={() => handleDelete(exam.id)}
                   className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all active:scale-95"
                 >
                   <Trash2 size={18} />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherExams;
