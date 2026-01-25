
import React, { useState, useEffect } from 'react';
import { Save, User, Award, CheckCircle2 } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, GradeLevel } from '../types';

const TeacherInputGrades: React.FC = () => {
  const [grade, setGrade] = useState<GradeLevel>('7');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [score, setScore] = useState(80);
  const [type, setType] = useState<'harian' | 'uts' | 'uas' | 'praktik'>('harian');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    db.getStudentsByGrade(grade).then(setStudents);
    setSelectedStudentId('');
  }, [grade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setStatus('saving');
    await db.addGrade({
      student_id: selectedStudentId,
      subject_type: type,
      score,
      description: desc,
      grade
    });
    
    setStatus('success');
    setTimeout(() => {
      setStatus('idle');
      setScore(80);
      setDesc('');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-amber-600 text-white p-8 rounded-3xl shadow-xl shadow-amber-900/10">
        <h1 className="text-3xl font-bold mb-2">Input Nilai Siswa</h1>
        <p className="text-amber-50">Portal administrasi untuk memasukkan hasil penilaian harian, UTS, UAS, dan ujian praktik.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tingkat Kelas</label>
              <div className="flex gap-2">
                {(['7', '8', '9'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`flex-1 py-3 rounded-xl font-bold border transition-all ${
                      grade === g ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Jenis Penilaian</label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                value={type}
                onChange={(e: any) => setType(e.target.value)}
              >
                <option value="harian">Penilaian Harian</option>
                <option value="uts">UTS (Tengah Semester)</option>
                <option value="uas">UAS (Akhir Semester)</option>
                <option value="praktik">Ujian Praktik</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Pilih Siswa</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="">-- Pilih Nama Siswa --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.nis} - {s.name} ({s.class})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nilai (0-100)</label>
              <div className="relative">
                <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  min="0" max="100" 
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Keterangan / Materi</label>
              <input 
                type="text" 
                placeholder="Misal: Bab Thaharah" 
                className="w-full p-3 rounded-xl border border-slate-200"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status !== 'idle' || !selectedStudentId}
            className={`
              w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all
              ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300'}
            `}
          >
            {status === 'saving' && 'Menyimpan...'}
            {status === 'success' && <><CheckCircle2 size={20} /> Berhasil Disimpan!</>}
            {status === 'idle' && <><Save size={20} /> Simpan Nilai</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherInputGrades;
