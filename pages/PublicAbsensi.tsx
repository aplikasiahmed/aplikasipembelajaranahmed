
import React, { useState } from 'react';
import { Search, Calendar, CheckCircle2, Clock, AlertCircle, UserCheck, UserMinus, Thermometer, FileText, Ban } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, AttendanceRecord } from '../types';
import Swal from 'sweetalert2';

const PublicAbsensi: React.FC = () => {
  const [nisn, setNisn] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Logika pencarian tetap sama, tidak diubah
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nisn.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Opss..',
        text: 'Silakan masukkan nomor induk Anda!',
        confirmButtonColor: '#059669',
      });
      return;
    }

    setLoading(true);
    setStudent(null);
    setAttendance([]);

    setTimeout(async () => {
      const found = await db.getStudentByNISN(nisn);
      if (found) {
        setStudent(found);
        const records = await db.getAttendanceByStudent(found.id!);
        setAttendance(records);
        
        Swal.fire({
          icon: 'success',
          title: 'Data Ditemukan',
          text: `Nama siswa terverifikasi`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Tidak Ditemukan',
          text: 'Nomor induk tidak terdaftar',
          confirmButtonColor: '#059669',
        });
      }
      setLoading(false);
    }, 700);
  };

  // Helper untuk mendapatkan inisial dan warna status
  const getStatusInitial = (status: string) => {
    switch(status) {
      case 'hadir': return { char: 'H', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
      case 'sakit': return { char: 'S', color: 'text-amber-600 bg-amber-50 border-amber-100' };
      case 'izin': return { char: 'I', color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'alfa': return { char: 'A', color: 'text-red-600 bg-red-50 border-red-100' };
      default: return { char: '?', color: 'text-slate-400 bg-slate-50 border-slate-100' };
    }
  };

  // Hitung Statistik
  const stats = {
    hadir: attendance.filter(a => a.status === 'hadir').length,
    sakit: attendance.filter(a => a.status === 'sakit').length,
    izin: attendance.filter(a => a.status === 'izin').length,
    alfa: attendance.filter(a => a.status === 'alfa').length
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-fadeIn px-1 md:px-0 pb-10">
      <div className="text-center space-y-1">
        <h1 className="text-lg md:text-2xl font-bold text-slate-800">Cek Absensi Siswa</h1>
        <p className="text-[10px] md:text-xs text-slate-500 font-medium">cek kehadiran siswa melalui Nomor Induk.</p>
      </div>

      {/* Input Pencarian - Tetap dengan background putih & font tebal */}
      <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Masukkan nomor NIS siswa" 
              className="w-full pl-9 pr-3 py-2.5 text-[11px] md:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
              value={nisn}
              onChange={(e) => setNisn(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-emerald-600 text-white px-5 md:px-7 py-2.5 rounded-xl text-[11px] md:text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
          >
            {loading ? '...' : 'Cek'}
          </button>
        </form>
      </div>

      {student && (
        <div className="space-y-4 animate-slideUp">
          {/* KARTU INFORMASI SISWA - SESUAI PERMINTAAN */}
          <div className="bg-emerald-700 text-white p-5 rounded-2xl shadow-lg flex justify-between items-center">
            <div>
              <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">Informasi Siswa</p>
              <h2 className="text-sm md:text-lg font-bold">{student.namalengkap}</h2>
              <p className="text-emerald-100 text-[10px]">Kelas {student.grade}-{student.rombel} • NIS {student.nis}</p>
            </div>
            <div className="bg-white/10 p-2 rounded-xl border border-white/20">
              <Calendar size={24} className="opacity-50" />
            </div>
          </div>

          {/* Kartu Statistik Kehadiran - 4 Kolom Sejajar */}
          <div className="grid grid-cols-4 gap-1.5 md:gap-3">
            <div className="bg-emerald-50 p-2 md:p-4 rounded-xl border border-emerald-100 text-center flex flex-col items-center justify-center">
              <UserCheck className="text-emerald-600 mb-1" size={16} />
              <p className="text-[8px] md:text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Hadir</p>
              <p className="text-xs md:text-xl font-black text-emerald-800 leading-none mt-1">{stats.hadir}</p>
            </div>
            <div className="bg-amber-50 p-2 md:p-4 rounded-xl border border-amber-100 text-center flex flex-col items-center justify-center">
              <Thermometer className="text-amber-600 mb-1" size={16} />
              <p className="text-[8px] md:text-[10px] font-bold text-amber-700 uppercase tracking-tighter">Sakit</p>
              <p className="text-xs md:text-xl font-black text-amber-800 leading-none mt-1">{stats.sakit}</p>
            </div>
            <div className="bg-blue-50 p-2 md:p-4 rounded-xl border border-blue-100 text-center flex flex-col items-center justify-center">
              <FileText className="text-blue-600 mb-1" size={16} />
              <p className="text-[8px] md:text-[10px] font-bold text-blue-700 uppercase tracking-tighter">Izin</p>
              <p className="text-xs md:text-xl font-black text-blue-800 leading-none mt-1">{stats.izin}</p>
            </div>
            <div className="bg-red-50 p-2 md:p-4 rounded-xl border border-red-100 text-center flex flex-col items-center justify-center">
              <Ban className="text-red-600 mb-1" size={16} />
              <p className="text-[8px] md:text-[10px] font-bold text-red-700 uppercase tracking-tighter">Alfa</p>
              <p className="text-xs md:text-xl font-black text-red-800 leading-none mt-1">{stats.alfa}</p>
            </div>
          </div>

          {/* Tabel Riwayat Kehadiran */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-[11px] md:text-xs font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={14} className="text-emerald-600" /> Riwayat Kehadiran (H/S/I/A)
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">No.</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Ket.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.length > 0 ? [...attendance].reverse().map((record, idx) => {
                    const statusInfo = getStatusInitial(record.status);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-[11px] md:text-sm font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[11px] md:text-sm font-bold text-slate-800">
                            {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black border ${statusInfo.color}`}>
                            {statusInfo.char}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 text-[11px]">Belum ada data absensi tercatat.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <p className="text-[9px] text-slate-400 italic text-center">
                * Keterangan: <strong>H</strong>: Hadir, <strong>S</strong>: Sakit, <strong>I</strong>: Izin, <strong>A</strong>: Alfa
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicAbsensi;
