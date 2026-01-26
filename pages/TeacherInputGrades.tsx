
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, Award, CheckCircle2, ArrowLeft, Users, Search } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, GradeLevel } from '../types';
import Swal from 'sweetalert2';

const TeacherInputGrades: React.FC = () => {
  const navigate = useNavigate();
  const [grade, setGrade] = useState<GradeLevel>('7');
  const [semester, setSemester] = useState('1');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [availableKelas, setAvailableKelas] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [score, setScore] = useState(80);
  const [type, setType] = useState<'harian' | 'uts' | 'uas' | 'praktik'>('harian');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Fix: Explicitly type the data returned from the service call to resolve 'unknown[]' error
  useEffect(() => {
    db.getAvailableKelas(grade).then((data: string[]) => {
      setAvailableKelas(data);
      setSelectedKelas(data[0] || '');
    });
  }, [grade]);

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
    if (!selectedStudentId) return;
    setStatus('saving');
    try {
      await db.addGrade({ student_id: selectedStudentId, subject_type: type, score, description: desc, kelas: selectedKelas, semester });
      setStatus('success');
      setTimeout(() => { setStatus('idle'); setScore(80); setDesc(''); }, 2000);
      Swal.fire({ icon: 'success', title: 'Nilai Disimpan', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      setStatus('idle');
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-2 md:space-y-6 animate-fadeIn pb-10 px-1 md:px-0">
      <button onClick={() => navigate('/guru')} className="md:hidden flex items-center gap-1.5 text-slate-800 text-[10px] font-black uppercase tracking-tight py-2 mb-1"><ArrowLeft size={14} /> Kembali ke Dashboard</button>
      <div className="bg-emerald-700 text-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-lg">
        <h1 className="text-base md:text-2xl font-black leading-tight uppercase tracking-tighter">Input Nilai PAI</h1>
        <p className="text-emerald-50 text-[9px] md:text-sm mt-0.5 opacity-90">Simpan nilai sesuai tugasnya.</p>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6">
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
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
              <select className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[9px] md:text-sm font-black outline-none" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="1">Semester 1</option><option value="2">Semester 2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kelas</label>
              <select className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[9px] md:text-sm font-black outline-none" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
                <option value="">-- Pilih Kelas --</option>
                {availableKelas.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Penilaian</label>
              <select className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[9px] md:text-sm font-black outline-none" value={type} onChange={(e: any) => setType(e.target.value)}>
                <option value="harian">Harian</option><option value="uts">UTS</option><option value="uas">UAS</option><option value="praktik">Praktik</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Siswa</label>
            <select className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-[10px] md:text-sm font-black outline-none" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} required>
              <option value="">-- Pilih Siswa --</option>
              {students.map(s => <option key={s.id} value={s.id!}>{s.namalengkap}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Skor</label>
              <input type="number" min="0" max="100" className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] md:text-sm font-black outline-none" value={score} onChange={(e) => setScore(parseInt(e.target.value))} required />
            </div>
            <div className="space-y-1"><label className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Materi</label>
              <input type="text" placeholder="Bab/Tugas" className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[10px] md:text-sm font-medium outline-none" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={status !== 'idle' || !selectedStudentId} className={`w-full py-3 md:py-4 rounded-xl text-[10px] md:text-sm font-black flex items-center justify-center gap-2 shadow-lg uppercase tracking-widest ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200'}`}>
            {status === 'saving' ? 'Menyimpan...' : status === 'success' ? <><CheckCircle2 size={16} /> Berhasil!</> : <><Save size={16} /> Simpan Nilai</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherInputGrades;
