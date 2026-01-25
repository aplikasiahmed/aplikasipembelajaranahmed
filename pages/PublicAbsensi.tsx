
import React, { useState } from 'react';
import { Search, Calendar, CheckCircle2, Clock, AlertCircle, UserCheck, UserMinus, Thermometer, FileText, Ban } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, AttendanceRecord } from '../types';
import Swal from 'sweetalert2';

const PublicAbsensi: React.FC = () => {
  const [nisn, setNisn] = useState('');
  const [semester, setSemester] = useState('1');
  const [student, setStudent] = useState<Student | null>(null);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nisn.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Opss..',
        text: 'Silakan masukkan nomor NIS Anda!',
        confirmButtonColor: '#059669',
      });
      return;
    }

    setLoading(true);
    setStudent(null);
    setAllAttendance([]);

    setTimeout(async () => {
      const found = await db.getStudentByNISN(nisn);
      if (found) {
        setStudent(found);
        const records = await db.getAttendanceByStudent(found.id!);
        setAllAttendance(records);
        
        Swal.fire({
          icon: 'success',
          title: 'Siswa Terverifikasi',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Opss...',
          text: 'Nomor NIS tidak terdaftar',
          confirmButtonColor: '#059669',
        });
      }
      setLoading(false);
    }, 700);
  };

  const filteredAttendance = allAttendance.filter(a => a.semester === semester);

  const getStatusInitial = (status: string) => {
    switch(status) {
      case 'hadir': return { char: 'H', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
      case 'sakit': return { char: 'S', color: 'text-amber-600 bg-amber-50 border-amber-100' };
      case 'izin': return { char: 'I', color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'alfa': return { char: 'A', color: 'text-red-600 bg-red-50 border-red-100' };
      default: return { char: '?', color: 'text-slate-400 bg-slate-50 border-slate-100' };
    }
  };

  const stats = {
    hadir: filteredAttendance.filter(a => a.status === 'hadir').length,
    sakit: filteredAttendance.filter(a => a.status === 'sakit').length,
    izin: filteredAttendance.filter(a => a.status === 'izin').length,
    alfa: filteredAttendance.filter(a => a.status === 'alfa').length
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3 md:space-y-6 animate-fadeIn px-1 md:px-0 pb-10">
      <div className="text-center space-y-0.5 md:space-y-1">
        <h1 className="text-base md:text-2xl font-bold text-slate-800">Cek Absensi Siswa</h1>
        <p className="text-[9px] md:text-xs text-slate-500 font-medium tracking-tighter md:tracking-normal">Pilih semester & masukkan NIS untuk mengecek absensi.</p>
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
                className="w-full pl-9 pr-3 py-2 text-[11px] md:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                value={nisn}
                onChange={(e) => setNisn(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white px-5 md:px-7 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
          >
            {loading ? 'Mencari...' : <><Search size={13} /> Cek Absensi</>}
          </button>
        </form>
      </div>

      {student && (
        <div className="space-y-3 md:space-y-4 animate-slideUp">
          <div className="bg-emerald-700 text-white p-3.5 md:p-5 rounded-2xl shadow-lg flex justify-between items-center">
            <div className="space-y-0.5">
              <p className="text-emerald-200 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Info Siswa • Semester {semester}</p>
              <h2 className="text-xs md:text-lg font-bold leading-tight">{student.namalengkap}</h2>
              <p className="text-emerald-100 text-[9px] md:text-[10px]">Kelas {student.grade}-{student.rombel} • NIS {student.nis}</p>
            </div>
            <div className="bg-white/10 p-1.5 md:p-2 rounded-xl border border-white/20 ml-2">
              <Calendar size={20} className="opacity-50 md:w-6 md:h-6" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 md:gap-3">
            <div className="bg-emerald-50 p-1.5 md:p-4 rounded-xl border border-emerald-100 text-center">
              <UserCheck className="text-emerald-600 mx-auto mb-0.5 md:mb-1" size={14} />
              <p className="text-[7px] md:text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Hadir</p>
              <p className="text-[11px] md:text-xl font-black text-emerald-800 leading-none mt-0.5">{stats.hadir}</p>
            </div>
            <div className="bg-amber-50 p-1.5 md:p-4 rounded-xl border border-amber-100 text-center">
              <Thermometer className="text-amber-600 mx-auto mb-0.5 md:mb-1" size={14} />
              <p className="text-[7px] md:text-[10px] font-black text-amber-700 uppercase tracking-tighter">Sakit</p>
              <p className="text-[11px] md:text-xl font-black text-amber-800 leading-none mt-0.5">{stats.sakit}</p>
            </div>
            <div className="bg-blue-50 p-1.5 md:p-4 rounded-xl border border-blue-100 text-center">
              <FileText className="text-blue-600 mx-auto mb-0.5 md:mb-1" size={14} />
              <p className="text-[7px] md:text-[10px] font-black text-blue-700 uppercase tracking-tighter">Izin</p>
              <p className="text-[11px] md:text-xl font-black text-blue-800 leading-none mt-0.5">{stats.izin}</p>
            </div>
            <div className="bg-red-50 p-1.5 md:p-4 rounded-xl border border-red-100 text-center">
              <Ban className="text-red-600 mx-auto mb-0.5 md:mb-1" size={14} />
              <p className="text-[7px] md:text-[10px] font-black text-red-700 uppercase tracking-tighter">Alfa</p>
              <p className="text-[11px] md:text-xl font-black text-red-800 leading-none mt-0.5">{stats.alfa}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-3 py-2 md:p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-[10px] md:text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <Calendar size={12} className="text-emerald-600" /> Riwayat Kehadiran Semester {semester}
              </h3>
            </div>
            
            {filteredAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase">No.</th>
                      <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase">Tanggal</th>
                      <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase text-center">Ket.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...filteredAttendance].reverse().map((record, idx) => {
                      const statusInfo = getStatusInitial(record.status);
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-1.5 md:py-3 text-[10px] md:text-sm font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-1.5 md:py-3">
                            <p className="text-[10px] md:text-sm font-bold text-slate-800 leading-tight">
                              {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                          </td>
                          <td className="px-3 py-1.5 md:py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg text-[10px] font-black border ${statusInfo.color}`}>
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
              <div className="p-8 md:p-10 text-center space-y-2">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-slate-800 font-bold text-xs">Data belum tersedia</p>
                  <p className="text-slate-400 text-[9px]">Belum ada absensi untuk Semester {semester}.</p>
                </div>
              </div>
            )}
            
            <div className="p-2 bg-slate-50 border-t border-slate-100">
              <p className="text-[8px] text-slate-400 italic text-center leading-none">
                * <strong>H</strong>adir, <strong>S</strong>akit, <strong>I</strong>zin, <strong>A</strong>lfa
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicAbsensi;
