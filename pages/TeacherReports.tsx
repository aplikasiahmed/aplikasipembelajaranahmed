
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  FileText, 
  Trash2, 
  ArrowLeft, 
  Database, 
  FileDown, 
  ShieldAlert, 
  Upload,
  Info,
  FileUp,
  AlertTriangle
} from 'lucide-react';
import { db, supabase } from '../services/supabaseMock';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

// Import Utils
import { generateExcel } from '../utils/excelGenerator';
import { generatePDFReport } from '../utils/pdfGenerator';
import { formatBulan } from '../utils/format';

const TeacherReports: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availKelas, setAvailKelas] = useState<string[]>([]);
  
  // States Konfigurasi - Default Kosong untuk Memaksa Pilihan User
  const [kelasNilai, setKelasNilai] = useState('');
  const [semNilai, setSemNilai] = useState('');
  const [kelasAbsen, setKelasAbsen] = useState('');
  const [semAbsen, setSemAbsen] = useState('');
  const [monthAbsen, setMonthAbsen] = useState('');
  const [yearAbsen, setYearAbsen] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchAllKelas();
  }, []);

  // LOGIKA DINAMIS: Bulan ke Semester
  // Berjalan hanya jika bulan dipilih
  useEffect(() => {
    if (!monthAbsen) {
      setSemAbsen('');
      return;
    }
    const m = parseInt(monthAbsen);
    if (m >= 7 && m <= 12) {
      setSemAbsen('1');
    } else {
      setSemAbsen('2');
    }
  }, [monthAbsen]);

  const fetchAllKelas = async () => {
    const { data } = await supabase.from('data_siswa').select('kelas');
    if (data) {
      const unique = Array.from(new Set(data.map(i => i.kelas))).sort();
      setAvailKelas(unique);
      // Jangan auto-select kelas agar user memilih sendiri
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) throw new Error("File kosong.");

        Swal.fire({ title: 'Mengimpor...', didOpen: () => Swal.showLoading(), heightAuto: false });

        const students = data.map((row, idx) => ({
          nis: String(row.NIS || row.nis),
          namalengkap: String(row.NAMA || row.nama || row['NAMA SISWA']),
          jeniskelamin: String(row.JK || row.jk),
          kelas: String(row.KELAS || row.kelas)
        }));

        await db.upsertStudents(students);
        Swal.fire('Berhasil', `${students.length} data siswa diperbarui.`, 'success');
        fetchAllKelas();
      } catch (err) {
        Swal.fire('Gagal', 'Format file tidak sesuai template.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const template = [
      { NO: 1, NIS: '12345', 'NAMA SISWA': 'Nama Siswa Contoh', JK: 'L', KELAS: '7.1' }
    ];
    generateExcel(template, 'Template_Import_Siswa', 'SISWA');
  };

  const handleExport = async (type: 'pdf' | 'excel', category: 'nilai' | 'absensi') => {
    // Validasi Input Kosong
    if (category === 'nilai') {
        if (!kelasNilai || !semNilai) {
            Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Kolom wajib di pilih!', heightAuto: false });
            return;
        }
    } else {
        if (!kelasAbsen || !monthAbsen) {
            Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Kolom wajib di pilih!', heightAuto: false });
            return;
        }
    }

    const targetKelas = category === 'nilai' ? kelasNilai : kelasAbsen;
    const targetSem = category === 'nilai' ? semNilai : semAbsen;
    
    Swal.fire({ title: 'Memproses...', didOpen: () => Swal.showLoading(), heightAuto: false, allowOutsideClick: false });

    try {
      if (category === 'nilai') {
        const data = await db.getGradesByKelas(targetKelas, targetSem);
        if (!data || data.length === 0) {
          Swal.fire('Kosong', `Data nilai Semester ${targetSem} belum tersedia.`, 'info');
          return;
        }

        if (type === 'excel') {
          const excelData = data.map((item, idx) => ({
            'NO': idx + 1,
            'NIS': item.data_siswa?.nis,
            'NAMA SISWA': item.data_siswa?.namalengkap,
            'MATERI': item.description,
            'NILAI': item.score,
            'TIPE': item.subject_type.toUpperCase()
          }));
          generateExcel(excelData, `Laporan_Nilai_${targetKelas}`, 'NILAI');
          Swal.close();
        } else {
          // Generate True PDF (Bukan Gambar)
          generatePDFReport('nilai', data, { 
              kelas: targetKelas, 
              semester: targetSem === '1' ? '1 (Ganjil)' : '2 (Genap)' 
          });
        }
      } else {
        const students = await db.getStudentsByKelas(targetKelas);
        const attendance = await db.getAttendanceByKelas(targetKelas, targetSem, monthAbsen, yearAbsen);

        if (!attendance || attendance.length === 0) {
          Swal.fire('Kosong', 'Data absensi bulan ini belum tersedia.', 'info');
          return;
        }

        const aggregated = students.map((s, idx) => {
          const sRecs = attendance.filter(a => a.student_id === s.id);
          return {
            'NO': idx + 1,
            'NIS': s.nis,
            'NAMA SISWA': s.namalengkap,
            'H': sRecs.filter(r => r.status?.toLowerCase() === 'hadir').length,
            'S': sRecs.filter(r => r.status?.toLowerCase() === 'sakit').length,
            'I': sRecs.filter(r => r.status?.toLowerCase() === 'izin').length,
            'A': sRecs.filter(r => r.status?.toLowerCase() === 'alfa').length
          };
        });

        if (type === 'excel') {
          generateExcel(aggregated, `Rekap_Absen_${targetKelas}_${monthAbsen}`, 'ABSEN');
          Swal.close();
        } else {
          // Generate True PDF (Bukan Gambar)
          generatePDFReport('absensi', aggregated, { 
            kelas: targetKelas, 
            semester: targetSem === '1' ? '1 (Ganjil)' : '2 (Genap)',
            bulan: formatBulan(monthAbsen),
            tahun: yearAbsen
          });
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Gagal memproses laporan.', 'error');
    }
  };

  const secureReset = async (type: 'absensi' | 'nilai' | 'tugas' | 'siswa' | 'semua') => {
    const labels = { absensi: 'Absensi', nilai: 'Nilai', tugas: 'Tugas', siswa: 'Data Siswa', semua: 'SEMUA DATABASE' };
    const confirm = await Swal.fire({
      title: 'Hapus Data?',
      text: `Apakah Bapak yakin ingin menghapus ${labels[type]}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      heightAuto: false
    });

    if (!confirm.isConfirmed) return;

    const { value: token } = await Swal.fire({ 
      title: 'Verifikasi Keamanan', 
      text: 'Masukkan Kode Token ID Server:',
      input: 'password', 
      inputPlaceholder: 'Kode Token',
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#dc2626',
      heightAuto: false 
    });

    if (token === "PAI_ADMIN_GURU") {
      Swal.fire({ title: 'Menghapus...', didOpen: () => Swal.showLoading(), heightAuto: false });
      try {
        if (type === 'absensi') await db.resetAttendance();
        else if (type === 'nilai') await db.resetGrades();
        else if (type === 'tugas') await db.resetTasks();
        else if (type === 'siswa') await db.resetStudents();
        else await db.resetAllData();
        Swal.fire('Berhasil', 'Data telah dibersihkan.', 'success');
        fetchAllKelas();
      } catch (err) { Swal.fire('Error', 'Gagal terhubung server.', 'error'); }
    } else if (token !== undefined) {
      Swal.fire('Ditolak', 'Token Keamanan Salah!', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 md:space-y-6 animate-fadeIn pb-24 px-1 no-print">
      {/* Header Responsif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/50 backdrop-blur-sm p-3 md:p-0 rounded-2xl md:bg-transparent">
        <div className="flex-1">
          <button onClick={() => navigate('/guru')} className="flex items-center gap-1.5 text-slate-800 text-[10px] font-black uppercase py-2 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={14} /> Dashboard Utama
          </button>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-800 leading-tight">Laporan & Database</h1>
          <p className="text-slate-500 text-[10px] md:text-sm font-medium leading-tight md:leading-normal max-w-lg">
            Panel Pengelolaan Laporan dan Database PAI.
          </p>
        </div>
        <div className="bg-slate-800 text-white p-2.5 rounded-xl md:rounded-2xl shadow-lg flex items-center gap-3 self-start md:self-center">
          <Database size={20} className="opacity-50" />
          <div className="text-[9px] font-bold uppercase tracking-widest">Admin System</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {/* LAPORAN NILAI */}
        <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={18}/></div>
            <h2 className="text-[11px] md:text-sm font-black uppercase tracking-widest text-slate-800">Laporan Nilai</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
              <select 
                className="w-full p-2 text-[10px] md:text-xs border border-slate-200 rounded-xl font-bold outline-none bg-white text-slate-900"
                value={kelasNilai} 
                onChange={(e) => setKelasNilai(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {availKelas.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
              <select 
                className="w-full p-2 text-[10px] md:text-xs border border-slate-200 rounded-xl font-bold outline-none bg-white text-slate-900"
                value={semNilai} 
                onChange={(e) => setSemNilai(e.target.value)}
              >
                <option value="">-- Pilih Semester --</option>
                <option value="1">1 (Ganjil)</option>
                <option value="2">2 (Genap)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => handleExport('excel', 'nilai')} className="p-2.5 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"><FileDown size={14}/> EXCEL</button>
            <button onClick={() => handleExport('pdf', 'nilai')} className="p-2.5 bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"><FileText size={14}/> PDF NILAI</button>
          </div>
        </div>

        {/* REKAP ABSENSI */}
        <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Download size={18}/></div>
            <h2 className="text-[11px] md:text-sm font-black uppercase tracking-widest text-slate-800">Rekap Absensi</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5 col-span-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
              <select 
                className="w-full p-2 text-[10px] md:text-xs border border-slate-200 rounded-xl font-bold outline-none bg-white text-slate-900"
                value={kelasAbsen} 
                onChange={(e) => setKelasAbsen(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {availKelas.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-0.5 col-span-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulan</label>
              <select 
                className="w-full p-2 text-[10px] md:text-xs border border-slate-200 rounded-xl font-bold outline-none bg-white text-slate-900"
                value={monthAbsen} 
                onChange={(e) => setMonthAbsen(e.target.value)}
              >
                <option value="">-- Pilih Bulan --</option>
                {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{formatBulan(m)}</option>)}
              </select>
            </div>
            <div className="space-y-0.5 col-span-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
              <input type="text" readOnly className="w-full p-2 text-[10px] md:text-xs border border-slate-100 bg-slate-50 text-slate-500 rounded-xl font-black text-center cursor-not-allowed" value={semAbsen || '-'} placeholder="-" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => handleExport('excel', 'absensi')} className="p-2.5 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"><FileDown size={14}/> EXCEL</button>
            <button onClick={() => handleExport('pdf', 'absensi')} className="p-2.5 bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"><FileText size={14}/> PDF REKAP</button>
          </div>
        </div>

        {/* IMPORT SISWA */}
        <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><FileUp size={18}/></div>
            <h2 className="text-[11px] md:text-sm font-black uppercase tracking-widest text-slate-800">Import Siswa</h2>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[9px] text-slate-500 leading-tight">Download template, isi data, lalu upload kembali ke database.</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={downloadTemplate} className="w-full p-2.5 bg-slate-100 text-slate-800 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"><Download size={14}/> Template Excel</button>
            <div className="relative">
              <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full p-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"><Upload size={14}/> Upload Data Siswa</button>
            </div>
          </div>
        </div>

        {/* RESET DATA */}
        <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-red-100 border-dashed shadow-sm space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl"><ShieldAlert size={18}/></div>
            <h2 className="text-[11px] md:text-sm font-black uppercase tracking-widest text-red-600">Reset Database</h2>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 bg-red-50/50 rounded-xl border border-red-100">
            <AlertTriangle size={14} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-[8px] font-bold text-red-700 uppercase italic">Membutuhkan Token Keamanan PAI.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => secureReset('siswa')} className="p-2.5 bg-slate-800 text-white rounded-xl text-[8px] font-black uppercase active:scale-95 transition-all">Reset Siswa</button>
            <button onClick={() => secureReset('absensi')} className="p-2.5 bg-slate-800 text-white rounded-xl text-[8px] font-black uppercase active:scale-95 transition-all">Reset Absensi</button>
            <button onClick={() => secureReset('nilai')} className="p-2.5 bg-slate-800 text-white rounded-xl text-[8px] font-black uppercase active:scale-95 transition-all">Reset Nilai</button>
            <button onClick={() => secureReset('tugas')} className="p-2.5 bg-slate-800 text-white rounded-xl text-[8px] font-black uppercase active:scale-95 transition-all">Reset Tugas</button>
            <button onClick={() => secureReset('semua')} className="p-3.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase col-span-2 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              <Trash2 size={16}/> Hapus Seluruh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
