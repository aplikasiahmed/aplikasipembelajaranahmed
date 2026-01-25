
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Link as LinkIcon, Send, User, Hash, Book, Users, Trash2, Youtube, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { db } from '../services/supabaseMock';

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

  // Effect untuk mencari data siswa secara dinamis berdasarkan NIS
  useEffect(() => {
    const searchStudent = async () => {
      // Jika input kosong, reset form
      if (formData.nisn.length === 0) {
        setFormData(prev => ({
          ...prev,
          student_name: '',
          grade: '',
          rombel: ''
        }));
        setIsVerified(false);
        return;
      }

      // Mulai mencari jika panjang NIS minimal 4 karakter (menghindari pencarian berlebih)
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
            
            // Toast notifikasi sukses ditemukan
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Siswa Terverifikasi',
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            // Jika tidak ditemukan setelah mencapai panjang tertentu
            setIsVerified(false);
            setFormData(prev => ({
              ...prev,
              student_name: '',
              grade: '',
              rombel: ''
            }));

            // Tampilkan peringatan hanya jika user sudah berhenti mengetik (debounce ditangani timeout)
            Swal.fire({
              icon: 'error',
              title: 'NIS Tidak Ditemukan',
              text: 'Nomor NIS yang Anda masukkan tidak terdaftar. Silakan periksa kembali atau hubungi guru.',
              confirmButtonColor: '#059669',
              confirmButtonText: 'Coba Lagi'
            });
          }
        } catch (error) {
          console.error("Error auto-filling student data:", error);
        } finally {
          setFetchingStudent(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      searchStudent();
    }, 800); // Jeda 800ms setelah berhenti mengetik

    return () => clearTimeout(timeoutId);
  }, [formData.nisn]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // KHUSUS NIS: Hanya izinkan angka dan filter teks
    if (name === 'nisn') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Terlalu Besar',
          text: 'Maksimal ukuran foto adalah 1MB',
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
    
    if (!isVerified) {
      Swal.fire({
        icon: 'warning',
        title: 'Siswa Belum Terpilih',
        text: 'Silakan masukkan nomor NIS yang benar agar data nama Anda muncul otomatis.',
        confirmButtonColor: '#059669'
      });
      return;
    }

    if (!formData.task_name || !formData.content) {
      Swal.fire({
        icon: 'warning',
        title: 'Ops...',
        text: 'kolom kosong wajib diisi!',
        confirmButtonColor: '#059669'
      });
      return;
    }

    if (formData.submission_type === 'link' && !formData.content.toLowerCase().startsWith('http')) {
      Swal.fire({
        icon: 'error',
        title: 'Link Tidak Valid',
        text: 'Masukkan link yang benar (contoh: https://drive.google.com/...)',
        confirmButtonColor: '#d33'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Konfirmasi Pengiriman',
      text: 'Kirim tugas atas nama ' + formData.student_name + '?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kirim',
      cancelButtonText: 'Cek Lagi',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      heightAuto: false,
      customClass: { popup: 'rounded-3xl' }
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
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: `Terjadi kesalahan saat menyimpan data.`,
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
        <p className="text-[10px] md:text-xs text-slate-500 font-medium">Data diri terisi otomatis saat Anda memasukkan NIS.</p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NIS - NUMERIC ONLY */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1 flex justify-between">
                <span>NOMOR NIS</span>
                {fetchingStudent && <span className="flex items-center gap-1 text-emerald-600 text-[9px] animate-pulse"><Loader2 size={10} className="animate-spin" /> Mencari Data...</span>}
              </label>
              <div className="relative">
                <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isVerified ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                <input 
                  type="text" 
                  name="nisn"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="masukkan nomor NIS anda" 
                  className={`w-full pl-9 pr-10 py-3 text-xs md:text-sm rounded-xl border bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-bold ${isVerified ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 focus:border-emerald-500'}`}
                  value={formData.nisn}
                  onChange={handleInputChange}
                  maxLength={10}
                  autoComplete="off"
                />
                {isVerified && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />}
              </div>
            </div>

            {/* Nama Lengkap - READ ONLY */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Nama Lengkap Siswa</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isVerified ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                <input 
                  type="text" 
                  name="student_name"
                  readOnly
                  placeholder="Terisi otomatis..." 
                  className={`w-full pl-9 pr-3 py-2.5 text-[11px] md:text-sm rounded-xl border outline-none bg-slate-50 text-slate-500 cursor-not-allowed font-medium ${isVerified ? 'border-emerald-100' : 'border-slate-200'}`}
                  value={formData.student_name}
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Kelas & Rombel - READ ONLY */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Kelas</label>
                <div className="relative">
                  <Book className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isVerified ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                  <input 
                    type="text"
                    readOnly
                    placeholder="Kelas"
                    className={`w-full pl-9 pr-3 py-2.5 text-[11px] md:text-sm rounded-xl border outline-none bg-slate-50 text-slate-500 cursor-not-allowed font-medium ${isVerified ? 'border-emerald-100' : 'border-slate-200'}`}
                    value={formData.grade ? `Kelas ${formData.grade}` : ''}
                    tabIndex={-1}
                  />
                </div>
              </div>
              <div className="w-24 space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Rombel</label>
                <div className="relative">
                  <Users className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isVerified ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                  <input 
                    type="text"
                    readOnly
                    placeholder="-"
                    className={`w-full pl-9 pr-3 py-2.5 text-[11px] md:text-sm rounded-xl border text-center outline-none bg-slate-50 text-slate-500 cursor-not-allowed font-medium ${isVerified ? 'border-emerald-100' : 'border-slate-200'}`}
                    value={formData.rombel}
                    tabIndex={-1}
                  />
                </div>
              </div>
            </div>

            {/* Nama Tugas */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Judul Tugas / Materi</label>
              <div className="relative">
                <Send className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  name="task_name"
                  placeholder="Tugas Bab 2 halaman 20 " 
                  className="w-full pl-9 pr-3 py-3 text-xs md:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
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
                <LinkIcon size={14} /> Link Drive
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, submission_type: 'photo', content: '' }));
                  setPreview(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all ${formData.submission_type === 'photo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                <Camera size={14} /> Foto Kamera
              </button>
            </div>
          </div>

          {/* Dynamic Content Input */}
          <div className="animate-fadeIn">
            {formData.submission_type === 'link' ? (
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Tempel (Paste) Link Tugas di sini</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="url" 
                    name="content"
                    placeholder="https://drive.google.com/..." 
                    className="w-full pl-9 pr-3 py-3 text-xs md:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
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
                    Tutorial cara ambil link Google Drive
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">Ambil Foto Tugas</label>
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
                      <p className="text-[10px] md:text-xs text-slate-500">Klik untuk membuka kamera HP atau pilih file (ukuran foto maksimal 1MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !isVerified}
            className={`w-full py-4 rounded-xl text-xs md:text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isVerified ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {loading ? 'Sedang Mengirim...' : <><Send size={16} /> Kirim Tugas Sekarang</>}
          </button>
        </form>
      </div>
      
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
        <p className="text-[9px] md:text-[10px] text-amber-800 leading-relaxed italic">
          <strong>Perhatian:</strong> Jika Nama atau Kelas Anda tidak muncul secara otomatis, artinya data Anda belum terdaftar di database. Silakan hubungi Bapak Guru untuk pendaftaran data siswa.
        </p>
      </div>
    </div>
  );
};

export default PublicTasks;
