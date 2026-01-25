
import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, GradeRecord } from '../types';

const PublicGrades: React.FC = () => {
  const [nis, setNis] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStudent(null);
    setGrades([]);

    const found = await db.getStudentByNIS(nis);
    if (found) {
      setStudent(found);
      const studentGrades = await db.getGradesByStudent(found.id);
      setGrades(studentGrades);
    } else {
      setError('Siswa dengan NIS tersebut tidak ditemukan.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Cek Nilai Siswa</h1>
        <p className="text-xs text-slate-500">Masukkan Nomor Induk Siswa (NIS) Anda.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Contoh: 1001" 
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 border border-red-100 text-xs">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {student && (
        <div className="space-y-4 animate-slideUp">
          <div className="bg-emerald-600 text-white p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-3">
            <div>
              <p className="text-emerald-100 text-[10px] font-medium uppercase tracking-wider">Data Siswa</p>
              <h2 className="text-lg font-bold">{student.name}</h2>
              <p className="text-emerald-200 text-xs">Kelas {student.class} | NIS: {student.nis}</p>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md">
              <span className="text-[10px] uppercase">Rata-rata: </span>
              <span className="text-lg font-bold">
                {grades.length > 0 ? (grades.reduce((a, b) => a + b.score, 0) / grades.length).toFixed(1) : '0'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-widest">Kategori</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-widest text-center">Nilai</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-widest">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.length > 0 ? grades.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 capitalize">{g.subject_type}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${g.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {g.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 line-clamp-1">{g.description}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">Belum ada data nilai.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicGrades;
