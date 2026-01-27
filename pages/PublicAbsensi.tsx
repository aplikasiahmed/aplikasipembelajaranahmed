import React, { useState } from 'react';
import { Search, Calendar, UserCheck, Thermometer, FileText, Ban, AlertCircle } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, AttendanceRecord } from '../types';
import Swal from 'sweetalert2';

const PublicAbsensi: React.FC = () => {
  const [nisn, setNisn] = useState('');
  const [semester, setSemester] = useState('1');
  const [student, setStudent] = useState<Student | null>(null);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim()) {
      Swal.fire({ icon: 'warning', title: 'NIS Kosong', text: 'Silakan masukkan nomor NIS Anda!', confirmButtonColor: '#059669', heightAuto: false });
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const found = await db.getStudentByNISN(nisn);
      if (found) {
        setStudent(found);
        const records = await db.getAttendanceByStudent(found.id!);
        setAllAttendance(records);
        Swal.fire({ icon: 'success', title: 'Ditemukan', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' });
      } else {
        setStudent(null);
        setAllAttendance([]);
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Nomor NIS tidak terdaftar.', confirmButtonColor: '#059669', heightAuto: false });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Kesalahan', text: 'Gagal mengambil data server.', heightAuto: false });
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = allAttendance.filter(a => String(a.semester) === String(semester));

  const getStatusInitial = (status: string) => {
    switch(status.toLowerCase()) {
      case 'hadir': return { char: 'H', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
      case 'sakit': return { char: 'S', color: 'text-amber-600 bg-amber-50 border-amber-100' };
      case 'izin': return { char: 'I', color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'alfa': return { char: 'A', color: 'text-red-600 bg-red-50 border-red-100' };
      default: return { char: '?', color: 'text-slate-400 bg-slate-50 border-slate-100' };
    }
  };

  const stats = {
    hadir: filteredAttendance.filter(a => a.status.toLowerCase() === 'hadir').length,
    sakit: filteredAttendance.filter(a => a.status.toLowerCase() === 'sakit').length,
    izin: filteredAttendance.filter(a => a.status.toLowerCase() === 'izin').length,
    alfa: filteredAttendance.filter(a => a.status.toLowerCase() === 'alfa').length
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3 md:space-y-6 animate-fadeIn px-1 md:px-0 pb-10">
      <div className="text-center space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Cek Absensi Siswa</h1>
        <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-tight">Pilih Semester & masukkan NIS untuk cek absensi.</p>
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select 
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-black focus:border-emerald-500 outline-none"
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
                placeholder="Masukkan nomor NIS siswa" 
                className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-emerald-500 transition-all shadow-sm"
                value={nisn}
                onChange={(e) => setNisn(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white px-5 py-3.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-95 shadow-lg flex items-center justify-center gap-2 transition-all">
            {loading ? 'Mencari...' : <><Search size={14} /> CARI DATA ABSENSI</>}
          </button>
        </form>
      </div>

      {hasSearched && student && (
        <div className="space-y-3 md:space-y-4 animate-slideUp">
          <div className="bg-emerald-700 text-white p-4 md:p-5 rounded-[2rem] shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="space-y-0.5 relative z-10">
              <p className="text-emerald-200 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Info Siswa • Semester {semester}</p>
              <h2 className="text-sm md:text-lg font-black uppercase tracking-tight leading-tight">{student.namalengkap}</h2>
              <p className="text-emerald-100 text-[9px] md:text-[10px] font-medium">Kelas {student.kelas} • NIS {student.nis}</p>
            </div>
            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20 ml-2 backdrop-blur-sm z-10">
              <Calendar size={24} className="opacity-70" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <div className="bg-emerald-50 p-2 md:p-3 rounded-2xl border border-emerald-100 text-center">
              <UserCheck className="text-emerald-600 mx-auto mb-1" size={16} />
              <p className="text-[7px] md:text-[9px] font-black text-emerald-700 uppercase">Hadir</p>
              <p className="text-xs md:text-xl font-black text-emerald-800">{stats.hadir}</p>
            </div>
            <div className="bg-amber-50 p-2 md:p-3 rounded-2xl border border-amber-100 text-center">
              <Thermometer className="text-amber-600 mx-auto mb-1" size={16} />
              <p className="text-[7px] md:text-[9px] font-black text-amber-700 uppercase">Sakit</p>
              <p className="text-xs md:text-xl font-black text-amber-800">{stats.sakit}</p>
            </div>
            <div className="bg-blue-50 p-2 md:p-3 rounded-2xl border border-blue-100 text-center">
              <FileText className="text-blue-600 mx-auto mb-1" size={16} />
              <p className="text-[7px] md:text-[9px] font-black text-blue-700 uppercase">Izin</p>
              <p className="text-xs md:text-xl font-black text-blue-800">{stats.izin}</p>
            </div>
            <div className="bg-red-50 p-2 md:p-3 rounded-2xl border border-red-100 text-center">
              <Ban className="text-red-600 mx-auto mb-1" size={16} />
              <p className="text-[7px] md:text-[9px] font-black text-red-700 uppercase">Alfa</p>
              <p className="text-xs md:text-xl font-black text-red-800">{stats.alfa}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            {filteredAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">No.</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Ket.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendance.map((record, idx) => {
                      const statusInfo = getStatusInitial(record.status);
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-[10px] md:text-xs font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 text-[11px] md:text-sm font-bold text-slate-800 uppercase">
                            {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg text-[10px] font-black border ${statusInfo.color}`}>
                              {statusInfo.char}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-slate-800 font-black text-sm uppercase tracking-tight">Data belum tersedia</p>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">Belum ada rincian kehadiran untuk Semester {semester}.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicAbsensi;