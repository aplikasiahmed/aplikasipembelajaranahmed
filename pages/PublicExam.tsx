
import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Timer, CheckCircle, AlertTriangle, ArrowRight, BookOpen, ShieldAlert, LogOut, ChevronLeft, ChevronRight, Flag, Grid, User, Calendar } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, Exam, Question } from '../types';
import Swal from 'sweetalert2';

const PublicExam: React.FC = () => {
  // --- STATES ---
  const [step, setStep] = useState<'login' | 'list' | 'exam' | 'result'>('login');
  
  // Login Data
  const [nis, setNis] = useState('');
  const [semester, setSemester] = useState('0'); 
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
  
  // --- ANTI-CURANG STATES & REFS ---
  const [violationCount, setViolationCount] = useState(0); // Untuk UI (Render)
  const violationRef = useRef(0); // Untuk Logika (Real-time Value)
  const isAlertOpen = useRef(false); // Kunci agar alert tidak tumpuk
  
  // Navigation
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showNavMobile, setShowNavMobile] = useState(false);
  
  // Data Waktu
  const [startTime, setStartTime] = useState<string>('');

  // --- HANDLERS ---

  // STEP 1: LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (semester === '0') {
      Swal.fire({ icon: 'warning', title: 'Pilih Semester', text: 'Silakan pilih semester terlebih dahulu.', heightAuto: false });
      return;
    }
    if (!nis.trim()) {
       Swal.fire({ icon: 'warning', title: 'NIS Kosong', text: 'Masukkan Nomor Induk Siswa.', heightAuto: false });
       return;
    }

    try {
      setLoadingExams(true);
      const s = await db.getStudentByNIS(nis);
      if (s) {
        setStudent(s);
        const gradeChar = s.kelas ? s.kelas.charAt(0) : ''; 
        const exams = await db.getActiveExamsByGrade(gradeChar, semester);
        setActiveExams(exams);
        setStep('list');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Halo, ${s.namalengkap}`, showConfirmButton: false, timer: 2000 });
      } else {
        Swal.fire({ icon: 'error', title: 'NIS Tidak Ditemukan', text: 'Periksa kembali nomor NIS Anda.', heightAuto: false });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Koneksi Error', text: 'Gagal terhubung ke server ujian.', heightAuto: false });
    } finally {
      setLoadingExams(false);
    }
  };

  // STEP 2: START EXAM
  const startExam = async (exam: Exam) => {
    // Cek Double Login / Sudah Mengerjakan
    if (student) {
        Swal.fire({ title: 'Memeriksa Data...', didOpen: () => Swal.showLoading(), heightAuto: false });
        const hasTaken = await db.checkStudentExamResult(student.nis, exam.id);
        Swal.close();
        if (hasTaken) {
            Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Anda sudah mengerjakan soal ini.', heightAuto: false });
            return;
        }
    }

    const q = await db.getQuestionsByExamId(exam.id);
    if (q.length === 0) {
      Swal.fire('Maaf', 'Soal belum tersedia.', 'info');
      return;
    }
    
    // Konfirmasi Aturan Main
    const rules = await Swal.fire({
      title: 'MODE UJIAN AMAN',
      html: `
        <div class="text-left space-y-3">
            <div class="bg-red-50 border border-red-100 p-3 rounded-xl flex gap-3">
                <div class="text-red-500 shrink-0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></div>
                <div>
                    <h4 class="font-bold text-red-600 text-sm">PERINGATAN KERAS</h4>
                    <p class="text-xs text-red-500 leading-tight mt-1">Sistem mendeteksi jika Anda keluar aplikasi/pindah tab. Pelanggaran 3x = DISKUALIFIKASI.</p>
                </div>
            </div>
            <ul class="text-xs space-y-2 text-slate-600 list-disc pl-4 font-medium">
                <li>Tampilan akan menjadi layar penuh.</li>
                <li>Dilarang membuka Google / Browser lain.</li>
                <li>Dilarang Screenshot.</li>
                <li>Fokus pada layar ujian.</li>
            </ul>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      confirmButtonText: 'SAYA SIAP MENGERJAKAN',
      cancelButtonText: 'Batal',
      heightAuto: false,
      allowOutsideClick: false
    });

    if (rules.isConfirmed) {
      // Fullscreen attempt
      try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
      } catch (e) { console.log("Fullscreen blocked", e); }

      setSelectedExam(exam);
      setQuestions(q);
      setAnswers({});
      setCurrentQIndex(0);
      setFlaggedQuestions(new Set());
      setTimeLeft(exam.duration * 60);
      setStartTime(new Date().toISOString());

      // RESET ANTI CURANG
      setViolationCount(0); 
      violationRef.current = 0; 
      isAlertOpen.current = false;
      
      setStep('exam');
    }
  };

  // --- LOGIKA ANTI-CURANG 3 STRIKES (FIXED LOGIC) ---
  useEffect(() => {
    if (step !== 'exam') return;

    // Fungsi Utama Trigger Pelanggaran
    const triggerViolation = async (reason: string) => {
        // Jika sudah diskualifikasi atau alert sedang terbuka, abaikan
        if (violationRef.current >= 3 || isAlertOpen.current) return;

        // Kunci Alert agar tidak spam
        isAlertOpen.current = true;

        // Tambah Counter
        violationRef.current += 1;
        setViolationCount(violationRef.current);

        const count = violationRef.current;

        // Tentukan Pesan & Warna berdasarkan Tingkat Pelanggaran
        let title = `PELANGGARAN ${count}/3`;
        let text = `Anda terdeteksi ${reason}. Fokus pada layar ujian!`;
        let icon: 'warning' | 'error' = 'warning';
        let btnColor = '#f59e0b'; // Kuning
        let btnText = 'Kembali Mengerjakan';

        if (count === 2) {
            title = 'PERINGATAN TERAKHIR (2/3)';
            text = 'JANGAN KELUAR LAGI! Sekali lagi melanggar, Anda akan DIDISKUALIFIKASI otomatis.';
            icon = 'error';
            btnColor = '#dc2626'; // Merah
            btnText = 'Saya Mengerti';
        } else if (count >= 3) {
            title = 'DISKUALIFIKASI';
            text = 'Anda telah melanggar aturan 3 kali. Sistem menghentikan ujian Anda sekarang.';
            icon = 'error';
            btnColor = '#000000'; // Hitam
            btnText = 'Tutup';
        }

        // Tampilkan Alert (Blocking)
        await Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonColor: btnColor,
            confirmButtonText: btnText,
            allowOutsideClick: false,
            allowEscapeKey: false,
            heightAuto: false,
            customClass: { popup: 'z-[99999]' }
        });

        // Buka Kunci Alert
        isAlertOpen.current = false;

        // Jika Pelanggaran ke-3, Auto Submit
        if (count >= 3) {
            handleSubmitExam(true);
        }
    };

    // 1. Event Ganti Tab / Minimize (Visibility Change)
    // Langsung trigger tanpa delay karena ini aksi yang jelas disengaja
    const handleVisibilityChange = () => {
        if (document.hidden) {
            triggerViolation("keluar dari aplikasi / ganti tab");
        }
    };

    // 2. Event Hilang Fokus (Blur)
    // Diberi delay 1 detik untuk membedakan klik popup/alert sistem vs klik luar app
    const handleBlur = () => {
        setTimeout(() => {
            // Cek apakah fokus benar-benar hilang dari dokumen & tab tidak hidden
            // Juga cek apakah alert sedang terbuka (karena klik alert memicu blur juga)
            if (!document.hasFocus() && !document.hidden && !isAlertOpen.current) {
                 triggerViolation("memindah fokus layar / membuka aplikasi lain");
            }
        }, 1000); 
    };

    // 3. Prevent Back Button Browser
    const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
        if (!isAlertOpen.current) {
            Swal.fire({
                title: 'Dilarang Kembali!',
                text: 'Gunakan tombol SELESAI jika ingin mengumpulkan.',
                icon: 'warning',
                timer: 1500,
                showConfirmButton: false,
                heightAuto: false,
                customClass: { popup: 'z-[99999]' }
            });
        }
    };

    // Attach Listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    
    // Push state untuk mencegah back
    window.history.pushState(null, "", window.location.href);
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener('popstate', handlePopState);
    };
  }, [step]); // Dependency: hanya reset saat step berubah (mulai ujian)

  // TIMER
  useEffect(() => {
    let timer: any;
    if (step === 'exam' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (step === 'exam' && timeLeft === 0) {
      handleSubmitExam(true); // Waktu Habis -> Auto Submit
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  const handleAnswer = (qId: string, idx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: String(idx) }));
  };

  const toggleFlag = (qId: string) => {
      const newFlags = new Set(flaggedQuestions);
      newFlags.has(qId) ? newFlags.delete(qId) : newFlags.add(qId);
      setFlaggedQuestions(newFlags);
  };

  // --- SUBMIT KE DB ---
  const handleSubmitExam = async (auto = false) => {
    // Exit Fullscreen
    if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch(e) {}
    }

    // Hitung Nilai Local
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);

    // Save DB
    if (selectedExam && student) {
      Swal.fire({ title: 'Menyimpan Jawaban...', didOpen: () => Swal.showLoading(), heightAuto: false, allowOutsideClick: false, customClass: { popup: 'z-[99999]' } });
      try {
        await db.submitExamResult({
            exam_id: selectedExam.id,
            student_nis: student.nis,
            student_name: student.namalengkap,
            student_class: student.kelas,
            semester: selectedExam.semester, 
            answers: answers,
            score: finalScore,
            started_at: startTime
        });
        Swal.close();
      } catch (e) {
        console.error(e);
        Swal.fire({title: 'Error', text: 'Gagal menyimpan nilai (Koneksi).', icon: 'error', heightAuto: false, customClass: { popup: 'z-[99999]' }});
      }
    }
    setStep('result');
  };

  // --- LOGIKA VALIDASI GANDA TOMBOL SELESAI (DIPANGGIL OLEH HEADER & FOOTER) ---
  const handleDoubleConfirmation = async () => {
      // Logic ini harus ada di dalam komponen agar bisa akses 'answers' dan 'questions'
      const answered = Object.keys(answers).length;
      const total = questions.length;
      const empty = total - answered;

      // VALIDASI 1: Cek Kelengkapan
      let title1 = 'Konfirmasi Selesai';
      let text1 = `Anda sudah menjawab ${answered} dari ${total} soal.`;
      let icon1: 'question' | 'warning' = 'question';
      let btnColor1 = '#059669'; // Hijau
      
      if (empty > 0) {
          title1 = 'Masih Ada Soal Kosong!';
          text1 = `Hati-hati! Masih ada ${empty} soal belum dijawab. Yakin mau kumpulkan?`;
          icon1 = 'warning';
          btnColor1 = '#d97706'; // Kuning/Orange
      }

      const confirm1 = await Swal.fire({
          title: title1,
          text: text1,
          icon: icon1,
          showCancelButton: true,
          confirmButtonColor: btnColor1,
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Ya, Lanjutkan',
          cancelButtonText: 'Periksa Lagi',
          heightAuto: false,
          customClass: { popup: 'z-[99999]' }
      });

      if (!confirm1.isConfirmed) return;

      // VALIDASI 2: Peringatan Final
      const confirm2 = await Swal.fire({
          title: 'PERINGATAN TERAKHIR',
          html: `<span style="color:red; font-weight:bold">JAWABAN TIDAK BISA DIUBAH!</span><br/>Apakah Anda benar-benar yakin ingin mengakhiri ujian ini?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626', // Merah
          cancelButtonColor: '#64748b',
          confirmButtonText: 'YA, KUMPULKAN SEKARANG',
          cancelButtonText: 'Batal',
          heightAuto: false,
          customClass: { popup: 'z-[99999]' }
      });

      if (confirm2.isConfirmed) {
          handleSubmitExam(false);
      }
  };

  // --- VIEWS ---

  if (step === 'login') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn px-1 md:px-0 pb-10">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-slate-800 uppercase">Kerjakan Soal</h1>
          <p className="text-xs text-slate-500 font-medium">Pilih Semester & masukkan NIS untuk mengerjakan soal</p>
        </div>
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* WARNA INPUT TETAP GELAP SESUAI PERMINTAAN */}
              <select 
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-normal outline-none focus:border-emerald-500 transition-all cursor-pointer"
                value={semester} 
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="0">Pilih Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                {/* WARNA INPUT TETAP GELAP SESUAI PERMINTAAN */}
                <input 
                  type="text" 
                  inputMode="numeric" 
                  className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-normal outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500" 
                  placeholder="Masukkan nomor NIS siswa" 
                  value={nis} 
                  onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>
            <button type="submit" disabled={loadingExams} className="w-full bg-emerald-700 text-white px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-800 transition-all">
               {loadingExams ? 'Mencari...' : 'CARI SOAL'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'list') {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fadeIn pb-24 px-1 md:px-0 pt-4">
        <button onClick={() => { setStep('login'); setNis(''); setSemester('0'); }} className="md:hidden flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase"><ArrowRight className="rotate-180" size={12}/> Ganti Akun</button>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-[9px] font-bold uppercase tracking-widest">Data Siswa</p>
            <h1 className="text-lg font-black uppercase">{student?.namalengkap}</h1>
            <p className="text-xs mt-0.5 opacity-90">Kelas {student?.kelas} • NIS {student?.nis}</p>
          </div>
        </div>
        <h2 className="text-sm font-black text-slate-800 uppercase ml-1">Daftar Soal</h2>
        <div className="space-y-3">
          {activeExams.length === 0 ? (
             <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200"><p className="text-slate-400 text-xs font-bold">Tidak ada soal tersedia.</p></div>
          ) : (
             activeExams.map(exam => (
               <div key={exam.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-300 transition-all">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <div className="flex items-center gap-2 mb-1"><BookOpen size={12} className="text-emerald-600"/><span className="text-[9px] font-black text-emerald-600 uppercase">Sem {exam.semester}</span></div>
                       <h3 className="font-bold text-slate-800 text-sm">{exam.title}</h3>
                       <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{exam.category}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl flex flex-col items-center"><Timer size={16} /><span className="text-[10px] font-black">{exam.duration}m</span></div>
                 </div>
                 <button onClick={() => startExam(exam)} className="w-full bg-red-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                   <Play size={12} fill="currentColor" /> Kerjakan Sekarang
                 </button>
               </div>
             ))
          )}
        </div>
      </div>
    );
  }

  // --- EXAM UI ---
  if (step === 'exam' && selectedExam && questions.length > 0) {
    const currentQ = questions[currentQIndex];
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-100 flex flex-col overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
        {/* HEADER */}
        <div className="bg-white border-b border-emerald-100 shadow-md p-3 z-50 flex items-center justify-between shrink-0 h-20">
           <div className="flex items-center gap-3">
              <div className="hidden md:flex w-12 h-12 bg-emerald-600 text-white rounded-xl items-center justify-center shadow-lg"><User size={24} /></div>
              <div className="space-y-0.5">
                 <h2 className="text-xs md:text-lg font-black text-slate-800 uppercase leading-none">{student?.namalengkap}</h2>
                 <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Kelas {student?.kelas} • {selectedExam.title}</p>
                 <div className="flex items-center gap-2 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit"><Calendar size={10}/> <span>{new Date().toLocaleDateString('id-ID')}</span></div>
              </div>
           </div>
           <div className="flex items-center gap-2 md:gap-4">
               {violationCount > 0 && (
                   <div className="hidden md:flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 animate-pulse">
                      <ShieldAlert size={14} /><span className="text-[10px] font-black uppercase">Pelanggaran {violationCount}/3</span>
                   </div>
               )}
               <div className="text-right mr-2">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Sisa Waktu</p>
                  <p className={`text-lg md:text-2xl font-black font-mono leading-none ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>{formatTime(timeLeft)}</p>
               </div>
               {/* TOMBOL SELESAI HEADER: SUDAH DIPERBAIKI MEMANGGIL handleDoubleConfirmation */}
               <button onClick={handleDoubleConfirmation} className="bg-red-600 text-white px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2">
                 <LogOut size={14} strokeWidth={3} /> <span className="hidden md:inline">Selesai</span>
               </button>
           </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col h-full relative overflow-y-auto bg-slate-50">
               <div className="w-full bg-slate-200 h-1"><div className="bg-emerald-500 h-1 transition-all duration-300" style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}></div></div>
               <div className="p-4 md:p-8 flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
                  <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 relative min-h-[400px] flex flex-col">
                      <div className="flex justify-between items-start mb-4 md:mb-6">
                          <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs md:text-sm font-black shadow-md">SOAL NO. {currentQIndex + 1}</span>
                          <button onClick={() => toggleFlag(currentQ.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${flaggedQuestions.has(currentQ.id) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-400 border-slate-200'}`}><Flag size={12} fill={flaggedQuestions.has(currentQ.id) ? "currentColor" : "none"} /> Ragu-ragu</button>
                      </div>
                      {currentQ.image_url && <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-w-lg mx-auto bg-slate-50"><img src={currentQ.image_url} alt="Soal" className="w-full h-auto object-contain max-h-[300px]" /></div>}
                      <div className="flex-1 mb-6"><p className="text-sm md:text-lg font-bold text-slate-800 leading-relaxed">{currentQ.text}</p></div>
                      <div className="grid grid-cols-1 gap-3">
                         {currentQ.options?.map((opt, optIdx) => {
                           const isSelected = answers[currentQ.id] === String(optIdx);
                           return (
                             <button key={optIdx} onClick={() => handleAnswer(currentQ.id, optIdx)} className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all text-xs md:text-sm flex items-center gap-4 group active:scale-[0.99] ${isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md ring-2 ring-emerald-500/20' : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-300'}`}>
                                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{['A','B','C','D'][optIdx]}</div>
                                <span className="leading-relaxed font-medium">{opt}</span>
                             </button>
                           );
                         })}
                      </div>
                  </div>
               </div>
               <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                  <button onClick={() => currentQIndex > 0 && setCurrentQIndex(p => p - 1)} disabled={currentQIndex === 0} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 disabled:opacity-50"><ChevronLeft size={16}/> Sebelumnya</button>
                  <button onClick={() => setShowNavMobile(!showNavMobile)} className="md:hidden flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-white font-bold text-xs"><Grid size={16}/> <span className="text-[10px]">NO. SOAL</span></button>
                  {currentQIndex === questions.length - 1 ? (
                      // TOMBOL SELESAI BAWAH: MENGGUNAKAN VALIDASI GANDA
                      <button onClick={handleDoubleConfirmation} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase hover:bg-emerald-700 shadow-lg"><CheckCircle size={16}/> Selesai</button>
                  ) : (
                      <button onClick={() => setCurrentQIndex(p => p + 1)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-lg">Selanjutnya <ChevronRight size={16}/></button>
                  )}
               </div>
            </div>
            
            {/* NAVIGATOR (KANAN) */}
            <div className={`fixed inset-y-0 right-0 z-[100] w-64 bg-white shadow-2xl transform transition-transform duration-300 md:relative md:transform-none md:w-80 md:border-l md:border-slate-200 md:shadow-none flex flex-col ${showNavMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-black text-slate-700 text-sm uppercase flex items-center gap-2"><Grid size={16} className="text-emerald-600"/> Navigasi Soal</h3><button onClick={() => setShowNavMobile(false)} className="md:hidden p-1 text-slate-400 hover:text-red-500"><ArrowRight size={20} /></button></div>
                <div className="flex-1 overflow-y-auto p-4"><div className="grid grid-cols-4 gap-2">{questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id]; const isFlagged = flaggedQuestions.has(q.id); const isCurrent = currentQIndex === idx;
                    let bgClass = 'bg-slate-50 border-slate-200 text-slate-500';
                    if (isAnswered) bgClass = 'bg-emerald-500 border-emerald-600 text-white';
                    if (isFlagged) bgClass = 'bg-amber-400 border-amber-500 text-white';
                    if (isCurrent) bgClass = 'ring-2 ring-blue-500 ring-offset-2 border-blue-500 text-blue-600 font-black';
                    return (<button key={q.id} onClick={() => { setCurrentQIndex(idx); setShowNavMobile(false); }} className={`aspect-square rounded-lg border flex items-center justify-center text-xs font-bold transition-all shadow-sm active:scale-95 ${bgClass}`}>{idx + 1}{isFlagged && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></div>}</button>);
                })}</div></div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Sudah Dijawab</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Ragu-ragu</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium"><div className="w-3 h-3 bg-slate-200 rounded-sm border border-slate-300"></div> Belum Dijawab</div>
                </div>
            </div>
            {showNavMobile && <div className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm" onClick={() => setShowNavMobile(false)}></div>}
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center px-4 animate-slideUp text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 animate-bounce"><CheckCircle size={48} strokeWidth={3} /></div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Mengerjakan Soal Selesai!</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Nilai telah tersimpan otomatis ke Buku Nilai, Nilai bisa langsung di lihat pada menu Cek Nilai</p>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl w-full space-y-2 mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nilai Kamu</p>
           <p className="text-5xl font-black text-slate-800 tracking-tighter">{score}</p>
        </div>
        <button onClick={() => { setStep('login'); setNis(''); setSemester('0'); }} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"><ArrowRight size={16} /> Selesai</button>
      </div>
    );
  }

  return null;
};

export default PublicExam;
