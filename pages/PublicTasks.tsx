
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Link as LinkIcon, Send, Hash, Book, Youtube, Loader2, CheckCircle2, Info, UserCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { db } from '../services/supabaseMock';

const PublicTasks: React.FC = () => {
  const [formData, setFormData] = useState({
    nisn: '',
    student_name: '',
    jeniskelamin: '',
    kelas: '',
    task_name: '',
    submission_type: 'link' as 'link' | 'photo',
    content: ''
  });
  
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchStudent = async () => {
      if (formData.nisn.length < 4) {
        setFormData(prev => ({ ...prev, student_name: '', kelas: '', jeniskelamin: '' }));
        setIsVerified(false);
        return;
      }

      setFetchingStudent(true);
      try {
        const student = await db.getStudentByNIS(formData.nisn);
        if (student) {
          setFormData(prev => ({ 
            ...prev, 
            student_name: student.namalengkap, 
            kelas: student.kelas,
            jeniskelamin: student.jeniskelamin || '-'
          }));
          setIsVerified(true);
          Swal.fire({ 
            toast: true, 
            position: 'top-end', 
            icon: 'success', 
            title: 'Siswa Terverifikasi', 
            showConfirmButton: false, 
            timer: 1500 
          });
        } else {
          setIsVerified(false);
          setFormData(prev => ({ ...prev, student_name: '', kelas: '', jeniskelamin: '' }));
        }
      } catch (error) { 
        console.error(error); 
      } finally { 
        setFetchingStudent(false); 
      }
    };

    const timeoutId = setTimeout(() => searchStudent(), 800);
    return () => clearTimeout(timeoutId);
  }, [formData.nisn]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'nisn' ? value.replace(/[^0-9]/g, '') : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const showTutorial = (e: React.MouseEvent) => {
    e.preventDefault();
    const videoUrl = "https://irqphggbsncuplifywul.supabase.co/storage/v1/object/sign/video/Video%20Tutorial%20Upload%20file%20ke%20Link%20Google%20Drive.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMjA2YTI2NS1hNTMwLTQ5ODktOTBhNS03Yjg2ZmNmZGM0ODYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlby9WaWRlbyBUdXRvcmlhbCBVcGxvYWQgZmlsZSBrZSBMaW5rIEdvb2dsZSBEcml2ZS5tcDQiLCJpYXQiOjE3Njk0MTEyODUsImV4cCI6MTgwMDk0NzI4NX0.2w9Ab3WVm34ItTWstBLHPJHsX51D-lBrL0WWqOjOmQI";
    
    Swal.fire({
      title: 'Tutorial Upload Drive (sinyal harus kuat untuk memutar video)',
      html: `
        <div class="w-full bg-black rounded-xl overflow-hidden shadow-2xl">
          <video 
            src="${videoUrl}" 
            controls 
            autoplay
            class="w-full h-auto"
          >
            Browser Anda tidak mendukung pemutaran video.
          </video>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#059669',
      width: '95%',
      customClass: {
        popup: 'rounded-[2rem] p-4'
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi 500KB sesuai instruksi Bapak Guru
      if (file.size > 500 * 1024) { 
        Swal.fire('Terlalu Besar', 'Maksimal ukuran foto adalah 500KB. Silakan kecilkan ukuran foto Anda.', 'error'); 
        if (fileInputRef.current) fileInputRef.current.value = '';
        return; 
      }
      const reader = new FileReader();
      reader.onloadend = () => { 
        setPreview(reader.result as string); 
        setFormData(prev => ({ ...prev, content: reader.result as string })); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) { 
      Swal.fire('Ops..', 'Masukkan NIS yang benar agar nama muncul otomatis.', 'warning'); 
      return; 
    }
    if (!formData.task_name || !formData.content) { 
      Swal.fire('Ops..', 'Kolom wajib diisi!', 'warning'); 
      return; 
    }

    const result = await Swal.fire({ 
      title: 'Kirim Tugas?', 
      text: `Atas nama ${formData.student_name} dari kelas ${formData.kelas}`, 
      icon: 'question', 
      showCancelButton: true, 
      confirmButtonColor: '#059669' 
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await db.addTaskSubmission({
        nisn: formData.nisn,
        student_name: formData.student_name,
        kelas: formData.kelas,
        task_name: formData.task_name,
        submission_type: formData.submission_type,
        content: formData.content
      });

      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      await Swal.fire({
        icon: 'success',
        title: 'Tugas Terkirim!',
        text: `Alhamdulillah... ${formData.student_name} dari kelas ${formData.kelas} sudah mengirim tugas ${formData.task_name} pada tanggal ${dateStr} waktu ${timeStr}. Bisa screenshot ini sebagai bukti.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#059669',
        customClass: {
          popup: 'rounded-[2rem]'
        }
      });

      setFormData({ nisn: '', student_name: '', jeniskelamin: '', kelas: '', task_name: '', submission_type: 'link', content: '' });
      setPreview(null); 
      setIsVerified(false);
    } catch (err) { 
      Swal.fire('Gagal', 'Sistem error.', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fadeIn pb-24 px-2">
      <div className="text-center space-y-1 pt-2">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Kumpulkan Tugas</h1>
        <p className="text-[10px] text-slate-500 font-medium tracking-tight">Masukkan NIS terlebih dahulu untuk mengumpulkan tugas</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NOMOR NIS */}
          <div>
            <label className="block text-[9px] font-black text-black uppercase tracking-normal ml-1 mb-1 flex justify-between">
              NOMOR NIS {fetchingStudent && <span className="text-emerald-600 text-[8px] animate-pulse font-normal">loading data siswa...</span>}
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                name="nisn" 
                inputMode="numeric" 
                placeholder="masukkan nomor NIS siswa" 
                className={`w-full pl-10 pr-10 py-3 text-xs rounded-xl border bg-white outline-none transition-all placeholder:font-normal font-normal ${isVerified ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-slate-200 focus:border-emerald-500'}`} 
                value={formData.nisn} 
                onChange={handleInputChange} 
                maxLength={10} 
              />
              {isVerified && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />}
            </div>
          </div>

          {/* NAMA SISWA */}
          <div>
            <label className="block text-[9px] font-black text-black uppercase tracking-normal ml-1 mb-1">Nama Siswa</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                type="text" 
                readOnly 
                tabIndex={-1}
                className="w-full pl-10 pr-3 py-3 text-xs rounded-xl border border-slate-100 bg-slate-50 text-black font-bold pointer-events-none placeholder:font-normal" 
                value={formData.student_name} 
                placeholder="nama akan muncul otomatis..." 
              />
            </div>
          </div>

          {/* JK & KELAS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black text-black uppercase tracking-normal ml-1 mb-1">Jenis Kelamin</label>
              <input 
                type="text" 
                readOnly 
                tabIndex={-1}
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-100 bg-slate-50 text-black font-normal pointer-events-none placeholder:font-normal" 
                value={formData.jeniskelamin} 
                placeholder="-" 
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-black uppercase tracking-normal ml-1 mb-1">Kelas</label>
              <input 
                type="text" 
                readOnly 
                tabIndex={-1}
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-100 bg-slate-50 text-black font-normal pointer-events-none placeholder:font-normal" 
                value={formData.kelas} 
                placeholder="-" 
              />
            </div>
          </div>

          {/* JUDUL TUGAS */}
          <div>
            <label className="block text-[9px] font-black text-black uppercase tracking-normal ml-1 mb-1">Judul Tugas / Materi</label>
            <div className="relative">
              <Book className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                name="task_name" 
                placeholder="Contoh: Bab 2 hal. 20" 
                style={{ colorScheme: 'light' }}
                className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-slate-200 !bg-white !text-black outline-none focus:border-emerald-500 font-normal placeholder:font-normal" 
                value={formData.task_name} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          {/* METODE PENGUMPULAN */}
          <div>
            <label className="block text-[9px] font-black text-black uppercase tracking-normal ml-1 mb-1">Metode Pengumpulan</label>
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 mb-2">
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({ ...prev, submission_type: 'link', content: '' }))} 
                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-normal transition-all ${formData.submission_type === 'link' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'}`}
              >
                Link Drive
              </button>
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({ ...prev, submission_type: 'photo', content: '' }))} 
                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${formData.submission_type === 'photo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'}`}
              >
                Foto Kamera
              </button>
            </div>

            {formData.submission_type === 'link' ? (
              <div className="space-y-2 animate-fadeIn">
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="url" 
                    name="content" 
                    placeholder="https://drive.google.com/..." 
                    style={{ colorScheme: 'light' }}
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-slate-200 !bg-white !text-black outline-none focus:border-emerald-500 italic font-normal placeholder:font-normal" 
                    value={formData.content} 
                    onChange={handleInputChange} 
                  />
                </div>
                <button 
                  type="button"
                  onClick={showTutorial}
                  className="flex items-center gap-1.5 text-[9px] font-normal italic text-blue-600 tracking-tight hover:underline px-1"
                >
                  <Youtube size={12} /> Cara mengupload tugas via Google Drive
                </button>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all bg-slate-50"
                >
                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  {preview ? (
                    <img src={preview} className="max-h-40 rounded-xl shadow-md mx-auto border-2 border-white" />
                  ) : (
                    <div className="space-y-1">
                      <Camera size={24} className="mx-auto text-slate-300" />
                      <p className="text-[10px] font-normal text-slate-500 tracking-tighter">Ambil Foto Tugas, Maksimal ukuran foto 500KB</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !isVerified} 
            className={`w-full py-4 rounded-xl text-xs font-black shadow-lg transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 ${isVerified ? 'bg-emerald-700 text-white shadow-emerald-700/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Proses Kirim
              </>
            ) : (
              <>
                <Send size={16} />
                Kirim Tugas
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-emerald-600 text-white p-5 rounded-[2rem] shadow-lg border border-emerald-500 animate-slideUp">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-emerald-100 opacity-90" />
          <h3 className="text-[10px] font-black uppercase tracking-widest">Ringkasan Pengiriman</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-[10px]">
          <div className="space-y-2.5">
            <div>
              <p className="text-emerald-100 font-bold uppercase tracking-tighter opacity-80 mb-0.5">Nama Siswa</p>
              <p className="font-normal text-white truncate w-full" title={formData.student_name}>
                {formData.student_name || 'Menunggu NIS...'}
              </p>
            </div>
            <div>
              <p className="text-emerald-100 font-bold uppercase tracking-tighter opacity-80 mb-0.5">Metode Pengumpulan</p>
              <p className="font-black uppercase text-white">{formData.submission_type}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <div>
              <p className="text-emerald-100 font-bold uppercase tracking-tighter opacity-80 mb-0.5">Tujuan Guru</p>
              <p className="font-black italic text-white leading-tight">Ahmad Nawasyi, S.Pd</p>
            </div>
            <div>
              <p className="text-emerald-100 font-bold uppercase tracking-tighter opacity-80 mb-0.5">Tanggal</p>
              <p className="font-black text-white">{new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-emerald-500/50">
          <p className="text-[8px] text-emerald-100 text-center leading-relaxed opacity-90 italic font-medium">
            Tugas yang dikirim akan tersimpan secara otomatis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicTasks;
