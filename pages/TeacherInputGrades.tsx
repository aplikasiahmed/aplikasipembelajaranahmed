import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, Award, CheckCircle2, ArrowLeft, Users, Search, Calendar } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, GradeLevel } from '../types';
import Swal from 'sweetalert2';

const TeacherInputGrades: React.FC = () => {
  const navigate = useNavigate();
  const [grade, setGrade] = useState<GradeLevel>('7');
  const [semester, setSemester] = useState(''); // Default kosong untuk "Pilih Semester"
  const [selectedKelas, setSelectedKelas] = useState('');
  const [availableKelas, setAvailableKelas] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // State untuk Data Nilai (Tanggal Manual)
  const [date, setDate] = useState(''); 
  const [score, setScore] = useState<string>(''); // REVISI: Default string kosong agar tidak ada angka 0
  const [type, setType] = useState(''); // Default kosong untuk "Pilih Tugas"
  const [desc, setDesc] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Load Kelas berdasarkan Jenjang
  useEffect(() => {
    db.getAvailableKelas(grade).then((data: string[]) => {
      setAvailableKelas(data);
      setSelectedKelas(data[0] || '');
    });
  }, [grade]);

  // Load Siswa berdasarkan Kelas
  useEffect(() => {
    if (selectedKelas) {
      db.getStudentsByKelas(selectedKelas).then(setStudents);
      setSelectedStudentId('');
    } else {
      setStudents([]);
    }
  }, [selectedKelas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validasi Kolom Kosong menggunakan SweetAlert2
    // REVISI: Cek score === ''
    if (!selectedStudentId || !date || !semester || !type || !selectedKelas || score === '' || !desc.trim()) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Perhatian', 
        text: 'Kolom kosong wajib di isi!', 
        heightAuto: false 
      });
      return;
    }

    // Ambil nama siswa untuk konfirmasi
    const selectedStudentName = students.find(s => s.id === selectedStudentId)?.namalengkap || '-';

    // 2 & 3. Konfirmasi Sebelum Kirim (Detail & Responsif)
    const result = await Swal.fire({
      title: 'Konfirmasi Kirim Nilai',
      html: `
        <div style="text-align: left; font-size: 0.9em; line-height: 1.5; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <p><strong>Nama:</strong> ${selectedStudentName}</p>
          <p><strong>Kelas:</strong> ${selectedKelas}</p>
          <p><strong>Semester:</strong> ${semester === '1' ? '1 (Ganjil)' : '2 (Genap)'}</p>
          <hr style="margin: 8px 0; border-top: 1px dashed #cbd5e1;">
          <p><strong>Jenis Tugas:</strong> <span style="text-transform: capitalize;">${type}</span></p>
          <p><strong>Nilai:</strong> <span style="color: #059669; font-weight: bold;">${score}</span></p>
          <p><strong>Materi/Ket:</strong> ${desc || '-'}</p>
        </div>
        <p style="margin-top: 10px; font-size: 0.8em; color: #64748b;">Pastikan data sudah benar sebelum dikirim.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Kirim Nilai',
      cancelButtonText: 'Batal',
      heightAuto: false,
      customClass: {
        popup: 'rounded-2xl'
      }
    });

    if (!result.isConfirmed) return;

    setStatus('saving');
    try {
      await db.addGrade({ 
        student_id: selectedStudentId, 
        subject_type: type as 'harian' | 'uts' | 'uas' | 'praktik', 
        score: parseInt(score), // REVISI: Convert string to number saat kirim ke DB
        description: desc, 
        kelas: selectedKelas, 
        semester,
        created_at: new Date(date).toISOString() 
      });
      
      setStatus('success');
      
      setTimeout(() => { 
        setStatus('idle'); 
        setScore(''); // REVISI: Reset ke string kosong
        setDesc(''); 
        setType(''); 
        setSemester(''); 
        setSelectedStudentId('');
      }, 2000);

      Swal.fire({ icon: 'success', title: 'Nilai Berhasil Disimpan', timer: 1500, showConfirmButton: false, heightAuto: false });
    } catch (err: any) {
      setStatus('idle');
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem.', heightAuto: false });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-2 md:space-y-6 animate-fadeIn pb-10 px-1 md:px-0">
      <button onClick={() => navigate('/guru')} className="md:hidden flex items-center gap-1.5 text-slate-800 text-[10px] font-black uppercase tracking-tight py-2 mb-1"><ArrowLeft size={14} /> Kembali ke Dashboard</button>
      <div className="bg-emerald-700 text-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-lg">
        <h1 className="text-base md:text-2xl font-black leading-tight uppercase tracking-tighter">Input Nilai PAI</h1>
        <p className="text-emerald-50 text-[9px] md:text-sm mt-0.5 opacity-90">Simpan nilai siswa secara manual.</p>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6">
          {/* Baris 1: Jenjang & Tanggal */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Jenjang</label>
              <div className="flex gap-1">
                {(['7', '8', '9'] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setGrade(g)} className={`flex-1 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-sm font-black border transition-all ${grade === g ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full p-1.5 md:p-2 rounded-lg border border-slate-200 bg-white text-[10px] md:text-sm font-black outline-none focus:border-emerald-500 cursor-pointer text-slate-600 placeholder:text-slate-300" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  placeholder="pilih tanggal"
                />
              </div>
            </div>
          </div>

          {/* Baris 2: Kelas & Semester */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kelas</label>
              <select className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[9px] md:text-sm font-black outline-none" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
                <option value="">-- Pilih Kelas --</option>
                {availableKelas.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
              <select className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[9px] md:text-sm font-black outline-none" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="">-- Pilih Semester --</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
          </div>

          {/* Nama Siswa */}
          <div className="space-y-1">
            <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Siswa</label>
            <select 
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-[10px] md:text-sm font-black outline-none" 
              value={selectedStudentId} 
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map(s => <option key={s.id} value={s.id!}>{s.namalengkap}</option>)}
            </select>
          </div>

          {/* Baris 3: Tipe, Nilai, Materi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Tugas</label>
              <select className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[9px] md:text-sm font-black outline-none" value={type} onChange={(e: any) => setType(e.target.value)}>
                <option value="">-- Pilih Tugas --</option>
                <option value="harian">Harian</option>
                <option value="uts">UTS</option>
                <option value="uas">UAS</option>
                <option value="praktik">Praktik</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">NILAI (0-100)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                placeholder="0"
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] md:text-sm font-black outline-none" 
                value={score} 
                onChange={(e) => {
                  const val = e.target.value;
                  // REVISI LOGIKA INPUT NILAI:
                  // 1. Jika kosong, set string kosong (biar placeholder muncul dan tidak ada 0)
                  // 2. Jika diisi, parse int lalu kembalikan ke string (otomatis hilangkan 0 di depan misal "08" jadi "8")
                  if (val === '') {
                    setScore('');
                  } else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num >= 0 && num <= 100) {
                      setScore(num.toString());
                    }
                  }
                }} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ket / Materi</label>
              <input 
                type="text" 
                placeholder="Bab/Tugas (min: -)" 
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[10px] md:text-sm font-medium outline-none" 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)} 
              />
            </div>
          </div>

          <button type="submit" disabled={status !== 'idle'} className={`w-full py-3 md:py-4 rounded-xl text-[10px] md:text-sm font-black flex items-center justify-center gap-2 shadow-lg uppercase tracking-widest ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-slate-200'}`}>
            {status === 'saving' ? 'Menyimpan...' : status === 'success' ? <><CheckCircle2 size={16} /> Berhasil!</> : <><Save size={16} /> Simpan Nilai</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherInputGrades;