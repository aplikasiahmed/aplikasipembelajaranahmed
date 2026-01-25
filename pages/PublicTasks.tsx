
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Link as LinkIcon, Send, User, Hash, Book, Users, Trash2, Youtube, Loader2, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { db } from '../services/supabaseMock';
import { GradeLevel } from '../types';

const PublicTasks: React.FC = () => {
  const [formData, setFormData] = useState({
    nisn: '',
    student_name: '',
    grade: '' as any,
    rombel: '',
    task_name: '',
    submission_type: 'link' as 'link' | 'photo',
    content: ''
  });
  
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rombels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  // Effect untuk mencari data siswa secara dinamis berdasarkan NIS
  useEffect(() => {
    const searchStudent = async () => {
      // Mulai mencari jika panjang NIS minimal 4 karakter untuk efisiensi
      if (formData.nisn.length >= 4) {
        setFetchingStudent(true);
        try {
          const student = await db.getStudentByNIS(formData.nisn);
          if (student) {
            setFormData(prev => ({
              ...prev,
              student_name: student.namalengkap,
              grade: student.grade,
              rombel: student.rombel
            }));
            setIsVerified(true);
          } else {
            setIsVerified(false);
          }
        } catch (error) {
          console.error("Error auto-filling student data:", error);
        } finally {
          setFetchingStudent(false);
        }
      } else {
        setIsVerified(false);
      }
    };

    // Debounce pencarian agar tidak terlalu sering request ke database saat mengetik
    const timeoutId = setTimeout(() => {
      searchStudent();
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [formData.nisn]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Terlalu Besar',
          text: 'Maksimal ukuran foto adalah 2MB',
          confirmButtonColor: '#059669'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        setFormData(prev => ({ ...prev, content: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nisn || !formData.student_name || !formData.task_name || !formData.content || !formData.grade || !formData.rombel) {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Form',
        text: 'Semua kolom wajib diisi termasuk Kelas dan Rombel!',
        confirmButtonColor: '#059669'
      });
      return;
    }

    if (formData.submission_type === 'link' && !formData.content.toLowerCase().startsWith('https://drive.google.com/')) {
      Swal.fire({
        icon: 'error',
        title: 'Link Tidak Valid',
        text: 'Anda wajib menggunakan link dari Google Drive (https://drive.google.com/...) agar tugas dapat diperiksa.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Konfirmasi Pengiriman',
      text: 'Yakin ingin mengirim tugas?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Kirim',
      cancelButtonText: 'Cek Lagi',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      heightAuto: false,
      customClass: {
        popup: 'rounded-3xl'
      }
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await db.addTaskSubmission(formData);
      
      Swal.fire({
        icon: 'success',
        title: 'Tugas Terkirim!',
        text: 'Alhamdulillah, tugas Anda berhasil dikumpulkan.',
        confirmButtonColor: '#059669',
        timer: 3000
      });

      setFormData({
        nisn: '',
        student_name: '',
        grade: '',
        rombel: '',
        task_name: '',
        submission_type: 'link',
        content: ''
      });
      setPreview(null);
      setIsVerified(false);
      
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error("Supabase Error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: `Error: ${err.message || 'Terjadi kesalahan tidak dikenal'}.`,
        confirmButtonColor: '#059669'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-fadeIn px-1 md:px-0 pb-16">
      <div className="text-center space-y-1">
        <h1 className="text-lg md:text-2xl font-bold text-slate-800">Kumpulkan Tugas PAI</h1>
        <p className="text-[10px] md:text-xs text-slate-500 font-medium">Isi form di bawah ini dengan benar untuk mengumpulkan tugas Anda.</p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NIS */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1 flex justify-between">
                <span>NIS</span>
                {fetchingStudent && <span className="flex items-center gap-1 text-emerald-600 text-[9px]"><Loader2 size={10} className="animate-spin" /> Mencari...</span>}
              </label>
              <div className="relative">
                <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isVerified ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                <input 
                  type="text" 
                  name="nisn"
                  placeholder="masukkan nomor NIS" 
                  className={`w-full pl-9 pr-10 py-2 text-[11px] md:text-sm rounded-xl border bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all ${isVerified ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 focus:border-emerald-500'}`}
                  value={formData.nisn}
                  onChange={handleInputChange}
                  maxLength={10}
                />
                {isVerified && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />}
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Nama Lengkap Siswa</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isVerified ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                <input 
                  type="text" 
                  name="student_name"
                  placeholder="Masukkan nama lengkap" 
                  className={`w-full pl-9 pr-3 py-2 text-[11px] md:text-sm rounded-xl border bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all ${isVerified ? 'border-emerald-200 bg-slate-50 text-slate-600' : 'border-slate-200 focus:border-emerald-500'}`}
                  value={formData.student_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Kelas & Rombel */}
            <div className="md:col-span-2 flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Kelas</label>
                <div className="relative">
                  <Book className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isVerified ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                  <select 
                    name="grade"
                    className={`w-full pl-9 pr-3 py-2 text-[11px] md:text-sm rounded-xl border appearance-none bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none ${isVerified ? 'border-emerald-200 bg-slate-50 text-slate-600' : 'border-slate-200 focus:border-emerald-500'}`}
                    value={formData.grade}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>Pilih Kelas</option>
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
              </div>
              <div className="w-28 md:w-32 space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Rombel</label>
                <div className="relative">
                  <Users className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isVerified ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                  <select 
                    name="rombel"
                    className={`w-full pl-9 pr-3 py-2 text-[11px] md:text-sm rounded-xl border appearance-none bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none ${isVerified ? 'border-emerald-200 bg-slate-50 text-slate-600' : 'border-slate-200 focus:border-emerald-500'}`}
                    value={formData.rombel}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>Rombel</option>
                    {rombels.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Nama Tugas */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Nama Tugas / Materi</label>
              <div className="relative">
                <Send className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  name="task_name"
                  placeholder="contoh : Penilain Sumatif Bab 1 Halaman 21" 
                  className="w-full pl-9 pr-3 py-2 text-[11px] md:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  value={formData.task_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Submission Method Toggle */}
          <div className="pt-2">
            <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1 mb-2 block">Metode Pengumpulan</label>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, submission_type: 'link', content: '' }));
                  setPreview(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${formData.submission_type === 'link' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                <LinkIcon size={14} /> Link Google Drive/Web
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, submission_type: 'photo', content: '' }));
                  setPreview(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${formData.submission_type === 'photo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                <Camera size={14} /> Foto Kamera / File
              </button>
            </div>
          </div>

          {/* Dynamic Content Input */}
          <div className="animate-fadeIn">
            {formData.submission_type === 'link' ? (
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Masukkan Link Bukti Tugas (Wajib Google Drive)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="url" 
                    name="content"
                    placeholder="https://drive.google.com/..." 
                    className="w-full pl-9 pr-3 py-2 text-[11px] md:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    value={formData.content}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                   <Youtube className="text-red-600" size={14} />
                   <a 
                    href="https://www.youtube.com/watch?v=TszEbugDcgg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] md:text-xs text-emerald-600 font-bold underline hover:text-emerald-700 transition-colors"
                  >
                    Klik di sini: Tutorial cara upload & ambil link Google Drive
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Unggah Foto Bukti Tugas</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {preview ? (
                    <div className="relative inline-block">
                      <img src={preview} alt="Preview" className="max-h-40 rounded-xl shadow-sm border border-slate-200" />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreview(null);
                          setFormData(prev => ({ ...prev, content: '' }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                        <Camera size={20} />
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-500">Klik untuk mengambil foto atau pilih file</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Mengirim...' : <><Send size={16} /> Kirim Tugas Sekarang</>}
          </button>
        </form>
      </div>
      
      <div className="text-center p-4">
        <p className="text-[9px] md:text-[10px] text-slate-400 leading-relaxed italic">
          * Pastikan data sudah benar sebelum menekan tombol kirim. <br/>
        </p>
      </div>
    </div>
  );
};

export default PublicTasks;
