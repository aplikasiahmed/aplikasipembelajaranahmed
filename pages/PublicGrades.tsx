
import React, { useState } from 'react';
import { Search, Award, BookOpen } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, GradeRecord } from '../types';
import Swal from 'sweetalert2';

const PublicGrades: React.FC = () => {
  const [nis, setNis] = useState('');
  const [semester, setSemester] = useState('1');
  const [student, setStudent] = useState<Student | null>(null);
  const [allGrades, setAllGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim()) {
      Swal.fire({ icon: 'warning', title: 'Opss..', text: 'Silakan masukkan nomor NIS Anda!', confirmButtonColor: '#059669' });
      return;
    }

    setLoading(true);
    const found = await db.getStudentByNIS(nis);
    if (found) {
      setStudent(found);
      const studentGrades = await db.getGradesByStudent(found.id!);
      setAllGrades(studentGrades);
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: 'Siswa Terverifikasi' });
    } else {
      setStudent(null);
      setAllGrades([]);
      Swal.fire({ icon: 'error', title: 'Opss...', text: 'Nomor NIS tidak terdaftar.', confirmButtonColor: '#059669' });
    }
    setLoading(false);
  };

  const filteredGrades = allGrades.filter(g => g.semester === semester);

  return (
    <div className="max-w-2xl mx-auto space-y-3 md:space-y-6 animate-fadeIn pb-10">
      <div className="text-center space-y-0.5 md:space-y-1">
        <h1 className="text-base md:text-2xl font-bold text-slate-800">Cek Nilai Siswa</h1>
        <p className="text-[9px] md:text-xs text-slate-500 font-medium tracking-tighter md:tracking-normal">Pilih semester & masukkan NIS untuk melihat penilaian.</p>
      </div>

      <div className="bg-white p-2.5 md:p-5 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="space-y-2 md:space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-2">
            <select 
              className="w-full px-3 py-2 text-[10px] md:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-emerald-500 outline-none transition-all"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
            
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Masukkan nomor NIS siswa" 
                className="w-full pl-9 pr-3 py-2 text-[11px] md:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:border-emerald-500 outline-none shadow-sm transition-all"
                value={nis}
                onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
            {loading ? 'Mencari...' : <><Search size={13} /> Cek Nilai</>}
          </button>
        </form>
      </div>

      {student && (
        <div className="space-y-3 md:space-y-4 animate-slideUp">
          <div className="bg-emerald-700 text-white p-3.5 md:p-5 rounded-2xl shadow-lg flex justify-between items-center">
            <div className="space-y-0.5">
              <p className="text-emerald-200 text-[8px] md:text-[10px] font-bold uppercase tracking-wider">Info Siswa • Semester {semester}</p>
              <h2 className="text-xs md:text-lg font-bold leading-tight">{student.namalengkap}</h2>
              <p className="text-emerald-100 text-[9px] md:text-[10px] font-medium">Kelas {student.kelas} • NIS {student.nis} | {student.jeniskelamin}</p>
            </div>
            <div className="bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-white/20 text-center shrink-0 ml-2">
              <p className="text-[7px] md:text-[9px] uppercase font-bold opacity-80">Rata-rata</p>
              <p className="text-sm md:text-xl font-black">
                {filteredGrades.length > 0 ? (filteredGrades.reduce((a, b) => a + b.score, 0) / filteredGrades.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {filteredGrades.length > 0 ? (
              <table className="w-full text-[10px] md:text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2 md:px-4 md:py-3 font-bold text-slate-500">Penilaian</th>
                    <th className="px-2 py-2 md:px-3 md:py-3 font-bold text-slate-500 text-center">Nilai</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 font-bold text-slate-500">Ket.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGrades.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-bold text-slate-700 capitalize">{g.subject_type}</td>
                      <td className="px-2 py-2 md:px-3 md:py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-lg font-black ${g.score >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {g.score}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-slate-500 italic truncate max-w-[80px] md:max-w-none">{g.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 md:p-10 text-center space-y-2 md:space-y-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <BookOpen size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-slate-800 font-bold text-xs md:text-sm">Data belum tersedia</p>
                  <p className="text-slate-400 text-[9px] md:text-[10px]">Belum ada nilai di Semester {semester}.</p>
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
