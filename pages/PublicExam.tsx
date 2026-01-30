
import React, { useState, useEffect } from 'react';
import { Search, Play, Timer, CheckCircle, AlertTriangle, ArrowRight, HelpCircle, Calendar, BookOpen } from 'lucide-react';
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

  // --- HANDLERS ---

  // STEP 1: LOGIN SISWA & CARI SOAL
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validasi Semester
    if (semester === '0') {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Pilih Semester', 
        text: 'Silakan pilih semester ujian terlebih dahulu.', 
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
        
        // Ambil Angka Kelas (misal 7.A -> '7')
        const gradeChar = s.kelas.charAt(0); 
        
        // Cari Ujian berdasarkan Kelas AND Semester
        const exams = await db.getActiveExamsByGrade(gradeChar, semester);
        
        setActiveExams(exams);
        setStep('list'); // Pindah ke halaman list soal
        
        Swal.fire({ 
            toast: true, 
            position: 'top-end', 
            icon: 'success', 
            title: `Halo, ${s.namalengkap}`, 
            text: `Menampilkan ujian Semester ${semester}`,
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

  // STEP 2: START EXAM
  const startExam = async (exam: Exam) => {
    // Ambil Soal dari Database
    const q = await db.getQuestionsByExamId(exam.id);
    
    if (q.length === 0) {
      Swal.fire('Maaf', 'Soal belum tersedia / kosong untuk ujian ini.', 'info');
      return;
    }
    
    const res = await Swal.fire({
      title: 'Mulai Ujian?',
      html: `
        <div class="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm">
            <p><b>Mata Pelajaran:</b> ${exam.title}</p>
            <p><b>Durasi:</b> ${exam.duration} Menit</p>
            <p><b>Jumlah Soal:</b> ${q.length} Butir</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      confirmButtonText: 'Mulai Mengerjakan',
      cancelButtonText: 'Batal',
      heightAuto: false
    });

    if (res.isConfirmed) {
      setSelectedExam(exam);
      setQuestions(q);
      setAnswers({});
      setTimeLeft(exam.duration * 60); 
      setStep('exam');
    }
  };

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

  // ANSWER HANDLER
  const handleAnswer = (qId: string, optIndex: number) => {
    setAnswers(prev => ({ ...prev, [qId]: String(optIndex) }));
  };

  // STEP 3: SUBMIT EXAM
  const handleSubmitExam = async (auto = false) => {
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
          heightAuto: false
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
          heightAuto: false
        });
        if (!confirm.isConfirmed) return;
      }
    } else {
        await Swal.fire({ icon: 'info', title: 'Waktu Habis!', text: 'Jawaban Anda otomatis dikumpulkan.', timer: 2000, showConfirmButton: false, heightAuto: false });
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
      Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading(), heightAuto: false, allowOutsideClick: false });
      
      try {
        await db.submitExamResult({
            exam_id: selectedExam.id,
            student_nis: student.nis,
            student_name: student.namalengkap,
            student_class: student.kelas,
            semester: selectedExam.semester, // WAJIB DIKIRIM KE DB HASIL UJIAN
            answers: answers,
            score: finalScore
        });
        Swal.close();
      } catch (e) {
        console.error("Gagal simpan nilai", e);
        Swal.fire('Error', 'Gagal menyimpan nilai ke server. Hubungi guru.', 'error');
      }
    }

    setStep('result');
  };

  // --- RENDER VIEWS ---

  if (step === 'login') {
    return (
      <div className="max-w-md mx-auto min-h-[50vh] flex flex-col justify-center animate-fadeIn px-4">
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm animate-bounce">
             <HelpCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Login Ujian</h1>
          <p className="text-xs text-slate-500">Silakan pilih semester dan masukkan NIS.</p>
        </div>
        
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
          {/* SEMESTER SELECTION */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Semester Ujian</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full bg-slate-50 pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 appearance-none"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="0">-- Pilih Semester --</option>
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Nomor Induk Siswa</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                inputMode="numeric"
                className="w-full bg-slate-50 pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:font-normal text-slate-800"
                placeholder="Masukkan NIS..."
                value={nis}
                onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>
          <button type="submit" disabled={loadingExams} className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">
             {loadingExams ? 'Mencari...' : 'Cari Ujian'}
          </button>
        </form>
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
            <p className="text-emerald-100 text-[9px] font-bold uppercase tracking-widest">Selamat Datang</p>
            <h1 className="text-lg font-black uppercase tracking-tight">{student?.namalengkap}</h1>
            <p className="text-xs mt-0.5 opacity-90">Kelas {student?.kelas} • NIS {student.nis} • </p>
            <div className="inline-block bg-white/20 px-2 py-0.5 rounded-md mt-2">
                <p className="text-[9px] font-bold uppercase">Ujian Semester {semester}</p>
            </div>
          </div>
        </div>

        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight ml-1">Daftar Soal Tersedia</h2>
        
        <div className="space-y-3">
          {activeExams.length === 0 ? (
             <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
               <AlertTriangle className="mx-auto text-slate-200 mb-2" size={32} />
               <p className="text-slate-600 text-xs font-bold">Tidak ada soal aktif.</p>
               <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
                  Pastikan Anda memilih <b>Semester {semester}</b> dengan benar,<br/>atau hubungi guru jika soal belum dipublikasikan.
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
                   className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95"
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

  if (step === 'exam' && selectedExam) {
    return (
      <div className="max-w-3xl mx-auto min-h-screen pb-20 animate-fadeIn bg-slate-50 relative">
        {/* Sticky Timer Header */}
        <div className="sticky top-16 md:top-20 z-30 bg-white/95 backdrop-blur-xl border-b border-emerald-100 p-3 md:p-4 shadow-sm flex justify-between items-center rounded-b-2xl mb-4 mx-2 md:mx-0">
           <div>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Sisa Waktu</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-xl font-black font-mono tracking-tight leading-none ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                  {formatTime(timeLeft)}
                </p>
                <span className="text-[10px] font-bold text-slate-400">menit</span>
              </div>
           </div>
           <button 
             onClick={() => handleSubmitExam(false)}
             className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-200 active:scale-95 transition-all hover:bg-emerald-700"
           >
             Selesai
           </button>
        </div>

        <div className="space-y-6 px-3 md:px-0">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
               <div className="absolute right-0 top-0 p-4 opacity-[0.03] font-black text-9xl text-slate-800 pointer-events-none -translate-y-6 translate-x-4">
                 {idx + 1}
               </div>

               <div className="relative z-10">
                   <div className="flex gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-sm border border-emerald-100 shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        {/* Gambar Soal */}
                        {q.image_url && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 shadow-sm max-w-md bg-slate-50">
                                <img src={q.image_url} alt="Soal" className="w-full h-auto object-contain" />
                            </div>
                        )}
                        <p className="text-sm md:text-base font-bold text-slate-800 leading-relaxed">
                          {q.text}
                        </p>
                      </div>
                   </div>
                   
                   <div className="space-y-2.5 pl-0 md:pl-12">
                     {q.options?.map((opt, optIdx) => {
                       const isSelected = answers[q.id] === String(optIdx);
                       return (
                         <button
                           key={optIdx}
                           onClick={() => handleAnswer(q.id, optIdx)}
                           className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all text-xs md:text-sm flex items-start gap-3 group active:scale-[0.98] ${
                             isSelected 
                               ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' 
                               : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-slate-50'
                           }`}
                         >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-[10px] font-black shrink-0 mt-0 transition-colors ${
                                isSelected 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500'
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
          ))}
        </div>
        
        <div className="p-8 text-center pb-20">
           <p className="text-[10px] text-slate-400 italic">"Kejujuran adalah kunci kesuksesan"</p>
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
        
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Ujian Selesai!</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Nilai telah tersimpan otomatis ke Buku Nilai.</p>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl w-full space-y-2 mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nilai Kamu</p>
           <p className="text-5xl font-black text-slate-800 tracking-tighter">{score}</p>
        </div>

        <button 
          onClick={() => { setStep('login'); setNis(''); setSemester('0'); }}
          className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowRight size={16} /> Kembali ke Depan
        </button>
      </div>
    );
  }

  return null;
};

export default PublicExam;
