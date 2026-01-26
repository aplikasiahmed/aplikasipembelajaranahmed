
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Trash2, AlertTriangle, CheckCircle, Upload, FileSpreadsheet, Loader2, ArrowLeft, Calendar, Filter } from 'lucide-react';
import { db } from '../services/supabaseMock';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const TeacherReports: React.FC = () => {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [exportSem, setExportSem] = useState('1');
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1 + '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SERVER_RESET_TOKEN = "PAI-ADMIN-2025";

  const months = [
    { v: '1', n: 'Januari' }, { v: '2', n: 'Februari' }, { v: '3', n: 'Maret' },
    { v: '4', n: 'April' }, { v: '5', n: 'Mei' }, { v: '6', n: 'Juni' },
    { v: '7', n: 'Juli' }, { v: '8', n: 'Agustus' }, { v: '9', n: 'September' },
    { v: '10', n: 'Oktober' }, { v: '11', n: 'November' }, { v: '12', n: 'Desember' },
  ];

  const handleExport = (type: 'pdf' | 'excel', category: 'nilai' | 'absensi') => {
    const monthName = months.find(m => m.v === exportMonth)?.n;
    Swal.fire({ icon: 'info', title: 'Menyiapkan Dokumen', text: `Ekspor Laporan ${category.toUpperCase()} (${type.toUpperCase()}) Semester ${exportSem} Bulan ${monthName}.`, timer: 2000, showConfirmButton: false, heightAuto: false })
    .then(() => { Swal.fire({ icon: 'success', title: 'Ekspor Berhasil', text: 'File telah diunduh.', heightAuto: false }); });
  };

  const secureReset = async (type: 'absensi' | 'nilai' | 'tugas' | 'semua') => {
    const labels = { absensi: 'Data Kehadiran', nilai: 'Data Nilai Akademik', tugas: 'Daftar Tugas', semua: 'SELURUH DATABASE' };
    const { value: token } = await Swal.fire({ title: 'KONFIRMASI RESET', html: `Hapus <b>${labels[type]}</b>?<br><span style="color:red; font-size:10px;">Token Server:</span>`, input: 'password', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', heightAuto: false });
    if (token === SERVER_RESET_TOKEN) {
      try {
        if (type === 'absensi') await db.resetAttendance();
        else if (type === 'nilai') await db.resetGrades();
        else if (type === 'tugas') await db.resetTasks();
        else if (type === 'semua') await db.resetAllData();
        Swal.fire('Terhapus!', 'Database telah dibersihkan.', 'success');
      } catch (err) { Swal.fire('Gagal', 'Kesalahan sistem.', 'error'); }
    } else if (token) { Swal.fire('Token Salah', '', 'error'); }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length === 0) throw new Error("File Excel kosong.");
        
        const formattedStudents = data.map((row: any) => ({
          nis: String(row.nis || ''),
          namalengkap: String(row.namalengkap || ''),
          jeniskelamin: String(row.jeniskelamin || ''),
          kelas: String(row.Kelas || row.kelas || '') // Sesuai kolom di gambar Bapak
        })).filter(s => s.nis && s.namalengkap && s.kelas);
        
        if (formattedStudents.length === 0) throw new Error("Header Excel tidak sesuai (Gunakan: nis, namalengkap, Kelas)");

        const res = await Swal.fire({ title: 'Import Data', text: `Impor ${formattedStudents.length} siswa baru?`, icon: 'question', showCancelButton: true, heightAuto: false });
        if (res.isConfirmed) {
          await db.upsertStudents(formattedStudents as any);
          Swal.fire('Berhasil!', 'Data siswa diperbarui.', 'success');
        }
      } catch (err: any) { Swal.fire('Gagal', err.message, 'error'); }
      finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 md:space-y-6 animate-fadeIn pb-20 px-1 md:px-0">
      <button onClick={() => navigate('/guru')} className="md:hidden flex items-center gap-1.5 text-slate-800 text-[10px] font-black uppercase tracking-tight py-2 mb-1"><ArrowLeft size={14} /> Kembali ke Dashboard</button>
      <div className="bg-slate-800 text-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-lg">
        <h1 className="text-base md:text-2xl font-black leading-tight uppercase tracking-tighter">Database & Laporan</h1>
        <p className="text-slate-400 text-[9px] md:text-sm mt-0.5">Kelola data siswa dan laporan nilai.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-[11px] md:text-base font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight"><Upload className="text-emerald-600" size={16} /> Import Siswa (Format Baru)</h2>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Header Excel: nis, namalengkap, jeniskelamin, Kelas</p>
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportExcel} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full bg-white border-2 border-dashed border-emerald-300 py-6 md:py-8 rounded-2xl text-emerald-700 font-bold hover:bg-emerald-50 transition-all flex flex-col items-center gap-2">
              {importing ? <Loader2 size={24} className="animate-spin" /> : <><FileSpreadsheet size={24} /><span className="text-[9px] md:text-xs">Klik Pilih File Excel Siswa</span></>}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-[11px] md:text-base font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight"><Filter className="text-blue-600" size={16} /> Rekap Laporan</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
              <select className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[9px] md:text-xs font-black outline-none" value={exportSem} onChange={(e) => setExportSem(e.target.value)}>
                <option value="1">Semester 1</option><option value="2">Semester 2</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulan</label>
              <select className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[9px] md:text-xs font-black outline-none" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}>
                {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => handleExport('excel', 'nilai')} className="py-2 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-100 flex items-center justify-center gap-1 hover:bg-emerald-600 hover:text-white transition-all"><FileSpreadsheet size={12} /> EXCEL NILAI</button>
            <button onClick={() => handleExport('pdf', 'nilai')} className="py-2 rounded-lg bg-red-50 text-red-700 text-[9px] font-black border border-red-100 flex items-center justify-center gap-1 hover:bg-red-600 hover:text-white transition-all"><FileText size={12} /> PDF NILAI</button>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-red-50 shadow-xl space-y-4">
          <h2 className="text-[12px] md:text-lg font-black text-red-600 flex items-center gap-2 uppercase tracking-tighter"><AlertTriangle size={20} /> Zona Pembersihan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4">
            <button onClick={() => secureReset('absensi')} className="p-3 rounded-2xl bg-white border border-red-100 text-red-600 flex flex-col items-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Calendar size={18} /><span className="text-[8px] md:text-[10px] font-black uppercase">Reset Absensi</span></button>
            <button onClick={() => secureReset('nilai')} className="p-3 rounded-2xl bg-white border border-red-100 text-red-600 flex flex-col items-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Download size={18} /><span className="text-[8px] md:text-[10px] font-black uppercase">Reset Nilai</span></button>
            <button onClick={() => secureReset('tugas')} className="p-3 rounded-2xl bg-white border border-red-100 text-red-600 flex flex-col items-center gap-2 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /><span className="text-[8px] md:text-[10px] font-black uppercase">Reset Tugas</span></button>
            <button onClick={() => secureReset('semua')} className="p-3 rounded-2xl bg-red-600 text-white flex flex-col items-center gap-2 hover:bg-red-700 transition-all"><AlertTriangle size={18} /><span className="text-[8px] md:text-[10px] font-black uppercase">Hapus Semua</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
