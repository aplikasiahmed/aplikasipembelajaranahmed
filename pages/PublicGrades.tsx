import React, { useState } from 'react';
import { Search, Award, AlertCircle, BookOpen } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, GradeRecord } from '../types';
import Swal from 'sweetalert2';

const PublicGrades: React.FC = () => {
  const [nis, setNis] = useState('');
  const [semester, setSemester] = useState('1');
  const [student, setStudent] = useState<Student | null>(null);
  const [allGrades, setAllGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim()) {
      Swal.fire({ icon: 'warning', title: 'NIS Kosong', text: 'Silakan masukkan nomor NIS Anda!', confirmButtonColor: '#059669', heightAuto: false });
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const found = await db.getStudentByNIS(nis);
      if (found) {
        setStudent(found);
        const studentGrades = await db.getGradesByStudent(found.id!);
        setAllGrades(studentGrades);
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, icon: 'success', title: 'Siswa Ditemukan' });
      } else {
        setStudent(null);
        setAllGrades([]);
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Nomor NIS tidak terdaftar.', confirmButtonColor: '#059669', heightAuto: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrades = allGrades.filter(g => String(g.semester) === String(semester));

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-fadeIn pb-10 px-1 md:px-0">
      <div className="text-center space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Cek Nilai Siswa</h1>
        <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-tight">Pilih Semester & masukkan NIS untuk melihat laporan nilai.</p>
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select 
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-black outline-none focus:ring-2 focus:ring-emerald-500/10"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
            
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Masukkan nomor NIS siswa" 
                className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
                value={nis}
                onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white px-5 py-3.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-emerald-800 active:scale-95 shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all">
            {loading ? 'Mencari...' : <><Search size={14} /> CARI DATA NILAI</>}
          </button>
        </form>
      </div>

      {hasSearched && student && (
        <div className="space-y-4 animate-slideUp">
          <div className="bg-emerald-700 text-white p-5 rounded-[2rem] shadow-lg flex justify-between items-center relative overflow-hidden">
             <div className="absolute right-[-10%] top-[-20%] opacity-10 pointer-events-none">
              <Award size={120} />
            </div>
            <div className="space-y-1 relative z-10">
              <p className="text-emerald-200 text-[8px] font-bold uppercase tracking-widest">HASIL PENCARIAN • SEMESTER {semester}</p>
              <h2 className="text-sm md:text-xl font-black leading-tight uppercase tracking-tight">{student.namalengkap}</h2>
              <p className="text-emerald-100 text-[10px] font-medium">Kelas {student.kelas} • NIS {student.nis}</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center shrink-0 ml-2 backdrop-blur-sm relative z-10">
              <p className="text-[8px] uppercase font-black opacity-80 mb-0.5">Rata-rata</p>
              <p className="text-lg md:text-2xl font-black">
                {filteredGrades.length > 0 ? (filteredGrades.reduce((a, b) => a + b.score, 0) / filteredGrades.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            {filteredGrades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Penilaian</th>
                      <th className="px-3 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center">Nilai</th>
                      <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Materi / Ket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGrades.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-black text-slate-700 uppercase tracking-tight">{g.subject_type.toUpperCase()}</td>
                        <td className="px-3 py-4 text-center">
                          <span className={`px-3 py-1 rounded-xl font-black text-sm ${g.score >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {g.score}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 italic font-medium">{g.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-slate-800 font-black text-sm uppercase tracking-tight">Data belum tersedia</p>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">Guru belum menginput nilai untuk Semester {semester}.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicGrades;