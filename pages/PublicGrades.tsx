
import React, { useState } from 'react';
import { Search, Award } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, GradeRecord } from '../types';
import Swal from 'sweetalert2';

const PublicGrades: React.FC = () => {
  const [nis, setNis] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim()) {
      Swal.fire({ icon: 'warning', title: 'Opss..', text: 'Silakan masukkan nomor induk Anda!', confirmButtonColor: '#059669' });
      return;
    }

    setLoading(true);
    const found = await db.getStudentByNIS(nis);
    if (found) {
      setStudent(found);
      const studentGrades = await db.getGradesByStudent(found.id!);
      setGrades(studentGrades);
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: 'Data Ditemukan' });
    } else {
      Swal.fire({ icon: 'error', title: 'Opss...', text: 'NIS tidak terdaftar.', confirmButtonColor: '#059669' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-fadeIn pb-10">
      <div className="text-center space-y-1">
        <h1 className="text-lg md:text-2xl font-bold text-slate-800">Cek Nilai Siswa</h1>
        <p className="text-[10px] md:text-xs text-slate-500 font-medium">cek penilaian melalui NIS.</p>
      </div>

      <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Masukkan nomor NIS Anda" 
              className="w-full pl-9 pr-3 py-2.5 text-[11px] md:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-emerald-500 outline-none shadow-sm transition-all"
              value={nis}
              onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
          <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20">
            {loading ? '...' : 'Cari'}
          </button>
        </form>
      </div>

      {student && (
        <div className="space-y-4 animate-slideUp">
          <div className="bg-emerald-700 text-white p-5 rounded-2xl shadow-lg flex justify-between items-center">
            <div>
              <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">Informasi Siswa</p>
              <h2 className="text-sm md:text-lg font-bold">{student.namalengkap}</h2>
              <p className="text-emerald-100 text-[10px]">Kelas {student.grade}-{student.rombel} • NIS {student.nis}</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-center">
              <p className="text-[9px] uppercase font-bold opacity-80">Rata-rata</p>
              <p className="text-xl font-black">
                {grades.length > 0 ? (grades.reduce((a, b) => a + b.score, 0) / grades.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-[11px] md:text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500">Penilaian</th>
                  <th className="px-3 py-3 font-bold text-slate-500 text-center">Nilai</th>
                  <th className="px-4 py-3 font-bold text-slate-500">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-700 capitalize">{g.subject_type}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-lg font-black ${g.score >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {g.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 italic">{g.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicGrades;
