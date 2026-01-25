
import React, { useState, useEffect } from 'react';
import { Save, Users, Calendar, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { Student, GradeLevel } from '../types';
import Swal from 'sweetalert2';

const TeacherInputAbsensi: React.FC = () => {
  const [grade, setGrade] = useState<GradeLevel>('7');
  const [rombel, setRombel] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ambil daftar rombel unik berdasarkan grade
  const [availableRombels, setAvailableRombels] = useState<string[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const allStudents = await db.getStudentsByGrade(grade);
      
      // Ambil rombel unik
      const uniqueRombels = Array.from(new Set(allStudents.map(s => s.rombel))).sort();
      setAvailableRombels(uniqueRombels);
      
      // Filter berdasarkan rombel jika dipilih
      const filtered = rombel 
        ? allStudents.filter(s => s.rombel === rombel)
        : allStudents;
        
      setStudents(filtered);
      
      // Reset attendance data dengan default 'hadir'
      const initial: Record<string, string> = {};
      filtered.forEach(s => {
        initial[s.id!] = 'hadir';
      });
      setAttendanceData(initial);
      setLoading(false);
    };

    fetchStudents();
  }, [grade, rombel]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (students.length === 0) return;

    const result = await Swal.fire({
      title: 'Simpan Absensi?',
      text: `Menyimpan data kehadiran untuk ${students.length} siswa tanggal ${date}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      confirmButtonText: 'Ya, Simpan'
    });

    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id: s.id!,
        status: attendanceData[s.id!] as any,
        date: date,
        grade: grade
      }));

      await db.addAttendance(records);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data absensi telah disimpan ke database.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Terjadi kesalahan saat menyimpan data.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20">
      <div className="bg-amber-600 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-amber-900/10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Input Absensi Harian</h1>
        <p className="text-amber-50 text-sm">Kelola kehadiran siswa secara kolektif per kelas.</p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Pilih Grade</label>
            <div className="flex gap-1">
              {(['7', '8', '9'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => {setGrade(g); setRombel('');}}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${grade === g ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Pilih Rombel</label>
            <select 
              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              value={rombel}
              onChange={(e) => setRombel(e.target.value)}
            >
              <option value="">Semua Rombel</option>
              {availableRombels.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tanggal Absen</label>
            <input 
              type="date"
              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Student List Section */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Users size={14} className="text-amber-600" /> Daftar Siswa ({students.length})
            </h3>
            {loading && <Loader2 size={14} className="animate-spin text-amber-600" />}
          </div>

          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {students.length > 0 ? students.map((s, idx) => (
              <div key={s.id} className="p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-slate-800">{s.namalengkap}</p>
                    <p className="text-[10px] text-slate-400">NIS: {s.nis} • Rombel: {s.rombel}</p>
                  </div>
                </div>

                <div className="flex gap-1 md:gap-2">
                  {[
                    { val: 'hadir', label: 'H', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 active:bg-emerald-600' },
                    { val: 'sakit', label: 'S', color: 'bg-amber-50 text-amber-600 border-amber-200 active:bg-amber-600' },
                    { val: 'izin', label: 'I', color: 'bg-blue-50 text-blue-600 border-blue-200 active:bg-blue-600' },
                    { val: 'alfa', label: 'A', color: 'bg-red-50 text-red-600 border-red-200 active:bg-red-600' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => handleStatusChange(s.id!, opt.val)}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-xl text-[10px] md:text-xs font-black border transition-all flex items-center justify-center ${
                        attendanceData[s.id!] === opt.val 
                        ? opt.val === 'hadir' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' :
                          opt.val === 'sakit' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' :
                          opt.val === 'izin' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' :
                          'bg-red-600 text-white border-red-600 shadow-sm'
                        : `bg-white text-slate-400 border-slate-100 hover:border-slate-300`
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )) : (
              <div className="p-10 text-center space-y-2">
                <AlertCircle className="mx-auto text-slate-300" size={32} />
                <p className="text-slate-500 text-xs">Siswa tidak ditemukan untuk filter ini.</p>
                <p className="text-slate-400 text-[10px]">Pastikan Anda sudah mengimport data siswa di halaman Laporan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={students.length === 0 || saving}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              students.length > 0 
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 active:scale-95' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <><Loader2 size={20} className="animate-spin" /> Menyimpan...</>
            ) : (
              <><Save size={20} /> Simpan Semua Kehadiran</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherInputAbsensi;
