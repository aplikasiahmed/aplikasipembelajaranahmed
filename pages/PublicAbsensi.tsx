
import React, { useState } from 'react';
import { Search, ClipboardCheck, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, AttendanceRecord } from '../types';
import Swal from 'sweetalert2';

const PublicAbsensi: React.FC = () => {
  const [nisn, setNisn] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nisn.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Input Kosong',
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
          text: `Halo ${found.namalengkap}, data absensi Anda berhasil dimuat.`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Tidak Ditemukan',
          text: 'Nomor induk tidak terdaftar di database kami.',
          confirmButtonColor: '#059669',
        });
      }
      setLoading(false);
    }, 700);
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'hadir': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'sakit': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'izin': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-red-50 text-red-700 border-red-100';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-fadeIn px-1 md:px-0 pb-10">
      <div className="text-center space-y-1">
        <h1 className="text-lg md:text-2xl font-bold text-slate-800">Cek Absensi Siswa</h1>
        <p className="text-[10px] md:text-xs text-slate-500 font-medium">Monitoring kehadiran Anda melalui Nomor Induk.</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600 mb-1" size={18} />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total Hadir</p>
              <p className="text-lg font-black text-slate-800">{attendance.filter(a => a.status === 'hadir').length}</p>
            </div>
            <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 text-center">
              <Clock className="mx-auto text-amber-600 mb-1" size={18} />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Ketidakhadiran</p>
              <p className="text-lg font-black text-slate-800">{attendance.filter(a => a.status !== 'hadir').length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-50">
              <h3 className="text-[11px] md:text-xs font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={14} className="text-emerald-600" /> Riwayat Kehadiran Terbaru
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {attendance.length > 0 ? [...attendance].reverse().map((record) => (
                <div key={record.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-[11px] md:text-sm font-bold text-slate-800">{new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-medium">PAI & Budi Pekerti • Kelas {record.grade}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-tight border ${getStatusStyle(record.status)}`}>
                    {record.status}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400 text-[11px]">Belum ada data absensi tercatat.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicAbsensi;
