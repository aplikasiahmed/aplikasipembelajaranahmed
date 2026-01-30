
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Plus, Trash2, Edit, PlayCircle, PauseCircle, Loader2, ArrowLeft } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Exam, GradeLevel } from '../types';
import Swal from 'sweetalert2';

const TeacherExams: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleCreate = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Buat Ujian Baru',
      html: `
        <div class="space-y-3 text-left">
          <div>
             <label class="text-xs font-bold text-slate-500">Judul Ujian</label>
             <input id="swal-title" class="swal2-input !m-0 !w-full !text-sm" placeholder="Contoh: Penilaian Harian Bab 1">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
               <label class="text-xs font-bold text-slate-500">Kelas</label>
               <select id="swal-grade" class="swal2-select !m-0 !w-full !text-sm">
                 <option value="7">Kelas 7</option>
                 <option value="8">Kelas 8</option>
                 <option value="9">Kelas 9</option>
               </select>
            </div>
            <div>
               <label class="text-xs font-bold text-slate-500">Durasi (Menit)</label>
               <input id="swal-duration" type="number" class="swal2-input !m-0 !w-full !text-sm" value="60">
            </div>
          </div>
          <div>
               <label class="text-xs font-bold text-slate-500">Semester</label>
               <select id="swal-semester" class="swal2-select !m-0 !w-full !text-sm">
                 <option value="1">Semester 1 (Ganjil)</option>
                 <option value="2">Semester 2 (Genap)</option>
               </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#059669',
      confirmButtonText: 'Buat Draft',
      heightAuto: false,
      preConfirm: () => {
        const title = (document.getElementById('swal-title') as HTMLInputElement).value;
        const grade = (document.getElementById('swal-grade') as HTMLSelectElement).value;
        const duration = (document.getElementById('swal-duration') as HTMLInputElement).value;
        const semester = (document.getElementById('swal-semester') as HTMLSelectElement).value;
        
        if (!title || !duration) {
          Swal.showValidationMessage('Judul dan Durasi wajib diisi!');
        }
        return { title, grade, duration, semester };
      }
    });

    if (formValues) {
      await db.createExam({
        title: formValues.title,
        grade: formValues.grade as GradeLevel,
        semester: formValues.semester,
        duration: parseInt(formValues.duration),
        status: 'draft'
      });
      
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Ujian baru telah dibuat.', timer: 1000, showConfirmButton: false, heightAuto: false });
      fetchExams();
    }
  };

  const toggleStatus = async (exam: Exam) => {
    const newStatus = exam.status === 'active' ? 'draft' : 'active';
    const actionText = newStatus === 'active' ? 'Mengaktifkan' : 'Menonaktifkan';
    
    // Konfirmasi
    const result = await Swal.fire({
      title: `${actionText} Ujian?`,
      text: newStatus === 'active' ? 'Siswa dapat melihat dan mengerjakan ujian ini.' : 'Ujian akan disembunyikan dari siswa.',
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight">Bank Soal & Ujian</h1>
          <p className="text-slate-400 text-[10px] md:text-sm font-medium">Buat dan kelola soal ujian untuk siswa.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider"
        >
          <Plus size={16} /> Buat Ujian Baru
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-10 text-center"><Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" /></div>
        ) : exams.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-sm">Belum ada ujian dibuat.</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-100 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${exam.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {exam.status === 'active' ? 'AKTIF' : 'DRAFT'}
                   </span>
                   <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      KELAS {exam.grade}
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
