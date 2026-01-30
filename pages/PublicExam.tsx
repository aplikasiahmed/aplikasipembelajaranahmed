
import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Timer, CheckCircle, AlertTriangle, ArrowRight, HelpCircle, Calendar, BookOpen, ShieldAlert, EyeOff, LogOut, ChevronLeft, ChevronRight, Flag, Grid, User } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, Exam, Question } from '../types';
import Swal from 'sweetalert2';

const PublicExam: React.FC = () => {
  // --- STATES ---
  const [step, setStep] = useState<'login' | 'list' | 'exam' | 'result'>('login');
  
  // Login Data
  const [nis, setNis] = useState('');
  const [semester, setSemester] = useState('0'); // Default 0
  const [student, setStudent] = useState<Student | null>(null);
  
  // Exam Selection
  const [activeExams, setActiveExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  
  // Exam Execution
  const [answers, setAnswers] = useState<Record<string, string>>({}); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [score, setScore] = useState(0);
  
  // NEW: State untuk Pelanggaran (Anti-Curang)
  const [violationCount, setViolationCount] = useState(0);
  // REF: Gunakan Ref agar nilai selalu update tanpa re-render effect (SOLUSI ANTI-CURANG TIDAK MUNCUL)
  const violationRef = useRef(0);

  // NEW: State Slideshow & Ragu-ragu
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showNavMobile, setShowNavMobile] = useState(false); // Untuk toggle navigasi di HP
  
  // NEW: State Waktu Mulai (Penting untuk Durasi Pengerjaan)
  const [startTime, setStartTime] = useState<string>('');

  // --- HANDLERS ---

  // STEP 1: LOGIN SISWA & CARI SOAL
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validasi Semester
    if (semester === '0') {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Pilih Semester', 
        text: 'Silakan pilih semester terlebih dahulu.', 
        heightAuto: false 
      });
      return;
    }

    // 2. Validasi NIS
    if (!nis.trim()) {
       Swal.fire({ icon: 'warning', title: 'NIS Kosong', text: 'Masukkan Nomor Induk Siswa.', heightAuto: false });
       return;
    }

    try {
      setLoadingExams(true);
      // Cari Data Siswa
      const s = await db.getStudentByNIS(nis);
      
      if (s) {
        setStudent(s);
        
        // Ambil Angka Kelas (misal 7.A -> '7'), handle jika null
        const gradeChar = s.kelas ? s.kelas.charAt(0) : ''; 
        
        // Cari Ujian berdasarkan Kelas AND Semester
        const exams = await db.getActiveExamsByGrade(gradeChar, semester);
        
        setActiveExams(exams);
        setStep('list'); // Pindah ke halaman list soal
        
        Swal.fire({ 
            toast: true, 
            position: 'top-end', 
            icon: 'success', 
            title: `Halo, ${s.namalengkap}`, 
            text: ``,
            showConfirmButton: false, 
            timer: 2000 
        });

      } else {
        Swal.fire({ icon: 'error', title: 'NIS Tidak Ditemukan', text: 'Periksa kembali nomor NIS Anda.', heightAuto: false });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Koneksi Error', text: 'Gagal terhubung ke server ujian.', heightAuto: false });
    } finally {
      setLoadingExams(false);
    }
  };

  // STEP 2: START EXAM (Updated with Rules & Anti-Cheat Init)
  const startExam = async (exam: Exam) => {
    // 0. CEK APAKAH SUDAH MENGERJAKAN?
    if (student) {
        Swal.fire({ title: 'Memeriksa Data...', didOpen: () => Swal.showLoading(), heightAuto: false });
        const hasTaken = await db.checkStudentExamResult(student.nis, exam.id);
        Swal.close();

        if (hasTaken) {
            Swal.fire({
                icon: 'error',
                title: 'Akses Ditolak',
                text: 'Anda sudah mengerjakan soal ini. Soal tidak bisa dikerjakan lebih dari 1x',
                heightAuto: false
            });
            return;
        }
    }

    // Ambil Soal dari Database
    const q = await db.getQuestionsByExamId(exam.id);
    
    if (q.length === 0) {
      Swal.fire('Maaf', 'Soal belum tersedia.', 'info');
      return;
    }
    
    // TAMPILKAN TATA TERTIB & KONFIRMASI
    const rules = await Swal.fire({
      title: 'MODE UJIAN AMAN',
      html: `
        <div class="text-left space-y-3">
            <div class="bg-red-50 border border-red-100 p-3 rounded-xl flex gap-3">
                <div class="text-red-500 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></div>
                <div>
                    <h4 class="font-bold text-red-600 text-sm">PERINGATAN KERAS</h4>
                    <p class="text-xs text-red-500 leading-tight mt-1">Sistem mendeteksi jika Anda keluar aplikasi/pindah tab. Pelanggaran 3x = DISKUALIFIKASI.</p>
                </div>
            </div>
            
            <ul class="text-xs space-y-2 text-slate-600 list-disc pl-4 font-medium">
                <li>Tampilan akan menjadi layar penuh.</li>
                <li>Dilarang membuka Google / Browser lain.</li>
                <li>Dilarang <i>Copy-Paste</i> atau <i>Screenshot</i>.</li>
                <li>Jika tombol navigasi HP hilang, geser dari bawah layar.</li>
            </ul>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      confirmButtonText: 'SAYA MENGERTI & SIAP',
      cancelButtonText: 'Batal',
      heightAuto: false,
      allowOutsideClick: false,
      customClass: {
        popup: 'rounded-2xl',
        title: 'text-lg font-black uppercase'
      }
    });

    if (rules.isConfirmed) {
      // AKTIFKAN FULLSCREEN
      try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
      } catch (e) {
        console.log("Fullscreen blocked or not supported", e);
      }

      setSelectedExam(exam);
      setQuestions(q);
      setAnswers({});
      setCurrentQIndex(0); // Reset ke soal pertama
      setFlaggedQuestions(new Set()); // Reset ragu-ragu
      setTimeLeft(exam.duration * 60);
      
      // SET WAKTU MULAI (PENTING UNTUK DURASI)
      setStartTime(new Date().toISOString());

      // RESET SENSOR ANTI CURANG
      setViolationCount(0); 
      violationRef.current = 0; // Reset REF juga penting!
      
      setStep('exam');
    }
  };

  // --- SISTEM DETEKSI PELANGGARAN (Anti-Cheat) ---
  // PERBAIKAN: Menggunakan violationRef agar listener tidak putus (stale closure)
  useEffect(() => {
    if (step !== 'exam') return;

    // Fungsi Trigger Pelanggaran
    const triggerViolation = (msg: string) => {
        // Increment REF (Data Kebenaran)
        violationRef.current += 1;
        const currentViolations = violationRef.current;
        
        // Update STATE (Untuk Tampilan UI)
        setViolationCount(currentViolations);

        // Logic Peringatan (Menggunakan REF agar akurat)
        if (currentViolations === 1) {
            Swal.fire({
                title: 'PELANGGARAN 1/3',
                text: msg,
                icon: 'warning',
                confirmButtonText: 'Kembali Mengerjakan',
                confirmButtonColor: '#f59e0b',
                allowOutsideClick: false,
                heightAuto: false,
                customClass: { popup: 'z-[10000]' }
            });
        } else if (currentViolations === 2) {
            Swal.fire({
                title: 'PELANGGARAN 2/3 (TERAKHIR)',
                text: 'JANGAN KELUAR LAGI! Sekali lagi Anda keluar, jawaban otomatis dikumpulkan dan nilai apa adanya.',
                icon: 'error',
                confirmButtonText: 'Saya Mengerti',
                confirmButtonColor: '#dc2626',
                allowOutsideClick: false,
                heightAuto: false,
                customClass: { popup: 'z-[10000]' }
            });
        } else if (currentViolations >= 3) {
            // DISKUALIFIKASI
            handleSubmitExam(true); // Auto Submit
            Swal.fire({
                title: 'DISKUALIFIKASI',
                text: 'Anda melanggar aturan berulang kali. Ujian dihentikan paksa oleh sistem.',
                icon: 'error',
                confirmButtonText: 'Lihat Hasil',
                confirmButtonColor: '#000000',
                allowOutsideClick: false,
                heightAuto: false,
                customClass: { popup: 'z-[10000]' }
            });
        }
    };

    // 1. Deteksi Pindah Tab / Minimize (HP & Laptop)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation("Anda terdeteksi keluar dari aplikasi ujian!");
      }
    };

    // 2. Deteksi Fokus Hilang (Split Screen / Klik Aplikasi Lain)
    const handleBlur = () => {
        // Abaikan jika fokus ke elemen internal (seperti Iframe atau SweetAlert)
        // Kita beri delay sedikit untuk memastikan bukan klik di dalam
        setTimeout(() => {
            if (document.activeElement?.tagName === "IFRAME" || document.activeElement?.tagName === "BODY") return;
            // Cek apakah user benar-benar tidak aktif di window
            if (!document.hasFocus()) {
                triggerViolation("Fokus layar hilang. Dilarang membuka aplikasi lain!");
            }
        }, 300);
    };

    // Pasang Event Listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    // Mencegah Tombol Back Browser (PopState)
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
        Swal.fire({
            title: 'Dilarang Kembali',
            text: 'Gunakan tombol "Selesai" jika ingin mengakhiri ujian.',
            icon: 'warning',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'z-[10000]' }
        });
    };
    window.addEventListener('popstate', handlePopState);

    // Cleanup saat unmount (Selesai Ujian)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [step]); // Dependency Cuma STEP, agar tidak re-render saat count berubah (Ref yang menangani count)


  // TIMER LOGIC
  useEffect(() => {
    let timer: any;
    if (step === 'exam' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (step === 'exam' && timeLeft === 0) {
      handleSubmitExam(true); // Auto submit saat waktu habis
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // FORMAT TIME
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ANSWER HANDLER (SlideShow Mode)
  const handleAnswer = (qId: string, optIndex: number) => {
    setAnswers(prev => ({ ...prev, [qId]: String(optIndex) }));
  };

  const toggleFlag = (qId: string) => {
      const newFlags = new Set(flaggedQuestions);
      if (newFlags.has(qId)) {
          newFlags.delete(qId);
      } else {
          newFlags.add(qId);
      }
      setFlaggedQuestions(newFlags);
  };

  const goToNextQuestion = () => {
      if (currentQIndex < questions.length - 1) {
          setCurrentQIndex(prev => prev + 1);
      }
  };

  const goToPrevQuestion = () => {
      if (currentQIndex > 0) {
          setCurrentQIndex(prev => prev - 1);
      }
  };

  // STEP 3: SUBMIT EXAM
  const handleSubmitExam = async (auto = false) => {
    // KELUAR DARI FULLSCREEN
    if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch(e) {}
    }

    if (!auto) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < questions.length) {
        const confirm = await Swal.fire({
          title: 'Masih ada soal kosong!',
          text: `Anda baru menjawab ${answeredCount} dari ${questions.length} soal. Yakin ingin mengumpulkan?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Ya, Kumpulkan',
          heightAuto: false,
          customClass: { popup: 'z-[10000]' }
        });
        if (!confirm.isConfirmed) return;
      } else {
        const confirm = await Swal.fire({
          title: 'Kumpulkan Jawaban?',
          text: 'Anda tidak dapat mengubah jawaban setelah ini.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#059669',
          confirmButtonText: 'Ya, Selesai',
          heightAuto: false,
          customClass: { popup: 'z-[10000]' }
        });
        if (!confirm.isConfirmed) return;
      }
    }

    // HITUNG NILAI
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });
    
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);

    // SIMPAN KE DATABASE (Auto-Grading)
    if (selectedExam && student) {
      Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading(), heightAuto: false, allowOutsideClick: false, customClass: { popup: 'z-[10000]' } });
      
      try {
        await db.submitExamResult({
            exam_id: selectedExam.id,
            student_nis: student.nis,
            student_name: student.namalengkap,
            student_class: student.kelas,
            semester: selectedExam.semester, 
            answers: answers,
            score: finalScore,
            started_at: startTime // KIRIM WAKTU MULAI (RESTORED)
        });
        Swal.close();
      } catch (e) {
        console.error("Gagal simpan nilai", e);
        // Pesan Error Lebih Jelas
        Swal.fire({title: 'Error', text: 'Gagal menyimpan nilai. Pastikan kolom started_at sudah ada di database.', icon: 'error', customClass: { popup: 'z-[10000]' }});
      }
    }

    setStep('result');
  };

  // --- RENDER VIEWS ---

  if (step === 'login') {
    return (
      <div className="max-w-2xl mx-auto space-y-3 md:space-y-6 animate-fadeIn px-1 md:px-0 pb-10">
        <div className="text-center space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Kerjakan Soal</h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-tight">Pilih Semester & masukkan NIS untuk kerjakan soal.</p>
        </div>
        
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* SEMESTER SELECTION */}
              <select 
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-normal outline-none focus:border-emerald-500 transition-all"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="0">Pilih Semester</option>
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>

              {/* NIS INPUT */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  inputMode="numeric"
                  className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-normal outline-none focus:border-emerald-500 transition-all shadow-sm"
                  placeholder="Masukkan Nomor Induk Siswa..."
                  value={nis}
                  onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>

            <button type="submit" disabled={loadingExams} className="w-full bg-emerald-700 text-white px-5 py-3.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-emerald-800 active:scale-95 shadow-lg flex items-center justify-center gap-2 transition-all">
               {loadingExams ? 'Mencari...' : <><Search size={14} /> CARI SOAL</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'list') {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fadeIn pb-24 px-1 md:px-0 pt-4">
        <button onClick={() => { setStep('login'); setNis(''); setSemester('0'); }} className="md:hidden flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-tight py-1">
           <ArrowRight className="rotate-180" size={12}/> Ganti Akun / Semester
        </button>

        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
           <div className="absolute right-[-10%] top-[-20%] opacity-20 pointer-events-none">
              <CheckCircle size={100} />
            </div>
          <div className="relative z-10">
            <p className="text-emerald-100 text-[9px] font-bold uppercase tracking-widest">Data Siswa • Semester {semester} </p>
            <h1 className="text-lg font-black uppercase tracking-tight">{student?.namalengkap}</h1>
            <p className="text-xs mt-0.5 opacity-90">Kelas {student?.kelas} • NIS {student?.nis} • {student.jeniskelamin} </p>
          </div>
        </div>

        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight ml-1">Daftar Soal Tersedia</h2>
        
        <div className="space-y-3">
          {activeExams.length === 0 ? (
             <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
               <AlertTriangle className="mx-auto text-slate-200 mb-2" size={32} />
               <p className="text-slate-600 text-xs font-bold">Tidak ada soal yang harus di kerjakan</p>
               <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
                  soal belum dipublikasikan
               </p>
             </div>
          ) : (
             activeExams.map(exam => (
               <div key={exam.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-300 transition-all group">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <BookOpen size={12} className="text-emerald-600"/>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Semester {exam.semester}</span>
                       </div>
                       <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight group-hover:text-emerald-600 transition-colors">{exam.title}</h3>
                       <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Kategori: {exam.category}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl flex flex-col items-center min-w-[60px]">
                       <Timer size={16} />
                       <span className="text-[10px] font-black mt-0.5">{exam.duration}m</span>
                    </div>
                 </div>
                 <button 
                   onClick={() => startExam(exam)}
                   className="w-full bg-red-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                 >
                   <Play size={12} fill="currentColor" /> Kerjakan Sekarang
                 </button>
               </div>
             ))
          )}
        </div>
      </div>
    );
  }

  // --- TAMPILAN UJIAN (FULLSCREEN OVERLAY) ---
  if (step === 'exam' && selectedExam && questions.length > 0) {
    const currentQ = questions[currentQIndex];
    const isLastQ = currentQIndex === questions.length - 1;

    return (
      // Z-INDEX 9999 + FIXED INSET-0 AKAN MENUTUPI HEADER & FOOTER
      <div 
        className="fixed inset-0 z-[9999] bg-slate-100 flex flex-col overflow-hidden select-none"
        onContextMenu={(e) => e.preventDefault()} // DISABLE KLIK KANAN
      >
        {/* HEADER INFORMASI LENGKAP (REVISI SESUAI REQUEST) */}
        <div className="bg-white border-b border-emerald-100 shadow-md p-3 z-50 flex items-center justify-between shrink-0 h-20 md:h-24">
           {/* Info Kiri: Data Siswa */}
           <div className="flex items-center gap-3">
              <div className="hidden md:flex w-12 h-12 bg-emerald-600 text-white rounded-xl items-center justify-center shadow-lg">
                 <User size={24} />
              </div>
              <div className="space-y-0.5">
                 <h2 className="text-xs md:text-lg font-black text-slate-800 uppercase tracking-tight leading-none">
                    {student?.namalengkap}
                 </h2>
                 <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">
                    Kelas {student?.kelas} • {selectedExam.title} 
                 </p>
                 <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                    <Calendar size={10}/> 
                    <span>{new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</span>
                    <span>• Sem {selectedExam.semester}</span>
                 </div>
              </div>
           </div>

           {/* Info Kanan: Timer & Tombol Selesai */}
           <div className="flex items-center gap-2 md:gap-4">
               {violationCount > 0 && (
                   <div className="hidden md:flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 animate-pulse">
                      <ShieldAlert size={14} />
                      <span className="text-[10px] font-black uppercase">Pelanggaran {violationCount}/3</span>
                   </div>
               )}
               
               <div className="text-right mr-2">
                  <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sisa Waktu</p>
                  <div className="flex items-baseline justify-end gap-1">
                    <p className={`text-lg md:text-2xl font-black font-mono tracking-tight leading-none ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                      {formatTime(timeLeft)}
                    </p>
                    <span className="text-[9px] font-bold text-slate-400">mnt</span>
                  </div>
               </div>

               <button 
                 onClick={() => handleSubmitExam(false)}
                 className="bg-red-600 text-white px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-lg shadow-red-200 active:scale-95 transition-all hover:bg-red-700 flex items-center gap-2"
               >
                 <LogOut size={14} strokeWidth={3} /> <span className="hidden md:inline">Selesai</span>
               </button>
           </div>
        </div>

        {/* BODY: SLIDESHOW SOAL & NAVIGATOR */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* AREA SOAL (KIRI) */}
            <div className="flex-1 flex flex-col h-full relative overflow-y-auto bg-slate-50">
               
               {/* Progress Bar di atas soal */}
               <div className="w-full bg-slate-200 h-1">
                  <div 
                    className="bg-emerald-500 h-1 transition-all duration-300" 
                    style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                  ></div>
               </div>

               <div className="p-4 md:p-8 flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full animate-slideRight">
                  {/* KARTU SOAL */}
                  <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 relative min-h-[400px] flex flex-col">
                      <div className="flex justify-between items-start mb-4 md:mb-6">
                          <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs md:text-sm font-black shadow-md">
                             SOAL NO. {currentQIndex + 1}
                          </span>
                          <button 
                             onClick={() => toggleFlag(currentQ.id)}
                             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${flaggedQuestions.has(currentQ.id) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                          >
                             <Flag size={12} fill={flaggedQuestions.has(currentQ.id) ? "currentColor" : "none"} /> Ragu-ragu
                          </button>
                      </div>

                      {/* GAMBAR SOAL */}
                      {currentQ.image_url && (
                          <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-w-lg mx-auto bg-slate-50">
                              <img src={currentQ.image_url} alt="Soal" className="w-full h-auto object-contain max-h-[300px]" />
                          </div>
                      )}

                      {/* TEKS SOAL */}
                      <div className="flex-1 mb-6">
                          <p className="text-sm md:text-lg font-bold text-slate-800 leading-relaxed">
                            {currentQ.text}
                          </p>
                      </div>

                      {/* OPSI JAWABAN */}
                      <div className="grid grid-cols-1 gap-3">
                         {currentQ.options?.map((opt, optIdx) => {
                           const isSelected = answers[currentQ.id] === String(optIdx);
                           return (
                             <button
                               key={optIdx}
                               onClick={() => handleAnswer(currentQ.id, optIdx)}
                               className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all text-xs md:text-sm flex items-center gap-4 group active:scale-[0.99] ${
                                 isSelected 
                                   ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md ring-2 ring-emerald-500/20' 
                                   : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/30'
                               }`}
                             >
                                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                                    isSelected 
                                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                                      : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-emerald-400 group-hover:text-emerald-500'
                                }`}>
                                   {['A','B','C','D'][optIdx]}
                                </div>
                                <span className="leading-relaxed font-medium">{opt}</span>
                             </button>
                           );
                         })}
                      </div>
                  </div>
               </div>

               {/* FOOTER NAVIGASI (PREV/NEXT) */}
               <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                  <button 
                    onClick={goToPrevQuestion}
                    disabled={currentQIndex === 0}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <ChevronLeft size={16}/> Sebelumnya
                  </button>

                  <button 
                    onClick={() => setShowNavMobile(!showNavMobile)}
                    className="md:hidden flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-white font-bold text-xs active:scale-95"
                  >
                    <Grid size={16}/> <span className="text-[10px]">NO. SOAL</span>
                  </button>

                  {isLastQ ? (
                      <button 
                        onClick={() => handleSubmitExam(false)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                      >
                        Selesai <CheckCircle size={16}/>
                      </button>
                  ) : (
                      <button 
                        onClick={goToNextQuestion}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                      >
                        Selanjutnya <ChevronRight size={16}/>
                      </button>
                  )}
               </div>
            </div>

            {/* NAVIGATOR NOMOR SOAL (KANAN / DESKTOP) */}
            <div className={`
                fixed inset-y-0 right-0 z-[100] w-64 bg-white shadow-2xl transform transition-transform duration-300 md:relative md:transform-none md:w-80 md:border-l md:border-slate-200 md:shadow-none flex flex-col
                ${showNavMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-slate-700 text-sm uppercase tracking-tight flex items-center gap-2">
                        <Grid size={16} className="text-emerald-600"/> Navigasi Soal
                    </h3>
                    <button onClick={() => setShowNavMobile(false)} className="md:hidden p-1 text-slate-400 hover:text-red-500">
                        <ArrowRight size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-4 gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = !!answers[q.id];
                            const isFlagged = flaggedQuestions.has(q.id);
                            const isCurrent = currentQIndex === idx;
                            
                            let bgClass = 'bg-slate-50 border-slate-200 text-slate-500'; // Default
                            if (isAnswered) bgClass = 'bg-emerald-500 border-emerald-600 text-white'; // Hijau
                            if (isFlagged) bgClass = 'bg-amber-400 border-amber-500 text-white'; // Kuning
                            if (isCurrent) bgClass = 'ring-2 ring-blue-500 ring-offset-2 border-blue-500 text-blue-600 font-black'; // Focus

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => {
                                        setCurrentQIndex(idx);
                                        setShowNavMobile(false);
                                    }}
                                    className={`aspect-square rounded-lg border flex items-center justify-center text-xs font-bold transition-all shadow-sm active:scale-95 ${bgClass}`}
                                >
                                    {idx + 1}
                                    {isFlagged && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Sudah Dijawab
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Ragu-ragu
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <div className="w-3 h-3 bg-slate-200 rounded-sm border border-slate-300"></div> Belum Dijawab
                    </div>
                </div>
            </div>

            {/* Overlay Gelap untuk Mobile saat Nav Open */}
            {showNavMobile && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm"
                    onClick={() => setShowNavMobile(false)}
                ></div>
            )}

        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center px-4 animate-slideUp text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 animate-bounce">
           <CheckCircle size={48} strokeWidth={3} />
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Mengerjakan Soal Selesai!</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Nilai telah tersimpan otomatis ke Buku Nilai, Nilai bisa langsung di lihat pada menu Cek Nilai</p>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl w-full space-y-2 mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nilai Kamu</p>
           <p className="text-5xl font-black text-slate-800 tracking-tighter">{score}</p>
        </div>

        <button 
          onClick={() => { setStep('login'); setNis(''); setSemester('0'); }}
          className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowRight size={16} /> Selesai
        </button>
      </div>
    );
  }

  return null;
};

export default PublicExam;
