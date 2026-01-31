import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Timer, CheckCircle, ShieldAlert, LogOut, ChevronLeft, ChevronRight, Flag, Grid, User, Calendar, X, ArrowRight, BookOpen, AlertTriangle, Loader2, HelpCircle } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, Exam, Question } from '../types';
import Swal from 'sweetalert2';

const PublicExam: React.FC = () => {
  // --- STATES UTAMA ---
  const [step, setStep] = useState<'login' | 'list' | 'exam' | 'result'>('login');
  
  // Data User & Ujian
  const [nis, setNis] = useState('');
  const [semester, setSemester] = useState('0'); 
  const [student, setStudent] = useState<Student | null>(null);
  const [activeExams, setActiveExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  
  // State Pengerjaan
  const [answers, setAnswers] = useState<Record<string, string>>({}); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [score, setScore] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showNavMobile, setShowNavMobile] = useState(false);
  const [startTime, setStartTime] = useState<string>('');

  // --- MODAL STATES (PENGGANTI SWEETALERT) ---
  const [violationCount, setViolationCount] = useState(0); 
  const [showViolationModal, setShowViolationModal] = useState(false); 
  const [showFinishModal, setShowFinishModal] = useState(false); // Modal Konfirmasi Selesai
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading Submit
  
  // Refs untuk logika realtime tanpa render ulang
  const violationRef = useRef(0); 
  const isPaused = useRef(false); // Kunci sensor utama

  // --- 1. RESTORE SESSION ---
  useEffect(() => {
    const savedSession = localStorage.getItem('pai_exam_session');
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            const now = new Date().getTime();
            const end = new Date(session.endTime).getTime();
            const remaining = Math.floor((end - now) / 1000);

            if (remaining > 0) {
                setStudent(session.student);
                setSelectedExam(session.exam);
                setQuestions(session.questions);
                setAnswers(session.answers || {});
                setStartTime(session.startTime);
                setTimeLeft(remaining);
                setStep('exam');
                setViolationCount(session.violationCount || 0);
                violationRef.current = session.violationCount || 0;
            } else {
                localStorage.removeItem('pai_exam_session');
            }
        } catch (e) {
            localStorage.removeItem('pai_exam_session');
        }
    }
  }, []);

  // --- 2. UPDATE SESSION ---
  useEffect(() => {
    if (step === 'exam' && selectedExam && student) {
        const endTime = new Date(new Date(startTime).getTime() + selectedExam.duration * 60000).toISOString();
        const sessionData = {
            student,
            exam: selectedExam,
            questions,
            answers,
            startTime,
            endTime, 
            violationCount: violationRef.current
        };
        localStorage.setItem('pai_exam_session', JSON.stringify(sessionData));
    }
  }, [answers, violationCount, step]); 

  // --- HANDLERS LOGIN & START ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (semester === '0') return Swal.fire({ icon: 'warning', title: 'Pilih Semester', text: 'Silakan pilih semester terlebih dahulu.', heightAuto: false });
    if (!nis.trim()) return Swal.fire({ icon: 'warning', title: 'NIS Kosong', text: 'Masukkan Nomor Induk Siswa.', heightAuto: false });

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
      Swal.fire({ icon: 'error', title: 'Koneksi Error', text: 'Gagal terhubung halaman soal', heightAuto: false });
    } finally {
      setLoadingExams(false);
    }
  };

  const startExam = async (exam: Exam) => {
    // [REVISI] HAPUS Loading SweetAlert disini
    if (student) {
        const hasTaken = await db.checkStudentExamResult(student.nis, exam.id);
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
    
    // PERINGATAN AWAL (Masih pakai SweetAlert tidak apa-apa karena belum masuk mode ujian)
    const rules = await Swal.fire({
      title: 'PERATURAN UJIAN',
      html: `
        <div class="text-left space-y-3">
            <div class="bg-red-50 border border-red-100 p-3 rounded-xl flex gap-3">
                <div class="text-red-500 shrink-0"><ShieldAlert size={24} /></div>
                <div>
                    <h4 class="font-bold text-red-600 text-sm">DILARANG CURANG!</h4>
                    <p class="text-xs text-red-500 leading-tight mt-1">Sistem mendeteksi jika Anda membuka Google, Ai, WA, atau sumber lainya</p>
                </div>
            </div>
            <ul class="text-xs space-y-1 text-slate-600 list-disc pl-4 font-medium">
                <li>Dilarang keluar dari halaman soal</li>
                <li>Jika melanggar 3x, anda tidak dapat mengerjakan soal kemballi (DISKUALIFIKASI) jawabanya akan otomatis masuk secara sistem</li>
                <li>Jangan Lupa membaca doa sebelum mengerjakan soal</li>
            </ul>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      confirmButtonText: 'SAYA MENGERTI & SIAP',
      cancelButtonText: 'Batal',
      heightAuto: false,
      allowOutsideClick: false
    });

    if (rules.isConfirmed) {
      const startTimeIso = new Date().toISOString();
      const endTimeIso = new Date(new Date().getTime() + exam.duration * 60000).toISOString();

      setSelectedExam(exam);
      setQuestions(q);
      setAnswers({});
      setCurrentQIndex(0);
      setFlaggedQuestions(new Set());
      setTimeLeft(exam.duration * 60);
      setStartTime(startTimeIso);

      // RESET
      setViolationCount(0); 
      violationRef.current = 0; 
      isPaused.current = false; 
      setShowViolationModal(false);
      setShowFinishModal(false);
      setIsSubmitting(false);
      
      const sessionData = {
          student,
          exam,
          questions: q,
          answers: {},
          startTime: startTimeIso,
          endTime: endTimeIso,
          violationCount: 0
      };
      localStorage.setItem('pai_exam_session', JSON.stringify(sessionData));

      setStep('exam');
    }
  };

  // --- SUBMIT FUNCTION ---
  const handleSubmitExam = async (forced = false) => {
    isPaused.current = true; // Matikan sensor
    setShowViolationModal(false); 
    setShowFinishModal(false);
    setIsSubmitting(true); // Tampilkan Loading Overlay Custom

    localStorage.removeItem('pai_exam_session');

    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);

    try {
      await db.submitExamResult({
          exam_id: selectedExam!.id,
          student_nis: student!.nis,
          student_name: student!.namalengkap,
          student_class: student!.kelas,
          semester: selectedExam!.semester, 
          answers: answers,
          score: finalScore,
          started_at: startTime
      });
    } catch (e) {
      console.error(e);
    }

    setIsSubmitting(false);
    setStep('result');
  };

  // --- LOGIKA ANTI-CURANG (CUSTOM) ---
  useEffect(() => {
    if (step !== 'exam') return;

    const triggerViolation = () => {
        if (isPaused.current) return; // Jika sedang pause, abaikan

        isPaused.current = true; // Kunci Sensor
        violationRef.current += 1;
        setViolationCount(violationRef.current);
        setShowViolationModal(true); // Tampilkan Modal Pelanggaran
    };

    const handleVisibility = () => {
        if (document.hidden) triggerViolation();
    };

    const handleBlur = () => {
        setTimeout(() => {
            if (!document.hasFocus() && !document.hidden && !isPaused.current) {
                triggerViolation();
            }
        }, 300);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    
    // Prevent Back
    const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener('popstate', handlePopState);
    };
  }, [step]); 

  // --- HANDLER MODAL ---
  const handleCloseViolationModal = () => {
      if (violationCount >= 3) {
          handleSubmitExam(true);
      } else {
          setShowViolationModal(false);
          // Beri jeda agar tidak langsung kena blur lagi saat klik tutup
          setTimeout(() => {
              isPaused.current = false;
          }, 1000);
      }
  };

  // --- HANDLER TOMBOL SELESAI (REVISI: MENGGUNAKAN CUSTOM MODAL) ---
  const handleFinishClick = () => {
      isPaused.current = true; // PAUSE SENSOR SEGERA
      setShowFinishModal(true); // TAMPILKAN MODAL CUSTOM
  };

  const handleConfirmFinish = () => {
      setShowFinishModal(false);
      handleSubmitExam(false);
  };

  const handleCancelFinish = () => {
      setShowFinishModal(false);
      // RESUME SENSOR setelah jeda
      setTimeout(() => {
          isPaused.current = false;
      }, 500);
  };

  // Timer
  useEffect(() => {
    let timer: any;
    if (step === 'exam' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (step === 'exam' && timeLeft <= 0) {
      handleSubmitExam(true); 
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (s: number) => {
    if (s < 0) return "00:00";
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

  // --- RENDER ---

  if (step === 'login') {
    return (
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-fadeIn pb-10 px-1 md:px-0">
        <div className="text-center space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Kerjakan Soal</h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-tight">Pilih Semester & masukkan NIS untuk mengerjakan soal</p>
        </div>
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select 
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-normal outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
                value={semester} 
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="0">Pilih Semester</option>
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  inputMode="numeric" 
                  className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-normal outline-none focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-400" 
                  placeholder="Masukkan nomor NIS siswa" 
                  value={nis} 
                  onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>
            <button type="submit" disabled={loadingExams} className="w-full bg-emerald-700 text-white px-5 py-3.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-emerald-800 active:scale-95 shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all">
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
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;
    // Hitung jumlah soal ragu-ragu
    const flaggedCount = flaggedQuestions.size;

    return (
      <div className="fixed inset-0 z-[9000] bg-slate-100 flex flex-col overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
        {/* HEADER (OPTIMASI MOBILE) */}
        <div className="bg-white border-b border-emerald-100 shadow-md p-2 md:p-3 z-50 flex items-center justify-between shrink-0 h-16 md:h-20">
           <div className="flex items-center gap-2 md:gap-3 flex-1 overflow-hidden">
              <div className="hidden md:flex w-12 h-12 bg-emerald-600 text-white rounded-xl items-center justify-center shadow-lg"><User size={24} /></div>
              <div className="space-y-0.5 overflow-hidden">
                 <h2 className="text-[10px] md:text-lg font-black text-slate-800 uppercase leading-none truncate">{student?.namalengkap}</h2>
                 <p className="text-[8px] md:text-xs text-slate-500 font-bold uppercase truncate">{selectedExam.title}</p>
                 <div className="hidden md:flex items-center gap-2 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit"><Calendar size={10}/> <span>{new Date().toLocaleDateString('id-ID')}</span></div>
              </div>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4 shrink-0">
               {/* INDIKATOR PELANGGARAN (MUNCUL DI MOBILE) & TEKS "Poin Pelanggaran" */}
               {violationCount > 0 && (
                   <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100 animate-pulse">
                      <ShieldAlert size={12} className="md:w-3.5 md:h-3.5" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase">Poin Pelanggaran {violationCount}/3</span>
                   </div>
               )}
               
               <div className="text-right">
                  <p className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase tracking-widest hidden md:block">Sisa Waktu</p>
                  <p className={`text-base md:text-2xl font-black font-mono leading-none ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>{formatTime(timeLeft)}</p>
               </div>
               
               {/* TOMBOL SELESAI (TEKS SELALU MUNCUL) */}
               <button 
                 onClick={handleFinishClick} 
                 className="bg-red-600 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-1 md:gap-2"
               >
                 <LogOut size={12} className="md:w-3.5 md:h-3.5" strokeWidth={3} /> <span>Selesai</span>
               </button>
           </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden relative">
            
            {/* === LOADING OVERLAY (CUSTOM) === */}
            {isSubmitting && (
                <div className="absolute inset-0 z-[10001] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                    <Loader2 size={48} className="text-emerald-600 animate-spin" />
                    <div className="text-center">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Menyimpan Jawaban...</h3>
                        <p className="text-xs text-slate-500 font-medium">Mohon tunggu, jangan keluar dari halaman.</p>
                    </div>
                </div>
            )}

            {/* === CUSTOM VIOLATION MODAL === */}
            {showViolationModal && (
                <div className="absolute inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-scaleUp">
                        <div className="bg-red-600 p-6 text-center text-white">
                            <ShieldAlert size={60} className="mx-auto mb-2 opacity-90" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">PELANGGARAN {violationCount}/3</h2>
                            <p className="text-xs font-medium text-red-100 mt-1 uppercase tracking-widest">Sistem Anti-Curang Terdeteksi</p>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <p className="text-sm font-bold text-red-800 leading-relaxed">
                                    Anda terdeteksi keluar dari halaman soal atau membuka sumber lainya.
                                </p>
                            </div>
                            
                            {violationCount >= 3 ? (
                                <p className="text-xs text-slate-500 font-medium">
                                    Maaf, Anda telah melanggar aturan sebanyak 3 kali. <br/>
                                    <span className="text-red-600 font-bold">Anda terlah dihentikan otomatis mengerjakan soal.</span>
                                </p>
                            ) : (
                                <p className="text-xs text-slate-500 font-medium">
                                    Harap tetap berada pada layar soal. Pelanggaran ke-3 akan menyebabkan diskualifikasi.
                                </p>
                            )}

                            <button 
                                onClick={handleCloseViolationModal}
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all ${violationCount >= 3 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                            >
                                {violationCount >= 3 ? 'KUMPULKAN JAWABAN' : 'SAYA MENGERTI (OK)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === CUSTOM FINISH MODAL (REVISI BARU: DETEKSI KOSONG & RAGU-RAGU) === */}
            {showFinishModal && (
                <div className="absolute inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-scaleUp border border-slate-200">
                        <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
                            {unansweredCount > 0 || flaggedCount > 0 ? (
                                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <AlertTriangle size={32} />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <HelpCircle size={32} />
                                </div>
                            )}
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Konfirmasi Selesai</h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* REVISI: TAMPILKAN STATUS SOAL KOSONG & RAGU-RAGU */}
                            {(unansweredCount > 0 || flaggedCount > 0) ? (
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center space-y-1">
                                    {unansweredCount > 0 && (
                                        <p className="text-amber-800 font-bold text-sm">Masih ada {unansweredCount} soal kosong!</p>
                                    )}
                                    {flaggedCount > 0 && (
                                        <p className="text-amber-700 font-bold text-sm">Masih ada {flaggedCount} soal ragu-ragu!</p>
                                    )}
                                    <p className="text-amber-600 text-xs mt-2">Apakah Anda yakin ingin mengumpulkan?</p>
                                </div>
                            ) : (
                                <p className="text-center text-slate-500 font-medium text-sm">
                                    Anda telah menjawab semua soal. Yakin ingin selesai mengerjakan soal?
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button 
                                    onClick={handleCancelFinish}
                                    className="py-3 rounded-xl bg-slate-200 text-slate-600 font-black uppercase text-xs hover:bg-slate-300 transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleConfirmFinish}
                                    className="py-3 rounded-xl bg-emerald-600 text-white font-black uppercase text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                                >
                                    Ya, Kumpulkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col h-full relative overflow-y-auto bg-slate-50">
               <div className="w-full bg-slate-200 h-1"><div className="bg-emerald-500 h-1 transition-all duration-300" style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}></div></div>
               <div className="p-3 md:p-8 flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
                  {/* REVISI MOBILE: PADDING DIPERKECIL (p-3 untuk mobile) */}
                  <div className="bg-white p-3 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-slate-100 relative min-h-[350px] md:min-h-[400px] flex flex-col">
                      <div className="flex justify-between items-start mb-4 md:mb-6">
                          <span className="bg-emerald-600 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-sm font-black shadow-md uppercase">Soal No. {currentQIndex + 1}</span>
                          <button onClick={() => toggleFlag(currentQ.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${flaggedQuestions.has(currentQ.id) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-400 border-slate-200'}`}><Flag size={12} fill={flaggedQuestions.has(currentQ.id) ? "currentColor" : "none"} /> Ragu-ragu</button>
                      </div>
                      {currentQ.image_url && <div className="mb-4 md:mb-6 rounded-xl md:rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-w-lg mx-auto bg-slate-50"><img src={currentQ.image_url} alt="Soal" className="w-full h-auto object-contain max-h-[250px] md:max-h-[300px]" /></div>}
                      <div className="flex-1 mb-4 md:mb-6"><p className="text-sm md:text-lg font-bold text-slate-800 leading-relaxed text-justify">{currentQ.text}</p></div>
                      
                      {/* REVISI MOBILE: GAP DIPERKECIL */}
                      <div className="grid grid-cols-1 gap-2 md:gap-3">
                         {currentQ.options?.map((opt, optIdx) => {
                           const isSelected = answers[currentQ.id] === String(optIdx);
                           return (
                             // REVISI MOBILE: PADDING OPSI DIPERKECIL (p-2.5)
                             <button key={optIdx} onClick={() => handleAnswer(currentQ.id, optIdx)} className={`w-full text-left p-2.5 md:p-4 rounded-xl border-2 transition-all text-xs md:text-sm flex items-center gap-3 md:gap-4 group active:scale-[0.98] ${isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md ring-2 ring-emerald-500/20' : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-300'}`}>
                                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg border-2 flex items-center justify-center text-[10px] md:text-xs font-black shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{['A','B','C','D'][optIdx]}</div>
                                <span className="leading-relaxed font-medium">{opt}</span>
                             </button>
                           );
                         })}
                      </div>
                  </div>
               </div>
               <div className="p-3 md:p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 gap-2">
                  <button onClick={() => currentQIndex > 0 && setCurrentQIndex(p => p - 1)} disabled={currentQIndex === 0} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-3 md:px-5 rounded-xl bg-slate-100 text-slate-600 font-bold text-[10px] md:text-xs hover:bg-slate-200 disabled:opacity-50"><ChevronLeft size={14} className="md:w-4 md:h-4"/> Sebelumnya</button>
                  <button onClick={() => setShowNavMobile(!showNavMobile)} className="md:hidden flex items-center gap-1.5 px-3 py-3 rounded-xl bg-slate-800 text-white font-bold text-[10px]"><Grid size={14}/> <span className="text-[9px]">NO. SOAL</span></button>
                  
                  {/* TOMBOL SELESAI / SELANJUTNYA (BAWAH) */}
                  {currentQIndex === questions.length - 1 ? (
                      <button onClick={handleFinishClick} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-3 md:px-6 rounded-xl bg-emerald-600 text-white font-black text-[10px] md:text-xs uppercase hover:bg-emerald-700 shadow-lg"><CheckCircle size={14} className="md:w-4 md:h-4"/> Selesai</button>
                  ) : (
                      <button onClick={() => setCurrentQIndex(p => p + 1)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 py-3 md:px-6 rounded-xl bg-blue-600 text-white font-bold text-[10px] md:text-xs hover:bg-blue-700 shadow-lg">Selanjutnya <ChevronRight size={14} className="md:w-4 md:h-4"/></button>
                  )}
               </div>
            </div>
            
            {/* NAVIGATOR (KANAN) */}
            <div className={`fixed inset-y-0 right-0 z-[9050] w-64 bg-white shadow-2xl transform transition-transform duration-300 md:relative md:transform-none md:w-80 md:border-l md:border-slate-200 md:shadow-none flex flex-col ${showNavMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-black text-slate-700 text-sm uppercase flex items-center gap-2"><Grid size={16} className="text-emerald-600"/> Navigasi Soal</h3><button onClick={() => setShowNavMobile(false)} className="md:hidden p-1 text-slate-400 hover:text-red-500"><X size={20} /></button></div>
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
            {showNavMobile && <div className="fixed inset-0 bg-black/50 z-[9040] md:hidden backdrop-blur-sm" onClick={() => setShowNavMobile(false)}></div>}
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center px-4 animate-slideUp text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 animate-bounce"><CheckCircle size={48} strokeWidth={3} /></div>
        <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Mengerjakan Soal Selesai!</h1>
        <p className="text-xm text-slate-500 mb-8 max-w-xs mx-auto">Nilai telah tersimpan otomatis ke Buku Nilai, Nilai bisa langsung di lihat pada menu Cek Nilai</p>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl w-full space-y-2 mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nilai Kamu</p>
           <p className="text-5xl font-black text-slate-800 tracking-tighter">{score}</p>
        </div>
        <button onClick={() => { setStep('login'); setNis(''); setSemester('0'); }} className="bg-emerald-800 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"><ArrowRight size={16} /> Selesai</button>
      </div>
    );
  }

  return null;
};

export default PublicExam;